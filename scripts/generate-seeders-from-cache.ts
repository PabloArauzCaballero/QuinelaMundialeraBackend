/**
 * Genera seeders desde el caché de progreso de TheSportsDB.
 * No necesita llamar a la API (usa .fetch-progress.json).
 * 
 * Uso: npx tsx scripts/generate-seeders-from-cache.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const PROGRESS_FILE = path.resolve(__dirname, '..', '.fetch-progress.json');
const SEEDERS_DIR = path.resolve(__dirname, '..', 'src', 'database', 'seeders');

// ── Mapeo manual: nombre de equipo → FIFA code ────────────────────────────
const FIFA_CODES: Record<string, string> = {
  'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR', 'Czech Republic': 'CZE',
  'Canada': 'CAN', 'Bosnia-Herzegovina': 'BIH', 'USA': 'USA', 'Paraguay': 'PAR',
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Qatar': 'QAT', 'Switzerland': 'SUI',
  'Haiti': 'HAI', 'Scotland': 'SCO', 'Germany': 'GER', 'Curaçao': 'CUW',
  'Ivory Coast': 'CIV', 'Ecuador': 'ECU', 'Netherlands': 'NED', 'Japan': 'JPN',
  'Australia': 'AUS', 'Turkey': 'TUR', 'Belgium': 'BEL', 'Egypt': 'EGY',
  'Saudi Arabia': 'KSA', 'Uruguay': 'URU', 'Spain': 'ESP', 'Cape Verde': 'CPV',
  'Sweden': 'SWE', 'Tunisia': 'TUN', 'Iran': 'IRN', 'France': 'FRA',
  'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR', 'New Zealand': 'NZL',
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  'England': 'ENG', 'Croatia': 'CRO', 'Ghana': 'GHA', 'Uzbekistan': 'UZB',
  'Colombia': 'COL', 'Portugal': 'POR', 'DR Congo': 'COD',
  'Italy': 'ITA', 'Poland': 'POL', 'Denmark': 'DEN', 'Russia': 'RUS',
  'Wales': 'WAL', 'Serbia': 'SRB', 'Cameroon': 'CMR', 'Nigeria': 'NGA',
};

// ── Sedes con coordenadas (16 sedes del Mundial 2026) ──────────────────────
const VENUES: Array<{ name: string; city: string; country: string; lat: number | null; lng: number | null }> = [
  { name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', lat: 19.3029, lng: -99.1505 },
  { name: 'Estadio Banorte', city: 'Mexico City', country: 'Mexico', lat: 19.3029, lng: -99.1505 },
  { name: 'Estadio Akron', city: 'Zapopan', country: 'Mexico', lat: 20.6818, lng: -103.4625 },
  { name: 'Estadio BBVA', city: 'Guadalupe', country: 'Mexico', lat: 25.6697, lng: -100.2442 },
  { name: 'Gillette Stadium', city: 'Foxborough', country: 'USA', lat: 42.0909, lng: -71.2643 },
  { name: 'MetLife Stadium', city: 'East Rutherford', country: 'USA', lat: 40.8135, lng: -74.0745 },
  { name: 'NRG Stadium', city: 'Houston', country: 'USA', lat: 29.6847, lng: -95.4107 },
  { name: 'AT&T Stadium', city: 'Arlington', country: 'USA', lat: 32.7473, lng: -97.0947 },
  { name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', lat: 33.7555, lng: -84.4017 },
  { name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', lat: 39.9008, lng: -75.1675 },
  { name: "Levi's Stadium", city: 'Santa Clara', country: 'USA', lat: 37.4030, lng: -121.9700 },
  { name: 'Lumen Field', city: 'Seattle', country: 'USA', lat: 47.5952, lng: -122.3316 },
  { name: 'Hard Rock Stadium', city: 'Miami Gardens', country: 'USA', lat: 25.9580, lng: -80.2389 },
  { name: 'SoFi Stadium', city: 'Inglewood', country: 'USA', lat: 33.9535, lng: -118.3394 },
  { name: 'GEHA Field at Arrowhead Stadium', city: 'Kansas City', country: 'USA', lat: 39.0489, lng: -94.4839 },
  { name: 'BMO Field', city: 'Toronto', country: 'Canada', lat: 43.6332, lng: -79.4186 },
  { name: 'BC Place', city: 'Vancouver', country: 'Canada', lat: 49.2766, lng: -123.1120 },
];

function toPhase(intRound: string): string {
  const round = Number(intRound);
  if (round <= 3) return 'group';
  if (round === 32) return 'round_32';
  if (round === 16) return 'round_16';
  if (round === 125) return 'quarter_final';
  if (round === 2) return 'semi_final';
  if (round === 1) return 'final';
  return 'group';
}

function esc(val: unknown): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  // Usamos dobles comillas en JS para evitar que apóstrofes como "Levi's" rompan la sintaxis
  const escaped = String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function main() {
  if (!fs.existsSync(PROGRESS_FILE)) {
    console.error('❌ No se encuentra .fetch-progress.json. Ejecuta primero fetch-worldcup-data.ts');
    process.exit(1);
  }

  const cache = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const events: any[] = cache.events || [];
  console.log(`📦 ${events.length} eventos cargados desde .fetch-progress.json\n`);

  // ── Recolectar equipos únicos ──────────────────────────────────────────
  const teamSet = new Set<string>();
  for (const ev of events) {
    teamSet.add(ev.strHomeTeam);
    teamSet.add(ev.strAwayTeam);
  }
  const teamNames = [...teamSet].sort();
  console.log(`🏃 ${teamNames.length} equipos únicos encontrados`);

  // ── Recolectar sedes únicas ─────────────────────────────────────────────
  const venueNames = new Set<string>();
  for (const ev of events) {
    if (ev.strVenue) venueNames.add(ev.strVenue);
  }
  console.log(`🏟️  ${venueNames.size} sedes únicas encontradas\n`);

  // ── Generar Teams + Stadiums seeder ─────────────────────────────────────
  const teamRows = teamNames.map(name => {
    const code = FIFA_CODES[name] || name.substring(0, 3).toUpperCase();
    return `      { name: ${esc(name)}, fifa_code: ${esc(code)}, short_name: ${esc(name)}, flag_url: null, created_at: now, updated_at: now }`;
  }).join(',\n');

  const stadiumRows = VENUES.map(v =>
    `      { name: ${esc(v.name)}, city: ${esc(v.city)}, country: ${esc(v.country)}, latitude: ${v.lat !== null ? v.lat : 'null'}, longitude: ${v.lng !== null ? v.lng : 'null'}, created_at: now, updated_at: now }`
  ).join(',\n');

  const teamsStadiumsSeeder = `'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ── Equipos (${teamNames.length} selecciones) ───────────────────────────────────────────
    await queryInterface.bulkInsert('teams', [
${teamRows}
    ], { ignoreDuplicates: true });

    // ── Sedes (${VENUES.length}) ──────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('stadiums', [
${stadiumRows}
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stadiums', null, {});
    await queryInterface.bulkDelete('teams', null, {});
  }
};
`;

  const TEAMS_SEEDER = path.join(SEEDERS_DIR, '002-teams-stadiums.cjs');
  fs.writeFileSync(TEAMS_SEEDER, teamsStadiumsSeeder);
  console.log(`✅ ${TEAMS_SEEDER} (${teamNames.length} equipos, ${VENUES.length} sedes)`);

  // ── Generar Matches seeder ──────────────────────────────────────────────
  const matchRows = events.map(ev => {
    const homeCode = FIFA_CODES[ev.strHomeTeam] || ev.strHomeTeam.substring(0, 3).toUpperCase();
    const awayCode = FIFA_CODES[ev.strAwayTeam] || ev.strAwayTeam.substring(0, 3).toUpperCase();
    const startsAt = `${ev.dateEvent}T${ev.strTime || '12:00:00'}Z`;
    const phase = toPhase(ev.intRound);
    const status = ev.strStatus === 'FT' ? 'finished' : ev.strPostponed === 'yes' ? 'postponed' : 'scheduled';
    const homeScore = ev.intHomeScore !== null && ev.intHomeScore !== undefined ? Number(ev.intHomeScore) : null;
    const awayScore = ev.intAwayScore !== null && ev.intAwayScore !== undefined ? Number(ev.intAwayScore) : null;

    return `      {
        external_id: ${esc(ev.idEvent)},
        home_team_fifa: ${esc(homeCode)},
        away_team_fifa: ${esc(awayCode)},
        venue_name: ${esc((ev.strVenue || '').toLowerCase().trim())},
        phase: ${esc(phase)},
        status: ${esc(status)},
        starts_at: ${esc(startsAt)},
        home_score: ${homeScore !== null ? homeScore : 'null'},
        away_score: ${awayScore !== null ? awayScore : 'null'},
        last_synced_at: null,
        created_at: now,
        updated_at: now
      }`;
  }).join(',\n');

  const matchSeeder = `'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener referencias de equipos y estadios
    const teams = await queryInterface.sequelize.query('SELECT id, fifa_code FROM teams', { type: Sequelize.QueryTypes.SELECT });
    const stadiums = await queryInterface.sequelize.query('SELECT id, name FROM stadiums', { type: Sequelize.QueryTypes.SELECT });

    const byFifa = Object.fromEntries(teams.map((t) => [t.fifa_code, t.id]));
    const byName = Object.fromEntries(stadiums.map((s) => [s.name.toLowerCase().trim(), s.id]));

    const now = new Date();

    const matchRows = [
${matchRows}
    ];

    const insertRows = matchRows
      .filter((r) => byFifa[r.home_team_fifa] && byFifa[r.away_team_fifa])
      .map((r) => ({
        external_id: r.external_id,
        home_team_id: byFifa[r.home_team_fifa],
        away_team_id: byFifa[r.away_team_fifa],
        stadium_id: byName[r.venue_name] || null,
        phase: r.phase,
        status: r.status,
        starts_at: r.starts_at,
        home_score: r.home_score,
        away_score: r.away_score,
        last_synced_at: r.last_synced_at,
        created_at: now,
        updated_at: now
      }));

    if (insertRows.length > 0) {
      await queryInterface.bulkInsert('matches', insertRows, { ignoreDuplicates: true });
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('matches', null, {});
  }
};
`;

  const MATCHES_SEEDER = path.join(SEEDERS_DIR, '003-sample-matches.cjs');
  fs.writeFileSync(MATCHES_SEEDER, matchSeeder);
  console.log(`✅ ${MATCHES_SEEDER} (${events.length} partidos)`);

  // ── Resumen ─────────────────────────────────────────────────────────────
  console.log(`\n📊 Resumen:`);
  console.log(`   Equipos: ${teamNames.length}`);
  console.log(`   Sedes: ${VENUES.length}`);
  console.log(`   Partidos: ${events.length}`);
  console.log(`\n✅ Seeders generados. Ejecuta 'yarn db:seed' para poblar la BD.`);
}

main();
