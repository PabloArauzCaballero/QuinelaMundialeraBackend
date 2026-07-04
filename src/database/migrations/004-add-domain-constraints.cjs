'use strict';

const constraints = [
  ['users', 'ck_users_status', "status IN ('active', 'inactive')"],
  ['groups', 'ck_groups_status', "status IN ('active', 'archived')"],
  ['group_members', 'ck_group_members_role', "role IN ('owner', 'member')"],
  ['group_members', 'ck_group_members_status', "status IN ('active', 'left')"],
  ['matches', 'ck_matches_status', "status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')"],
  ['matches', 'ck_matches_phase', "phase IN ('group', 'round_32', 'round_16', 'quarter_final', 'semi_final', 'third_place', 'final')"],
  ['matches', 'ck_matches_different_teams', 'home_team_id <> away_team_id'],
  ['matches', 'ck_matches_home_score_non_negative', 'home_score IS NULL OR home_score >= 0'],
  ['matches', 'ck_matches_away_score_non_negative', 'away_score IS NULL OR away_score >= 0'],
  ['predictions', 'ck_predictions_scores_non_negative', 'predicted_home_score >= 0 AND predicted_away_score >= 0'],
  ['predictions', 'ck_predictions_points_non_negative', 'points >= 0'],
  ['predictions', 'ck_predictions_status', "status IN ('pending', 'scored', 'void')"],
  ['sync_runs', 'ck_sync_runs_status', "status IN ('success', 'partial', 'failed', 'skipped')"]
];

module.exports = {
  async up(queryInterface) {
    for (const [table, name, expression] of constraints) {
      await queryInterface.sequelize.query(`ALTER TABLE ${table} ADD CONSTRAINT ${name} CHECK (${expression});`);
    }
  },

  async down(queryInterface) {
    for (const [table, name] of [...constraints].reverse()) {
      await queryInterface.sequelize.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${name};`);
    }
  }
};
