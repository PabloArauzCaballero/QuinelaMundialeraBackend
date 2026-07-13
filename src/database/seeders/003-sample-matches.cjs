'use strict';

/**
 * Seeder de partidos del Mundial 2026 con datos REALES verificados (al 12-jul-2026).
 *
 * Fuente de verdad: resultados oficiales del torneo (Yahoo Sports / FIFA).
 * Hasta el 12-jul: fase de grupos, Round of 32, Round of 16 y Cuartos ya jugados.
 * Semifinales, 3er puesto y Final son FUTUROS (marcadores null).
 *
 * external_id: convención estable `wc2026-<YYYYMMDD>-<HOMEFIFA>-<AWAYFIFA>`.
 * Esto permite que el sync incremental (syncOnBoot / syncToday) reconozca los
 * partidos por externalId sin duplicar, y respete la regla de no re-pedir los
 * ya consolidados. El estado `finished` no cambia nunca.
 *
 * Nota: TheSportsDB en plan gratuito no expone de forma fiable los IDs reales
 * del Mundial 2026, por lo que se usa esta clave estable en lugar de los
 * idEvent inventados de versiones previas (que causaban duplicados al sincronizar).
 */

module.exports = {

  async up(queryInterface, Sequelize) {
    const teams = await queryInterface.sequelize.query('SELECT id, fifa_code FROM teams', { type: Sequelize.QueryTypes.SELECT });
    const stadiums = await queryInterface.sequelize.query('SELECT id, name FROM stadiums', { type: Sequelize.QueryTypes.SELECT });

    const byFifa = Object.fromEntries(teams.map((t) => [t.fifa_code, t.id]));
    const byName = Object.fromEntries(stadiums.map((s) => [s.name.toLowerCase().trim(), s.id]));

    const now = new Date();

    // [externalId, homeFifa, awayFifa, venueName, phase, status, startsAt, homeScore, awayScore]
    const raw = [
      // ── Grupo A ──────────────────────────────────────────────
      ['wc2026-20260611-MEX-RSA', 'MEX', 'RSA', 'estadio azteca', 'group', 'finished', '2026-06-11T19:00:00Z', 2, 0],
      ['wc2026-20260611-KOR-CZE', 'KOR', 'CZE', 'estadio akron', 'group', 'finished', '2026-06-12T02:00:00Z', 2, 1],
      ['wc2026-20260618-CZE-RSA', 'CZE', 'RSA', 'estadio bbva', 'group', 'finished', '2026-06-18T16:00:00Z', 1, 1],
      ['wc2026-20260618-MEX-KOR', 'MEX', 'KOR', 'estadio akron', 'group', 'finished', '2026-06-19T01:00:00Z', 1, 0],
      ['wc2026-20260624-RSA-KOR', 'RSA', 'KOR', 'estadio bbva', 'group', 'finished', '2026-06-25T01:00:00Z', 1, 0],
      ['wc2026-20260624-MEX-CZE', 'MEX', 'CZE', 'estadio azteca', 'group', 'finished', '2026-06-25T03:00:00Z', 3, 0],
      // ── Grupo B ──────────────────────────────────────────────
      ['wc2026-20260612-CAN-BIH', 'CAN', 'BIH', 'bmo field', 'group', 'finished', '2026-06-12T19:00:00Z', 1, 1],
      ['wc2026-20260613-QAT-SUI', 'QAT', 'SUI', 'levi\'s stadium', 'group', 'finished', '2026-06-13T19:00:00Z', 1, 1],
      ['wc2026-20260618-CAN-QAT', 'CAN', 'QAT', 'bc place', 'group', 'finished', '2026-06-18T22:00:00Z', 6, 0],
      ['wc2026-20260618-SUI-BIH', 'SUI', 'BIH', 'sofi stadium', 'group', 'finished', '2026-06-19T03:00:00Z', 4, 1],
      ['wc2026-20260624-SUI-CAN', 'SUI', 'CAN', 'bc place', 'group', 'finished', '2026-06-24T19:00:00Z', 2, 1],
      ['wc2026-20260624-QAT-BIH', 'QAT', 'BIH', 'lumen field', 'group', 'finished', '2026-06-24T22:00:00Z', 3, 1],
      // ── Grupo C ──────────────────────────────────────────────
      ['wc2026-20260613-BRA-MAR', 'BRA', 'MAR', 'metlife stadium', 'group', 'finished', '2026-06-13T22:00:00Z', 1, 1],
      ['wc2026-20260613-SCO-HAI', 'SCO', 'HAI', 'gillette stadium', 'group', 'finished', '2026-06-14T01:00:00Z', 1, 1],
      ['wc2026-20260619-MAR-SCO', 'MAR', 'SCO', 'gillette stadium', 'group', 'finished', '2026-06-19T22:00:00Z', 1, 1],
      ['wc2026-20260619-BRA-HAI', 'BRA', 'HAI', 'lincoln financial field', 'group', 'finished', '2026-06-20T00:30:00Z', 3, 0],
      ['wc2026-20260624-BRA-SCO', 'BRA', 'SCO', 'hard rock stadium', 'group', 'finished', '2026-06-24T22:00:00Z', 3, 0],
      ['wc2026-20260624-MAR-HAI', 'MAR', 'HAI', 'mercedes-benz stadium', 'group', 'finished', '2026-06-25T00:00:00Z', 4, 2],
      // ── Grupo D ──────────────────────────────────────────────
      ['wc2026-20260612-USA-PAR', 'USA', 'PAR', 'sofi stadium', 'group', 'finished', '2026-06-12T01:00:00Z', 4, 1],
      ['wc2026-20260614-AUS-TUR', 'AUS', 'TUR', 'bc place', 'group', 'finished', '2026-06-14T17:00:00Z', 2, 0],
      ['wc2026-20260619-USA-AUS', 'USA', 'AUS', 'lumen field', 'group', 'finished', '2026-06-19T19:00:00Z', 2, 0],
      ['wc2026-20260620-PAR-TUR', 'PAR', 'TUR', 'levi\'s stadium', 'group', 'finished', '2026-06-20T03:00:00Z', 1, 0],
      ['wc2026-20260625-TUR-USA', 'TUR', 'USA', 'sofi stadium', 'group', 'finished', '2026-06-25T02:00:00Z', 3, 2],
      ['wc2026-20260625-PAR-AUS', 'PAR', 'AUS', 'levi\'s stadium', 'group', 'finished', '2026-06-26T02:00:00Z', 0, 0],
      // ── Grupo E ──────────────────────────────────────────────
      ['wc2026-20260614-GER-CUW', 'GER', 'CUW', 'nrg stadium', 'group', 'finished', '2026-06-14T17:00:00Z', 7, 1],
      ['wc2026-20260614-CIV-ECU', 'CIV', 'ECU', 'lincoln financial field', 'group', 'finished', '2026-06-14T23:00:00Z', 1, 0],
      ['wc2026-20260620-GER-CIV', 'GER', 'CIV', 'bmo field', 'group', 'finished', '2026-06-20T20:00:00Z', 2, 1],
      ['wc2026-20260620-ECU-CUW', 'ECU', 'CUW', 'geha field at arrowhead stadium', 'group', 'finished', '2026-06-21T00:00:00Z', 0, 0],
      ['wc2026-20260625-CUW-CIV', 'CUW', 'CIV', 'lincoln financial field', 'group', 'finished', '2026-06-25T20:00:00Z', 0, 2],
      ['wc2026-20260625-ECU-GER', 'ECU', 'GER', 'metlife stadium', 'group', 'finished', '2026-06-25T20:00:00Z', 2, 1],
      // ── Grupo F ──────────────────────────────────────────────
      ['wc2026-20260614-NED-JPN', 'NED', 'JPN', 'at&t stadium', 'group', 'finished', '2026-06-14T21:00:00Z', 2, 2],
      ['wc2026-20260614-SWE-TUN', 'SWE', 'TUN', 'estadio bbva', 'group', 'finished', '2026-06-15T04:00:00Z', 5, 1],
      ['wc2026-20260620-NED-SWE', 'NED', 'SWE', 'nrg stadium', 'group', 'finished', '2026-06-20T23:00:00Z', 5, 1],
      ['wc2026-20260621-JPN-TUN', 'JPN', 'TUN', 'estadio bbva', 'group', 'finished', '2026-06-21T04:00:00Z', 4, 0],
      ['wc2026-20260625-JPN-SWE', 'JPN', 'SWE', 'at&t stadium', 'group', 'finished', '2026-06-25T21:00:00Z', 1, 1],
      ['wc2026-20260625-NED-TUN', 'NED', 'TUN', 'geha field at arrowhead stadium', 'group', 'finished', '2026-06-26T01:00:00Z', 3, 1],
      // ── Grupo G ──────────────────────────────────────────────
      ['wc2026-20260615-BEL-EGY', 'BEL', 'EGY', 'lumen field', 'group', 'finished', '2026-06-15T22:00:00Z', 1, 1],
      ['wc2026-20260615-IRN-NZL', 'IRN', 'NZL', 'sofi stadium', 'group', 'finished', '2026-06-16T01:00:00Z', 2, 2],
      ['wc2026-20260621-BEL-IRN', 'BEL', 'IRN', 'sofi stadium', 'group', 'finished', '2026-06-21T19:00:00Z', 0, 0],
      ['wc2026-20260621-EGY-NZL', 'EGY', 'NZL', 'bc place', 'group', 'finished', '2026-06-22T01:00:00Z', 3, 1],
      ['wc2026-20260626-EGY-IRN', 'EGY', 'IRN', 'lumen field', 'group', 'finished', '2026-06-26T03:00:00Z', 1, 1],
      ['wc2026-20260626-BEL-NZL', 'BEL', 'NZL', 'bc place', 'group', 'finished', '2026-06-27T03:00:00Z', 5, 1],
      // ── Grupo H ──────────────────────────────────────────────
      ['wc2026-20260615-ESP-CPV', 'ESP', 'CPV', 'mercedes-benz stadium', 'group', 'finished', '2026-06-15T16:00:00Z', 0, 0],
      ['wc2026-20260615-KSA-URU', 'KSA', 'URU', 'hard rock stadium', 'group', 'finished', '2026-06-15T22:00:00Z', 1, 1],
      ['wc2026-20260621-ESP-KSA', 'ESP', 'KSA', 'mercedes-benz stadium', 'group', 'finished', '2026-06-21T16:00:00Z', 4, 0],
      ['wc2026-20260621-URU-CPV', 'URU', 'CPV', 'hard rock stadium', 'group', 'finished', '2026-06-22T03:00:00Z', 1, 1],
      ['wc2026-20260626-CPV-KSA', 'CPV', 'KSA', 'nrg stadium', 'group', 'finished', '2026-06-26T19:00:00Z', 0, 0],
      ['wc2026-20260626-ESP-URU', 'ESP', 'URU', 'estadio akron', 'group', 'finished', '2026-06-27T03:00:00Z', 1, 0],
      // ── Grupo I ──────────────────────────────────────────────
      ['wc2026-20260616-FRA-SEN', 'FRA', 'SEN', 'metlife stadium', 'group', 'finished', '2026-06-16T19:00:00Z', 3, 1],
      ['wc2026-20260616-NOR-IRQ', 'NOR', 'IRQ', 'gillette stadium', 'group', 'finished', '2026-06-16T22:00:00Z', 4, 1],
      ['wc2026-20260622-FRA-IRQ', 'FRA', 'IRQ', 'lincoln financial field', 'group', 'finished', '2026-06-22T21:00:00Z', 3, 0],
      ['wc2026-20260622-NOR-SEN', 'NOR', 'SEN', 'metlife stadium', 'group', 'finished', '2026-06-23T00:00:00Z', 3, 2],
      ['wc2026-20260626-FRA-NOR', 'FRA', 'NOR', 'gillette stadium', 'group', 'finished', '2026-06-26T19:00:00Z', 4, 1],
      ['wc2026-20260626-SEN-IRQ', 'SEN', 'IRQ', 'bmo field', 'group', 'finished', '2026-06-27T00:00:00Z', 5, 0],
      // ── Grupo J ──────────────────────────────────────────────
      ['wc2026-20260616-ARG-ALG', 'ARG', 'ALG', 'geha field at arrowhead stadium', 'group', 'finished', '2026-06-17T01:00:00Z', 3, 0],
      ['wc2026-20260616-AUT-JOR', 'AUT', 'JOR', 'levi\'s stadium', 'group', 'finished', '2026-06-17T04:00:00Z', 3, 1],
      ['wc2026-20260622-ARG-AUT', 'ARG', 'AUT', 'at&t stadium', 'group', 'finished', '2026-06-22T17:00:00Z', 2, 0],
      ['wc2026-20260622-ALG-JOR', 'ALG', 'JOR', 'levi\'s stadium', 'group', 'finished', '2026-06-23T03:00:00Z', 2, 1],
      ['wc2026-20260627-ALG-AUT', 'ALG', 'AUT', 'geha field at arrowhead stadium', 'group', 'finished', '2026-06-28T02:00:00Z', 3, 3],
      ['wc2026-20260627-ARG-JOR', 'ARG', 'JOR', 'at&t stadium', 'group', 'finished', '2026-06-28T02:00:00Z', 3, 1],
      // ── Grupo K ──────────────────────────────────────────────
      ['wc2026-20260617-POR-COD', 'POR', 'COD', 'nrg stadium', 'group', 'finished', '2026-06-17T20:00:00Z', 1, 1],
      ['wc2026-20260617-COL-UZB', 'COL', 'UZB', 'estadio azteca', 'group', 'finished', '2026-06-18T02:00:00Z', 3, 1],
      ['wc2026-20260623-POR-UZB', 'POR', 'UZB', 'nrg stadium', 'group', 'finished', '2026-06-23T17:00:00Z', 5, 0],
      ['wc2026-20260623-COL-COD', 'COL', 'COD', 'estadio akron', 'group', 'finished', '2026-06-24T01:00:00Z', 1, 0],
      ['wc2026-20260627-COL-POR', 'COL', 'POR', 'hard rock stadium', 'group', 'finished', '2026-06-27T16:00:00Z', 0, 0],
      ['wc2026-20260627-COD-UZB', 'COD', 'UZB', 'mercedes-benz stadium', 'group', 'finished', '2026-06-28T00:00:00Z', 3, 1],
      // ── Grupo L ──────────────────────────────────────────────
      ['wc2026-20260617-ENG-CRO', 'ENG', 'CRO', 'at&t stadium', 'group', 'finished', '2026-06-17T20:00:00Z', 4, 2],
      ['wc2026-20260617-GHA-PAN', 'GHA', 'PAN', 'bmo field', 'group', 'finished', '2026-06-18T04:00:00Z', 1, 0],
      ['wc2026-20260623-ENG-GHA', 'ENG', 'GHA', 'gillette stadium', 'group', 'finished', '2026-06-23T20:00:00Z', 0, 0],
      ['wc2026-20260623-PAN-CRO', 'PAN', 'CRO', 'bmo field', 'group', 'finished', '2026-06-24T01:00:00Z', 0, 1],
      ['wc2026-20260627-ENG-PAN', 'ENG', 'PAN', 'metlife stadium', 'group', 'finished', '2026-06-27T19:00:00Z', 2, 1],
      ['wc2026-20260627-CRO-GHA', 'CRO', 'GHA', 'lincoln financial field', 'group', 'finished', '2026-06-28T01:00:00Z', 2, 1],
      // ── Round of 32 ──────────────────────────────────────────
      ['wc2026-20260628-RSA-CAN', 'RSA', 'CAN', 'sofi stadium', 'round_32', 'finished', '2026-06-28T19:00:00Z', 0, 1],
      ['wc2026-20260629-BRA-JPN', 'BRA', 'JPN', 'nrg stadium', 'round_32', 'finished', '2026-06-29T17:00:00Z', 2, 1],
      ['wc2026-20260629-PAR-GER', 'PAR', 'GER', 'gillette stadium', 'round_32', 'finished', '2026-06-29T20:30:00Z', 1, 1],
      ['wc2026-20260629-MAR-NED', 'MAR', 'NED', 'estadio bbva', 'round_32', 'finished', '2026-06-30T01:00:00Z', 1, 1],
      ['wc2026-20260630-NOR-CIV', 'NOR', 'CIV', 'at&t stadium', 'round_32', 'finished', '2026-06-30T17:00:00Z', 2, 1],
      ['wc2026-20260630-FRA-SWE', 'FRA', 'SWE', 'metlife stadium', 'round_32', 'finished', '2026-06-30T21:00:00Z', 3, 0],
      ['wc2026-20260701-MEX-ECU', 'MEX', 'ECU', 'estadio azteca', 'round_32', 'finished', '2026-07-01T01:00:00Z', 2, 0],
      ['wc2026-20260701-ENG-COD', 'ENG', 'COD', 'mercedes-benz stadium', 'round_32', 'finished', '2026-07-01T16:00:00Z', 2, 1],
      ['wc2026-20260701-BEL-SEN', 'BEL', 'SEN', 'lumen field', 'round_32', 'finished', '2026-07-01T20:00:00Z', 3, 2],
      ['wc2026-20260702-USA-BIH', 'USA', 'BIH', 'levi\'s stadium', 'round_32', 'finished', '2026-07-02T00:00:00Z', 2, 0],
      ['wc2026-20260702-ESP-AUT', 'ESP', 'AUT', 'sofi stadium', 'round_32', 'finished', '2026-07-02T19:00:00Z', 3, 0],
      ['wc2026-20260702-POR-CRO', 'POR', 'CRO', 'bmo field', 'round_32', 'finished', '2026-07-02T23:00:00Z', 2, 1],
      ['wc2026-20260703-AUS-EGY', 'AUS', 'EGY', 'at&t stadium', 'round_32', 'finished', '2026-07-03T18:00:00Z', 1, 1],
      ['wc2026-20260703-ARG-CPV', 'ARG', 'CPV', 'hard rock stadium', 'round_32', 'finished', '2026-07-03T22:00:00Z', 3, 2],
      ['wc2026-20260703-SUI-ALG', 'SUI', 'ALG', 'bc place', 'round_32', 'finished', '2026-07-04T03:00:00Z', 2, 0],
      ['wc2026-20260704-COL-GHA', 'COL', 'GHA', 'geha field at arrowhead stadium', 'round_32', 'finished', '2026-07-04T01:30:00Z', 1, 0],
      // ── Round of 16 ──────────────────────────────────────────
      ['wc2026-20260704-CAN-MAR', 'CAN', 'MAR', 'nrg stadium', 'round_16', 'finished', '2026-07-04T17:00:00Z', 0, 3],
      ['wc2026-20260704-FRA-PAR', 'FRA', 'PAR', 'lincoln financial field', 'round_16', 'finished', '2026-07-04T21:00:00Z', 1, 0],
      ['wc2026-20260705-BRA-NOR', 'BRA', 'NOR', 'metlife stadium', 'round_16', 'finished', '2026-07-05T20:00:00Z', 1, 2],
      ['wc2026-20260705-ENG-MEX', 'ENG', 'MEX', 'estadio banorte', 'round_16', 'finished', '2026-07-06T02:00:00Z', 3, 2],
      ['wc2026-20260706-ESP-POR', 'ESP', 'POR', 'at&t stadium', 'round_16', 'finished', '2026-07-06T19:00:00Z', 1, 0],
      ['wc2026-20260706-USA-BEL', 'USA', 'BEL', 'lumen field', 'round_16', 'finished', '2026-07-07T00:00:00Z', 1, 4],
      ['wc2026-20260707-ARG-EGY', 'ARG', 'EGY', 'mercedes-benz stadium', 'round_16', 'finished', '2026-07-07T16:00:00Z', 3, 2],
      ['wc2026-20260707-SUI-COL', 'SUI', 'COL', 'bc place', 'round_16', 'finished', '2026-07-07T20:00:00Z', 0, 0],
      // ── Quarterfinals ────────────────────────────────────────
      ['wc2026-20260709-FRA-MAR', 'FRA', 'MAR', 'gillette stadium', 'quarter_final', 'finished', '2026-07-09T20:00:00Z', 2, 0],
      ['wc2026-20260710-ESP-BEL', 'ESP', 'BEL', 'sofi stadium', 'quarter_final', 'finished', '2026-07-10T20:00:00Z', 2, 1],
      // ── Semifinals (FUTUROS) ─────────────────────────────────
      ['wc2026-20260714-ESP-FRA', 'ESP', 'FRA', 'at&t stadium', 'semi_final', 'scheduled', '2026-07-14T15:00:00Z', null, null],
      ['wc2026-20260715-ENG-ARG', 'ENG', 'ARG', 'mercedes-benz stadium', 'semi_final', 'scheduled', '2026-07-15T15:00:00Z', null, null],
      // ── Third place (FUTURO) ─────────────────────────────────
      ['wc2026-20260718-MAR-FRA-ESP-ENG', 'MAR', 'FRA', 'hard rock stadium', 'third_place', 'scheduled', '2026-07-18T17:00:00Z', null, null],
      // ── Final (FUTURO) ──────────────────────────────────────
      ['wc2026-20260719-FRA-ESP-ENG-ARG', 'FRA', 'ENG', 'metlife stadium', 'final', 'scheduled', '2026-07-19T15:00:00Z', null, null]
    ];

    const insertRows = raw
      .filter((r) => byFifa[r[1]] && byFifa[r[2]])
      .map((r) => ({
        external_id: r[0],
        home_team_id: byFifa[r[1]],
        away_team_id: byFifa[r[2]],
        stadium_id: byName[r[3].toLowerCase().trim()] || null,
        phase: r[4],
        status: r[5],
        starts_at: r[6],
        home_score: r[7],
        away_score: r[8],
        last_synced_at: null,
        created_at: now,
        updated_at: now
      }));

    if (insertRows.length > 0) {
      await queryInterface.bulkInsert('matches', insertRows, { ignoreDuplicates: true });
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('matches', null, {});
  }
};
