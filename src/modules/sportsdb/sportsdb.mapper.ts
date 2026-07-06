import type { NormalizedExternalMatch, NormalizedLeague, NormalizedSport, SportsDbEvent, SportsDbLeague, SportsDbSport } from './sportsdb.types';

const SOURCE = 'thesportsdb' as const;

export function normalizeSport(sport: SportsDbSport): NormalizedSport | null {
  if (!sport.idSport || !sport.strSport) return null;
  return {
    id: `sportsdb-sport-${sport.idSport}`,
    externalId: sport.idSport,
    name: sport.strSport,
    format: sport.strFormat ?? null,
    thumbnailUrl: sport.strSportThumb ?? null,
    iconUrl: sport.strSportIconGreen ?? null,
    description: sport.strSportDescription ?? null,
    source: SOURCE
  };
}

export function normalizeLeague(league: SportsDbLeague): NormalizedLeague | null {
  if (!league.idLeague || !league.strLeague) return null;
  const formedYear = league.intFormedYear ? Number(league.intFormedYear) : null;
  return {
    id: `sportsdb-league-${league.idLeague}`,
    externalId: league.idLeague,
    name: league.strLeague,
    alternateName: league.strLeagueAlternate ?? null,
    sport: league.strSport ?? null,
    country: league.strCountry ?? null,
    badgeUrl: league.strBadge ?? null,
    logoUrl: league.strLogo ?? null,
    bannerUrl: league.strBanner ?? null,
    website: league.strWebsite ?? null,
    youtube: league.strYoutube ?? null,
    formedYear: Number.isFinite(formedYear) ? formedYear : null,
    source: SOURCE
  };
}

export function normalizeExternalMatch(event: SportsDbEvent): NormalizedExternalMatch | null {
  if (!event.idEvent) return null;
  const startsAt = normalizeStartDate(event);
  const rawStatus = [event.strStatus, event.strProgress].filter(Boolean).join(' ').trim() || null;

  return {
    id: `sportsdb-event-${event.idEvent}`,
    externalId: event.idEvent,
    source: SOURCE,
    externalOnly: true,
    league: {
      externalId: event.idLeague ?? null,
      name: event.strLeague ?? null,
      season: event.strSeason ?? null
    },
    phase: mapPhase(event),
    status: mapStatus(event, startsAt),
    startsAt,
    score: {
      home: parseNullableInt(event.intHomeScore),
      away: parseNullableInt(event.intAwayScore)
    },
    homeTeam: {
      id: event.idHomeTeam ? `sportsdb-team-${event.idHomeTeam}` : null,
      externalId: event.idHomeTeam ?? null,
      name: event.strHomeTeam ?? null,
      shortName: toShortName(event.strHomeTeam),
      fifaCode: null,
      flagUrl: event.strHomeTeamBadge ?? null
    },
    awayTeam: {
      id: event.idAwayTeam ? `sportsdb-team-${event.idAwayTeam}` : null,
      externalId: event.idAwayTeam ?? null,
      name: event.strAwayTeam ?? null,
      shortName: toShortName(event.strAwayTeam),
      fifaCode: null,
      flagUrl: event.strAwayTeamBadge ?? null
    },
    stadium: normalizeStadium(event),
    rawStatus,
    lastSyncedAt: null
  };
}

export function parseNullableInt(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeStartDate(event: SportsDbEvent): string | null {
  if (event.strTimestamp) {
    const date = new Date(event.strTimestamp);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const datePart = event.dateEventLocal ?? event.dateEvent;
  const timePart = event.strTimeLocal ?? event.strTime ?? '00:00:00';
  if (!datePart) return null;

  const normalizedTime = /^\d{2}:\d{2}$/.test(timePart) ? `${timePart}:00` : timePart;
  const date = new Date(`${datePart}T${normalizedTime}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function mapStatus(event: SportsDbEvent, startsAtIso?: string | null): NormalizedExternalMatch['status'] {
  const raw = [event.strStatus, event.strProgress].filter(Boolean).join(' ').toLowerCase();
  if (raw.includes('postpon')) return 'postponed';
  if (raw.includes('cancel')) return 'cancelled';
  if (raw.includes('final') || raw.includes('finished') || raw.includes('ft')) return 'finished';
  if (raw.includes('live') || raw.includes('half') || raw.includes('progress') || raw.includes("'") || raw.includes('min')) return 'live';

  const hasScore = parseNullableInt(event.intHomeScore) !== null && parseNullableInt(event.intAwayScore) !== null;
  if (hasScore && startsAtIso && new Date(startsAtIso).getTime() < Date.now()) return 'finished';
  return 'scheduled';
}

export function mapPhase(event: SportsDbEvent): NormalizedExternalMatch['phase'] {
  const raw = [event.strRound, event.strEvent, event.strEventAlternate].filter(Boolean).join(' ').toLowerCase();
  if (raw.includes('final') && !raw.includes('semi') && !raw.includes('third')) return 'final';
  if (raw.includes('third') || raw.includes('3rd')) return 'third_place';
  if (raw.includes('semi')) return 'semi_final';
  if (raw.includes('quarter')) return 'quarter_final';
  if (raw.includes('round of 16') || raw.includes('last 16')) return 'round_16';
  if (raw.includes('round of 32') || raw.includes('last 32')) return 'round_32';
  return 'group';
}

function normalizeStadium(event: SportsDbEvent): NormalizedExternalMatch['stadium'] {
  const hasAnyVenueData = Boolean(event.idVenue || event.strVenue || event.strCity || event.strCountry);
  if (!hasAnyVenueData) return null;
  return {
    id: event.idVenue ? `sportsdb-venue-${event.idVenue}` : null,
    externalId: event.idVenue ?? null,
    name: event.strVenue ?? null,
    city: event.strCity ?? null,
    country: event.strCountry ?? null,
    latitude: null,
    longitude: null
  };
}

function toShortName(name: string | null | undefined): string | null {
  if (!name) return null;
  const cleaned = name.trim();
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 37).trimEnd() + '...';
}
