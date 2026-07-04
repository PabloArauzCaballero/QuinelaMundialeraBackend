'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('teams', [
      { name: 'Argentina', fifa_code: 'ARG', short_name: 'Argentina', flag_url: null, created_at: now, updated_at: now },
      { name: 'Brasil', fifa_code: 'BRA', short_name: 'Brasil', flag_url: null, created_at: now, updated_at: now },
      { name: 'Francia', fifa_code: 'FRA', short_name: 'Francia', flag_url: null, created_at: now, updated_at: now },
      { name: 'España', fifa_code: 'ESP', short_name: 'España', flag_url: null, created_at: now, updated_at: now }
    ], { ignoreDuplicates: true });

    await queryInterface.bulkInsert('stadiums', [
      { name: 'MetLife Stadium', city: 'East Rutherford', country: 'USA', latitude: 40.813500, longitude: -74.074500, created_at: now, updated_at: now },
      { name: 'Estadio Azteca', city: 'Ciudad de México', country: 'México', latitude: 19.302900, longitude: -99.150500, created_at: now, updated_at: now },
      { name: 'BMO Field', city: 'Toronto', country: 'Canadá', latitude: 43.633200, longitude: -79.418600, created_at: now, updated_at: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stadiums', null, {});
    await queryInterface.bulkDelete('teams', null, {});
  }
};
