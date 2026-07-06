import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

type SmokeRecord = {
  label: string;
  method: string;
  url: string;
  status: number | null;
  ok: boolean;
  expectedStatus?: number;
  durationMs: number;
  itemsLength: number | null;
  firstItem: unknown | null;
  secondItem: unknown | null;
  errorMessage: string | null;
  response: JsonValue | null;
};

const API_BASE_URL = stripTrailingSlash(process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1');
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? process.env.DEMO_ADMIN_EMAIL ?? 'demo.admin@quiniela.test';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? process.env.DEMO_ADMIN_PASSWORD ?? 'DemoAdmin123!';
const SPORTSDB_BASE_URL = stripTrailingSlash(process.env.SPORTSDB_BASE_URL ?? 'https://www.thesportsdb.com/api/v1/json');
const SPORTSDB_API_KEY = process.env.SPORTSDB_API_KEY ?? '123';
const SMOKE_COMPARE_UPSTREAM = bool(process.env.SMOKE_COMPARE_UPSTREAM, true);
const SMOKE_STRICT = bool(process.env.SMOKE_STRICT, false);
const SMOKE_SPORTSDB_DATE = process.env.SMOKE_SPORTSDB_DATE ?? new Date().toISOString().slice(0, 10);
const SMOKE_EPL_LEAGUE_ID = process.env.SMOKE_EPL_LEAGUE_ID ?? '4328';
const SMOKE_EPL_SEASON = process.env.SMOKE_EPL_SEASON ?? '2026-2027';
const SMOKE_WORLD_CUP_LEAGUE_ID = process.env.SMOKE_WORLD_CUP_LEAGUE_ID ?? process.env.SPORTSDB_WORLD_CUP_LEAGUE_ID ?? '';
const SMOKE_WORLD_CUP_SEASON = process.env.SMOKE_WORLD_CUP_SEASON ?? process.env.SPORTSDB_WORLD_CUP_SEASON ?? '2026';

const currentFile = fileURLToPath(import.meta.url);
const smokeDir = dirname(currentFile);
const OUTPUT_PATH = process.env.SMOKE_SPORTSDB_OUTPUT_JSON ?? join(smokeDir, 'sportsdb-debug-responses.json');

const records: SmokeRecord[] = [];

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(value.toLowerCase());
}

function getItems(body: unknown): unknown[] | null {
  if (!body || typeof body !== 'object') return null;
  const maybe = body as Record<string, unknown>;
  if (Array.isArray(maybe.items)) return maybe.items;
  if (Array.isArray(maybe.sports)) return maybe.sports;
  if (Array.isArray(maybe.leagues)) return maybe.leagues;
  if (Array.isArray(maybe.events)) return maybe.events;
  return null;
}

function getErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const maybe = body as Record<string, unknown>;
  const error = maybe.error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as Record<string, unknown>).message;
    return typeof message === 'string' ? message : null;
  }
  if (typeof maybe.message === 'string') return maybe.message;
  return null;
}

async function parseResponse(response: Response): Promise<JsonValue | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return text;
  }
}

function printBlock(record: SmokeRecord): void {
  console.log('================================================================');
  console.log(`${record.method} ${record.url}`);
  console.log(`STATUS ${record.status}`);
  console.log(`durationMs = ${record.durationMs}`);
  if (record.itemsLength !== null) console.log(`items.length = ${record.itemsLength}`);
  if (record.errorMessage) console.log(`error.message = ${record.errorMessage}`);
  if (record.firstItem !== null) console.log(`items[0] = ${JSON.stringify(record.firstItem, null, 2)}`);
  if (record.secondItem !== null) console.log(`items[1] = ${JSON.stringify(record.secondItem, null, 2)}`);
  console.log(`FULL RESPONSE = ${JSON.stringify(record.response, null, 2)}`);
  console.log('================================================================');
  console.log('');
}

async function request(label: string, url: string, options: RequestInit = {}, expectedStatus = 200): Promise<SmokeRecord> {
  const startedAt = Date.now();
  let status: number | null = null;
  let body: JsonValue | null = null;
  let ok = false;

  try {
    const response = await fetch(url, options);
    status = response.status;
    body = await parseResponse(response);
    ok = status === expectedStatus;
  } catch (error) {
    body = {
      thrown: error instanceof Error ? error.message : String(error),
    };
  }

  const items = getItems(body);
  const record: SmokeRecord = {
    label,
    method: options.method ?? 'GET',
    url,
    status,
    ok,
    expectedStatus,
    durationMs: Date.now() - startedAt,
    itemsLength: items ? items.length : null,
    firstItem: items?.[0] ?? null,
    secondItem: items?.[1] ?? null,
    errorMessage: getErrorMessage(body),
    response: body,
  };

  records.push(record);
  console.log(`### ${label}`);
  printBlock(record);

  if (!record.ok && SMOKE_STRICT) {
    throw new Error(`${record.method} ${record.url} -> ${record.status}. Esperado ${expectedStatus}. Respuesta: ${JSON.stringify(body)}`);
  }

  return record;
}

async function login(): Promise<string> {
  const loginUrl = `${API_BASE_URL}/auth/login`;
  const response = await request(
    'Backend Auth - login admin para endpoints protegidos',
    loginUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    },
    200,
  );

  const body = response.response;
  if (!body || typeof body !== 'object') {
    throw new Error('Login no devolvió JSON válido.');
  }

  const obj = body as Record<string, unknown>;
  const token =
    obj.accessToken ??
    obj.token ??
    (obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>).accessToken : undefined) ??
    (obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>).token : undefined);

  if (typeof token !== 'string' || token.length < 10) {
    throw new Error(`No se pudo obtener token del login. Respuesta: ${JSON.stringify(body)}`);
  }

  return token;
}

async function saveReport(): Promise<void> {
  const payload = {
    generatedAt: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    compareUpstream: SMOKE_COMPARE_UPSTREAM,
    strict: SMOKE_STRICT,
    notes: [
      'Este archivo se genera automáticamente por scripts/smoke/sportsdb-debug.smoke.ts.',
      'No modifica base de datos.',
      'Sirve para comparar backend normalizado vs TheSportsDB upstream.',
      'Si un endpoint devuelve items: [], revisar parámetros reales de TheSportsDB antes de asumir error del backend.',
    ],
    summary: records.map((record) => ({
      label: record.label,
      method: record.method,
      url: record.url,
      status: record.status,
      ok: record.ok,
      itemsLength: record.itemsLength,
      errorMessage: record.errorMessage,
      durationMs: record.durationMs,
    })),
    records,
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`JSON_DEBUG_WRITTEN = ${OUTPUT_PATH}`);
}

async function main(): Promise<void> {
  console.log('Smoke SportsDB debug');
  console.log(`API_BASE_URL = ${API_BASE_URL}`);
  console.log(`SMOKE_COMPARE_UPSTREAM = ${SMOKE_COMPARE_UPSTREAM}`);
  console.log(`SMOKE_STRICT = ${SMOKE_STRICT}`);
  console.log(`SMOKE_SPORTSDB_OUTPUT_JSON = ${OUTPUT_PATH}`);
  console.log('');

  const token = await login();
  const authHeaders = { Authorization: `Bearer ${token}` };

  await request('Backend SportsDB - deportes reales disponibles', `${API_BASE_URL}/sportsdb/sports`, { headers: authHeaders });
  await request('Backend SportsDB - ligas sin filtro', `${API_BASE_URL}/sportsdb/leagues`, { headers: authHeaders });
  await request('Backend SportsDB - ligas filtradas sport=Soccer', `${API_BASE_URL}/sportsdb/leagues?sport=Soccer`, { headers: authHeaders });
  await request('Backend SportsDB - eventos día sin leagueId', `${API_BASE_URL}/sportsdb/events?mode=day`, { headers: authHeaders });
  await request('Backend SportsDB - eventos día sport=Soccer', `${API_BASE_URL}/sportsdb/events?mode=day&sport=Soccer`, { headers: authHeaders });
  await request('Backend SportsDB - eventos next EPL 4328', `${API_BASE_URL}/sportsdb/events?leagueId=${encodeURIComponent(SMOKE_EPL_LEAGUE_ID)}&mode=next`, { headers: authHeaders });
  await request('Backend SportsDB - eventos season EPL con season correcta', `${API_BASE_URL}/sportsdb/events?leagueId=${encodeURIComponent(SMOKE_EPL_LEAGUE_ID)}&mode=season&season=${encodeURIComponent(SMOKE_EPL_SEASON)}`, { headers: authHeaders });
  await request('Backend SportsDB - diagnóstico season EPL 2026', `${API_BASE_URL}/sportsdb/events?leagueId=${encodeURIComponent(SMOKE_EPL_LEAGUE_ID)}&mode=season&season=2026`, { headers: authHeaders });

  if (SMOKE_WORLD_CUP_LEAGUE_ID) {
    await request(
      'Backend SportsDB - Mundial por leagueId configurado',
      `${API_BASE_URL}/sportsdb/world-cup/events?leagueId=${encodeURIComponent(SMOKE_WORLD_CUP_LEAGUE_ID)}&mode=season&season=${encodeURIComponent(SMOKE_WORLD_CUP_SEASON)}`,
      { headers: authHeaders },
    );
  } else {
    await request('Backend SportsDB - world cup events sin leagueId configurado', `${API_BASE_URL}/sportsdb/world-cup/events?mode=day`, { headers: authHeaders });
  }

  if (SMOKE_COMPARE_UPSTREAM) {
    const upstream = `${SPORTSDB_BASE_URL}/${SPORTSDB_API_KEY}`;
    await request('Upstream TheSportsDB directo - all_sports.php', `${upstream}/all_sports.php`);
    await request('Upstream TheSportsDB directo - all_leagues.php', `${upstream}/all_leagues.php`);
    await request('Upstream TheSportsDB directo - eventsday.php?d=YYYY-MM-DD', `${upstream}/eventsday.php?d=${encodeURIComponent(SMOKE_SPORTSDB_DATE)}`);
    await request('Upstream TheSportsDB directo - eventsday.php?d=YYYY-MM-DD&s=Soccer', `${upstream}/eventsday.php?d=${encodeURIComponent(SMOKE_SPORTSDB_DATE)}&s=Soccer`);
    await request('Upstream TheSportsDB directo - eventsnextleague.php EPL', `${upstream}/eventsnextleague.php?id=${encodeURIComponent(SMOKE_EPL_LEAGUE_ID)}`);
    await request('Upstream TheSportsDB directo - eventsseason.php EPL season correcta', `${upstream}/eventsseason.php?id=${encodeURIComponent(SMOKE_EPL_LEAGUE_ID)}&s=${encodeURIComponent(SMOKE_EPL_SEASON)}`);
  }

  await saveReport();

  const failed = records.filter((record) => !record.ok);
  if (failed.length > 0 && SMOKE_STRICT) {
    throw new Error(`SMOKE_SPORTSDB_DEBUG_FAILED: ${failed.length} request(s) no cumplieron status esperado.`);
  }

  console.log('SMOKE_SPORTSDB_DEBUG_OK');
}

main().catch(async (error) => {
  console.error('SMOKE_SPORTSDB_DEBUG_FAILED');
  console.error(error);
  try {
    await saveReport();
  } catch (writeError) {
    console.error('No se pudo escribir el JSON de debug:', writeError);
  }
  process.exit(1);
});
