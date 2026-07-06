/**
 * Script de extracción de datos del Mundial 2026 desde TheSportsDB API.
 *
 * Uso:  npx tsx scripts/fetch-worldcup-data.ts
 * Requiere: axios instalado (ya está en dependencies)
 *
 * Flujo:
 *   1. Recorre fechas 2026-06-11 → 2026-07-19 llamando eventsday.php (key 123)
 *   2. Extrae equipos, sedes y partidos únicos
 *   3. Obtiene detalle de equipos vía lookupteam.php (key 3)
 *   4. Obtiene detalle de sedes vía lookupvenue.php (key 123)
 *   5. Genera seeders/002-teams-stadiums.cjs y seeders/003-matches.cjs
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// ── Configuración ──────────────────────────────────────────────────────────
const EVENTS_KEY = '123';   // Para eventsday.php
const TEAM_KEY = '3';       // Para lookupteam.php
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';
const LEAGUE_ID = '4429';   // FIFA World Cup

const START_DATE = '2026-06-11';
const END_DATE = '2026-07-19';

const SEEDERS_DIR = path.resolve(__dirname, '..', 'src', 'database', 'seeders');
const TEAMS_SEEDER = path.join(SEEDERS_DIR, '002-teams-stadiums.cjs');
const MATCHES_SEEDER = path.join(SEEDERS_DIR, '003-sample-matches.cjs');

// ── Interfaces ─────────────────────────────────────────────────────────────
interface SportsDbEvent {
  idEvent: string;
  strEvent: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strHomeTeam: string;
  strAwayTeam: string;
  idVenue: string;
  strVenue: string;
  strCountry: string;
  strCity?: string;
  dateEvent: string;
  strTime: string;
  intRound: string;
  strGroup?: string;
  strStatus?: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strPostponed?: string;
}

interface SportsDbTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string;
  strAlternate: string;
  strCountry: string;
  strBadge: string;
  strStadium: string;
}

interface SportsDbVenue {
  idVenue: string;
  strVenue: string;
  strVenueAlternate: string;
  strCountry: string;
  strLocation: string;
  strMap: string;
  intCapacity: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Convierte intRound de TheSportsDB a fase del sistema */
function toPhase(intRound: string): string {
  const round = Number(intRound);
  if (round <= 3) return 'group';
  if (round === 32) return 'round_32';
  if (round === 16) return 'round_16';
  if (round === 125) return 'quarter_final';
  if (round === 2) return 'semi_final';
  if (round === 1) return 'final';
  // fallback: si no reconocemos, usamos group
  return 'group';
}

/** Obtener código FIFA desde strTeamShort o inferir */
function toFifaCode(team: SportsDbTeam): string {
  const short = (team.strTeamShort || '').trim().toUpperCase();
  if (short && short.length <= 3) return short;
  // Mapeo manual para equipos sin código corto
  const manual: Record<string, string> = {
    'Czech Republic': 'CZE',
    'South Korea': 'KOR',
    'Ivory Coast': 'CIV',
    'Netherlands': 'NED',
    'Saudi Arabia': 'KSA',
    'Cape Verde': 'CPV',
    'Bosnia-Herzegovina': 'BIH',
    'New Zealand': 'NZL',
    'DR Congo': 'COD',
    'French Guiana': 'GUF',
  };
  return manual[team.strTeam] ?? team.strTeam.substring(0, 3).toUpperCase();
}

function toDateObject(dateStr: string, timeStr: string): Date {
  // timeStr viene como "19:00:00"
  const [h, m, s] = (timeStr || '12:00:00').split(':').map(Number);
  return new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:${String(s || 0).padStart(2, '0')}Z`);
}

/** Escapa strings para SQL */
function esc(val: string | number | boolean | null): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ── Generador de seeders ───────────────────────────────────────────────────
function generateTeamSeeder(teams: Map<string, SportsDbTeam>): string {
  const rows: string[] = [];
  for (const team of teams.values()) {
    const fifaCode = toFifaCode(team);
    rows.push(`      { name: ${esc(team.strTeam)}, fifa_code: ${esc(fifaCode)}, short_name: ${esc(team.strTeamShort || team.strTeam)}, flag_url: null, created_at: now, updated_at: now }`);
  }

  return `'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('teams', [
${rows.join(',\n')}
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('teams', null, {});
  }
};
`;
}

function generateStadiumSeeder(venues: Map<string, SportsDbVenue>): string {
  // Extraemos también de venues
  return '';
}

function generateMatchSeeder(
  matches: SportsDbEvent[],
  teamBySportsId: Map<string, string>,  // sportsId -> fifaCode
  venueByName: Map<string, { name: string; city: string; country: string }>
): string {
  const rows: string[] = [];

  for (const m of matches) {
    const homeCode = teamBySportsId.get(m.idHomeTeam) || m.strHomeTeam.substring(0, 3).toUpperCase();
    const awayCode = teamBySportsId.get(m.idAwayTeam) || m.strAwayTeam.substring(0, 3).toUpperCase();
    const venueName = m.strVenue || 'TBD';
    const startsAt = toDateObject(m.dateEvent, m.strTime);
    const phase = toPhase(m.intRound);
    const status = m.strStatus === 'FT' ? 'finished' : m.strPostponed === 'yes' ? 'postponed' : 'scheduled';
    const homeScore = m.intHomeScore !== null && m.intHomeScore !== undefined ? Number(m.intHomeScore) : null;
    const awayScore = m.intAwayScore !== null && m.intAwayScore !== undefined ? Number(m.intAwayScore) : null;

    rows.push(`      {
        external_id: ${esc(m.idEvent)},
        home_team_fifa: ${esc(homeCode)},
        away_team_fifa: ${esc(awayCode)},
        venue_name: ${esc(venueName)},
        phase: ${esc(phase)},
        status: ${esc(status)},
        starts_at: ${esc(startsAt.toISOString())},
        home_score: ${homeScore !== null ? homeScore : 'null'},
        away_score: ${awayScore !== null ? awayScore : 'null'},
        last_synced_at: null,
        created_at: now,
        updated_at: now
      }`);
  }

  return `'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener referencias de equipos y estadios
    const teams = await queryInterface.sequelize.query('SELECT id, fifa_code FROM teams', { type: Sequelize.QueryTypes.SELECT });
    const stadiums = await queryInterface.sequelize.query('SELECT id, name FROM stadiums', { type: Sequelize.QueryTypes.SELECT });

    const byFifa = Object.fromEntries(teams.map((t) => [t.fifa_code, t.id]));
    const byName = Object.fromEntries(stadiums.map((s) => [s.name.toLowerCase().trim(), s.id]));

    const now = new Date();

    const matchRows = [
${rows.join(',\n')}
    ];

    const insertRows = matchRows
      .filter((r) => byFifa[r.home_team_fifa] && byFifa[r.away_team_fifa])
      .map((r) => ({
        external_id: r.external_id,
        home_team_id: byFifa[r.home_team_fifa],
        away_team_id: byFifa[r.away_team_fifa],
        stadium_id: byName[r.venue_name.toLowerCase().trim()] || null,
        phase: r.phase,
        status: r.status,
        starts_at: r.starts_at,
        home_score: r.home_score,
        away_score: r.away_score,
        last_synced_at: r.last_synced_at,
        created_at: now,
        updated_at: now
      }))
      .filter((r) => r.stadium_id !== null);

    if (insertRows.length > 0) {
      await queryInterface.bulkInsert('matches', insertRows, { ignoreDuplicates: true });
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('matches', null, {});
  }
};
`;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Iniciando extracción de datos del Mundial 2026 desde TheSportsDB...\n');

  const allEvents: SportsDbEvent[] = [];
  const seenEventIds = new Set<string>();
  const teamIds = new Set<string>();
  const venueIds = new Set<string>();

  // Archivo temporal para progreso incremental
  const PROGRESS_FILE = path.resolve(__dirname, '..', '.fetch-progress.json');
  const processedDates = new Set<string>();
  let savedEventsCache: SportsDbEvent[] = [];

  // Cargar progreso anterior si existe
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const prev = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      if (prev.events) {
        for (const ev of prev.events) {
          if (!seenEventIds.has(ev.idEvent)) {
            seenEventIds.add(ev.idEvent);
            allEvents.push(ev);
            teamIds.add(ev.idHomeTeam);
            teamIds.add(ev.idAwayTeam);
            if (ev.idVenue) venueIds.add(ev.idVenue);
          }
        }
        savedEventsCache = prev.events;
        if (prev.processedDates) prev.processedDates.forEach((d: string) => processedDates.add(d));
        console.log(`📂 Progreso anterior cargado: ${allEvents.length} eventos, ${processedDates.size} fechas procesadas.\n`);
      }
    } catch { /* ignorar */ }
  }

  function saveProgress() {
    try {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
        events: allEvents,
        processedDates: [...processedDates],
        teamIds: [...teamIds],
        venueIds: [...venueIds],
        updatedAt: new Date().toISOString()
      }, null, 2));
    } catch { /* ignorar */ }
  }

  // ── Fase 1: Recorrer fechas ──────────────────────────────────────────────
  console.log('📅 Fase 1: Recorriendo fechas...');
  const start = new Date(START_DATE);
  const end = new Date(END_DATE);
  let dateCount = 0;
  let eventCount = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const url = `${BASE_URL}/${EVENTS_KEY}/eventsday.php?d=${dateStr}&l=${LEAGUE_ID}`;

    // Saltar fechas ya procesadas si hay data guardada
    if (processedDates.has(dateStr)) {
      console.log(`   ${dateStr}: ✅ ya procesado`);
      continue;
    }

    let retries = 0;
    const maxRetries = 5;

    while (retries <= maxRetries) {
      try {
        const response = await axios.get<{ events?: SportsDbEvent[] }>(url, { timeout: 15000 });
        dateCount++;

        const events = response.data.events || [];
        for (const ev of events) {
          if (!seenEventIds.has(ev.idEvent)) {
            seenEventIds.add(ev.idEvent);
            allEvents.push(ev);
            teamIds.add(ev.idHomeTeam);
            teamIds.add(ev.idAwayTeam);
            if (ev.idVenue) venueIds.add(ev.idVenue);
            eventCount++;
          }
        }

        if (events.length > 0) {
          console.log(`   ${dateStr}: ${events.length} evento(s) (total: ${eventCount})`);
        }

        // Guardar progreso incremental
        processedDates.add(dateStr);
        saveProgress();

        break; // éxito, salir del while
      } catch (err: any) {
        retries++;
        if (err.response?.status === 429 && retries <= maxRetries) {
          const waitSeconds = 5 * retries;
          console.log(`   ${dateStr}: ⚠️  Rate limit (intento ${retries}/${maxRetries}), esperando ${waitSeconds}s...`);
          await sleep(waitSeconds * 1000);
        } else if (err.response?.status === 429) {
          console.log(`   ${dateStr}: ❌ Rate limit persistente después de ${maxRetries} intentos, saltando.`);
          break;
        } else {
          console.log(`   ${dateStr}: ⚠️  Error (${err.message})`);
          break;
        }
      }
    }

    await sleep(2000); // Pacing: 2 segundos entre requests
  }

  console.log(`\n✅ Fase 1 completa: ${dateCount} fechas consultadas, ${eventCount} eventos únicos encontrados.`);
  console.log(`   Equipos únicos: ${teamIds.size}, Sedes únicas: ${venueIds.size}\n`);

  if (eventCount === 0) {
    console.log('⚠️  No se encontraron eventos. Usando datos de respaldo pre-recolectados.\n');
    // Aquí se podrían cargar datos de respaldo hardcodeados
    // Por ahora, terminamos con error para que el usuario sepa
    console.error('❌ No se pudieron obtener datos de la API. Verifica la conexión o usa un seeder manual.');
    process.exit(1);
  }

  // ── Fase 2: Obtener detalle de equipos ──────────────────────────────────
  console.log('🏃 Fase 2: Obteniendo detalle de equipos...');
  const teams = new Map<string, SportsDbTeam>();
  let teamCount = 0;

  for (const tid of teamIds) {
    if (teams.has(tid)) continue;
    const url = `${BASE_URL}/${TEAM_KEY}/lookupteam.php?id=${tid}`;

    try {
      const response = await axios.get<{ teams?: SportsDbTeam[] }>(url, { timeout: 15000 });
      const teamData = response.data.teams?.[0];
      if (teamData) {
        teams.set(tid, teamData);
        teamCount++;
      }
    } catch (err: any) {
      console.log(`   Equipo ${tid}: Error (${err.message})`);
    }

    await sleep(250);
  }

  console.log(`✅ Fase 2 completa: ${teamCount} equipos obtenidos.\n`);

  // ── Fase 3: Obtener detalle de sedes ─────────────────────────────────────
  console.log('🏟️  Fase 3: Obteniendo detalle de sedes...');
  const venues = new Map<string, SportsDbVenue>();
  let venueCount = 0;

  for (const vid of venueIds) {
    if (venues.has(vid)) continue;
    const url = `${BASE_URL}/${EVENTS_KEY}/lookupvenue.php?id=${vid}`;

    try {
      const response = await axios.get<{ venues?: SportsDbVenue[] }>(url, { timeout: 15000 });
      const venueData = response.data.venues?.[0];
      if (venueData) {
        venues.set(vid, venueData);
        venueCount++;
      }
    } catch (err: any) {
      console.log(`   Sede ${vid}: Error (${err.message})`);
    }

    await sleep(250);
  }

  console.log(`✅ Fase 3 completa: ${venueCount} sedes obtenidas.\n`);

  // ── Fase 4: Generar seeders ──────────────────────────────────────────────
  console.log('📝 Fase 4: Generando seeders...');

  // Mapa: sportsId → fifaCode
  const teamBySportsId = new Map<string, string>();
  for (const [sid, team] of teams) {
    teamBySportsId.set(sid, toFifaCode(team));
  }

  // Mapa: nombre sede → datos
  const venueByName = new Map<string, { name: string; city: string; country: string }>();
  for (const venue of venues.values()) {
    // Extraer ciudad y coordenadas de strLocation y strMap
    let city = venue.strLocation?.split(',')[0]?.trim() || '';
    let country = venue.strCountry || '';
    // Si strMap tiene coordenadas, las usamos para el seeder de stadiums
    venueByName.set(venue.strVenue.toLowerCase().trim(), {
      name: venue.strVenue,
      city,
      country
    });
  }

  // Generar seeder de equipos y estadios
  const teamSeederContent = generateTeamSeeder(teams);

  // Generar insert de estadios adicional (los que vienen de venues)
  const venueRows: string[] = [];
  for (const venue of venues.values()) {
    const coords = (venue.strMap || '').split(',').map(s => s.trim());
    const lat = coords.length >= 2 && !isNaN(Number(coords[0])) ? Number(coords[0]) : null;
    const lng = coords.length >= 2 && !isNaN(Number(coords[1])) ? Number(coords[1]) : null;
    let city = venue.strLocation?.split(',')[0]?.trim() || '';
    let country = venue.strCountry || '';
    venueRows.push(`      { name: ${esc(venue.strVenue)}, city: ${esc(city)}, country: ${esc(country)}, latitude: ${lat !== null ? lat : 'null'}, longitude: ${lng !== null ? lng : 'null'}, created_at: now, updated_at: now }`);
  }

  const stadiumSeederContent = venueRows.length > 0 ? `
    await queryInterface.bulkInsert('stadiums', [
${venueRows.join(',\n')}
    ], { ignoreDuplicates: true });
` : '';

  const fullTeamStadiumSeeder = teamSeederContent.replace(
    '  async down(queryInterface)',
    `  async up(queryInterface) {
    const now = new Date();${stadiumSeederContent}
  },

  async down(queryInterface)`
  );

  // Generar seeder de partidos
  const matchSeederContent = generateMatchSeeder(allEvents, teamBySportsId, venueByName);

  // Escribir archivos
  fs.writeFileSync(TEAMS_SEEDER, fullTeamStadiumSeeder);
  console.log(`   ✅ ${TEAMS_SEEDER}`);

  fs.writeFileSync(MATCHES_SEEDER, matchSeederContent);
  console.log(`   ✅ ${MATCHES_SEEDER}`);

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log(`\n📊 Resumen:`);
  console.log(`   Eventos encontrados: ${eventCount}`);
  console.log(`   Equipos obtenidos: ${teamCount}`);
  console.log(`   Sedes obtenidas: ${venueCount}`);
  console.log(`\n✅ Extracción completada. Ejecuta 'yarn db:seed:all' para poblar la BD.`);
}

main().catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
