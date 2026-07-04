# Supuestos de arquitectura y negocio

| ID | Supuesto | Justificación | Riesgo |
|---|---|---|---|
| QM-ASU-001 | El backend usa NestJS aunque el enunciado acepta Express o NestJS. | Mantiene arquitectura modular y profesional. | Bajo |
| QM-ASU-002 | Se usa access token JWT sin refresh token en MVP. | Suficiente para entrega académica inicial. | Medio si se lleva a producción real. |
| QM-ASU-003 | La puntuación inicial es 3 exacto, 1 ganador/empate, 0 error. | El enunciado da esa regla como ejemplo y permite definirla. | Medio si el docente espera otra regla. |
| QM-ASU-004 | El código de invitación de grupo no expira en MVP. | Simplifica el flujo y evita reglas no especificadas. | Bajo/medio. |
| QM-ASU-005 | TheSportsDB se encapsula detrás de `SportsDbClient`. | Permite ajustar campos reales sin contaminar dominio. | Bajo. |
| QM-ASU-006 | El resultado oficial solo se actualiza por sync externa. | El requerimiento indica que no debe modificarse manualmente. | Bajo. |
