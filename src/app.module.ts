import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { validateEnv } from './config/env.schema';
import { appConfigProvider } from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MatchesModule } from './modules/matches/matches.module';
import { PredictionsModule } from './modules/predictions/predictions.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SyncModule } from './modules/sync/sync.module';
import { SportsDbModule } from './modules/sportsdb/sportsdb.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ScheduleModule.forRoot(),
    JwtModule.register({ global: true }),
    DatabaseModule,
    AuditModule,
    HealthModule,
    UsersModule,
    AuthModule,
    GroupsModule,
    MatchesModule,
    PredictionsModule,
    LeaderboardModule,
    DashboardModule,
    SportsDbModule,
    SyncModule
  ],
  providers: [
    appConfigProvider,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes({ path: '/{*path}', method: RequestMethod.ALL });
  }
}
