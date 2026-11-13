const db = require('./db');

const SENTINEL_PREFIX = '1970-01-01';

// Catalog of local municipalities and Madrid cities (specific towns first; Madrid as fallback)
const CITY_CATALOG = [
  { canonical: 'Soto del Real', isLocal: true, patterns: [/\bsoto\s+del\s+real\b/i, /^\s*soto\s*$/i] },
  { canonical: 'Colmenar Viejo', isLocal: false, patterns: [/\bcolmenar\s+viejo\b/i, /\bcolmenar\b/i] },
  { canonical: 'Miraflores de la Sierra', isLocal: false, patterns: [/\bmiraflores\s+de\s+la\s+sierra\b/i, /\bmiraflores\b/i] },
  { canonical: 'Manzanares el Real', isLocal: false, patterns: [/\bmanzanares\s+el\s+real\b/i, /\bmanzanares\b/i] },
  { canonical: 'Guadalix de la Sierra', isLocal: false, patterns: [/\bguadalix\s+de\s+la\s+sierra\b/i, /\bguadalix\b/i] },
  { canonical: 'El Boalo', isLocal: false, patterns: [/\bel\s+boalo\b/i, /\bboalo\b/i] },
  { canonical: 'Cerceda', isLocal: false, patterns: [/\bcerceda\b/i] },
  { canonical: 'Mataelpino', isLocal: false, patterns: [/\bmataelpino\b/i] },
  { canonical: 'Tres Cantos', isLocal: false, patterns: [/\btres\s+cantos\b/i] },
  { canonical: 'Alcobendas', isLocal: false, patterns: [/\balcobendas\b/i] },
  { canonical: 'San Sebastián de los Reyes', isLocal: false, patterns: [/\bsan\s+sebastian\s+de\s+los\s+reyes\b/i, /\bs\.?\s*s\.?\s+de\s+los\s+reyes\b/i] },
  { canonical: 'Bustarviejo', isLocal: false, patterns: [/\bbustarviejo\b/i] },
  { canonical: 'Navalafuente', isLocal: false, patterns: [/\bnavalafuente\b/i] },
  { canonical: 'Venturada', isLocal: false, patterns: [/\bventurada\b/i] },
  { canonical: 'Pedrezuela', isLocal: false, patterns: [/\bpedrezuela\b/i] },
  { canonical: 'San Agustín del Guadalix', isLocal: false, patterns: [/\bsan\s+agustin\s+del\s+guadalix\b/i] },
  { canonical: 'Torrelaguna', isLocal: false, patterns: [/\btorrelaguna\b/i] },
  { canonical: 'Becerril de la Sierra', isLocal: false, patterns: [/\bbecerril\b/i] },
  { canonical: 'Moralzarzal', isLocal: false, patterns: [/\bmoralzarzal\b/i] },
  { canonical: 'Collado Villalba', isLocal: false, patterns: [/\bcollado\s+villalba\b/i, /\bvillalba\b/i] },
  { canonical: 'Navacerrada', isLocal: false, patterns: [/\bnavacerrada\b/i] },
  { canonical: 'Rascafría', isLocal: false, patterns: [/\brascafria\b/i] },
  { canonical: 'Alcalá de Henares', isLocal: false, patterns: [/\balcala\s+de\s+henares\b/i] },
  { canonical: 'Algete', isLocal: false, patterns: [/\balgete\b/i] },
  { canonical: 'Getafe', isLocal: false, patterns: [/\bgetafe\b/i] },
  { canonical: 'Leganés', isLocal: false, patterns: [/\bleganes\b/i] },
  { canonical: 'Móstoles', isLocal: false, patterns: [/\bmostoles\b/i] },
  { canonical: 'Fuenlabrada', isLocal: false, patterns: [/\bfuenlabrada\b/i] },
  { canonical: 'Madrid', isLocal: false, patterns: [/\bmadrid\b/i] }
];

const STREET_PREFIX_RE = /^(c\/|calle|av|avda|avenida|paseo|pº|plaza|pza|urb|urbanizacion|barrio|bo|sector|camino|carretera|ctra|ronda|travesia|glorieta|parque|zona|poligono|portal|bloque|blq|piso|pta|puerta|esc|escalera|chalet|bajo|atico|ático)\b/i;

function getLocalDateStr(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDaysToDateStr(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function diffDaysBetween(laterStr, earlierStr) {
  const [y1, m1, d1] = laterStr.split('-').map(Number);
  const [y2, m2, d2] = earlierStr.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t1 - t2) / 86400000);
}

function isValidIsoDate(val) {
  return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim());
}

function toTitleCase(str) {
  const lowercaseWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y']);
  return str
    .trim()
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && lowercaseWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Clean street / zone text to group neighbors on the same street or urbanization.
 */
function normalizeZoneLabel(rawSegments) {
  const cleanedParts = rawSegments
    .map(seg => seg
      .replace(/\b\d{5}\b/g, '')
      .replace(/\b(nº|num\.?|número|portal|bloque|blq\.?|piso|pta\.?|puerta|escalera|esc\.?|bajo|ático|atico)\b[\s.:a-z0-9ºª-]*/gi, '')
      .replace(/^\d+[a-zºª]?$/i, '')
      .replace(/[\s,]+$/g, '')
      .trim()
    )
    .filter(seg => seg && !/^\d+[a-zºª-]*$/i.test(seg));

  if (cleanedParts.length === 0) return null;

  let zone = cleanedParts.join(', ')
    .replace(/\bc\/\s*/gi, 'Calle ')
    .replace(/\bavda\.?\s+/gi, 'Avenida ')
    .replace(/\bav\.?\s+/gi, 'Avenida ')
    .replace(/\bpza\.?\s+/gi, 'Plaza ')
    .replace(/\burb\.?\s+/gi, 'Urbanización ')
    .replace(/\bpº\.?\s+/gi, 'Paseo ')
    .replace(/\s+\d+[a-zºª-]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!zone || /^\d+$/.test(zone)) return null;
  return zone;
}

/**
 * Extract structured city/municipality and zone/street/neighborhood from a free-text address.
 */
function parseAddressGeography(rawAddress) {
  const trimmed = (rawAddress || '').trim();
  if (!trimmed || trimmed === '-' || trimmed === '—') {
    return {
      hasAddress: false,
      city: 'Sin dirección registrada',
      zone: 'Sin dirección',
      isKnownZone: false,
      isLocalCity: false
    };
  }

  const segments = trimmed
    .split(',')
    .map(s => s.replace(/\b(españa|spain)\b/gi, '').trim())
    .filter(Boolean);

  let matchedCity = null;
  let matchedSegmentIdx = -1;

  // Check specific towns right-to-left (ignoring Madrid first so "Soto del Real, Madrid" resolves to Soto del Real)
  const specificCatalog = CITY_CATALOG.slice(0, -1);
  const madridEntry = CITY_CATALOG[CITY_CATALOG.length - 1];

  for (let i = segments.length - 1; i >= 0 && !matchedCity; i--) {
    const normSeg = db.normalizeForSearch(segments[i]);
    for (const entry of specificCatalog) {
      if (entry.patterns.some(re => re.test(normSeg))) {
        matchedCity = entry;
        matchedSegmentIdx = i;
        break;
      }
    }
  }

  // Fall back to Madrid if no specific town matched
  if (!matchedCity) {
    for (let i = segments.length - 1; i >= 0; i--) {
      const normSeg = db.normalizeForSearch(segments[i]);
      if (madridEntry.patterns.some(re => re.test(normSeg))) {
        matchedCity = madridEntry;
        matchedSegmentIdx = i;
        break;
      }
    }
  }

  if (matchedCity) {
    // Remaining segments represent the zone/neighborhood/street
    const remaining = [];
    segments.forEach((seg, idx) => {
      if (idx === matchedSegmentIdx) {
        // Strip the city name & postal code from this segment in case someone wrote "Barrio Centro Soto del Real"
        let stripped = seg.replace(/\b\d{5}\b/g, '').trim();
        for (const pattern of matchedCity.patterns) {
          stripped = stripped.replace(new RegExp(pattern.source, 'gi'), '').trim();
        }
        stripped = stripped.replace(/^[-,.\s]+|[-,.\s]+$/g, '');
        if (stripped) remaining.push(stripped);
      } else {
        // Skip trailing province "Madrid" if already resolved to a Madrid municipality
        if (matchedCity.canonical !== 'Madrid' && /^madrid$/i.test(db.normalizeForSearch(seg))) {
          return;
        }
        remaining.push(seg);
      }
    });

    const zoneLabel = normalizeZoneLabel(remaining);
    return {
      hasAddress: true,
      city: matchedCity.canonical,
      zone: zoneLabel || 'Municipio general (sin detalle)',
      isKnownZone: Boolean(zoneLabel),
      isLocalCity: Boolean(matchedCity.isLocal)
    };
  }

  // No catalog match: infer unknown town vs street-only entry
  const cleanedSegments = segments
    .map(s => s.replace(/\b\d{5}\b/g, '').trim())
    .filter(s => s && !/^\d+[a-zºª-]*$/i.test(s));

  if (cleanedSegments.length === 0) {
    return {
      hasAddress: true,
      city: 'Ciudad no especificada',
      zone: trimmed,
      isKnownZone: true,
      isLocalCity: false
    };
  }

  const lastSeg = cleanedSegments[cleanedSegments.length - 1];
  const lastNorm = db.normalizeForSearch(lastSeg);

  if (STREET_PREFIX_RE.test(lastNorm) || /\s+\d+/.test(lastNorm)) {
    const zoneLabel = normalizeZoneLabel(cleanedSegments);
    return {
      hasAddress: true,
      city: 'Ciudad no especificada',
      zone: zoneLabel || trimmed,
      isKnownZone: true,
      isLocalCity: false
    };
  }

  const cityName = toTitleCase(lastSeg);
  const zoneLabel = normalizeZoneLabel(cleanedSegments.slice(0, -1));
  return {
    hasAddress: true,
    city: cityName,
    zone: zoneLabel || 'Municipio general (sin detalle)',
    isKnownZone: Boolean(zoneLabel),
    isLocalCity: false
  };
}

/**
 * Resolve date boundaries from preset, single specific date, custom range, or full history.
 */
function resolveDateRange(params = {}) {
  const today = getLocalDateStr();
  const mode = params.mode || 'preset';

  if (mode === 'date' && isValidIsoDate(params.date)) {
    const target = params.date.trim();
    return {
      mode: 'date',
      dateFrom: target,
      dateTo: target,
      label: target
    };
  }

  if (mode === 'range' && (isValidIsoDate(params.dateFrom) || isValidIsoDate(params.dateTo))) {
    let from = isValidIsoDate(params.dateFrom) ? params.dateFrom.trim() : params.dateTo.trim();
    let to = isValidIsoDate(params.dateTo) ? params.dateTo.trim() : params.dateFrom.trim();
    if (from > to) [from, to] = [to, from];
    return {
      mode: 'range',
      dateFrom: from,
      dateTo: to,
      label: from === to ? from : `${from} a ${to}`
    };
  }

  if (mode === 'all') {
    const bounds = db.db.prepare(`
      SELECT
        MIN(substr(fecha_hora, 1, 10)) AS minDate,
        MAX(substr(fecha_hora, 1, 10)) AS maxDate
      FROM asistencias
      WHERE fecha_hora NOT LIKE ?
    `).get(`${SENTINEL_PREFIX}%`);

    const minDate = bounds && bounds.minDate ? bounds.minDate : today;
    const maxDate = bounds && bounds.maxDate ? bounds.maxDate : today;
    return {
      mode: 'all',
      dateFrom: minDate,
      dateTo: maxDate,
      label: 'Todo el historial'
    };
  }

  // Preset: last N days (default 30)
  const parsedDays = parseInt(params.days, 10);
  const days = !isNaN(parsedDays) && parsedDays > 0 ? Math.min(parsedDays, 3650) : 30;
  const from = addDaysToDateStr(today, -(days - 1));
  return {
    mode: 'preset',
    days,
    dateFrom: from,
    dateTo: today,
    label: `Últimos ${days} días`
  };
}

/**
 * Compute new-entry & attendance metrics for a date or date range (excluding sentinel 1970-01-01 dates).
 */
function getNewEntriesAnalytics(params = {}) {
  const period = resolveDateRange(params);
  const fromTs = `${period.dateFrom} 00:00:00`;
  const toTs = `${period.dateTo} 23:59:59`;
  const sentinelLike = `${SENTINEL_PREFIX}%`;

  const totalPersonas = db.db.prepare('SELECT COUNT(*) AS c FROM personas').get().c;

  // Summary of first-time entrants ("personas nuevas que entraron") inside period
  const newPeopleList = db.db.prepare(`
    WITH valid_asistencias AS (
      SELECT id, persona_id, fecha_hora, tipo, notas
      FROM asistencias
      WHERE fecha_hora NOT LIKE ?
    ),
    first_visits AS (
      SELECT
        a.persona_id,
        a.fecha_hora AS primera_visita,
        a.tipo AS primer_tipo,
        a.notas AS notas_ingreso
      FROM valid_asistencias a
      WHERE a.id = (
        SELECT a2.id
        FROM valid_asistencias a2
        WHERE a2.persona_id = a.persona_id
        ORDER BY a2.fecha_hora ASC, a2.id ASC
        LIMIT 1
      )
    )
    SELECT
      p.id,
      p.nombre,
      p.telefono,
      p.direccion,
      p.tipo AS estado_actual,
      fv.primer_tipo,
      fv.primera_visita,
      (SELECT MAX(va.fecha_hora) FROM valid_asistencias va WHERE va.persona_id = p.id) AS ultima_visita,
      (SELECT COUNT(*) FROM valid_asistencias va WHERE va.persona_id = p.id) AS total_asistencias
    FROM first_visits fv
    JOIN personas p ON p.id = fv.persona_id
    WHERE fv.primer_tipo = 'nuevo'
      AND fv.primera_visita >= ?
      AND fv.primera_visita <= ?
    ORDER BY fv.primera_visita DESC, p.nombre ASC
  `).all(sentinelLike, fromTs, toTs);

  // Period attendance counts (new vs consolidated visits inside period)
  const periodTotals = db.db.prepare(`
    SELECT
      COUNT(*) AS totalAsistencias,
      COUNT(DISTINCT CASE WHEN tipo = 'nuevo' THEN persona_id END) AS nuevosVisitantes,
      COUNT(DISTINCT CASE WHEN tipo = 'consolidado' THEN persona_id END) AS consolidadosVisitantes,
      COALESCE(SUM(CASE WHEN tipo = 'nuevo' THEN 1 ELSE 0 END), 0) AS asistenciasNuevo,
      COALESCE(SUM(CASE WHEN tipo = 'consolidado' THEN 1 ELSE 0 END), 0) AS asistenciasConsolidado
    FROM asistencias
    WHERE fecha_hora NOT LIKE ?
      AND fecha_hora >= ?
      AND fecha_hora <= ?
  `).get(sentinelLike, fromTs, toTs);

  // Daily counts of new first-time entries
  const dailyNewRows = db.db.prepare(`
    WITH valid_asistencias AS (
      SELECT id, persona_id, fecha_hora, tipo
      FROM asistencias
      WHERE fecha_hora NOT LIKE ?
    ),
    first_visits AS (
      SELECT a.persona_id, a.fecha_hora AS primera_visita, a.tipo AS primer_tipo
      FROM valid_asistencias a
      WHERE a.id = (
        SELECT a2.id FROM valid_asistencias a2
        WHERE a2.persona_id = a.persona_id
        ORDER BY a2.fecha_hora ASC, a2.id ASC
        LIMIT 1
      )
    )
    SELECT
      substr(primera_visita, 1, 10) AS date,
      COUNT(*) AS nuevosIngresos
    FROM first_visits
    WHERE primer_tipo = 'nuevo'
      AND primera_visita >= ?
      AND primera_visita <= ?
    GROUP BY substr(primera_visita, 1, 10)
    ORDER BY date ASC
  `).all(sentinelLike, fromTs, toTs);

  // Daily attendance totals in period
  const dailyAttRows = db.db.prepare(`
    SELECT
      substr(fecha_hora, 1, 10) AS date,
      COUNT(*) AS totalAsistencias,
      COALESCE(SUM(CASE WHEN tipo = 'nuevo' THEN 1 ELSE 0 END), 0) AS asistenciasNuevo,
      COALESCE(SUM(CASE WHEN tipo = 'consolidado' THEN 1 ELSE 0 END), 0) AS asistenciasConsolidado
    FROM asistencias
    WHERE fecha_hora NOT LIKE ?
      AND fecha_hora >= ?
      AND fecha_hora <= ?
    GROUP BY substr(fecha_hora, 1, 10)
    ORDER BY date ASC
  `).all(sentinelLike, fromTs, toTs);

  const byDateMap = new Map();
  const ensureDateBucket = (d) => {
    if (!byDateMap.has(d)) {
      byDateMap.set(d, {
        date: d,
        nuevosIngresos: 0,
        asistenciasNuevo: 0,
        asistenciasConsolidado: 0,
        totalAsistencias: 0
      });
    }
    return byDateMap.get(d);
  };

  const spanDays = diffDaysBetween(period.dateTo, period.dateFrom) + 1;
  if (spanDays >= 1 && spanDays <= 35) {
    for (let i = 0; i < spanDays; i++) {
      ensureDateBucket(addDaysToDateStr(period.dateFrom, i));
    }
  }

  for (const r of dailyNewRows) {
    ensureDateBucket(r.date).nuevosIngresos = r.nuevosIngresos;
  }
  for (const r of dailyAttRows) {
    const bucket = ensureDateBucket(r.date);
    bucket.asistenciasNuevo = r.asistenciasNuevo;
    bucket.asistenciasConsolidado = r.asistenciasConsolidado;
    bucket.totalAsistencias = r.totalAsistencias;
  }

  const dailySeries = Array.from(byDateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Monthly aggregation (useful when viewing 90 days or full history)
  const monthlyMap = new Map();
  for (const d of dailySeries) {
    const month = d.date.slice(0, 7);
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, {
        month,
        nuevosIngresos: 0,
        asistenciasNuevo: 0,
        asistenciasConsolidado: 0,
        totalAsistencias: 0
      });
    }
    const mBucket = monthlyMap.get(month);
    mBucket.nuevosIngresos += d.nuevosIngresos;
    mBucket.asistenciasNuevo += d.asistenciasNuevo;
    mBucket.asistenciasConsolidado += d.asistenciasConsolidado;
    mBucket.totalAsistencias += d.totalAsistencias;
  }
  const monthlySeries = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  return {
    period,
    totals: {
      totalPersonas,
      nuevosPrimerIngreso: newPeopleList.length,
      nuevosVisitantes: periodTotals.nuevosVisitantes || 0,
      consolidadosVisitantes: periodTotals.consolidadosVisitantes || 0,
      asistenciasNuevo: periodTotals.asistenciasNuevo || 0,
      asistenciasConsolidado: periodTotals.asistenciasConsolidado || 0,
      totalAsistencias: periodTotals.totalAsistencias || 0
    },
    dailySeries,
    monthlySeries,
    newPeopleList
  };
}

/**
 * Geographic breakdown by city/municipality and zone/neighborhood/street.
 */
function getGeographicAnalytics() {
  const personas = db.db.prepare(`
    SELECT id, nombre, telefono, direccion, tipo, notas
    FROM personas
    ORDER BY nombre ASC
  `).all();

  const cityMap = new Map();
  const topZonesMap = new Map();

  let conDireccion = 0;
  let sinDireccion = 0;
  let enSotoDelReal = 0;
  let otrasCiudades = 0;

  for (const p of personas) {
    const geo = parseAddressGeography(p.direccion);
    if (geo.hasAddress) {
      conDireccion++;
      if (geo.isLocalCity) enSotoDelReal++;
      else otrasCiudades++;
    } else {
      sinDireccion++;
    }

    if (!cityMap.has(geo.city)) {
      cityMap.set(geo.city, {
        city: geo.city,
        hasAddress: geo.hasAddress,
        isLocalCity: geo.isLocalCity,
        count: 0,
        nuevosCount: 0,
        consolidadosCount: 0,
        zonesMap: new Map(),
        personas: []
      });
    }

    const cBucket = cityMap.get(geo.city);
    cBucket.count++;
    if (p.tipo === 'nuevo') cBucket.nuevosCount++;
    else cBucket.consolidadosCount++;

    const personSummary = {
      id: p.id,
      nombre: p.nombre,
      telefono: p.telefono,
      direccion: p.direccion,
      tipo: p.tipo,
      zone: geo.zone
    };
    cBucket.personas.push(personSummary);

    if (!cBucket.zonesMap.has(geo.zone)) {
      cBucket.zonesMap.set(geo.zone, {
        zone: geo.zone,
        isKnownZone: geo.isKnownZone,
        count: 0,
        personas: []
      });
    }
    const zBucket = cBucket.zonesMap.get(geo.zone);
    zBucket.count++;
    zBucket.personas.push(personSummary);

    if (geo.hasAddress && geo.isKnownZone) {
      const tzKey = `${geo.city}|||${geo.zone}`;
      if (!topZonesMap.has(tzKey)) {
        topZonesMap.set(tzKey, {
          city: geo.city,
          zone: geo.zone,
          isLocalCity: geo.isLocalCity,
          count: 0
        });
      }
      topZonesMap.get(tzKey).count++;
    }
  }

  const totalPersonas = personas.length;
  const cities = Array.from(cityMap.values())
    .map(c => {
      const zones = Array.from(c.zonesMap.values()).sort((a, b) => {
        if (a.isKnownZone !== b.isKnownZone) return a.isKnownZone ? -1 : 1;
        if (b.count !== a.count) return b.count - a.count;
        return a.zone.localeCompare(b.zone, 'es');
      });

      return {
        city: c.city,
        hasAddress: c.hasAddress,
        isLocalCity: c.isLocalCity,
        count: c.count,
        percent: totalPersonas > 0 ? Math.round((c.count / totalPersonas) * 1000) / 10 : 0,
        percentKnownAddress: c.hasAddress && conDireccion > 0 ? Math.round((c.count / conDireccion) * 1000) / 10 : 0,
        nuevosCount: c.nuevosCount,
        consolidadosCount: c.consolidadosCount,
        zones,
        personas: c.personas
      };
    })
    .sort((a, b) => {
      if (a.hasAddress !== b.hasAddress) return a.hasAddress ? -1 : 1;
      if (b.count !== a.count) return b.count - a.count;
      if (a.isLocalCity !== b.isLocalCity) return a.isLocalCity ? -1 : 1;
      return a.city.localeCompare(b.city, 'es');
    });

  const topZones = Array.from(topZonesMap.values())
    .sort((a, b) => (b.count - a.count) || a.city.localeCompare(b.city, 'es') || a.zone.localeCompare(b.zone, 'es'));

  const knownCitiesCount = cities.filter(c => c.hasAddress && c.city !== 'Ciudad no especificada').length;

  return {
    summary: {
      totalPersonas,
      conDireccion,
      sinDireccion,
      enSotoDelReal,
      otrasCiudades,
      totalCiudades: knownCitiesCount
    },
    cities,
    topZones
  };
}

/**
 * Searchable participant summary list with real attendance counts & latest visit date.
 */
function getAnalyticsPersonasList(term = '') {
  const searchTerm = `%${db.normalizeForSearch((term || '').trim())}%`;
  const sentinelLike = `${SENTINEL_PREFIX}%`;

  return db.db.prepare(`
    SELECT
      p.id,
      p.nombre,
      p.telefono,
      p.direccion,
      p.cumpleanos,
      p.tipo,
      p.notas,
      (SELECT COUNT(*) FROM asistencias WHERE persona_id = p.id AND fecha_hora NOT LIKE ?) AS total_asistencias,
      (SELECT MAX(fecha_hora) FROM asistencias WHERE persona_id = p.id AND fecha_hora NOT LIKE ?) AS ultima_asistencia,
      (SELECT MIN(fecha_hora) FROM asistencias WHERE persona_id = p.id AND fecha_hora NOT LIKE ?) AS primera_asistencia
    FROM personas p
    WHERE norm(p.nombre) LIKE ? OR norm(p.telefono) LIKE ? OR norm(p.direccion) LIKE ? OR norm(p.notas) LIKE ?
    ORDER BY p.nombre ASC
  `).all(sentinelLike, sentinelLike, sentinelLike, searchTerm, searchTerm, searchTerm, searchTerm);
}

/**
 * Detailed attendance history and statistics for one participant.
 */
function getPersonaAnalyticsDetail(personaId) {
  const persona = db.db.prepare('SELECT * FROM personas WHERE id = ?').get(personaId);
  if (!persona) return null;

  const rawRows = db.db.prepare(`
    SELECT id, persona_id, fecha_hora, tipo, notas, created_at
    FROM asistencias
    WHERE persona_id = ?
    ORDER BY
      CASE WHEN fecha_hora LIKE ? THEN 0 ELSE 1 END DESC,
      fecha_hora DESC,
      id DESC
  `).all(personaId, `${SENTINEL_PREFIX}%`);

  const validHistory = rawRows
    .filter(r => r.fecha_hora && !r.fecha_hora.startsWith(SENTINEL_PREFIX))
    .map(r => ({
      id: r.id,
      fecha_hora: r.fecha_hora,
      tipo: r.tipo,
      notas: r.notas,
      created_at: r.created_at
    }));

  const hasUndatedBaseline = rawRows.some(r => r.fecha_hora && r.fecha_hora.startsWith(SENTINEL_PREFIX));
  const ultimaVisita = validHistory.length > 0 ? validHistory[0].fecha_hora : null;
  const primeraVisita = validHistory.length > 0 ? validHistory[validHistory.length - 1].fecha_hora : null;

  const today = getLocalDateStr();
  const diasDesdeUltimaVisita = ultimaVisita ? diffDaysBetween(today, ultimaVisita.slice(0, 10)) : null;

  return {
    persona: {
      id: persona.id,
      nombre: persona.nombre,
      telefono: persona.telefono,
      direccion: persona.direccion,
      cumpleanos: persona.cumpleanos,
      tipo: persona.tipo,
      notas: persona.notas,
      created_at: persona.created_at
    },
    geography: parseAddressGeography(persona.direccion),
    stats: {
      totalAsistencias: validHistory.length,
      hasUndatedBaseline,
      ultimaVisita,
      primeraVisita,
      diasDesdeUltimaVisita
    },
    history: validHistory
  };
}

module.exports = {
  parseAddressGeography,
  resolveDateRange,
  getNewEntriesAnalytics,
  getGeographicAnalytics,
  getAnalyticsPersonasList,
  getPersonaAnalyticsDetail
};
