const db = require('../server/db');
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

  console.log('--- ✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE ---');
}

runTests().catch(err => {
  console.error('❌ Error en las pruebas:', err);
  process.exit(1);
});

