# Reporte de implementación y segunda revisión

## Alcance implementado

Se implementó el backend completo por fases para Quiniela Mundial 2026, tomando como base el UML generado y los requerimientos del PDF.

## Calidad aplicada

- Arquitectura modular NestJS.
- Controllers delgados.
- Services por caso de uso.
- Repositories para Sequelize.
- Models para persistencia.
- Schemas Zod para entrada externa.
- Mappers para respuestas seguras.
- Error filter global.
- Guard JWT global y guard de roles.
- Swagger visual en `/docs`.
- Migraciones y seeders.
- Smoke test de reglas de puntuación.
- Documentación de pendientes y supuestos.

## Segunda revisión aplicada

Se revisaron riesgos que podían afectar mantenimiento o producción futura. Se corrigió:

- Propagación real de transacciones al crear grupos y membresía owner.
- Revalidación de usuario activo y roles actuales en cada request JWT.
- Rechazo de login para usuarios inactivos.
- Manejo profesional de errores Sequelize: unique, foreign key y validation errors.
- Validación previa de equipos y estadios en endpoints admin de partidos.
- Protección contra actualizar un partido dejando equipo local igual al visitante.
- Migración adicional de restricciones CHECK del dominio.
- Uso explícito de `Op.in` para consultas de predicciones por usuarios/partidos.
- Deduplicación de partidos actualizados durante sincronización.
- Tipado explícito de timestamps en modelos Sequelize.
- Documentación adicional de contratos API y revisión de largo plazo.

## Comandos esperados

```bash
yarn install
yarn db:migrate
yarn db:seed
yarn start:dev
yarn lint
yarn type-check
yarn test
yarn smoke
yarn build
```

## Validación ejecutada en ChatGPT

- Revisión estructural de archivos generados.
- Revisión manual de módulos críticos.
- Revisión de documentación obligatoria.
- Validación sintáctica básica de migraciones/seeders `.cjs` con `node --check`.
- Empaquetado ZIP real.

No se ejecutó `yarn install`, `lint`, `type-check`, `test` ni `build` en este entorno porque no se descargaron dependencias externas.

## Corrección adicional — Smoke HTTP end-to-end real

Se reemplazó el smoke principal para que pruebe solicitudes HTTP reales contra la API levantada.

Cambios:

- `yarn smoke` ahora ejecuta `yarn smoke:http`.
- `yarn smoke:rules` queda disponible para reglas puras.
- `scripts/smoke/http.smoke.ts` ahora cubre auth, usuarios, grupos, miembros, dashboard, leaderboard, partidos, equipos, estadios, pronósticos cuando existan partidos futuros, TheSportsDB real y endpoints admin cuando existan credenciales.
- Se agregó `docs/api/smoke-http-e2e.md` con variables, modo estricto y ejemplos para local/Render.

El smoke no crea partidos falsos. Si no hay partidos reales importados, el flujo de pronósticos se marca como `SKIP`, salvo que `SMOKE_STRICT=true` esté activo.

## Corrección E2E smoke: roles base obligatorios

Se detectó que una base local migrada pero sin seeders podía romper `POST /api/v1/auth/register` con:

```txt
Role no encontrado: user
```

Corrección aplicada:

- Nueva migración `006-ensure-required-roles.cjs` inserta de forma idempotente los roles base `user` y `admin`.
- `UserRepository.assignRole()` ahora usa `findOrCreate` como defensa operativa.
- Esto no introduce mocks: `user` y `admin` son catálogo obligatorio para autorización.

Para bases ya existentes, ejecutar:

```bash
yarn db:migrate
```

Si la tabla `roles` quedó vacía en local, con esa migración basta. No es necesario cargar seeders de partidos/equipos.
