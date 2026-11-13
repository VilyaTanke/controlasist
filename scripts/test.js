const db = require('../server/db');
const analytics = require('../server/analyticsService');
const { generateExcel, parseUploadedExcel } = require('../server/excelService');

async function runTests() {
  console.log('--- Iniciando Pruebas de Calidad Control NVSR ---');

  // 1. Test Base de Datos
  console.log('1. Probando integridad de SQLite...');
  const stats = db.getStats();
  console.log('   Stats:', JSON.stringify(stats));
  if (typeof stats.total !== 'number') throw new Error('Estadísticas inválidas');

  // 2. Test Crear y Leer
  const item = db.create({
    nombre: 'Usuario de Prueba CI',
    telefono: '611223344',
    direccion: 'Plaza Mayor 1, Soto del Real',
    cumpleanos: '1990-10-10',
    tipo: 'nuevo',
    notas: 'Prueba automática'
  });
  if (!item || !item.id) throw new Error('Error creando registro');

  const fetched = db.getById(item.id);
  if (fetched.nombre !== 'Usuario de Prueba CI') throw new Error('Error al recuperar registro');

  // 3. Test Actualizar
  const updated = db.update(item.id, {
    nombre: 'Usuario de Prueba CI Modificado',
    telefono: '611223344',
    direccion: 'Plaza Mayor 1, Soto del Real',
    cumpleanos: '1990-10-10',
    tipo: 'consolidado',
    notas: 'Prueba automática modificada'
  });
  if (updated.tipo !== 'consolidado') throw new Error('Error al actualizar registro');

  // 4. Test Eliminar
  db.remove(item.id);
  if (item.persona_id) {
    db.db.prepare('DELETE FROM personas WHERE id = ?').run(item.persona_id);
  }
  if (db.getById(item.id)) throw new Error('Error al eliminar registro');
  console.log('   Operaciones CRUD: OK');

  // 5. Test Transacción Bulk (createMany)
  console.log('2. Probando inserción masiva en transacción (createMany)...');
  db.getAll({ search: 'Bulk Test' }).forEach(b => {
    db.remove(b.id);
    db.db.prepare('DELETE FROM personas WHERE id = ?').run(b.persona_id);
  });

  const count = db.createMany([
    { nombre: 'Bulk Test 1', tipo: 'nuevo' },
    { nombre: 'Bulk Test 2', tipo: 'consolidado' }
  ]);
  if (count !== 2) throw new Error('Error en inserción masiva');
  const bulkItems = db.getAll({ search: 'Bulk Test' });
  if (bulkItems.length !== 2) throw new Error('Error al consultar registros bulk');
  bulkItems.forEach(b => {
    db.remove(b.id);
    db.db.prepare('DELETE FROM personas WHERE id = ?').run(b.persona_id);
  });
  console.log('   Transacción createMany: OK');

  // 6. Test Generación de Excel
  console.log('3. Probando exportación e importación ExcelJS...');
  const allPersonas = db.getAll({});
  const wbOriginal = await generateExcel(allPersonas, 'original');
  const bufOrig = await wbOriginal.xlsx.writeBuffer();
  if (bufOrig.length < 1000) throw new Error('Buffer Excel Original corrupto o vacío');

  const wbFull = await generateExcel(allPersonas, 'full');
  const bufFull = await wbFull.xlsx.writeBuffer();
  if (bufFull.length < 1000) throw new Error('Buffer Excel Completo corrupto o vacío');

  const parsed = await parseUploadedExcel(bufFull);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Error en parseUploadedExcel');
  console.log('   Excel export/import roundtrip: OK');

  // 7. Test Módulo de Usuarios Administradores
  console.log('4. Probando sistema de autenticación y usuarios Admin...');
  const pastoraAuth = db.verifyAdminCredentials('Pastora', '12345678');
  if (!pastoraAuth || pastoraAuth.username !== 'Pastora') {
    throw new Error('Fallo al autenticar usuario por defecto Pastora');
  }
  const badAuth = db.verifyAdminCredentials('Pastora', 'contraseña_erronea');
  if (badAuth !== null) {
    throw new Error('La autenticación no debe aceptar contraseñas erróneas');
  }

  // Probar creación de nuevo admin
  db.db.prepare('DELETE FROM usuarios_admin WHERE username = ?').run('Admin CI Test');
  const newAdmin = db.createAdminUser({ username: 'Admin CI Test', password: 'ciPassword123' });
  if (!newAdmin || newAdmin.username !== 'Admin CI Test') {
    throw new Error('Error al crear nuevo administrador');
  }
  const checkNewAdmin = db.verifyAdminCredentials('Admin CI Test', 'ciPassword123');
  if (!checkNewAdmin) {
    throw new Error('Error al autenticar el nuevo administrador creado');
  }
  db.deleteAdminUser(newAdmin.id);
  console.log('   Autenticación y gestión Admin: OK');

  // 8. Test Módulo de Analíticas y Geografía
  console.log('5. Probando módulo de Analíticas y Geografía...');
  const geo1 = analytics.parseAddressGeography('Calle Real, 14, 28791 Soto del Real, Madrid');
  if (geo1.city !== 'Soto del Real' || geo1.zone !== 'Calle Real' || !geo1.isLocalCity) {
    throw new Error(`Error parseo geo1: ${JSON.stringify(geo1)}`);
  }
  const geo2 = analytics.parseAddressGeography('Colmenar');
  if (geo2.city !== 'Colmenar Viejo' || geo2.isLocalCity) {
    throw new Error(`Error parseo geo2: ${JSON.stringify(geo2)}`);
  }
  const geo3 = analytics.parseAddressGeography('Carabanchel, Madrid');
  if (geo3.city !== 'Madrid' || geo3.zone !== 'Carabanchel') {
    throw new Error(`Error parseo geo3: ${JSON.stringify(geo3)}`);
  }

  let testPersonaId = null;
  try {
    const pCreated = db.create({
      nombre: 'Analítica Test Persona',
      telefono: '699000111',
      direccion: 'Calle del Prado, 15, Soto del Real',
      tipo: 'nuevo',
      fecha_hora_registro: '2026-11-10 18:00:00'
    });
    testPersonaId = pCreated.persona_id;
    db.registrarAsistencia({
      persona_id: testPersonaId,
      fecha_hora: '2026-11-12 18:00:00',
      tipo: 'consolidado',
      notas: 'Segunda visita CI'
    });

    const entriesDay = analytics.getNewEntriesAnalytics({ mode: 'date', date: '2026-11-10' });
    if (entriesDay.totals.nuevosPrimerIngreso < 1) {
      throw new Error('Error en filtro por fecha específica de nuevos ingresos');
    }
    const entriesRange = analytics.getNewEntriesAnalytics({
      mode: 'range',
      dateFrom: '2026-11-10',
      dateTo: '2026-11-12'
    });
    if (entriesRange.totals.totalAsistencias < 2) {
      throw new Error('Error en conteo de asistencias por rango');
    }

    const detail = analytics.getPersonaAnalyticsDetail(testPersonaId);
    if (!detail || detail.stats.totalAsistencias !== 2 || detail.stats.ultimaVisita !== '2026-11-12 18:00:00') {
      throw new Error(`Error en detalle analítico de persona: ${JSON.stringify(detail)}`);
    }

    const geoReport = analytics.getGeographicAnalytics();
    const sotoCity = geoReport.cities.find(c => c.city === 'Soto del Real');
    if (!sotoCity || !sotoCity.zones.some(z => z.zone === 'Calle del Prado')) {
      throw new Error('Error en agrupación geográfica de ciudades/zonas');
    }
  } finally {
    if (testPersonaId) {
      db.db.prepare('DELETE FROM asistencias WHERE persona_id = ?').run(testPersonaId);
      db.db.prepare('DELETE FROM personas WHERE id = ?').run(testPersonaId);
    }
  }
  console.log('   Analíticas y distribución geográfica: OK');

  console.log('--- ✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE ---');
}

runTests().catch(err => {
  console.error('❌ Error en las pruebas:', err);
  process.exit(1);
});

