const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'control_nvsr.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS personas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    cumpleanos TEXT,
    tipo TEXT NOT NULL CHECK(tipo IN ('nuevo', 'consolidado')),
    fecha_hora_registro TEXT NOT NULL,
    notas TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_personas_tipo ON personas(tipo);
  CREATE INDEX IF NOT EXISTS idx_personas_fecha ON personas(fecha_hora_registro);
  CREATE INDEX IF NOT EXISTS idx_personas_nombre ON personas(nombre);
`);

// Helper to seed initial sample records if empty
const count = db.prepare('SELECT COUNT(*) as count FROM personas').get().count;
if (count === 0) {
  const insertSample = db.prepare(`
    INSERT INTO personas (nombre, telefono, direccion, cumpleanos, tipo, fecha_hora_registro, notas)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const formatISO = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

  const samples = [
    {
      nombre: 'David Alejandro Morales',
      telefono: '612345678',
      direccion: 'Calle Mayor, 12, Soto del Real',
      cumpleanos: '1992-04-15',
      tipo: 'nuevo',
      fecha_hora_registro: formatISO(new Date(now.getTime() - 3600000 * 2)),
      notas: 'Primera vez que asiste con su familia. Interesado en grupo de jóvenes.'
    },
    {
      nombre: 'María Elena Gómez',
      telefono: '654987321',
      direccion: 'Avenida de España, 4, Soto del Real',
      cumpleanos: '1985-08-22',
      tipo: 'consolidado',
      fecha_hora_registro: formatISO(new Date(now.getTime() - 86400000 * 5)),
      notas: 'Asiste regularmente. Apoya en escuela dominical.'
    },
    {
      nombre: 'Carlos Andrés Rodríguez',
      telefono: '678112233',
      direccion: 'Calle Los Pinos, 8, Manzanares el Real',
      cumpleanos: '1998-11-05',
      tipo: 'nuevo',
      fecha_hora_registro: formatISO(new Date(now.getTime() - 86400000 * 2)),
      notas: 'Invitado por la familia Morales. Desea información de bautismos.'
    },
    {
      nombre: 'Lucía Fernández Ramos',
      telefono: '633445566',
      direccion: 'Calle del Río, 23, Miraflores de la Sierra',
      cumpleanos: '1979-01-30',
      tipo: 'consolidado',
      fecha_hora_registro: formatISO(new Date(now.getTime() - 86400000 * 12)),
      notas: 'Líder de discipulado de mujeres.'
    }
  ];

  for (const s of samples) {
    insertSample.run(s.nombre, s.telefono, s.direccion, s.cumpleanos, s.tipo, s.fecha_hora_registro, s.notas);
  }
}

// Helper for local timestamp string: YYYY-MM-DD HH:mm:ss
const getLocalTimestamp = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

// Queries
const getAll = (filters = {}) => {
  let query = 'SELECT * FROM personas WHERE 1=1';
  const params = [];

  if (filters.search) {
    query += ' AND (nombre LIKE ? OR telefono LIKE ? OR direccion LIKE ? OR notas LIKE ?)';
    const term = `%${filters.search.trim()}%`;
    params.push(term, term, term, term);
  }

  if (filters.tipo && filters.tipo !== 'todos') {
    query += ' AND tipo = ?';
    params.push(filters.tipo);
  }

  if (filters.dateFrom) {
    query += ' AND fecha_hora_registro >= ?';
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    let dateToVal = filters.dateTo.trim();
    if (dateToVal.length === 10) {
      dateToVal += ' 23:59:59';
    }
    query += ' AND fecha_hora_registro <= ?';
    params.push(dateToVal);
  }

  query += ' ORDER BY fecha_hora_registro DESC, id DESC';

  return db.prepare(query).all(...params);
};

const getById = (id) => {
  return db.prepare('SELECT * FROM personas WHERE id = ?').get(id);
};

const create = (data) => {
  const stmt = db.prepare(`
    INSERT INTO personas (nombre, telefono, direccion, cumpleanos, tipo, fecha_hora_registro, notas, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `);

  const result = stmt.run(
    data.nombre ? data.nombre.trim().slice(0, 150) : '',
    data.telefono ? data.telefono.trim().slice(0, 30) : null,
    data.direccion ? data.direccion.trim().slice(0, 250) : null,
    data.cumpleanos ? data.cumpleanos.trim().slice(0, 20) : null,
    ['nuevo', 'consolidado'].includes(data.tipo) ? data.tipo : 'nuevo',
    data.fecha_hora_registro || getLocalTimestamp(),
    data.notas ? data.notas.trim().slice(0, 2000) : null
  );

  return getById(result.lastInsertRowid);
};

// Batch insert inside a single SQLite transaction
const createMany = db.transaction((records) => {
  const stmt = db.prepare(`
    INSERT INTO personas (nombre, telefono, direccion, cumpleanos, tipo, fecha_hora_registro, notas, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `);

  let count = 0;
  for (const data of records) {
    if (!data.nombre || !data.nombre.trim()) continue;
    stmt.run(
      data.nombre.trim().slice(0, 150),
      data.telefono ? data.telefono.trim().slice(0, 30) : null,
      data.direccion ? data.direccion.trim().slice(0, 250) : null,
      data.cumpleanos ? data.cumpleanos.trim().slice(0, 20) : null,
      ['nuevo', 'consolidado'].includes(data.tipo) ? data.tipo : 'nuevo',
      data.fecha_hora_registro || getLocalTimestamp(),
      data.notas ? data.notas.trim().slice(0, 2000) : null
    );
    count++;
  }
  return count;
});

const update = (id, data) => {
  const stmt = db.prepare(`
    UPDATE personas
    SET nombre = ?,
        telefono = ?,
        direccion = ?,
        cumpleanos = ?,
        tipo = ?,
        fecha_hora_registro = ?,
        notas = ?,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);

  stmt.run(
    data.nombre ? data.nombre.trim().slice(0, 150) : '',
    data.telefono ? data.telefono.trim().slice(0, 30) : null,
    data.direccion ? data.direccion.trim().slice(0, 250) : null,
    data.cumpleanos ? data.cumpleanos.trim().slice(0, 20) : null,
    ['nuevo', 'consolidado'].includes(data.tipo) ? data.tipo : 'nuevo',
    data.fecha_hora_registro || getLocalTimestamp(),
    data.notas ? data.notas.trim().slice(0, 2000) : null,
    id
  );

  return getById(id);
};

const remove = (id) => {
  return db.prepare('DELETE FROM personas WHERE id = ?').run(id);
};

const getStats = () => {
  const total = db.prepare('SELECT COUNT(*) as c FROM personas').get().c;
  const nuevos = db.prepare("SELECT COUNT(*) as c FROM personas WHERE tipo = 'nuevo'").get().c;
  const consolidados = db.prepare("SELECT COUNT(*) as c FROM personas WHERE tipo = 'consolidado'").get().c;

  // Hoy en formato YYYY-MM-DD
  const hoyQuery = db.prepare(`
    SELECT COUNT(*) as c FROM personas
    WHERE substr(fecha_hora_registro, 1, 10) = date('now', 'localtime')
  `).get().c;

  return {
    total,
    nuevos,
    consolidados,
    hoy: hoyQuery
  };
};

module.exports = {
  db,
  dbPath,
  getLocalTimestamp,
  getAll,
  getById,
  create,
  createMany,
  update,
  remove,
  getStats
};

