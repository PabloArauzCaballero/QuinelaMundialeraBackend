# Contratos principales de API

Todos los endpoints usan el prefijo global:

```txt
/api/v1
```

## Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Pública | Registra visitante como usuario |
| POST | `/auth/login` | Pública | Devuelve access token JWT |
| GET | `/auth/me` | JWT | Devuelve usuario autenticado |
| POST | `/auth/logout` | JWT | Logout lógico y auditoría |

## Usuarios

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/users/me` | JWT | Consulta perfil seguro |
| PATCH | `/users/me` | JWT | Actualiza nombre/correo |

## Grupos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/groups` | JWT | Crea grupo y membresía owner en una transacción |
| GET | `/groups` | JWT | Lista grupos del usuario |
| GET | `/groups/:groupId` | JWT + miembro | Detalle del grupo |
| GET | `/groups/:groupId/invitation-code` | JWT + owner | Código de invitación |
| POST | `/groups/join` | JWT | Unirse por código |
| GET | `/groups/:groupId/members` | JWT + miembro | Participantes |

## Partidos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/matches` | JWT | Calendario con filtros |
| GET | `/matches/:matchId` | JWT | Detalle de partido, equipos y estadio |
| GET | `/teams` | JWT | Listar todos los equipos registrados |
| GET | `/stadiums` | JWT | Listar todos los estadios registrados |
| POST | `/admin/matches` | JWT + admin | Registrar partido |
| PATCH | `/admin/matches/:matchId` | JWT + admin | Modificar información base sin resultado oficial |

## Pronósticos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/predictions` | JWT | Crear pronóstico antes del inicio |
| PATCH | `/predictions/:id` | JWT + propietario | Modificar antes del inicio |
| GET | `/predictions/me` | JWT | Listar pronósticos del usuario |
| GET | `/predictions/me/groups/:groupId` | JWT + miembro | Lista los pronósticos del usuario en contexto del grupo |

## Clasificación y dashboard

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/groups/:groupId/leaderboard` | JWT + miembro | Ranking del grupo |
| GET | `/groups/:groupId/my-position` | JWT + miembro | Posición del usuario |
| GET | `/dashboard/me` | JWT | Resumen consolidado |

## Sincronización

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/admin/sync/run` | JWT + admin | Ejecuta sync manual |
| GET | `/admin/sync/runs` | JWT + admin | Últimas ejecuciones |

## Formato estándar de error

```json
{
  "requestId": "uuid-o-header-x-request-id",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La información enviada no es válida.",
    "details": []
  },
  "timestamp": "2026-07-04T00:00:00.000Z"
}
```
