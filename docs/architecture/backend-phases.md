# Plan por fases implementado

| Fase | Estado | Entregable |
|---|---|---|
| 0 | Implementado | Base NestJS, configuración, common, Swagger, errores y seguridad |
| 1 | Implementado | Modelo relacional, migraciones y seeders |
| 2 | Implementado | Auth, usuarios, JWT, roles y guards |
| 3 | Implementado | Grupos privados y membresías |
| 4 | Implementado | Partidos, equipos, estadios y endpoints admin |
| 5 | Implementado | Pronósticos con bloqueo por inicio de partido |
| 6 | Implementado | Motor de puntuación y clasificación |
| 7 | Implementado | Sincronización encapsulada con TheSportsDB |
| 8 | Implementado | Dashboard del usuario |
| 9 | Implementado | Auditoría, errores profesionales y requestId |
| 10 | Implementado | Swagger, README y colección HTTP |
| 11 | Implementado | Test de reglas y smoke de lógica pura |

## Criterios aplicados

- Controllers delgados.
- Services con casos de uso.
- Repositories para Sequelize.
- Schemas Zod por entrada externa.
- Mappers para respuestas seguras.
- Errores explícitos y consistentes.
- Documentación de pendientes y supuestos.
