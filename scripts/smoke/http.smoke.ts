import 'dotenv/config';

/**
 * Smoke HTTP end-to-end para Quiniela Mundial 2026.
 *
 * Este script NO prueba funciones aisladas ni mocks. Hace solicitudes HTTP reales
 * contra una API levantada localmente o desplegada. Valida auth, permisos,
 * grupos, dashboard, leaderboard, SportsDB, sync admin y pronósticos cuando hay
 * partidos disponibles en la base.
 *
 * Uso local:
 *   API_BASE_URL=http://localhost:3000/api/v1 yarn smoke:http
 *
 * Uso Render/producción controlada:
 *   API_BASE_URL=https://tu-backend.onrender.com/api/v1 yarn smoke:http
 *
 * Variables útiles:
 *   API_BASE_URL                  Base de la API con prefijo, default http://localhost:3000/api/v1
 *   SMOKE_ADMIN_EMAIL             Admin real/seed controlado para probar endpoints admin
 *   SMOKE_ADMIN_PASSWORD          Password admin
 *   SMOKE_IMPORT_LEAGUE_ID        Si se define, prueba importación real de liga desde TheSportsDB
 *   SMOKE_IMPORT_SEASON           Temporada para import-league, default 2026
 *   SMOKE_WORLD_CUP_LEAGUE_ID     Si se define, prueba eventos/import mundial por liga
 *   SMOKE_EXTERNAL_MODE           required | warn | off. Default required
 *   SMOKE_STRICT                  true falla si se omiten pruebas opcionales importantes
 */

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface SmokeConfig {
  apiBaseUrl: string;
  originUrl: string;
  externalMode: 'required' | 'warn' | 'off';
  strict: boolean;
  adminEmail?: string;
  adminPassword?: string;
  importLeagueId?: string;
  importSeason: string;
  worldCupLeagueId?: string;
}

interface HttpResult<T = Json> {
  status: number;
  ok: boolean;
  data: T;
  text: string;
  headers: Headers;
}

interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles?: string[];
  };
}

interface GroupResponse {
  id: string;
  name: string;
  invitationCode: string;
  ownerUserId: string;
  status: string;
}

interface InvitationCodeResponse {
  groupId: string;
  invitationCode: string;
}

interface MatchResponse {
  id: string;
  status: string;
  startsAt: string;
  homeTeam?: { id?: string; name?: string };
  awayTeam?: { id?: string; name?: string };
}

interface PredictionResponse {
  id: string;
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  points: number;
  status: string;
}

const config = loadConfig();
const state = {
  passed: 0,
  skipped: 0,
  warnings: 0
};

function loadConfig(): SmokeConfig {
  const apiBaseUrl = normalizeApiBaseUrl(process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1');
  return {
    apiBaseUrl,
    originUrl: apiBaseUrl.replace(/\/api\/v1\/?$/, ''),
    externalMode: parseExternalMode(process.env.SMOKE_EXTERNAL_MODE),
    strict: process.env.SMOKE_STRICT === 'true',
    adminEmail: resolveAdminEmail(),
    adminPassword: resolveAdminPassword(),
    importLeagueId: process.env.SMOKE_IMPORT_LEAGUE_ID,
    importSeason: process.env.SMOKE_IMPORT_SEASON ?? process.env.SPORTSDB_WORLD_CUP_SEASON ?? '2026',
    worldCupLeagueId: process.env.SMOKE_WORLD_CUP_LEAGUE_ID ?? process.env.SPORTSDB_WORLD_CUP_LEAGUE_ID
  };
}


function resolveAdminEmail(): string | undefined {
  if (process.env.SMOKE_ADMIN_EMAIL) return process.env.SMOKE_ADMIN_EMAIL;
  if (process.env.ADMIN_EMAIL) return process.env.ADMIN_EMAIL;
  return process.env.DEMO_ADMIN_EMAIL ?? 'demo.admin@quiniela.test';
}

function resolveAdminPassword(): string | undefined {
  if (process.env.SMOKE_ADMIN_PASSWORD) return process.env.SMOKE_ADMIN_PASSWORD;
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.DEMO_ADMIN_PASSWORD ?? 'DemoAdmin123!';
}

function parseExternalMode(value: string | undefined): SmokeConfig['externalMode'] {
  if (value === 'off' || value === 'warn' || value === 'required') return value;
  return 'required';
}

function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertObject(value: unknown, message: string): asserts value is Record<string, unknown> {
  assert(Boolean(value) && typeof value === 'object' && !Array.isArray(value), message);
}

function assertArray(value: unknown, message: string): asserts value is unknown[] {
  assert(Array.isArray(value), message);
}

function mask(value: string | undefined): string {
  if (!value) return '(no configurado)';
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

async function rawRequest<T = Json>(
  pathOrUrl: string,
  init: RequestInit & { expectedStatuses?: number[] } = {}
): Promise<HttpResult<T>> {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbsolute ? pathOrUrl : `${config.apiBaseUrl}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
  const expectedStatuses = init.expectedStatuses ?? [200, 201];
  const response = await fetch(url, init);
  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${init.method ?? 'GET'} ${url} -> ${response.status}. Respuesta: ${text.slice(0, 1000)}`);
  }

  return { status: response.status, ok: response.ok, data: data as T, text, headers: response.headers };
}

async function api<T = Json>(path: string, init: RequestInit & { expectedStatuses?: number[] } = {}): Promise<HttpResult<T>> {
  return rawRequest<T>(path, init);
}

function jsonBody(body: unknown, token?: string): RequestInit {
  return {
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  };
}

function authHeaders(token: string): HeadersInit {
  return { authorization: `Bearer ${token}` };
}

async function step(name: string, fn: () => Promise<void>): Promise<void> {
  const started = Date.now();
  try {
    await fn();
    state.passed += 1;
    console.log(`OK  ${name} (${Date.now() - started} ms)`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
}

function skip(name: string, reason: string): void {
  state.skipped += 1;
  const message = `SKIP ${name}: ${reason}`;
  if (config.strict) throw new Error(`${message}. SMOKE_STRICT=true no permite omitir esta prueba.`);
  console.warn(message);
}

function warn(name: string, reason: string): void {
  state.warnings += 1;
  console.warn(`WARN ${name}: ${reason}`);
}

async function externalStep(name: string, fn: () => Promise<void>): Promise<void> {
  if (config.externalMode === 'off') {
    skip(name, 'SMOKE_EXTERNAL_MODE=off');
    return;
  }

  if (config.externalMode === 'warn') {
    try {
      await step(name, fn);
    } catch (error) {
      warn(name, `falló integración externa sin cortar smoke por SMOKE_EXTERNAL_MODE=warn: ${(error as Error).message}`);
    }
    return;
  }

  await step(name, fn);
}

async function registerUser(label: string): Promise<AuthResponse> {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const email = `smoke.${label}.${unique}@example.test`;
  const response = await api<AuthResponse>('/auth/register', {
    method: 'POST',
    ...jsonBody({ name: `Smoke ${label}`, email, password: 'Password123!' })
  });

  assertAuthResponse(response.data, `Registro ${label} no devolvió contrato de autenticación válido.`);
  return response.data;
}

async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api<AuthResponse>('/auth/login', {
    method: 'POST',
    ...jsonBody({ email, password })
  });
  assertAuthResponse(response.data, `Login de ${email} no devolvió contrato de autenticación válido.`);
  return response.data;
}

function assertAuthResponse(value: unknown, message: string): asserts value is AuthResponse {
  assertObject(value, message);
  assert(typeof value.accessToken === 'string' && value.accessToken.length > 20, `${message} Falta accessToken.`);
  assertObject(value.user, `${message} Falta user.`);
  assert(typeof value.user.id === 'string', `${message} Falta user.id.`);
  assert(typeof value.user.email === 'string', `${message} Falta user.email.`);
}

function assertGroup(value: unknown, message: string): asserts value is GroupResponse {
  assertObject(value, message);
  assert(typeof value.id === 'string', `${message} Falta id.`);
  assert(typeof value.name === 'string', `${message} Falta name.`);
  assert(typeof value.invitationCode === 'string', `${message} Falta invitationCode.`);
}

function assertPrediction(value: unknown, message: string): asserts value is PredictionResponse {
  assertObject(value, message);
  assert(typeof value.id === 'string', `${message} Falta id.`);
  assert(typeof value.matchId === 'string', `${message} Falta matchId.`);
  assert(typeof value.predictedHomeScore === 'number', `${message} Falta predictedHomeScore.`);
  assert(typeof value.predictedAwayScore === 'number', `${message} Falta predictedAwayScore.`);
}

async function main(): Promise<void> {
  console.log('Smoke HTTP end-to-end Quiniela Mundial 2026');
  console.log(`API_BASE_URL: ${config.apiBaseUrl}`);
  console.log(`Health origin: ${config.originUrl}`);
  console.log(`External mode: ${config.externalMode}`);
  console.log(`Admin email: ${mask(config.adminEmail)}`);

  let owner!: AuthResponse;
  let participant!: AuthResponse;
  let group!: GroupResponse;
  let invitation!: InvitationCodeResponse;
  let createdPrediction: PredictionResponse | null = null;

  await step('health público en /health', async () => {
    const response = await rawRequest<Record<string, unknown>>(`${config.originUrl}/health`);
    assertObject(response.data, 'Health no devolvió objeto.');
    assert(response.data.ok === true, 'Health no devolvió ok=true.');
  });

  await step('ruta protegida rechaza solicitudes sin token', async () => {
    await api('/auth/me', { expectedStatuses: [401] });
  });

  await step('validación rechaza registro inválido', async () => {
    await api('/auth/register', {
      method: 'POST',
      ...jsonBody({ name: 'x', email: 'correo-invalido', password: '123' }),
      expectedStatuses: [400]
    });
  });

  await step('registro real usuario dueño', async () => {
    owner = await registerUser('owner');
  });

  await step('login real usuario dueño', async () => {
    const logged = await login(owner.user.email, 'Password123!');
    owner.accessToken = logged.accessToken;
  });

  await step('auth/me devuelve usuario autenticado', async () => {
    const response = await api<Record<string, unknown>>('/auth/me', { headers: authHeaders(owner.accessToken) });
    assertObject(response.data, 'auth/me no devolvió objeto.');
    assert(response.data.id === owner.user.id, 'auth/me devolvió un usuario distinto.');
  });

  await step('users/me permite actualizar perfil', async () => {
    const response = await api<Record<string, unknown>>('/users/me', {
      method: 'PATCH',
      ...jsonBody({ name: 'Smoke Owner Actualizado' }, owner.accessToken)
    });
    assert(response.data.name === 'Smoke Owner Actualizado', 'users/me no actualizó el nombre.');
  });

  await step('registro real segundo participante', async () => {
    participant = await registerUser('participant');
  });

  await step('crear grupo real', async () => {
    const response = await api<GroupResponse>('/groups', {
      method: 'POST',
      ...jsonBody({ name: `Grupo Smoke ${Date.now()}` }, owner.accessToken)
    });
    assertGroup(response.data, 'Crear grupo no devolvió contrato válido.');
    group = response.data;
  });

  await step('listar grupos del dueño', async () => {
    const response = await api<unknown[]>('/groups', { headers: authHeaders(owner.accessToken) });
    assertArray(response.data, 'GET /groups no devolvió array.');
    assert(response.data.some((item) => typeof item === 'object' && item !== null && (item as { id?: string }).id === group.id), 'El grupo creado no aparece en /groups.');
  });

  await step('consultar detalle de grupo', async () => {
    const response = await api<GroupResponse>(`/groups/${group.id}`, { headers: authHeaders(owner.accessToken) });
    assertGroup(response.data, 'Detalle de grupo no devolvió contrato válido.');
    assert(response.data.id === group.id, 'Detalle de grupo devolvió otro id.');
  });

  await step('obtener código de invitación', async () => {
    const response = await api<InvitationCodeResponse>(`/groups/${group.id}/invitation-code`, { headers: authHeaders(owner.accessToken) });
    assertObject(response.data, 'Código de invitación no devolvió objeto.');
    assert(typeof response.data.invitationCode === 'string' && response.data.invitationCode.length >= 4, 'Código de invitación inválido.');
    invitation = response.data;
  });

  await step('participante se une con código real', async () => {
    const response = await api<Record<string, unknown>>('/groups/join', {
      method: 'POST',
      ...jsonBody({ invitationCode: invitation.invitationCode }, participant.accessToken)
    });
    assertObject(response.data, 'Join no devolvió objeto.');
    assertObject(response.data.group, 'Join no devolvió group.');
    assert((response.data.group as { id?: string }).id === group.id, 'Join devolvió grupo incorrecto.');
  });

  await step('no permite unirse dos veces al mismo grupo', async () => {
    await api('/groups/join', {
      method: 'POST',
      ...jsonBody({ invitationCode: invitation.invitationCode }, participant.accessToken),
      expectedStatuses: [409]
    });
  });

  await step('listar miembros del grupo', async () => {
    const response = await api<unknown[]>(`/groups/${group.id}/members`, { headers: authHeaders(owner.accessToken) });
    assertArray(response.data, 'Members no devolvió array.');
    assert(response.data.length >= 2, 'El grupo debería tener al menos dueño y participante.');
  });

  await step('dashboard del usuario responde shape operativo', async () => {
    const response = await api<Record<string, unknown>>('/dashboard/me', { headers: authHeaders(owner.accessToken) });
    assertObject(response.data, 'Dashboard no devolvió objeto.');
    assert(typeof response.data.groupsCount === 'number', 'Dashboard falta groupsCount.');
    assert(typeof response.data.pendingPredictionsCount === 'number', 'Dashboard falta pendingPredictionsCount.');
    assertArray(response.data.upcomingMatches, 'Dashboard falta upcomingMatches array.');
    assertArray(response.data.groupPositions, 'Dashboard falta groupPositions array.');
  });

  await step('leaderboard del grupo responde ranking', async () => {
    const response = await api<unknown[]>(`/groups/${group.id}/leaderboard`, { headers: authHeaders(owner.accessToken) });
    assertArray(response.data, 'Leaderboard no devolvió array.');
    assert(response.data.length >= 2, 'Leaderboard debería incluir dos participantes.');
  });

  await step('my-position responde posición del usuario', async () => {
    const response = await api<Record<string, unknown>>(`/groups/${group.id}/my-position`, { headers: authHeaders(owner.accessToken) });
    assertObject(response.data, 'my-position no devolvió objeto.');
    assert(typeof response.data.position === 'number', 'my-position no devolvió position numérica.');
  });

  await step('consultar partidos locales importados o registrados', async () => {
    const response = await api<unknown[]>('/matches', { headers: authHeaders(owner.accessToken) });
    assertArray(response.data, 'GET /matches no devolvió array.');
  });

  await step('consultar equipos y estadios locales', async () => {
    const teams = await api<unknown[]>('/teams', { headers: authHeaders(owner.accessToken) });
    const stadiums = await api<unknown[]>('/stadiums', { headers: authHeaders(owner.accessToken) });
    assertArray(teams.data, 'GET /teams no devolvió array.');
    assertArray(stadiums.data, 'GET /stadiums no devolvió array.');
  });

  await step('pronósticos: listar sin datos previos', async () => {
    const mine = await api<unknown[]>('/predictions/me', { headers: authHeaders(owner.accessToken) });
    const byGroup = await api<unknown[]>(`/predictions/me/groups/${group.id}`, { headers: authHeaders(owner.accessToken) });
    assertArray(mine.data, 'GET /predictions/me no devolvió array.');
    assertArray(byGroup.data, 'GET /predictions/me/groups/:groupId no devolvió array.');
  });

  await step('pronósticos: crear/editar si existe partido programado futuro', async () => {
    const response = await api<MatchResponse[]>('/matches?status=scheduled', { headers: authHeaders(owner.accessToken) });
    assertArray(response.data, 'GET /matches?status=scheduled no devolvió array.');
    const futureMatch = response.data.find((match) => typeof match.startsAt === 'string' && new Date(match.startsAt).getTime() > Date.now());

    if (!futureMatch) {
      skip('crear/editar pronóstico', 'no hay partidos programados futuros en la base local. Importa una liga real con /api/v1/admin/sync/import-league para cubrir este flujo.');
      return;
    }

    const created = await api<PredictionResponse>('/predictions', {
      method: 'POST',
      ...jsonBody({ matchId: futureMatch.id, predictedHomeScore: 2, predictedAwayScore: 1 }, owner.accessToken)
    });
    assertPrediction(created.data, 'Crear pronóstico no devolvió contrato válido.');
    createdPrediction = created.data;

    const duplicated = await api('/predictions', {
      method: 'POST',
      ...jsonBody({ matchId: futureMatch.id, predictedHomeScore: 1, predictedAwayScore: 1 }, owner.accessToken),
      expectedStatuses: [409]
    });
    assert(duplicated.status === 409, 'Crear pronóstico duplicado debía devolver 409.');

    const updated = await api<PredictionResponse>(`/predictions/${createdPrediction.id}`, {
      method: 'PATCH',
      ...jsonBody({ predictedHomeScore: 3, predictedAwayScore: 1 }, owner.accessToken)
    });
    assertPrediction(updated.data, 'Actualizar pronóstico no devolvió contrato válido.');
    assert(updated.data.predictedHomeScore === 3, 'No se actualizó predictedHomeScore.');
  });

  await externalStep('TheSportsDB: listar deportes reales disponibles', async () => {
    const response = await api<Record<string, unknown>>('/sportsdb/sports', { headers: authHeaders(owner.accessToken) });
    assert(response.data.source === 'thesportsdb', 'SportsDB sports no indicó source=thesportsdb.');
    assertArray(response.data.items, 'SportsDB sports no devolvió items array.');
  });

  await externalStep('TheSportsDB: listar ligas reales de Soccer', async () => {
    const response = await api<Record<string, unknown>>('/sportsdb/leagues?sport=Soccer', { headers: authHeaders(owner.accessToken) });
    assert(response.data.source === 'thesportsdb', 'SportsDB leagues no indicó source=thesportsdb.');
    assertArray(response.data.items, 'SportsDB leagues no devolvió items array.');
  });

  await externalStep('TheSportsDB: consultar eventos del día sin inventar leagueId', async () => {
    const date = new Date().toISOString().slice(0, 10);
    const response = await api<Record<string, unknown>>(`/sportsdb/world-cup/events?mode=day&date=${date}`, { headers: authHeaders(owner.accessToken) });
    assert(response.data.source === 'thesportsdb', 'World Cup day events no indicó source=thesportsdb.');
    assertArray(response.data.items, 'World Cup day events no devolvió items array.');
  });

  if (config.worldCupLeagueId) {
    await externalStep('TheSportsDB: consultar eventos Mundial por leagueId configurado', async () => {
      const response = await api<Record<string, unknown>>(`/sportsdb/world-cup/events?leagueId=${encodeURIComponent(config.worldCupLeagueId as string)}&season=${encodeURIComponent(config.importSeason)}&mode=season`, { headers: authHeaders(owner.accessToken) });
      assert(response.data.source === 'thesportsdb', 'World Cup season events no indicó source=thesportsdb.');
      assertArray(response.data.items, 'World Cup season events no devolvió items array.');
    });
  } else {
    skip('TheSportsDB Mundial por leagueId', 'no está definido SMOKE_WORLD_CUP_LEAGUE_ID ni SPORTSDB_WORLD_CUP_LEAGUE_ID.');
  }

  await step('admin protegido: usuario normal no puede consultar sync runs', async () => {
    await api('/admin/sync/runs', { headers: authHeaders(owner.accessToken), expectedStatuses: [403] });
  });

  if (config.adminEmail && config.adminPassword) {
    let admin!: AuthResponse;

    await step('admin: login con credenciales reales/controladas', async () => {
      admin = await login(config.adminEmail as string, config.adminPassword as string);
      assert(admin.user.roles?.includes('admin'), 'El usuario configurado no tiene rol admin.');
    });

    await step('admin: consultar historial de sync', async () => {
      const response = await api<unknown[]>('/admin/sync/runs', { headers: authHeaders(admin.accessToken) });
      assertArray(response.data, 'GET /admin/sync/runs no devolvió array.');
    });

    await externalStep('admin: ejecutar sync real del día', async () => {
      const response = await api<Record<string, unknown>>('/admin/sync/run', {
        method: 'POST',
        headers: authHeaders(admin.accessToken)
      });
      assertObject(response.data, 'POST /admin/sync/run no devolvió objeto.');
      assert(typeof response.data.runId === 'string', 'POST /admin/sync/run no devolvió runId.');
    });

    if (config.importLeagueId) {
      await externalStep('admin: importar liga real desde TheSportsDB', async () => {
        const response = await api<Record<string, unknown>>('/admin/sync/import-league', {
          method: 'POST',
          ...jsonBody({ leagueId: config.importLeagueId, season: config.importSeason, mode: 'season' }, admin.accessToken)
        });
        assertObject(response.data, 'import-league no devolvió objeto.');
        assert(typeof response.data.checked === 'number', 'import-league no devolvió checked numérico.');
      });
    } else {
      skip('admin import-league', 'no está definido SMOKE_IMPORT_LEAGUE_ID.');
    }

    if (config.worldCupLeagueId) {
      await externalStep('admin: importar Mundial real desde TheSportsDB', async () => {
        const response = await api<Record<string, unknown>>('/admin/sync/import-world-cup', {
          method: 'POST',
          ...jsonBody({ leagueId: config.worldCupLeagueId, season: config.importSeason, mode: 'season' }, admin.accessToken)
        });
        assertObject(response.data, 'import-world-cup no devolvió objeto.');
        assert(typeof response.data.checked === 'number', 'import-world-cup no devolvió checked numérico.');
      });
    } else {
      skip('admin import-world-cup', 'no está definido SMOKE_WORLD_CUP_LEAGUE_ID ni SPORTSDB_WORLD_CUP_LEAGUE_ID.');
    }
  } else {
    skip('bloque admin real', 'no hay SMOKE_ADMIN_EMAIL/SMOKE_ADMIN_PASSWORD ni ADMIN_EMAIL/ADMIN_PASSWORD en entorno.');
  }

  await step('logout real', async () => {
    const response = await api<Record<string, unknown>>('/auth/logout', {
      method: 'POST',
      headers: authHeaders(owner.accessToken)
    });
    assert(response.data.ok === true, 'Logout no devolvió ok=true.');
  });

  console.log('\nResultado smoke HTTP');
  console.log(`OK: ${state.passed}`);
  console.log(`SKIP: ${state.skipped}`);
  console.log(`WARN: ${state.warnings}`);

  if (state.skipped > 0 && config.strict) {
    throw new Error('Smoke terminó con SKIP en modo estricto.');
  }

  console.log('SMOKE_HTTP_OK');
}

void main().catch((error) => {
  console.error('\nSMOKE_HTTP_FAILED');
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
