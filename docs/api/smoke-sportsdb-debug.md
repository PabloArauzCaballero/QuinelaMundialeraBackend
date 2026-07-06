# Smoke SportsDB debug con JSON de respuestas

Este smoke prueba los endpoints reales de SportsDB del backend y guarda todas las respuestas en un archivo JSON para depurar frontend/backend sin depender de logs truncados.

## Comando local

```bash
yarn smoke:sportsdb
```

## Comando contra Render

```powershell
$env:API_BASE_URL="https://TU-BACKEND.onrender.com/api/v1"
yarn smoke:sportsdb
```

## Archivo generado

Por defecto escribe:

```txt
scripts/smoke/sportsdb-debug-responses.json
```

Puedes cambiar la ruta con:

```powershell
$env:SMOKE_SPORTSDB_OUTPUT_JSON="scripts/smoke/responses/sportsdb-render.json"
yarn smoke:sportsdb
```

## Variables útiles

```env
SMOKE_ADMIN_EMAIL=demo.admin@quiniela.test
SMOKE_ADMIN_PASSWORD=DemoAdmin123!
SMOKE_COMPARE_UPSTREAM=true
SMOKE_STRICT=false
SMOKE_SPORTSDB_DATE=2026-07-06
SMOKE_EPL_LEAGUE_ID=4328
SMOKE_EPL_SEASON=2026-2027
SMOKE_WORLD_CUP_LEAGUE_ID=
SMOKE_WORLD_CUP_SEASON=2026
```

## Lectura del resultado

El JSON contiene:

- `summary`: resumen corto de cada request.
- `records`: respuesta completa de cada request.
- `itemsLength`: cantidad de items detectados en `items`, `sports`, `leagues` o `events`.
- `firstItem` y `secondItem`: primeros elementos para lectura rápida.

## Nota importante sobre temporadas

Para la Premier League, TheSportsDB puede responder la temporada como `2026-2027`, no como `2026`. Por eso este smoke prueba ambas:

- `season=2026-2027`, como temporada correcta para EPL.
- `season=2026`, como diagnóstico de por qué puede devolver vacío.

## Nota sobre Mundial

`/sportsdb/world-cup/events` necesita un `leagueId` real para traer calendario de temporada. Si `SMOKE_WORLD_CUP_LEAGUE_ID` o `SPORTSDB_WORLD_CUP_LEAGUE_ID` está vacío, el smoke deja el caso como diagnóstico y no inventa el ID.
