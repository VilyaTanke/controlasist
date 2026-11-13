const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

  CREATE TABLE IF NOT EXISTS asistencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    persona_id INTEGER NOT NULL,
    fecha_hora TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('nuevo', 'consolidado')),
    notas TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_asistencias_persona ON asistencias(persona_id);
  CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha_hora);

  CREATE TABLE IF NOT EXISTS usuarios_admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    rol TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

// Seed default admin user "Pastora" with password "12345678" if not exists
const defaultAdmin = db.prepare('SELECT id FROM usuarios_admin WHERE username = ?').get('Pastora');
if (!defaultAdmin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync('12345678', salt, 64).toString('hex');
  db.prepare(`
    INSERT INTO usuarios_admin (username, password_hash, salt, rol, created_at)
    VALUES (?, ?, ?, 'admin', datetime('now', 'localtime'))
  `).run('Pastora', passwordHash, salt);
}

// Auto-migration: ensure existing personas have attendance records in asistencias
db.exec(`
  INSERT INTO asistencias (persona_id, fecha_hora, tipo, notas, created_at)
  SELECT id, fecha_hora_registro, tipo, notas, created_at FROM personas
  WHERE id NOT IN (SELECT DISTINCT persona_id FROM asistencias);
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

// Normalize text for accent-insensitive and case-insensitive search
const normalizeForSearch = (str) => {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};
db.function('norm', normalizeForSearch);

// Queries
const getAll = (filters = {}) => {
  let query = `
    SELECT 
      a.id,
      a.persona_id,
      p.nombre,
      p.telefono,
      p.direccion,
      p.cumpleanos,
      a.tipo,
      a.fecha_hora as fecha_hora_registro,
      a.notas,
      a.created_at
    FROM asistencias a
    JOIN personas p ON a.persona_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.search) {
    query += ' AND (norm(p.nombre) LIKE ? OR norm(p.telefono) LIKE ? OR norm(p.direccion) LIKE ? OR norm(a.notas) LIKE ?)';
    const term = `%${normalizeForSearch(filters.search.trim())}%`;
    params.push(term, term, term, term);
  }

  if (filters.tipo && filters.tipo !== 'todos') {
    query += ' AND a.tipo = ?';
    params.push(filters.tipo);
  }

  if (filters.dateFrom) {
    query += ' AND a.fecha_hora >= ?';
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    let dateToVal = filters.dateTo.trim();
    if (dateToVal.length === 10) {
      dateToVal += ' 23:59:59';
    }
    query += ' AND a.fecha_hora <= ?';
    params.push(dateToVal);
  }

  query += ' ORDER BY a.fecha_hora DESC, a.id DESC';

  return db.prepare(query).all(...params);
};

const getById = (id) => {
  return db.prepare(`
    SELECT 
      a.id,
      a.persona_id,
      p.nombre,
      p.telefono,
      p.direccion,
      p.cumpleanos,
      a.tipo,
      a.fecha_hora as fecha_hora_registro,
      a.notas,
      a.created_at
    FROM asistencias a
    JOIN personas p ON a.persona_id = p.id
    WHERE a.id = ?
  `).get(id);
};

const getPersonaById = (personaId) => {
  return db.prepare('SELECT * FROM personas WHERE id = ?').get(personaId);
};

// Autocomplete search for personas to mark attendance
const searchPersonas = (term = '') => {
  const searchTerm = `%${normalizeForSearch((term || '').trim())}%`;
  return db.prepare(`
    SELECT 
      p.id,
      p.nombre,
      p.telefono,
      p.direccion,
      p.cumpleanos,
      p.tipo,
      p.notas,
      (SELECT COUNT(*) FROM asistencias WHERE persona_id = p.id) as total_asistencias,
      (SELECT MAX(fecha_hora) FROM asistencias WHERE persona_id = p.id) as ultima_asistencia,
      (SELECT COUNT(*) FROM asistencias WHERE persona_id = p.id AND substr(fecha_hora, 1, 10) = date('now', 'localtime')) as asistio_hoy
    FROM personas p
    WHERE norm(p.nombre) LIKE ? OR norm(p.telefono) LIKE ? OR norm(p.direccion) LIKE ? OR norm(p.notas) LIKE ?
    ORDER BY p.nombre ASC
    LIMIT 150
  `).all(searchTerm, searchTerm, searchTerm, searchTerm);
};

// Create a new person AND register their first attendance
const create = (data) => {
  const fechaHora = data.fecha_hora_registro || getLocalTimestamp();
  const tipo = ['nuevo', 'consolidado'].includes(data.tipo) ? data.tipo : 'nuevo';

  const stmtPersona = db.prepare(`
    INSERT INTO personas (nombre, telefono, direccion, cumpleanos, tipo, fecha_hora_registro, notas, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `);

  const result = stmtPersona.run(
    data.nombre ? data.nombre.trim().slice(0, 150) : '',
    data.telefono ? data.telefono.trim().slice(0, 30) : null,
    data.direccion ? data.direccion.trim().slice(0, 250) : null,
    data.cumpleanos ? data.cumpleanos.trim().slice(0, 20) : null,
    tipo,
    fechaHora,
    data.notas ? data.notas.trim().slice(0, 2000) : null
  );

  const personaId = result.lastInsertRowid;

  // Also insert their attendance record
  const stmtAsist = db.prepare(`
    INSERT INTO asistencias (persona_id, fecha_hora, tipo, notas, created_at)
    VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
  `);

  const asistResult = stmtAsist.run(
    personaId,
    fechaHora,
    tipo,
    data.notas ? data.notas.trim().slice(0, 2000) : null
  );

  return getById(asistResult.lastInsertRowid);
};

// Register attendance for an existing person
const registrarAsistencia = (data) => {
  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(data.persona_id);
  if (!persona) {
    throw new Error('Persona no encontrada');
  }

  const fechaHora = data.fecha_hora || getLocalTimestamp();
  const tipo = ['nuevo', 'consolidado'].includes(data.tipo) ? data.tipo : persona.tipo;

  const stmt = db.prepare(`
    INSERT INTO asistencias (persona_id, fecha_hora, tipo, notas, created_at)
    VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
  `);

  const result = stmt.run(
    data.persona_id,
    fechaHora,
    tipo,
    data.notas ? data.notas.trim().slice(0, 2000) : null
  );

  // Update persona with latest condition and updated timestamp
  db.prepare(`
    UPDATE personas
    SET tipo = ?,
        fecha_hora_registro = ?,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(tipo, fechaHora, data.persona_id);

  return getById(result.lastInsertRowid);
};

// Batch insert inside a single SQLite transaction
const createMany = db.transaction((records) => {
  const stmtPersona = db.prepare(`
    INSERT INTO personas (nombre, telefono, direccion, cumpleanos, tipo, fecha_hora_registro, notas, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `);

  const stmtAsist = db.prepare(`
    INSERT INTO asistencias (persona_id, fecha_hora, tipo, notas, created_at)
    VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
  `);

  let count = 0;
  for (const data of records) {
    if (!data.nombre || !data.nombre.trim()) continue;
    const fechaHora = data.fecha_hora_registro || getLocalTimestamp();
    const tipo = ['nuevo', 'consolidado'].includes(data.tipo) ? data.tipo : 'nuevo';

    const res = stmtPersona.run(
      data.nombre.trim().slice(0, 150),
      data.telefono ? data.telefono.trim().slice(0, 30) : null,
      data.direccion ? data.direccion.trim().slice(0, 250) : null,
      data.cumpleanos ? data.cumpleanos.trim().slice(0, 20) : null,
      tipo,
      fechaHora,
      data.notas ? data.notas.trim().slice(0, 2000) : null
    );

    stmtAsist.run(
      res.lastInsertRowid,
      fechaHora,
      tipo,
      data.notas ? data.notas.trim().slice(0, 2000) : null
    );

    count++;
  }
  return count;
});

const update = (id, data) => {
  const asistencia = db.prepare('SELECT * FROM asistencias WHERE id = ?').get(id);

  const tipo = ['nuevo', 'consolidado'].includes(data.tipo) ? data.tipo : 'nuevo';
  const fechaHora = data.fecha_hora_registro || getLocalTimestamp();

  if (asistencia) {
    // Update asistencia
    db.prepare(`
      UPDATE asistencias
      SET tipo = ?,
          fecha_hora = ?,
          notas = ?
      WHERE id = ?
    `).run(tipo, fechaHora, data.notas ? data.notas.trim().slice(0, 2000) : null, id);

    // Update associated persona
    db.prepare(`
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
    `).run(
      data.nombre ? data.nombre.trim().slice(0, 150) : '',
      data.telefono ? data.telefono.trim().slice(0, 30) : null,
      data.direccion ? data.direccion.trim().slice(0, 250) : null,
      data.cumpleanos ? data.cumpleanos.trim().slice(0, 20) : null,
      tipo,
      fechaHora,
      data.notas ? data.notas.trim().slice(0, 2000) : null,
      asistencia.persona_id
    );

    return getById(id);
  }

  // Fallback update personas table directly
  db.prepare(`
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
  `).run(
    data.nombre ? data.nombre.trim().slice(0, 150) : '',
    data.telefono ? data.telefono.trim().slice(0, 30) : null,
    data.direccion ? data.direccion.trim().slice(0, 250) : null,
    data.cumpleanos ? data.cumpleanos.trim().slice(0, 20) : null,
    tipo,
    fechaHora,
    data.notas ? data.notas.trim().slice(0, 2000) : null,
    id
  );

  return getById(id);
};

const remove = (id) => {
  return db.prepare('DELETE FROM asistencias WHERE id = ?').run(id);
};

const getStats = () => {
  const totalPersonas = db.prepare('SELECT COUNT(*) as c FROM personas').get().c;
  const totalAsistencias = db.prepare('SELECT COUNT(*) as c FROM asistencias').get().c;

  // Asistencias hoy
  const hoyQuery = db.prepare(`
    SELECT COUNT(*) as c FROM asistencias
    WHERE substr(fecha_hora, 1, 10) = date('now', 'localtime')
  `).get().c;

  // Nuevos hoy
  const nuevosHoy = db.prepare(`
    SELECT COUNT(*) as c FROM asistencias
    WHERE tipo = 'nuevo' AND substr(fecha_hora, 1, 10) = date('now', 'localtime')
  `).get().c;

  // Consolidados hoy
  const consolidadosHoy = db.prepare(`
    SELECT COUNT(*) as c FROM asistencias
    WHERE tipo = 'consolidado' AND substr(fecha_hora, 1, 10) = date('now', 'localtime')
  `).get().c;

  return {
    total: totalAsistencias,
    totalPersonas,
    totalAsistencias,
    nuevos: nuevosHoy,
    consolidados: consolidadosHoy,
    hoy: hoyQuery
  };
};

// ========================================================
// ADMIN USERS MANAGEMENT (Solo Usuarios Admin)
// ========================================================

/**
 * Verify admin credentials
 * @param {string} username
 * @param {string} password
 * @returns {object|null} Admin user info without hash/salt, or null if invalid
 */
const verifyAdminCredentials = (username, password) => {
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return null;
  }

  const user = db.prepare('SELECT * FROM usuarios_admin WHERE username = ?').get(username.trim());
  if (!user) return null;

  try {
    const checkHash = crypto.scryptSync(password, user.salt, 64).toString('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(user.password_hash, 'hex'), Buffer.from(checkHash, 'hex'));
    if (isValid) {
      return {
        id: user.id,
        username: user.username,
        rol: user.rol,
        created_at: user.created_at
      };
    }
  } catch (err) {
    console.error('Error verificando credenciales admin:', err);
  }
  return null;
};

/**
 * List all admin users
 * @returns {Array} List of admin users
 */
const getAdminUsers = () => {
  return db.prepare('SELECT id, username, rol, created_at FROM usuarios_admin ORDER BY id ASC').all();
};

/**
 * Create a new admin user
 * @param {object} param0 { username, password }
 * @returns {object} Created admin user info
 */
const createAdminUser = ({ username, password }) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    throw new Error('El nombre de usuario es obligatorio');
  }

  const cleanUsername = username.trim();
  if (cleanUsername.length < 3) {
    throw new Error('El nombre de usuario debe tener al menos 3 caracteres');
  }

  if (cleanUsername.length > 50) {
    throw new Error('El nombre de usuario no puede exceder 50 caracteres');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  const existing = db.prepare('SELECT id FROM usuarios_admin WHERE username = ?').get(cleanUsername);
  if (existing) {
    throw new Error(`El usuario "${cleanUsername}" ya existe`);
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');

  const result = db.prepare(`
    INSERT INTO usuarios_admin (username, password_hash, salt, rol, created_at)
    VALUES (?, ?, ?, 'admin', datetime('now', 'localtime'))
  `).run(cleanUsername, passwordHash, salt);

  return {
    id: result.lastInsertRowid,
    username: cleanUsername,
    rol: 'admin',
    created_at: getLocalTimestamp()
  };
};

/**
 * Delete an admin user (prevent deleting if only 1 remains)
 * @param {number} id
 */
const deleteAdminUser = (id) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM usuarios_admin').get().c;
  if (total <= 1) {
    throw new Error('No es posible eliminar el único usuario administrador restante');
  }
  return db.prepare('DELETE FROM usuarios_admin WHERE id = ?').run(id);
};

module.exports = {
  db,
  dbPath,
  getLocalTimestamp,
  normalizeForSearch,
  getAll,
  getById,
  getPersonaById,
  searchPersonas,
  create,
  registrarAsistencia,
  createMany,
  update,
  remove,
  getStats,
  verifyAdminCredentials,
  getAdminUsers,
  createAdminUser,
  deleteAdminUser
};

