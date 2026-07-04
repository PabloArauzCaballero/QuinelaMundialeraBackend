const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const text = await response.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} -> ${response.status}: ${text}`);
  }
  return data as any;
}

async function main() {
  const health = await request('/health');
  if (!health.ok) throw new Error('Health no respondió OK');
  console.log('OK health');

  const email = `smoke-${Date.now()}@example.test`;
  const registered = await request('/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Test', email, password: 'Password123!' })
  });
  const token = registered.accessToken;
  if (!token) throw new Error('No se recibió accessToken');
  console.log('OK register/login token');

  const group = await request('/groups', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Grupo Smoke' })
  });
  if (!group.id) throw new Error('No se creó grupo');
  console.log('OK groups');
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
