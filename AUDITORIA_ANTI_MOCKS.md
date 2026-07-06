# Auditoría anti mocks / datos estáticos

## Resultado

Se eliminaron datos demo del paquete final.

## Cambios aplicados

| Área | Antes | Ahora |
|---|---|---|
| Roles/admin | Admin demo por defecto | Solo roles; admin solo si `CREATE_INITIAL_ADMIN=true` y hay credenciales explícitas |
| Equipos | Argentina/Brasil/Francia/España demo | Seeder vacío; equipos se importan desde TheSportsDB o admin |
| Estadios | Sedes precargadas | Seeder vacío; sedes se importan desde TheSportsDB o admin |
| Partidos | Fixtures demo `demo-*` | Seeder vacío; partidos reales se importan desde TheSportsDB |
| Docker | Ejecutaba `db:seed:all` siempre | Seeds solo con `RUN_DB_SEEDS=true` |
| API externa | Solo sync diario básico | Cliente TheSportsDB con deportes, ligas, eventos, normalización, importación y caché |

## Criterio

El backend puede funcionar sin cargar datos falsos. Los datos deportivos entran por:

1. `GET /api/v1/sportsdb/*` para consumo directo normalizado.
2. `POST /api/v1/admin/sync/import-*` para importar eventos reales a la base local.
3. Endpoints admin manuales cuando se requiera carga controlada.

No se agregaron cuotas, odds, apuestas ni lógica monetaria.
