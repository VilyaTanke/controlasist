/**
 * Importación de registros reales desde LISTA ASISTENTES SOTO_261031_121819.pdf
 * Reemplaza los registros de prueba en `personas` y `asistencias` preservando `usuarios_admin`.
 */
const db = require('../server/db');

const SENTINEL_NO_DATE = '1970-01-01 00:00:00';
const KNOWN_LOCATIONS = ['Soto del Real', 'Colmenar', 'Manzanares', 'Miraflores'];

const MUJERES = [
  ['Elizabeth Vergara (Perú) (Soto del Real)', '634788943', '28/12/25'],
  ['Arely', '654376295', '—'],
  ['Elaine', '697234627', '07/09/25'],
  ['Erika', '603209557', '—'],
  ['Alicia Galeano (Ezequiel)', '641879366', '08/02/26'],
  ['Luz (señora del parque del río)', '655231413', '30/08/25'],
  ['Lidia Alejo (Colmenar)', '640803970', '06/07/25'],
  ['Viviana (hija de Dovi)', '684716468', '06/12/25'],
  ['Laura Vancouver (Colmenar)', '642871254', '08/02/26'],
  ['Tatiana', '637495400', '25/01/26'],
  ['Dovihumar', '684733819', '08/02/26'],
  ['Raiza', '+584141668416', '08/02/26'],
  ['Alejandra Jiménez', '616731928', '28/12/26'],
  ['Luz María Quezada', '698372271', '—'],
  ['Nadia Blanco', '614102084', '—'],
  ['Jacquelin Ruiz', '686856682', '—'],
  ['Margot', '6335910711', '22/06/25'],
  ['Lesy (peruana)', '613355973', '14/06/25'],
  ['Katherine Barba', '613047669', '22/06/25'],
  ['Vanesa García (hija de Reina)', '684201703', '28/12/25'],
  ['Nelly Patricia', '661593315', '17/08/25'],
  ['Kiara Geibler', '623764538', '07/09/25'],
  ['Hilary Fermín', '666580230', '08/02/26'],
  ['Carmen', '637167749', '—'],
  ['Eucary', '633555490', '28/12/25'],
  ['Elizabeth Suett', '664361950', '31/08/25'],
  ['Jhoana (amiga de Maryouri)', '655258983', '—'],
  ['Ana Stangil', '678314785', '14/09/25'],
  ['Victoria (hija de Dovi)', '+584121800318', '08/02/26'],
  ['Angélica (Soto del Real)', '631704154', '13/08/25'],
  ['Jinnet (esposa de Juan)', '+34745059818', '—'],
  ['Maryouri', '627122134', '08/02/26'],
  ['Yohana Patricia Briñez', '634125460', '08/02/26'],
  ['Estela Ochoa Soliz', '652132757', '22/02/26'],
  ['Gineth Prada', '699736685', '08/02/26'],
  ['Angie (Colmenar)', '+34722702803', '08/02/26'],
  ['Jhojaiza Salas', '+584146579846', '08/02/26'],
  ['Raquel (prima de Alicia)', '641802957', '—'],
  ['Mirla (Manzanares)', '600935501', '21/12/25'],
  ['Fanny', '602450752', '07/02/26'],
  ['Olga (Manzanares)', '678151390', '08/02/26'],
  ['Melisa', '673929102', '01/02/26'],
  ['Pamela', '652580687', '—'],
  ['Carmen (Soto del Real)', '666012739', '—'],
  ['Lissette', '625080603', '22/02/26'],
  ['Michelle (Colmenar)', '654201849', '22/02/26'],
  ['Lesly Carolina Cantillo', '663086774', '—'],
  ['Claudia Hernández (Miraflores)', '651337965', '15/03/26'],
  ['Lilian', '643701710', '15/03/26'],
  ['Catalina (Soto del Real)', '641339054', '15/03/26'],
  ['Evelin', '689259075', '08/01/26'],
  ['Fabiola', '658625173', '08/01/26'],
  ['Yolanda (sobrina de Luz) (Soto del Real)', '+18298989038', '15/03/26'],
  ['Nataly Días', '641407096', '22/03/26'],
  ['Margarita Euceda', '66850319', '22/03/26'],
  ['Yuri Reyes', '668503620', '22/03/26'],
  ['Anais Ruiz', '683374918', '22/03/26'],
  ['Nury (Miraflores)', '632041073', '22/03/26'],
  ['Mamá de Johana', '655258983', '29/03/26'],
  ['Melanie Marte', '611283275', '29/03/26'],
  ['Zara Pazmiño', '677137198', '12/07/26'],
  ['Elevin Murillo', '642873003', '12/07/26'],
  ['Yovana (Miraflores)', '613211133', '—'],
  ['Jossy (esposa de Peter)', '611223522', '—'],
  ['Ruth (novia de Víctor)', '614199501', '—'],
  ['Yube (Miraflores)', '603757866', '—'],
  ['Milena (Miraflores)', '613645491', '—'],
  ['Sharlot', '622515525', '—'],
  ['Ariadna Castro', '613368680', '—'],
  ['Julieth', '604270153', '—'],
  ['Stephy', '678355036', '']
];

const HOMBRES = [
  ['Juan Saldaña (Soto del Real)', '661132144', '07/09/25'],
  ['Ender Robles (Soto del Real)', '623740985', '—'],
  ['Ezequiel (Colmenar)', '622918106', '08/02/26'],
  ['Yeison (pareja de Tatiana) (Soto del Real)', '675127123', '22/09/25'],
  ['Rey (Soto del Real)', '643624689', '08/02/26'],
  ['Jhonny Piñango', '63306061', '—'],
  ['Antonio', '634671002', '—'],
  ['Omar Piñuela (Soto del Real)', '647122464', '08/02/26'],
  ['Rodian (Soto del Real)', '633675955', '28/12/25'],
  ['José Omar Soler (Soto del Real)', '602072001', '18/01/26'],
  ['Yeiner Maya', '670788256', '07/09/25'],
  ['Brayan', '688316609', '14/09/25'],
  ['Andrés', '643322787', '—'],
  ['Edison (Colmenar)', '646769619', '18/01/26'],
  ['Elián David (hijo de Lidia) (Miraflores)', '692394098', '21/09/25'],
  ['Víctor Núñez (Soto del Real)', '636006046', '08/02/26'],
  ['Erick Murillo', '657221999', '08/02/26'],
  ['Carlos Fernando Rueda', '614642377', '08/02/26'],
  ['Alejandro Méndez (Soto del Real)', '641792968', '07/02/26'],
  ['Anderson Méndez (Soto del Real)', '643259071', '07/02/26'],
  ['Harry (pareja de Maryouri)', '674859956', '21/12/25'],
  ['Juan Carlos Navarro', '617603356', '22/02/26'],
  ['Jorge', '622916820', '15/03/26'],
  ['William Riveros', '602725264', '15/03/26'],
  ['Samuel Reyes', '610429707', '22/03/26'],
  ['Luis Sosas', '642612281', '22/03/26'],
  ['Blass Armando Delgado', '627328694', '05/04/26'],
  ['Enrique Díaz', '60597987', '12/07/26'],
  ['Ángel', '653343906', '—'],
  ['Peter (Soto del Real)', '633293154', '—'],
  ['Víctor (Soto del Real)', '636006046', '—'],
  ['Daniel Jurado', '655870369', '—'],
  ['Cesar tío de Ezequiel', '651472666', '—']
];

function extractMunicipality(nombre) {
  for (const loc of KNOWN_LOCATIONS) {
    if (nombre.includes(`(${loc})`)) {
      return loc;
    }
  }
  return null;
}

function parseVisitDate(rawDate) {
  const cleaned = (rawDate || '').trim();
  if (!cleaned || cleaned === '—' || cleaned === '-') {
    return SENTINEL_NO_DATE;
  }
  const match = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!match) {
    throw new Error(`Formato de fecha inesperado en PDF: "${rawDate}"`);
  }
  const [, dd, mm, yy] = match;
  return `20${yy}-${mm}-${dd} 18:00:00`;
}

function buildRecord([nombre, telefono, ultimaVisita], group) {
  return {
    nombre,
    telefono,
    direccion: extractMunicipality(nombre),
    cumpleanos: null,
    tipo: 'nuevo',
    fecha_hora_registro: parseVisitDate(ultimaVisita),
    notas: group
  };
}

function seedFromPdf() {
  const records = [
    ...MUJERES.map(row => buildRecord(row, 'Mujeres')),
    ...HOMBRES.map(row => buildRecord(row, 'Hombres'))
  ];

  const resetTx = db.db.transaction(() => {
    db.db.prepare('DELETE FROM asistencias').run();
    db.db.prepare('DELETE FROM personas').run();
    db.db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('asistencias', 'personas')").run();
  });

  resetTx();
  const inserted = db.createMany(records);
  const stats = db.getStats();
  const groupCounts = db.db.prepare(
    'SELECT notas AS grupo, COUNT(*) AS cantidad FROM personas GROUP BY notas ORDER BY notas'
  ).all();
  const admins = db.db.prepare('SELECT id, username, rol FROM usuarios_admin').all();

  console.log(`Importación completada: ${inserted} registros insertados.`);
  console.log('Estadísticas:', stats);
  console.log('Por grupo:', groupCounts);
  console.log('Admins preservados:', admins);
}

seedFromPdf();
