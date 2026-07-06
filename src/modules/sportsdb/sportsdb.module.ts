import { Module } from '@nestjs/common';
import { SportsDbClient } from './sportsdb.client';
import { SportsDbController } from './sportsdb.controller';
import { SportsDbService } from './sportsdb.service';

@Module({
  controllers: [SportsDbController],
  providers: [SportsDbClient, SportsDbService],
  exports: [SportsDbClient, SportsDbService]
})
export class SportsDbModule {}
