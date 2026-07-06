'use strict';

const bcrypt = require('bcryptjs');

/**
 * Seeder idempotente obligatorio para entornos remotos/demo.
 *
 * Objetivo:
 * - Garantizar roles base: user/admin.
 * - Garantizar credenciales demo controladas por defecto para probar frontend/smoke.
 * - No crear partidos, equipos, estadios, resultados ni datos deportivos falsos.
 *
 * Este seeder es seguro para re-ejecutarse:
 * - Si el usuario existe, actualiza nombre, contraseña, status y roles.
 * - Si el rol existe, no duplica.
 * - Si la relación usuario-rol existe, no duplica.
 *
 * Para desactivar credenciales demo en un entorno real:
 *   SEED_DEMO_USERS=false
 */

const DEFAULT_DEMO_ADMIN_EMAIL = 'demo.admin@quiniela.test';
const DEFAULT_DEMO_ADMIN_PASSWORD = 'DemoAdmin123!';
const DEFAULT_DEMO_USER_EMAIL = 'demo.user@quiniela.test';
const DEFAULT_DEMO_USER_PASSWORD = 'DemoUser123!';

function envFlag(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function requirePassword(label, password) {
  if (!password || String(password).length < 10) {
    throw new Error(`${label} debe tener al menos 10 caracteres.`);
  }
}

async function ensureRole(queryInterface, Sequelize, transaction, name) {
  const [rows] = await queryInterface.sequelize.query(
    `INSERT INTO roles (name, created_at, updated_at)
     VALUES (:name, NOW(), NOW())
     ON CONFLICT (name) DO UPDATE
     SET updated_at = EXCLUDED.updated_at
     RETURNING id`,
    {
      replacements: { name },
      type: Sequelize.QueryTypes.INSERT,
      transaction
    }
  );

  return rows[0].id;
}

async function ensureUser(queryInterface, Sequelize, transaction, input) {
  const email = normalizeEmail(input.email);
  requirePassword(`Password para ${email}`, input.password);

  const passwordHash = await bcrypt.hash(input.password, 12);

  const [existingUser] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      replacements: { email },
      type: Sequelize.QueryTypes.SELECT,
      transaction
    }
  );

  if (existingUser?.id) {
    await queryInterface.sequelize.query(
      `UPDATE users
       SET name = :name,
           password_hash = :passwordHash,
           status = 'active',
           updated_at = NOW()
       WHERE id = :id`,
      {
        replacements: {
          id: existingUser.id,
          name: input.name,
          passwordHash
        },
        transaction
      }
    );

    return existingUser.id;
  }

  const [rows] = await queryInterface.sequelize.query(
    `INSERT INTO users (name, email, password_hash, status, created_at, updated_at)
     VALUES (:name, :email, :passwordHash, 'active', NOW(), NOW())
     RETURNING id`,
    {
      replacements: {
        name: input.name,
        email,
        passwordHash
      },
      type: Sequelize.QueryTypes.INSERT,
      transaction
    }
  );

  return rows[0].id;
}

async function ensureUserRoles(queryInterface, transaction, rolesByName, userId, roleNames) {
  for (const roleName of roleNames) {
    const roleId = rolesByName[roleName];
    if (!roleId) throw new Error(`Rol requerido no existe en memoria: ${roleName}`);

    await queryInterface.sequelize.query(
      `INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
       VALUES (:userId, :roleId, NOW(), NOW())
       ON CONFLICT (user_id, role_id) DO UPDATE
       SET updated_at = EXCLUDED.updated_at`,
      {
        replacements: { userId, roleId },
        transaction
      }
    );
  }
}

async function ensureControlledAdminIfConfigured(queryInterface, Sequelize, transaction, rolesByName) {
  const shouldCreateInitialAdmin = envFlag('CREATE_INITIAL_ADMIN', false);
  if (!shouldCreateInitialAdmin) return;

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('CREATE_INITIAL_ADMIN=true requiere ADMIN_EMAIL y ADMIN_PASSWORD.');
  }

  const adminId = await ensureUser(queryInterface, Sequelize, transaction, {
    name: process.env.ADMIN_NAME || 'Administrador',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  });

  await ensureUserRoles(queryInterface, transaction, rolesByName, adminId, ['admin', 'user']);
}

async function ensureDemoUsers(queryInterface, Sequelize, transaction, rolesByName) {
  const shouldSeedDemoUsers = envFlag('SEED_DEMO_USERS', true);
  if (!shouldSeedDemoUsers) return;

  const demoAdminEmail = process.env.DEMO_ADMIN_EMAIL || DEFAULT_DEMO_ADMIN_EMAIL;
  const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD || DEFAULT_DEMO_ADMIN_PASSWORD;
  const demoUserEmail = process.env.DEMO_USER_EMAIL || DEFAULT_DEMO_USER_EMAIL;
  const demoUserPassword = process.env.DEMO_USER_PASSWORD || DEFAULT_DEMO_USER_PASSWORD;

  const demoAdminId = await ensureUser(queryInterface, Sequelize, transaction, {
    name: process.env.DEMO_ADMIN_NAME || 'Demo Admin',
    email: demoAdminEmail,
    password: demoAdminPassword
  });
  await ensureUserRoles(queryInterface, transaction, rolesByName, demoAdminId, ['admin', 'user']);

  const demoUserId = await ensureUser(queryInterface, Sequelize, transaction, {
    name: process.env.DEMO_USER_NAME || 'Demo User',
    email: demoUserEmail,
    password: demoUserPassword
  });
  await ensureUserRoles(queryInterface, transaction, rolesByName, demoUserId, ['user']);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const userRoleId = await ensureRole(queryInterface, Sequelize, transaction, 'user');
      const adminRoleId = await ensureRole(queryInterface, Sequelize, transaction, 'admin');
      const rolesByName = { user: userRoleId, admin: adminRoleId };

      await ensureControlledAdminIfConfigured(queryInterface, Sequelize, transaction, rolesByName);
      await ensureDemoUsers(queryInterface, Sequelize, transaction, rolesByName);
    });
  },

  async down(queryInterface) {
    // Down conservador: solo elimina usuarios demo conocidos.
    // No borra roles base ni relaciones de usuarios reales.
    const demoAdminEmail = normalizeEmail(process.env.DEMO_ADMIN_EMAIL || DEFAULT_DEMO_ADMIN_EMAIL);
    const demoUserEmail = normalizeEmail(process.env.DEMO_USER_EMAIL || DEFAULT_DEMO_USER_EMAIL);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM users
         WHERE email IN (:demoAdminEmail, :demoUserEmail)`,
        {
          replacements: { demoAdminEmail, demoUserEmail },
          transaction
        }
      );
    });
  }
};
