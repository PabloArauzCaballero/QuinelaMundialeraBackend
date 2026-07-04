'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sync_runs', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      provider: { type: Sequelize.STRING(40), allowNull: false },
      status: { type: Sequelize.STRING(24), allowNull: false },
      started_at: { type: Sequelize.DATE, allowNull: false },
      finished_at: { type: Sequelize.DATE, allowNull: true },
      matches_checked: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      matches_updated: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      error_summary: { type: Sequelize.TEXT, allowNull: true }
    });
    await queryInterface.addIndex('sync_runs', ['started_at']);

    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      actor_user_id: { type: Sequelize.UUID, allowNull: true },
      action: { type: Sequelize.STRING(80), allowNull: false },
      resource_type: { type: Sequelize.STRING(80), allowNull: false },
      resource_id: { type: Sequelize.UUID, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      request_id: { type: Sequelize.STRING(100), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('audit_logs', ['actor_user_id']);
    await queryInterface.addIndex('audit_logs', ['action']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('sync_runs');
  }
};
