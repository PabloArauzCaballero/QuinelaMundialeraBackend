# Segunda revisión técnica — riesgos de largo plazo

## Resultado general

El backend quedó apto como base académica/profesional inicial. En esta segunda revisión se reforzaron puntos que podían generar fallas difíciles de detectar en mantenimiento, especialmente consistencia transaccional, seguridad de cuentas, errores de base de datos y restricciones del dominio.

## Correcciones aplicadas

| Área | Problema detectado | Riesgo a largo plazo | Corrección aplicada |
|---|---|---|---|
| Grupos | La transacción de creación no propagaba `transaction` al repositorio | Grupo creado sin membresía owner si una operación parcial fallaba | `GroupRepository` acepta opciones transaccionales y `GroupsService` las propaga |
| Seguridad | El JWT se aceptaba solo por firma, sin revalidar estado actual del usuario | Usuarios inactivos podrían usar tokens hasta expirar | `JwtAuthGuard` reconsulta usuario activo y roles actuales |
| Login | No se rechazaba explícitamente usuario inactivo | Cuenta desactivada podría iniciar sesión | `AuthService.login` valida `status='active'` |
| Errores | Restricciones Sequelize podían convertirse en 500 genérico | Mala experiencia para frontend y diagnóstico lento | `HttpExceptionFilter` mapea unique, foreign key y validation errors |
| Partidos admin | IDs de equipos/estadio dependían de FK de BD | Error tardío y poco claro | `MatchesService` valida referencias antes de crear/modificar |
| Partidos admin | Update parcial podía dejar equipo local igual al visitante | Datos inválidos persistidos si se actualizaba un solo equipo | Validación con estado efectivo del partido existente |
| Base de datos | Faltaban restricciones CHECK del dominio | Datos inválidos si entran por scripts o integraciones | Migración `004-add-domain-constraints.cjs` |
| Ranking | Consulta por usuarios dependía de inferencia de Sequelize con arrays | Riesgo de comportamiento ambiguo | Uso explícito de `Op.in` |
| Sync | Recalculo podía repetir partidos duplicados del proveedor | Trabajo duplicado y métricas infladas | Deduplicación de `updatedMatchIds` |
| TypeScript | Modelos con timestamps no declaraban tipos explícitos | Riesgo de errores en `strict` al mapear `createdAt/updatedAt` | Declaración explícita de timestamps en modelos |

## Decisiones mantenidas como supuestos

| ID | Decisión | Motivo |
|---|---|---|
| QM-ASU-002 | Access token sin refresh token | Suficiente para MVP académico; documentado como pendiente de producción |
| QM-ASU-003 | 3 puntos exacto, 1 resultado, 0 error | El enunciado permite definir regla; queda marcado como supuesto |
| QM-ASU-004 | Código de invitación sin expiración | Evita regla no especificada; queda pendiente de producto |
| QM-ASU-005 | TheSportsDB encapsulado | Permite corregir formato real sin tocar dominio |

## Recomendación antes de producción real

Antes de usarlo como producto real, resolver obligatoriamente:

1. Refresh token, revocación o versión de sesión.
2. Rate limiting en login y registro.
3. Fixture oficial completo del Mundial 2026.
4. Pruebas de integración con PostgreSQL real.
5. Validación real de TheSportsDB con eventos del torneo.
6. Política formal de rotación/expiración de códigos de invitación.
7. Observabilidad: logs estructurados, métricas y trazas.
