# Smoke HTTP end-to-end

Este smoke prueba la API mediante solicitudes HTTP reales. No llama services internos y no usa mocks.

## Precondiciones obligatorias

Antes de ejecutar el smoke, la base debe estar migrada:

```bash
yarn db:migrate
```

La migración `006-ensure-required-roles.cjs` crea de forma idempotente los roles base `user` y `admin`. Estos roles no son datos mock; son catálogo obligatorio del sistema. Sin ellos, el registro real de usuarios no puede asignar rol `user`.

El seed idempotente debe ejecutarse para garantizar credenciales demo/controladas y roles base en bases remotas reutilizadas. Usa `yarn db:deploy` para migrar y sembrar en una sola operación.

## Ejecutar local

```bash
API_BASE_URL=http://localhost:3000/api/v1 yarn smoke:http
```

## Ejecutar con admin

```bash
SMOKE_ADMIN_EMAIL=demo.admin@quiniela.test \
SMOKE_ADMIN_PASSWORD=DemoAdmin123! \
API_BASE_URL=http://localhost:3000/api/v1 \
yarn smoke:http
```

## Modo estricto

```bash
SMOKE_STRICT=true yarn smoke:http
```

En modo estricto, cualquier `SKIP` falla el smoke.

## Cobertura

- Health check público.
- Registro/login real.
- Rutas protegidas.
- Perfil.
- Grupos e invitaciones.
- Miembros.
- Dashboard.
- Leaderboard.
- Pronósticos si existen partidos futuros reales.
- SportsDB real según disponibilidad del plan gratuito.
- Endpoints admin si se configuran credenciales.

## Importante

Si no hay partidos reales futuros importados en la base, la prueba de creación/edición de pronósticos se omite, salvo que `SMOKE_STRICT=true`.

## Smoke con credenciales demo

El seeder crea por defecto:

```env
SEED_DEMO_USERS=true
DEMO_ADMIN_EMAIL=demo.admin@quiniela.test
DEMO_ADMIN_PASSWORD=DemoAdmin123!
DEMO_USER_EMAIL=demo.user@quiniela.test
DEMO_USER_PASSWORD=DemoUser123!
```

Ejecutar:

```bash
yarn db:deploy
yarn smoke:http
```

El smoke usa `SMOKE_ADMIN_EMAIL`/`SMOKE_ADMIN_PASSWORD` si existen. Si no existen, usa `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Si tampoco existen, usa las credenciales demo por defecto.
