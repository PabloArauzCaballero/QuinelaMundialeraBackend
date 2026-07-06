# Integración TheSportsDB — Quiniela Mundial 2026

## Propósito

El backend no debe subir partidos, equipos ni sedes demo. La fuente externa para calendario/resultados es TheSportsDB y el backend actúa como adaptador:

1. Consulta TheSportsDB v1.
2. Normaliza deportes, ligas y eventos.
3. Devuelve el mismo shape que espera el frontend para partidos.
4. Opcionalmente importa eventos reales a la base local para habilitar pronósticos, ranking y dashboard.
5. Recalcula puntos cuando un resultado oficial cambia.

## Variables relevantes

```env
SPORTSDB_API_KEY=123
SPORTSDB_BASE_URL=https://www.thesportsdb.com/api/v1/json
SPORTSDB_LEAGUE_NAME=FIFA World Cup
SPORTSDB_WORLD_CUP_LEAGUE_ID=
SPORTSDB_WORLD_CUP_SEASON=2026
SPORTSDB_TIMEOUT_MS=12000
SPORTSDB_CACHE_TTL_SECONDS=300
SYNC_ENABLED=false
```

`SPORTSDB_WORLD_CUP_LEAGUE_ID` debe configurarse con el id real de la liga/competencia en TheSportsDB. El backend no inventa ese ID.

## Endpoints para frontend

### Deportes del plan configurado

```http
GET /api/v1/sportsdb/sports
```

Devuelve deportes normalizados:

```json
{
  "source": "thesportsdb",
  "items": [
    {
      "id": "sportsdb-sport-102",
      "externalId": "102",
      "name": "Soccer",
      "format": "TeamvsTeam",
      "thumbnailUrl": "...",
      "iconUrl": "...",
      "description": "...",
      "source": "thesportsdb"
    }
  ]
}
```

### Ligas disponibles / búsqueda por deporte y país

```http
GET /api/v1/sportsdb/leagues
GET /api/v1/sportsdb/leagues?sport=Soccer
GET /api/v1/sportsdb/leagues?sport=Soccer&country=England
```

### Partidos externos normalizados por liga

```http
GET /api/v1/sportsdb/events?leagueId=4328&mode=next
GET /api/v1/sportsdb/events?leagueId=4328&mode=past
GET /api/v1/sportsdb/events?leagueId=4328&mode=season&season=2026
```

La respuesta usa el contrato de partido del frontend:

```json
{
  "source": "thesportsdb",
  "mode": "season",
  "leagueId": "4328",
  "season": "2026",
  "items": [
    {
      "id": "sportsdb-event-123456",
      "externalId": "123456",
      "source": "thesportsdb",
      "externalOnly": true,
      "league": { "externalId": "4328", "name": "...", "season": "2026" },
      "phase": "group",
      "status": "scheduled",
      "startsAt": "2026-06-11T20:00:00.000Z",
      "score": { "home": null, "away": null },
      "homeTeam": { "id": "sportsdb-team-...", "externalId": "...", "name": "...", "shortName": "...", "fifaCode": null, "flagUrl": null },
      "awayTeam": { "id": "sportsdb-team-...", "externalId": "...", "name": "...", "shortName": "...", "fifaCode": null, "flagUrl": null },
      "stadium": null,
      "rawStatus": null,
      "lastSyncedAt": null
    }
  ]
}
```

### Mundial

```http
GET /api/v1/sportsdb/world-cup/events?leagueId=<ID_REAL>&season=2026&mode=season
```

Si `SPORTSDB_WORLD_CUP_LEAGUE_ID` está configurado, el frontend puede omitir `leagueId`.

## Endpoints admin de importación

Estos endpoints convierten eventos externos a registros locales en `teams`, `stadiums` y `matches`.

```http
POST /api/v1/admin/sync/import-league
Content-Type: application/json

{
  "leagueId": "4328",
  "season": "2026",
  "mode": "season"
}
```

```http
POST /api/v1/admin/sync/import-world-cup
Content-Type: application/json

{
  "leagueId": "<ID_REAL>",
  "season": "2026",
  "mode": "season"
}
```

## Reglas anti mock

- No hay partidos demo.
- No hay equipos demo.
- No hay sedes demo.
- Si TheSportsDB no trae un dato, se guarda `null` cuando el modelo lo permite.
- Si falta un dato obligatorio para crear un partido local, el evento se omite y se devuelve la razón.
- El backend no inventa IDs de ligas ni calendario.

## Limitaciones del plan gratuito

TheSportsDB aplica límites por endpoint y por minuto. El backend incluye caché TTL para reducir llamadas repetidas y registra ejecuciones en `sync_runs`.
