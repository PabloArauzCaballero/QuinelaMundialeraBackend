'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('roles', [
      { name: 'user', created_at: now, updated_at: now },
      { name: 'admin', created_at: now, updated_at: now }
    ], { ignoreDuplicates: true });

    const email = (process.env.ADMIN_EMAIL || 'admin@example.test').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(password, 12);

    const [existingUsers] = await queryInterface.sequelize.query('SELECT id FROM users WHERE email = :email LIMIT 1', {
      replacements: { email },
      type: Sequelize.QueryTypes.SELECT
    });

    let adminId = existingUsers?.id;
    if (!adminId) {
      const [rows] = await queryInterface.sequelize.query(
        `INSERT INTO users (name, email, password_hash, status, created_at, updated_at)
         VALUES (:name, :email, :passwordHash, 'active', NOW(), NOW()) RETURNING id`,
        { replacements: { name: 'Administrador Demo', email, passwordHash } }
      );
      adminId = rows[0].id;
    }

    const [adminRole] = await queryInterface.sequelize.query('SELECT id FROM roles WHERE name = :name LIMIT 1', {
      replacements: { name: 'admin' },
      type: Sequelize.QueryTypes.SELECT
    });
    const [userRole] = await queryInterface.sequelize.query('SELECT id FROM roles WHERE name = :name LIMIT 1', {
      replacements: { name: 'user' },
      type: Sequelize.QueryTypes.SELECT
    });

    await queryInterface.bulkInsert('user_roles', [
      { user_id: adminId, role_id: adminRole.id, created_at: now, updated_at: now },
      { user_id: adminId, role_id: userRole.id, created_at: now, updated_at: now }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_roles', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
