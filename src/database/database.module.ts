import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import type { Env } from '../config/env.schema';
import { databaseModels } from './models';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        dialect: 'postgres',
        host: config.get('DATABASE_HOST', { infer: true }),
        port: config.get('DATABASE_PORT', { infer: true }),
        username: config.get('DATABASE_USER', { infer: true }),
        password: config.get('DATABASE_PASSWORD', { infer: true }),
        database: config.get('DATABASE_NAME', { infer: true }),
        models: databaseModels,
        autoLoadModels: false,
        synchronize: false,
        logging: config.get('DATABASE_LOGGING', { infer: true }) ? console.log : false,
        dialectOptions: config.get('DATABASE_SSL', { infer: true })
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : undefined
      })
    })
  ]
})
export class DatabaseModule {}
