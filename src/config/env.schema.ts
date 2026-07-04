import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_PORT: z.coerce.number().int().positive().default(3000),
  APP_NAME: z.string().default('Quiniela Mundial 2026 API'),
  APP_CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_NAME: z.string().default('quiniela_mundial_2026'),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres'),
  DATABASE_SSL: z.coerce.boolean().default(false),
  DATABASE_LOGGING: z.coerce.boolean().default(false),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  ADMIN_EMAIL: z.string().email().default('admin@example.test'),
  ADMIN_PASSWORD: z.string().min(10).default('ChangeMe123!'),
  SPORTSDB_API_KEY: z.string().default('3'),
  SPORTSDB_BASE_URL: z.string().url().default('https://www.thesportsdb.com/api/v1/json'),
  SPORTSDB_LEAGUE_NAME: z.string().default('FIFA World Cup'),
  SYNC_ENABLED: z.coerce.boolean().default(false)
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
