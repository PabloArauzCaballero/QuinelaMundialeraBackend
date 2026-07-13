import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MatchesModule } from '../matches/matches.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { SyncRunModel } from './models/sync-run.model';
import { SportsDbModule } from '../sportsdb/sportsdb.module';
import { SyncController } from './sync.controller';
import { SyncRepository } from './sync.repository';
import { SyncService } from './sync.service';

@Module({
  imports: [SequelizeModule.forFeature([SyncRunModel]), MatchesModule, PredictionsModule, SportsDbModule],
  controllers: [SyncController],
  providers: [SyncRepository, SyncService]
})
export class SyncModule implements OnModuleInit {
  constructor(private readonly sync: SyncService) {}

  onModuleInit(): void {
    // Corre la sincronización incremental al iniciar (respeta SYNC_ENABLED/SYNC_ON_BOOT).
    // Se dispara de forma asíncrona para no bloquear el arranque del servidor.
    void this.sync.syncOnBoot();
  }
}
