import { z } from 'zod';

const optionalString = (schema: z.ZodString) => z.preprocess((val) => val === '' ? undefined : val, schema.optional());
const booleanFromEnv = z.preprocess((val) => val === 'true' || val === true, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_NAME: z.string().default('Quiniela Mundial 2026 API'),
  APP_CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_NAME: z.string().default('quiniela_mundial_2026'),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres'),
  DATABASE_SSL: booleanFromEnv.default(false),
  DATABASE_LOGGING: booleanFromEnv.default(false),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  CREATE_INITIAL_ADMIN: booleanFromEnv.default(false),
  ADMIN_NAME: z.string().default('Administrador'),
  ADMIN_EMAIL: optionalString(z.string().email()),
  ADMIN_PASSWORD: optionalString(z.string().min(10)),
  CREATE_DEMO_USERS: booleanFromEnv.default(false),
  ALLOW_DEMO_USERS_IN_PRODUCTION: booleanFromEnv.default(false),
  DEMO_ADMIN_NAME: z.string().default('Demo Admin'),
  DEMO_ADMIN_EMAIL: z.string().email().default('demo.admin@quiniela.test'),
  DEMO_ADMIN_PASSWORD: z.string().min(10).default('DemoAdmin123!'),
  DEMO_USER_NAME: z.string().default('Demo User'),
  DEMO_USER_EMAIL: z.string().email().default('demo.user@quiniela.test'),
  DEMO_USER_PASSWORD: z.string().min(10).default('DemoUser123!'),
  SPORTSDB_API_KEY: z.string().default('123'),
  SPORTSDB_BASE_URL: z.string().url().default('https://www.thesportsdb.com/api/v1/json'),
  SPORTSDB_LEAGUE_NAME: z.string().default('FIFA World Cup'),
  SPORTSDB_WORLD_CUP_LEAGUE_ID: optionalString(z.string().trim().min(1)),
  SPORTSDB_WORLD_CUP_SEASON: z.string().default('2026'),
  SPORTSDB_TIMEOUT_MS: z.coerce.number().int().positive().default(12000),
  SPORTSDB_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
  SYNC_ENABLED: booleanFromEnv.default(false),
  SYNC_ON_BOOT: booleanFromEnv.default(false)
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Configuración inválida: ${message}`);
  }
  return result.data;
}
