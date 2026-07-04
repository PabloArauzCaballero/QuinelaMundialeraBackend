import { MatchModel } from './models/match.model';

export function mapMatch(match: MatchModel) {
  return {
    id: match.id,
    externalId: match.externalId,
    phase: match.phase,
    status: match.status,
    startsAt: match.startsAt,
    score: {
      home: match.homeScore,
      away: match.awayScore
    },
    homeTeam: match.homeTeam
      ? { id: match.homeTeam.id, name: match.homeTeam.name, shortName: match.homeTeam.shortName, fifaCode: match.homeTeam.fifaCode, flagUrl: match.homeTeam.flagUrl }
      : { id: match.homeTeamId },
    awayTeam: match.awayTeam
      ? { id: match.awayTeam.id, name: match.awayTeam.name, shortName: match.awayTeam.shortName, fifaCode: match.awayTeam.fifaCode, flagUrl: match.awayTeam.flagUrl }
      : { id: match.awayTeamId },
    stadium: match.stadium
      ? { id: match.stadium.id, name: match.stadium.name, city: match.stadium.city, country: match.stadium.country, latitude: match.stadium.latitude, longitude: match.stadium.longitude }
      : { id: match.stadiumId },
    lastSyncedAt: match.lastSyncedAt,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt
  };
}
