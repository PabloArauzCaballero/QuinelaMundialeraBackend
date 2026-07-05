import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema';

export interface AppConfig {
  name: string;
  port: number;
  isProduction: boolean;
  corsOrigins: string[];
  jwtSecret: string;
  jwtExpiresIn: string;
}

export const appConfigProvider = {
  provide: 'APP_CONFIG',
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): AppConfig => ({
    name: config.get('APP_NAME', { infer: true }),
    port: config.get('PORT', { infer: true }),
    isProduction: config.get('NODE_ENV', { infer: true }) === 'production',
    corsOrigins: config
      .get('APP_CORS_ORIGIN', { infer: true })
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    jwtSecret: config.get('JWT_SECRET', { infer: true }),
    jwtExpiresIn: config.get('JWT_EXPIRES_IN', { infer: true })
  })
};
