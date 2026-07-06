export interface SportsDbSport {
  idSport?: string;
  strSport?: string;
  strFormat?: string | null;
  strSportThumb?: string | null;
  strSportIconGreen?: string | null;
  strSportDescription?: string | null;
}

export interface SportsDbLeague {
  idLeague?: string;
  strLeague?: string;
  strLeagueAlternate?: string | null;
  strSport?: string | null;
  strCountry?: string | null;
  strBadge?: string | null;
  strLogo?: string | null;
  strBanner?: string | null;
  strWebsite?: string | null;
  strYoutube?: string | null;
  intFormedYear?: string | null;
}

export interface SportsDbEvent {
  idEvent?: string;
  idLeague?: string | null;
  strLeague?: string | null;
  strSeason?: string | null;
  strEvent?: string | null;
  strEventAlternate?: string | null;
  strRound?: string | null;
  strStatus?: string | null;
  strProgress?: string | null;
  dateEvent?: string | null;
  dateEventLocal?: string | null;
  strTime?: string | null;
  strTimeLocal?: string | null;
  strTimestamp?: string | null;
  idHomeTeam?: string | null;
  idAwayTeam?: string | null;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  idVenue?: string | null;
  strVenue?: string | null;
  strCity?: string | null;
  strCountry?: string | null;
}

export interface NormalizedSport {
  id: string;
  externalId: string;
  name: string;
  format: string | null;
  thumbnailUrl: string | null;
  iconUrl: string | null;
  description: string | null;
  source: 'thesportsdb';
}

export interface NormalizedLeague {
  id: string;
  externalId: string;
  name: string;
  alternateName: string | null;
  sport: string | null;
  country: string | null;
  badgeUrl: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  website: string | null;
  youtube: string | null;
  formedYear: number | null;
  source: 'thesportsdb';
}

export interface NormalizedExternalMatch {
  id: string;
  externalId: string;
  source: 'thesportsdb';
  externalOnly: true;
  league: {
    externalId: string | null;
    name: string | null;
    season: string | null;
  };
  phase: 'group' | 'round_32' | 'round_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final';
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  startsAt: string | null;
  score: {
    home: number | null;
    away: number | null;
  };
  homeTeam: {
    id: string | null;
    externalId: string | null;
    name: string | null;
    shortName: string | null;
    fifaCode: null;
    flagUrl: string | null;
  };
  awayTeam: {
    id: string | null;
    externalId: string | null;
    name: string | null;
    shortName: string | null;
    fifaCode: null;
    flagUrl: string | null;
  };
  stadium: {
    id: string | null;
    externalId: string | null;
    name: string | null;
    city: string | null;
    country: string | null;
    latitude: null;
    longitude: null;
  } | null;
  rawStatus: string | null;
  lastSyncedAt: null;
}
