# Credenciales demo idempotentes

Este backend crea credenciales demo por defecto cuando se ejecuta:

```bash
yarn db:seed
```

Esto está pensado para entornos de demo, QA, Render de prueba y validación con frontend.

## Credenciales por defecto

| Tipo | Email | Contraseña | Roles |
|---|---|---|---|
| Admin demo | `demo.admin@quiniela.test` | `DemoAdmin123!` | `admin`, `user` |
| Usuario demo | `demo.user@quiniela.test` | `DemoUser123!` | `user` |

## Propiedades importantes

- El seeder es idempotente.
- Si el usuario ya existe, actualiza contraseña, nombre, estado `active` y roles.
- No crea partidos mock.
- No crea equipos mock.
- No crea estadios mock.
- No crea resultados falsos.
- No cambia endpoints.

## Variables para cambiar credenciales

```env
SEED_DEMO_USERS=true
DEMO_ADMIN_NAME=Demo Admin
DEMO_ADMIN_EMAIL=demo.admin@quiniela.test
DEMO_ADMIN_PASSWORD=DemoAdmin123!
DEMO_USER_NAME=Demo User
DEMO_USER_EMAIL=demo.user@quiniela.test
DEMO_USER_PASSWORD=DemoUser123!
```

## Desactivar credenciales demo

En un entorno productivo real, desactivar:

```env
SEED_DEMO_USERS=false
```

Los roles `user` y `admin` seguirán existiendo por migración/seed, porque son catálogo base del sistema.

## Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "demo.admin@quiniela.test",
  "password": "DemoAdmin123!"
}
```
