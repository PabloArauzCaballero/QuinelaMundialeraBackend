# Quiniela Mundial 2026 — Backend

Backend profesional para una aplicación de quiniela del Mundial 2026.

## Stack

- NestJS + TypeScript
- Sequelize + PostgreSQL
- Zod para validación de entrada
- JWT para autenticación
- Swagger/OpenAPI
- Jobs programados para sincronización con TheSportsDB

## Módulos implementados

| Módulo | Responsabilidad |
|---|---|
| `auth` | Registro, login, sesión actual y logout lógico |
| `users` | Perfil seguro del usuario autenticado |
| `groups` | Grupos privados, invitaciones y participantes |
| `matches` | Calendario, detalle y administración de partidos |
| `predictions` | Registro, edición y consulta de pronósticos |
| `leaderboard` | Ranking por grupo y posición del usuario |
| `dashboard` | Resumen consolidado para el frontend |
| `sync` | Sincronización de resultados con TheSportsDB |
| `audit` | Trazabilidad de acciones críticas |

## Arquitectura aplicada

```txt
Controller -> Service -> Repository -> Model
          -> Schema Zod
          -> Mapper de respuesta segura
```

Principios aplicados:

- Controllers delgados.
- Services con casos de uso.
- Repositories para Sequelize.
- Models sin lógica de negocio.
- Validación Zod en toda entrada externa.
- Mappers para evitar exposición accidental de campos sensibles.
- Errores normalizados con `requestId`.
- Auditoría para acciones críticas.
- Migraciones explícitas, sin `synchronize` automático.

## Comandos

```bash
yarn install
cp .env.example .env
yarn db:migrate
yarn db:seed
yarn start:dev
```

Validación de calidad:

```bash
yarn lint
yarn type-check
yarn test
yarn smoke
yarn build
```

> Nota honesta: este paquete fue generado y revisado sin ejecutar `yarn install` dentro del entorno de ChatGPT porque no hay acceso garantizado a internet para descargar dependencias. La estructura, scripts y archivos están preparados para ejecutarse localmente.

## Swagger

Cuando el servidor esté activo:

```txt
http://localhost:3000/docs
```

## Variables importantes

| Variable | Uso |
|---|---|
| `DATABASE_*` | Conexión PostgreSQL |
| `JWT_SECRET` | Firma de access token |
| `SPORTSDB_API_KEY` | API key de TheSportsDB |
| `SYNC_ENABLED` | Habilita/deshabilita sincronización automática |

## Base de datos

Las migraciones crean:

- usuarios, roles y relación usuario-rol;
- equipos y estadios;
- grupos y membresías;
- partidos;
- pronósticos;
- ejecuciones de sincronización;
- auditoría;
- restricciones CHECK de dominio.

No se usa `synchronize: true`. Toda evolución debe pasar por migraciones.

## Regla de puntuación inicial

La regla queda documentada como supuesto temporal:

- 3 puntos: marcador exacto.
- 1 punto: ganador/empate acertado.
- 0 puntos: no acierta.

Ver:

- `docs/pending/pending-items.md`
- `docs/architecture/assumptions.md`
- `docs/architecture/long-term-review.md`

## Documentación adicional

| Archivo | Propósito |
|---|---|
| `docs/api/api-contracts.md` | Contratos principales de API |
| `docs/api/quiniela.http` | Pruebas manuales rápidas |
| `docs/architecture/backend-phases.md` | Fases implementadas |
| `docs/architecture/assumptions.md` | Supuestos técnicos y de negocio |
| `docs/architecture/long-term-review.md` | Segunda revisión y riesgos de largo plazo |
| `docs/pending/pending-items.md` | Pendientes explícitos |
| `IMPLEMENTATION_REPORT.md` | Reporte de implementación y revisión |
