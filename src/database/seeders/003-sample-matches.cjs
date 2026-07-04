'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // PENDIENTE_ATLAS: reemplazar por calendario oficial completo 2026 cuando el fixture esté confirmado/importado.
    const teams = await queryInterface.sequelize.query('SELECT id, fifa_code FROM teams', { type: Sequelize.QueryTypes.SELECT });
    const stadiums = await queryInterface.sequelize.query('SELECT id, name FROM stadiums', { type: Sequelize.QueryTypes.SELECT });
    const byCode = Object.fromEntries(teams.map((team) => [team.fifa_code, team.id]));
    const metlife = stadiums.find((stadium) => stadium.name === 'MetLife Stadium')?.id ?? stadiums[0]?.id;
    const azteca = stadiums.find((stadium) => stadium.name === 'Estadio Azteca')?.id ?? stadiums[0]?.id;
    const now = new Date();

    if (!byCode.ARG || !byCode.BRA || !byCode.FRA || !byCode.ESP || !metlife || !azteca) return;

    await queryInterface.bulkInsert('matches', [
      {
        external_id: 'demo-arg-bra-2026',
        home_team_id: byCode.ARG,
        away_team_id: byCode.BRA,
        stadium_id: metlife,
        phase: 'group',
        status: 'scheduled',
        starts_at: new Date('2026-07-12T20:00:00.000Z'),
        home_score: null,
        away_score: null,
        last_synced_at: null,
        created_at: now,
        updated_at: now
      },
      {
        external_id: 'demo-fra-esp-2026',
        home_team_id: byCode.FRA,
        away_team_id: byCode.ESP,
        stadium_id: azteca,
        phase: 'group',
        status: 'scheduled',
        starts_at: new Date('2026-07-13T22:00:00.000Z'),
        home_score: null,
        away_score: null,
        last_synced_at: null,
        created_at: now,
        updated_at: now
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('matches', { external_id: ['demo-arg-bra-2026', 'demo-fra-esp-2026'] }, {});
  }
};
