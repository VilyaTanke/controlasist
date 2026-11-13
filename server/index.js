const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const os = require('os');
const crypto = require('crypto');
const db = require('./db');
const analytics = require('./analyticsService');
const { generateExcel, parseUploadedExcel } = require('./excelService');

const app = express();
const PORT = process.env.PORT || 3005;

// Production hardening: disable Express banner
app.disable('x-powered-by');

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Admin In-Memory Session Storage
const adminSessions = new Map(); // token -> { user, createdAt }

// Helper middleware to require admin authentication
const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.slice(7).trim()
    : (req.headers['x-admin-token'] || req.query.adminToken);

  if (token && adminSessions.has(token)) {
    req.adminUser = adminSessions.get(token).user;
    return next();
  }

  // Also support direct admin credentials in request body or headers
  const adminUser = (req.body && req.body.adminUser) || req.headers['x-admin-user'];
  const adminPassword = (req.body && req.body.adminPassword) || req.headers['x-admin-password'];

  if (adminUser && adminPassword) {
    const verified = db.verifyAdminCredentials(adminUser, adminPassword);
    if (verified) {
      req.adminUser = verified;
      return next();
    }
  }

  return res.status(401).json({
    error: 'Autorización denegada: Se requieren credenciales de Administrador válidas'
  });
};

// Multer in-memory storage for Excel file imports
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- API ROUTES ---

// Health check endpoint for uptime and monitoring
app.get('/api/health', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: db.getLocalTimestamp(),
      database: 'connected',
      recordsCount: stats.total
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Backup SQLite Database Download
app.get('/api/backup', (req, res) => {
  try {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const filename = `control_nvsr_backup_${dateStr}.db`;

    res.download(db.dbPath, filename, (err) => {
      if (err && !res.headersSent) {
        console.error('Error al descargar copia de seguridad:', err);
        res.status(500).json({ error: 'Error al descargar la base de datos' });
      }
    });
  } catch (error) {
    console.error('Error en backup:', error);
    res.status(500).json({ error: 'Error al generar copia de seguridad' });
  }
});

// 1. Get church institutional information
app.get('/api/church-info', (req, res) => {
  res.json({
    nombre: 'Iglesia Nueva Vida de Soto del Real',
    direccion: 'Calle del Prado, 15, 28791 Soto del Real, Madrid.',
    horario: 'Domingos a las 18:00 h.',
    pastores: 'Jorge Gámez Zúñiga y Carmen Vera Mendoza.'
  });
});

// 2. Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// 3. Autocomplete search for personas (used by "Registrar Asistencia" dropdown)
app.get('/api/personas/search', (req, res) => {
  try {
    const q = req.query.q || '';
    const results = db.searchPersonas(q);
    res.json(results);
  } catch (error) {
    console.error('Error en búsqueda de personas:', error);
    res.status(500).json({ error: 'Error en la búsqueda' });
  }
});

// 4. List personas/asistencias with optional filters
app.get('/api/personas', (req, res) => {
  try {
    const { search, tipo, dateFrom, dateTo } = req.query;
    const personas = db.getAll({ search, tipo, dateFrom, dateTo });
    res.json(personas);
  } catch (error) {
    console.error('Error al listar personas:', error);
    res.status(500).json({ error: 'Error al listar personas' });
  }
});

// 5. Register attendance for existing persona
app.post('/api/asistencias', (req, res) => {
  try {
    const { persona_id, fecha_hora, tipo, notas } = req.body;
    const personaIdNum = parseInt(persona_id, 10);

    if (isNaN(personaIdNum) || personaIdNum <= 0) {
      return res.status(400).json({ error: 'ID de persona inválido' });
    }

    const asistencia = db.registrarAsistencia({
      persona_id: personaIdNum,
      fecha_hora,
      tipo,
      notas
    });

    res.status(201).json(asistencia);
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ error: error.message || 'Error al registrar la asistencia' });
  }
});

// 4. Get persona by ID
app.get('/api/personas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de registro inválido' });
    }

    const persona = db.getById(id);
    if (!persona) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    res.json(persona);
  } catch (error) {
    console.error('Error al obtener persona:', error);
    res.status(500).json({ error: 'Error al obtener persona' });
  }
});

// 5. Create new persona
app.post('/api/personas', (req, res) => {
  try {
    const { nombre, telefono, direccion, cumpleanos, tipo, fecha_hora_registro, notas } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (nombre.trim().length > 150) {
      return res.status(400).json({ error: 'El nombre no puede exceder 150 caracteres' });
    }

    if (!tipo || !['nuevo', 'consolidado'].includes(tipo)) {
      return res.status(400).json({ error: 'El tipo debe ser "nuevo" o "consolidado"' });
    }

    // Default to local date/time if not provided
    const fechaHora = fecha_hora_registro && fecha_hora_registro.trim()
      ? fecha_hora_registro.trim()
      : db.getLocalTimestamp();

    const newPersona = db.create({
      nombre: nombre.trim(),
      telefono: telefono ? telefono.trim() : null,
      direccion: direccion ? direccion.trim() : null,
      cumpleanos: cumpleanos ? cumpleanos.trim() : null,
      tipo,
      fecha_hora_registro: fechaHora,
      notas: notas ? notas.trim() : null
    });

    res.status(201).json(newPersona);
  } catch (error) {
    console.error('Error al crear registro:', error);
    res.status(500).json({ error: 'Error al guardar el registro' });
  }
});

// 6. Update persona
app.put('/api/personas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de registro inválido' });
    }

    const existing = db.getById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    const { nombre, telefono, direccion, cumpleanos, tipo, fecha_hora_registro, notas } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (nombre.trim().length > 150) {
      return res.status(400).json({ error: 'El nombre no puede exceder 150 caracteres' });
    }

    if (!tipo || !['nuevo', 'consolidado'].includes(tipo)) {
      return res.status(400).json({ error: 'El tipo debe ser "nuevo" o "consolidado"' });
    }

    const updated = db.update(id, {
      nombre: nombre.trim(),
      telefono: telefono ? telefono.trim() : null,
      direccion: direccion ? direccion.trim() : null,
      cumpleanos: cumpleanos ? cumpleanos.trim() : null,
      tipo,
      fecha_hora_registro: fecha_hora_registro || existing.fecha_hora_registro,
      notas: notas ? notas.trim() : null
    });

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar registro:', error);
    res.status(500).json({ error: 'Error al actualizar el registro' });
  }
});

// 7. Delete persona (REQUIERE APROBACIÓN DE USUARIO ADMINISTRADOR)
app.delete('/api/personas/:id', requireAdminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de registro inválido' });
    }

    const existing = db.getById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    const result = db.remove(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({
      success: true,
      message: `Registro eliminado correctamente con autorización del administrador "${req.adminUser.username}"`
    });
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    res.status(500).json({ error: 'Error al eliminar el registro' });
  }
});

// ========================================================
// RUTAS DE GESTIÓN DE ADMINISTRADORES (PANEL ADMIN)
// ========================================================

// Login de Administrador
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = db.verifyAdminCredentials(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña de administrador incorrectos' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, { user, createdAt: Date.now() });

    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Error en login de admin:', error);
    res.status(500).json({ error: 'Error al procesar el inicio de sesión' });
  }
});

// Verificar si el token actual de admin sigue válido
app.get('/api/admin/verify', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    user: req.adminUser
  });
});

// Listar usuarios administradores (solo admin)
app.get('/api/admin/users', requireAdminAuth, (req, res) => {
  try {
    const users = db.getAdminUsers();
    res.json({ users });
  } catch (error) {
    console.error('Error al listar administradores:', error);
    res.status(500).json({ error: 'Error al listar usuarios administradores' });
  }
});

// Crear nuevo usuario administrador (solo admin)
app.post('/api/admin/users', requireAdminAuth, (req, res) => {
  try {
    const { username, password } = req.body;
    const newUser = db.createAdminUser({ username, password });
    res.status(201).json({
      success: true,
      message: `Administrador "${newUser.username}" creado con éxito`,
      user: newUser
    });
  } catch (error) {
    console.error('Error al crear administrador:', error);
    res.status(400).json({ error: error.message || 'Error al crear el administrador' });
  }
});

// Eliminar usuario administrador (solo admin)
app.delete('/api/admin/users/:id', requireAdminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    db.deleteAdminUser(id);
    res.json({ success: true, message: 'Usuario administrador eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar administrador:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar el administrador' });
  }
});

// Cerrar sesión de administrador
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.slice(7).trim()
    : req.headers['x-admin-token'];

  if (token) {
    adminSessions.delete(token);
  }
  res.json({ success: true, message: 'Sesión de administrador cerrada' });
});

// ========================================================
// RUTAS DE ANALÍTICAS (EXCLUSIVO ADMINISTRADORES)
// ========================================================

// Resumen de nuevos ingresos (por fecha/rango) y distribución geográfica
app.get('/api/analytics/overview', requireAdminAuth, (req, res) => {
  try {
    const entries = analytics.getNewEntriesAnalytics({
      mode: req.query.mode,
      days: req.query.days,
      date: req.query.date,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    });
    const geography = analytics.getGeographicAnalytics();
    res.json({ entries, geography });
  } catch (error) {
    console.error('Error en analíticas generales:', error);
    res.status(500).json({ error: 'Error al generar las analíticas' });
  }
});

// Listado buscable de participantes con frecuencia de asistencia (solo admin)
app.get('/api/analytics/personas', requireAdminAuth, (req, res) => {
  try {
    const results = analytics.getAnalyticsPersonasList(req.query.q || '');
    res.json(results);
  } catch (error) {
    console.error('Error al listar participantes para analíticas:', error);
    res.status(500).json({ error: 'Error al consultar participantes' });
  }
});

// Detalle e historial de visitas de un participante (solo admin)
app.get('/api/analytics/personas/:id', requireAdminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de persona inválido' });
    }
    const detail = analytics.getPersonaAnalyticsDetail(id);
    if (!detail) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    res.json(detail);
  } catch (error) {
    console.error('Error al obtener detalle analítico de persona:', error);
    res.status(500).json({ error: 'Error al obtener analíticas de la persona' });
  }
});

// 8. Export to Excel (.xlsx)
app.get('/api/export/excel', async (req, res) => {
  try {
    const { format = 'full', search, tipo, dateFrom, dateTo } = req.query;
    const personas = db.getAll({ search, tipo, dateFrom, dateTo });

    const workbook = await generateExcel(personas, format);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const suffix = format === 'original' ? 'Plantilla_Original' : 'Completo';
    const filename = `Control_Asistencia_NVSR_${suffix}_${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    res.status(500).json({ error: 'Error al generar el archivo Excel' });
  }
});

// 9. Import from Excel (.xlsx)
app.post('/api/import/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const records = await parseUploadedExcel(req.file.buffer);
    if (!records || records.length === 0) {
      return res.status(400).json({ error: 'No se encontraron registros válidos en el archivo' });
    }

    // High performance bulk insertion inside single transaction
    const insertedCount = db.createMany(records);

    res.json({
      success: true,
      message: `Se importaron ${insertedCount} registros con éxito.`,
      count: insertedCount
    });
  } catch (error) {
    console.error('Error al importar Excel:', error);
    res.status(500).json({ error: error.message || 'Error al procesar el archivo Excel' });
  }
});

// 10. Fallback for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Helper to get local network IP
function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Start Server
const server = app.listen(PORT, () => {
  const localIP = getLocalNetworkIP();
  console.log('====================================================');
  console.log('⛪  SISTEMA DE CONTROL - IGLESIA NUEVA VIDA SOTO DEL REAL');
  console.log('====================================================');
  console.log(`🚀 Servidor ejecutándose en:`);
  console.log(`   ➜ Local:        http://localhost:${PORT}`);
  console.log(`   ➜ Red Local/Móvil: http://${localIP}:${PORT}`);
  console.log('====================================================');
});

module.exports = { app, server };
