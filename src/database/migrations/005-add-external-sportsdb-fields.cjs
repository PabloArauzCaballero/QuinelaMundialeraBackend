'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teams', 'source', { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'manual' });
    await queryInterface.addColumn('teams', 'external_id', { type: Sequelize.STRING(80), allowNull: true });
    await queryInterface.addIndex('teams', ['source', 'external_id'], { unique: true, name: 'uq_teams_source_external_id' });

    await queryInterface.addColumn('stadiums', 'source', { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'manual' });
    await queryInterface.addColumn('stadiums', 'external_id', { type: Sequelize.STRING(80), allowNull: true });
    await queryInterface.addIndex('stadiums', ['source', 'external_id'], { unique: true, name: 'uq_stadiums_source_external_id' });
    await queryInterface.changeColumn('stadiums', 'name', { type: Sequelize.STRING(140), allowNull: true });
    await queryInterface.changeColumn('stadiums', 'city', { type: Sequelize.STRING(80), allowNull: true });
    await queryInterface.changeColumn('stadiums', 'country', { type: Sequelize.STRING(80), allowNull: true });

    await queryInterface.addColumn('matches', 'source', { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'manual' });
    await queryInterface.addColumn('matches', 'league_external_id', { type: Sequelize.STRING(80), allowNull: true });
    await queryInterface.addColumn('matches', 'league_name', { type: Sequelize.STRING(140), allowNull: true });
    await queryInterface.addColumn('matches', 'season', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.changeColumn('matches', 'stadium_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'stadiums', key: 'id' },
      onDelete: 'RESTRICT'
    });
    await queryInterface.addIndex('matches', ['source', 'league_external_id', 'season'], { name: 'ix_matches_source_league_season' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('matches', 'ix_matches_source_league_season');
    await queryInterface.changeColumn('matches', 'stadium_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'stadiums', key: 'id' },
      onDelete: 'RESTRICT'
    });
    await queryInterface.removeColumn('matches', 'season');
    await queryInterface.removeColumn('matches', 'league_name');
    await queryInterface.removeColumn('matches', 'league_external_id');
    await queryInterface.removeColumn('matches', 'source');

    await queryInterface.changeColumn('stadiums', 'country', { type: Sequelize.STRING(80), allowNull: false });
    await queryInterface.changeColumn('stadiums', 'city', { type: Sequelize.STRING(80), allowNull: false });
    await queryInterface.changeColumn('stadiums', 'name', { type: Sequelize.STRING(140), allowNull: false });
    await queryInterface.removeIndex('stadiums', 'uq_stadiums_source_external_id');
    await queryInterface.removeColumn('stadiums', 'external_id');
    await queryInterface.removeColumn('stadiums', 'source');

    await queryInterface.removeIndex('teams', 'uq_teams_source_external_id');
    await queryInterface.removeColumn('teams', 'external_id');
    await queryInterface.removeColumn('teams', 'source');
  }
};
