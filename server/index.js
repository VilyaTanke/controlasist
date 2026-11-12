const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const os = require('os');
const db = require('./db');
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

// 3. List personas with optional filters
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

// 7. Delete persona
app.delete('/api/personas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de registro inválido' });
    }

    const result = db.remove(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    res.json({ success: true, message: 'Registro eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    res.status(500).json({ error: 'Error al eliminar el registro' });
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
