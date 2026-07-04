'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('groups', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      name: { type: Sequelize.STRING(120), allowNull: false },
      invitation_code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      owner_user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('group_members', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      group_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'groups', key: 'id' }, onDelete: 'CASCADE' },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      role: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'member' },
      status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'active' },
      joined_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addConstraint('group_members', { fields: ['group_id', 'user_id'], type: 'unique', name: 'uq_group_members_group_user' });

    await queryInterface.createTable('matches', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      external_id: { type: Sequelize.STRING(80), allowNull: true, unique: true },
      home_team_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'teams', key: 'id' }, onDelete: 'RESTRICT' },
      away_team_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'teams', key: 'id' }, onDelete: 'RESTRICT' },
      stadium_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'stadiums', key: 'id' }, onDelete: 'RESTRICT' },
      phase: { type: Sequelize.STRING(40), allowNull: false },
      status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'scheduled' },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      home_score: { type: Sequelize.INTEGER, allowNull: true },
      away_score: { type: Sequelize.INTEGER, allowNull: true },
      last_synced_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('matches', ['starts_at']);
    await queryInterface.addIndex('matches', ['status']);
    await queryInterface.addIndex('matches', ['phase']);

    await queryInterface.createTable('predictions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      match_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'matches', key: 'id' }, onDelete: 'CASCADE' },
      predicted_home_score: { type: Sequelize.INTEGER, allowNull: false },
      predicted_away_score: { type: Sequelize.INTEGER, allowNull: false },
      points: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'pending' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addConstraint('predictions', { fields: ['user_id', 'match_id'], type: 'unique', name: 'uq_predictions_user_match' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('predictions');
    await queryInterface.dropTable('matches');
    await queryInterface.dropTable('group_members');
    await queryInterface.dropTable('groups');
  }
};
