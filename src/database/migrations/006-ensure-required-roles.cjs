'use strict';

/**
 * Roles base del sistema.
 *
 * Esto NO es dato mock ni demo. Son datos de catálogo obligatorios para que
 * los casos de uso de autenticación/autorización funcionen:
 * - user: todo usuario registrado.
 * - admin: usuarios con permisos administrativos.
 *
 * Antes dependían de seeders. Eso era frágil porque una base migrada sin seeds
 * dejaba roto POST /auth/register con "Role no encontrado: user".
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO roles (name, created_at, updated_at)
      VALUES
        ('user', NOW(), NOW()),
        ('admin', NOW(), NOW())
      ON CONFLICT (name) DO UPDATE
      SET updated_at = EXCLUDED.updated_at;
    `);
  },

  async down(queryInterface) {
    // No eliminamos roles base en down para evitar dejar usuarios existentes sin rol.
    // Si se requiere reset total, usar db:migrate:undo:all sobre una base desechable.
    await queryInterface.sequelize.query('SELECT 1;');
  }
};
