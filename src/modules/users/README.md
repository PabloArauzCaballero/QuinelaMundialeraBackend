# Módulo users

Responsable de exponer el perfil seguro del usuario autenticado y actualizar datos personales.

- Nunca retorna `passwordHash`.
- Valida entrada con Zod.
- Mantiene el controller delgado.
