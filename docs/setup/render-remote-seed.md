# Render: migración y seed idempotente en base remota

Este proyecto debe preparar una base remota de Render/PostgreSQL con migraciones y seed idempotente.

## Comando recomendado

En Render, configurar como comando previo al deploy o ejecutarlo manualmente en Shell:

```bash
yarn db:deploy
```

Ese comando ejecuta:

```bash
sequelize-cli db:migrate && sequelize-cli db:seed:all
```

## Qué crea

- Tablas por migraciones.
- Roles base `user` y `admin`.
- Credenciales demo controladas por defecto para probar frontend/smoke.

## Qué NO crea

- No crea partidos falsos.
- No crea equipos falsos.
- No crea estadios falsos.
- No crea resultados falsos.
- No crea datos deportivos mock.

Los partidos/equipos/estadios deben venir desde TheSportsDB o desde endpoints administrativos reales.

## Variables mínimas recomendadas en Render demo

```env
NODE_ENV=production
JWT_SECRET=poner_una_clave_larga_segura
DATABASE_HOST=...
DATABASE_PORT=5432
DATABASE_NAME=...
DATABASE_USER=...
DATABASE_PASSWORD=...
DATABASE_SSL=true
SEED_DEMO_USERS=true
DEMO_ADMIN_EMAIL=demo.admin@quiniela.test
DEMO_ADMIN_PASSWORD=DemoAdmin123!
DEMO_USER_EMAIL=demo.user@quiniela.test
DEMO_USER_PASSWORD=DemoUser123!
SPORTSDB_API_KEY=123
SPORTSDB_BASE_URL=https://www.thesportsdb.com/api/v1/json
```

## Variables para producción real

```env
SEED_DEMO_USERS=false
CREATE_INITIAL_ADMIN=true
ADMIN_EMAIL=admin.real@tu-dominio.com
ADMIN_PASSWORD=una_clave_larga_segura
```

## Validación

Después de correr `yarn db:deploy`:

```bash
yarn smoke:http
```

Para Render:

```bash
API_BASE_URL=https://tu-backend.onrender.com/api/v1 yarn smoke:http
```
