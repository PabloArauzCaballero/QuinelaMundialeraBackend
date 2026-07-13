import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { StadiumModel } from './models/stadium.model';
import { TeamModel } from './models/team.model';
import { MatchModel } from './models/match.model';
import type { CreateMatchInput, ListMatchesQuery, UpdateMatchInput } from './match.schemas';
import type { NormalizedExternalMatch } from '../sportsdb/sportsdb.types';
import { resolveFifaCode } from '../sportsdb/country-fifa-codes';
import { resolveVenueCoordinates } from '../sportsdb/world-cup-venues';

@Injectable()
export class MatchRepository {
  constructor(
    @InjectModel(MatchModel) private readonly matches: typeof MatchModel,
    @InjectModel(TeamModel) private readonly teams: typeof TeamModel,
    @InjectModel(StadiumModel) private readonly stadiums: typeof StadiumModel
  ) {}

  findById(id: string): Promise<MatchModel | null> {
    return this.matches.findByPk(id, { include: [{ model: TeamModel, as: 'homeTeam' }, { model: TeamModel, as: 'awayTeam' }, StadiumModel] });
  }

  findByExternalId(externalId: string): Promise<MatchModel | null> {
    return this.matches.findOne({ where: { externalId }, include: [{ model: TeamModel, as: 'homeTeam' }, { model: TeamModel, as: 'awayTeam' }, StadiumModel] });
  }

  findTeamById(teamId: string): Promise<TeamModel | null> {
    return this.teams.findByPk(teamId);
  }

  findStadiumById(stadiumId: string): Promise<StadiumModel | null> {
    return this.stadiums.findByPk(stadiumId);
  }

  findTeamBySourceExternalId(source: string, externalId: string): Promise<TeamModel | null> {
    return this.teams.findOne({ where: { source, externalId } });
  }

  findTeamByName(name: string): Promise<TeamModel | null> {
    return this.teams.findOne({ where: { name } });
  }

  findTeamByFifaCode(fifaCode: string): Promise<TeamModel | null> {
    return this.teams.findOne({ where: { fifaCode } });
  }

  findStadiumBySourceExternalId(source: string, externalId: string): Promise<StadiumModel | null> {
    return this.stadiums.findOne({ where: { source, externalId } });
  }

  findStadiumByName(name: string): Promise<StadiumModel | null> {
    return this.stadiums.findOne({ where: { name } });
  }

  findAllTeams(): Promise<TeamModel[]> {
    return this.teams.findAll({ order: [['name', 'ASC']] });
  }

  findAllStadiums(): Promise<StadiumModel[]> {
    return this.stadiums.findAll({ order: [['name', 'ASC']] });
  }

  list(query: ListMatchesQuery): Promise<MatchModel[]> {
    const where: WhereOptions = {};
    if (query.phase) Object.assign(where, { phase: query.phase });
    if (query.status) Object.assign(where, { status: query.status });
    if (query.stadiumId) Object.assign(where, { stadiumId: query.stadiumId });
    if (query.source) Object.assign(where, { source: query.source });
    if (query.leagueExternalId) Object.assign(where, { leagueExternalId: query.leagueExternalId });
    if (query.season) Object.assign(where, { season: query.season });
    if (query.teamId) Object.assign(where, { [Op.or]: [{ homeTeamId: query.teamId }, { awayTeamId: query.teamId }] });
    if (query.date) {
      const start = new Date(`${query.date}T00:00:00.000Z`);
      const end = new Date(`${query.date}T23:59:59.999Z`);
      Object.assign(where, { startsAt: { [Op.between]: [start, end] } });
    }
    return this.matches.findAll({ where, include: [{ model: TeamModel, as: 'homeTeam' }, { model: TeamModel, as: 'awayTeam' }, StadiumModel], order: [['startsAt', 'ASC']] });
  }

  upcoming(limit = 10): Promise<MatchModel[]> {
    return this.matches.findAll({
      where: { status: 'scheduled', startsAt: { [Op.gt]: new Date() } },
      include: [{ model: TeamModel, as: 'homeTeam' }, { model: TeamModel, as: 'awayTeam' }, StadiumModel],
      order: [['startsAt', 'ASC']],
      limit
    });
  }

  // Partidos con fuente externa que ya deberían haber terminado (startsAt en
  // el pasado) pero siguen "scheduled". Pasa cuando el sync no corrió el día
  // real del partido (SYNC_ENABLED apagado, error puntual, ronda no
  // detectada a tiempo, etc.) y syncToday() solo revisa "hoy".
  findStaleScheduledExternalMatches(before: Date): Promise<MatchModel[]> {
    return this.matches.findAll({
      where: { status: 'scheduled', source: 'thesportsdb', externalId: { [Op.ne]: null }, startsAt: { [Op.lt]: before } }
    });
  }

  todaysMatches(): Promise<MatchModel[]> {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    return this.matches.findAll({ where: { startsAt: { [Op.between]: [start, end] } } });
  }

  create(input: CreateMatchInput): Promise<MatchModel> {
    return this.matches.create({ ...input, source: 'manual' } as any);
  }

  async upsertExternalMatch(input: NormalizedExternalMatch): Promise<{ match: MatchModel | null; action: 'created' | 'updated' | 'skipped'; reason?: string }> {
    if (!input.startsAt) return { match: null, action: 'skipped', reason: 'Evento sin fecha/hora válida.' };
    if (!input.homeTeam.externalId || !input.homeTeam.name) return { match: null, action: 'skipped', reason: 'Evento sin equipo local válido.' };
    if (!input.awayTeam.externalId || !input.awayTeam.name) return { match: null, action: 'skipped', reason: 'Evento sin equipo visitante válido.' };

    const [homeTeam, awayTeam, stadium] = await Promise.all([
      this.upsertExternalTeam(input.homeTeam),
      this.upsertExternalTeam(input.awayTeam),
      this.upsertExternalStadium(input.stadium)
    ]);

    const existing = await this.findByExternalId(input.externalId);
    const payload = {
      externalId: input.externalId,
      source: input.source,
      leagueExternalId: input.league.externalId,
      leagueName: input.league.name,
      season: input.league.season,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      stadiumId: stadium?.id ?? null,
      phase: input.phase,
      status: input.status,
      startsAt: new Date(input.startsAt),
      homeScore: input.score.home,
      awayScore: input.score.away,
      lastSyncedAt: new Date()
    };

    if (existing) {
      await existing.update(payload as any);
      return { match: await this.findById(existing.id), action: 'updated' };
    }

    const created = await this.matches.create(payload as any);
    return { match: await this.findById(created.id), action: 'created' };
  }

  async updateInfo(match: MatchModel, input: UpdateMatchInput): Promise<MatchModel> {
    await match.update(input as any);
    return this.findById(match.id) as Promise<MatchModel>;
  }

  async updateOfficialScore(match: MatchModel, input: { homeScore: number | null; awayScore: number | null; status: string; lastSyncedAt: Date }): Promise<void> {
    await match.update(input as any);
  }

  private async upsertExternalTeam(input: NormalizedExternalMatch['homeTeam']): Promise<TeamModel> {
    const fifaCode = resolveFifaCode(input.name) ?? (input.name ? input.name.slice(0, 3).toUpperCase() : null);
    // TheSportsDB a veces asigna un idTeam distinto o un nombre alterno (p. ej. "South Korea"
    // vs "Korea Republic") a la misma selección; el fifaCode resuelto es la clave más estable
    // para no violar la columna única ni duplicar equipos.
    const existing = (fifaCode ? await this.findTeamByFifaCode(fifaCode) : null)
      ?? (input.name ? await this.findTeamByName(input.name) : null)
      ?? (await this.findTeamBySourceExternalId('thesportsdb', input.externalId as string));
    if (existing) {
      // No se sobreescribe externalId: TheSportsDB puede reportar un idTeam distinto
      // para la misma selección entre eventos, y reescribirlo puede chocar con la
      // restricción única (source, external_id) de otro equipo ya sincronizado.
      await existing.update({ name: input.name, shortName: input.shortName ?? input.name, fifaCode, flagUrl: input.flagUrl } as any);
      return existing;
    }
    return this.teams.create({
      source: 'thesportsdb',
      externalId: input.externalId,
      name: input.name,
      shortName: input.shortName ?? input.name,
      fifaCode,
      flagUrl: input.flagUrl
    } as any);
  }

  private async upsertExternalStadium(input: NormalizedExternalMatch['stadium']): Promise<StadiumModel | null> {
    if (!input || (!input.externalId && !input.name)) return null;
    // TheSportsDB no siempre incluye idVenue para el mismo estadio (varía por evento),
    // así que el nombre es la clave más confiable para no duplicar sedes.
    const existing = (input.name ? await this.findStadiumByName(input.name) : null)
      ?? (await this.findStadiumBySourceExternalId('thesportsdb', input.externalId ?? `name:${input.name}`));
    const coordinates = resolveVenueCoordinates(input.name);
    if (existing) {
      // No se sobreescribe externalId: un idVenue distinto para el mismo nombre de
      // sede puede chocar con la restricción única (source, external_id) de otra fila.
      await existing.update({
        name: input.name,
        city: input.city,
        country: input.country,
        latitude: coordinates?.latitude ?? existing.latitude ?? null,
        longitude: coordinates?.longitude ?? existing.longitude ?? null
      } as any);
      return existing;
    }
    return this.stadiums.create({
      source: 'thesportsdb',
      externalId: input.externalId ?? `name:${input.name}`,
      name: input.name,
      city: input.city,
      country: input.country,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null
    } as any);
  }
}

