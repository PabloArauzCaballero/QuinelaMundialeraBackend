'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ── Equipos (47 selecciones) ───────────────────────────────────────────
    await queryInterface.bulkInsert('teams', [
      { name: "Algeria", fifa_code: "ALG", short_name: "Algeria", flag_url: null, created_at: now, updated_at: now },
      { name: "Argentina", fifa_code: "ARG", short_name: "Argentina", flag_url: null, created_at: now, updated_at: now },
      { name: "Australia", fifa_code: "AUS", short_name: "Australia", flag_url: null, created_at: now, updated_at: now },
      { name: "Austria", fifa_code: "AUT", short_name: "Austria", flag_url: null, created_at: now, updated_at: now },
      { name: "Belgium", fifa_code: "BEL", short_name: "Belgium", flag_url: null, created_at: now, updated_at: now },
      { name: "Bosnia-Herzegovina", fifa_code: "BIH", short_name: "Bosnia-Herzegovina", flag_url: null, created_at: now, updated_at: now },
      { name: "Brazil", fifa_code: "BRA", short_name: "Brazil", flag_url: null, created_at: now, updated_at: now },
      { name: "Canada", fifa_code: "CAN", short_name: "Canada", flag_url: null, created_at: now, updated_at: now },
      { name: "Cape Verde", fifa_code: "CPV", short_name: "Cape Verde", flag_url: null, created_at: now, updated_at: now },
      { name: "Colombia", fifa_code: "COL", short_name: "Colombia", flag_url: null, created_at: now, updated_at: now },
      { name: "Croatia", fifa_code: "CRO", short_name: "Croatia", flag_url: null, created_at: now, updated_at: now },
      { name: "Curaçao", fifa_code: "CUW", short_name: "Curaçao", flag_url: null, created_at: now, updated_at: now },
      { name: "Czech Republic", fifa_code: "CZE", short_name: "Czech Republic", flag_url: null, created_at: now, updated_at: now },
      { name: "DR Congo", fifa_code: "COD", short_name: "DR Congo", flag_url: null, created_at: now, updated_at: now },
      { name: "Ecuador", fifa_code: "ECU", short_name: "Ecuador", flag_url: null, created_at: now, updated_at: now },
      { name: "Egypt", fifa_code: "EGY", short_name: "Egypt", flag_url: null, created_at: now, updated_at: now },
      { name: "England", fifa_code: "ENG", short_name: "England", flag_url: null, created_at: now, updated_at: now },
      { name: "France", fifa_code: "FRA", short_name: "France", flag_url: null, created_at: now, updated_at: now },
      { name: "Germany", fifa_code: "GER", short_name: "Germany", flag_url: null, created_at: now, updated_at: now },
      { name: "Ghana", fifa_code: "GHA", short_name: "Ghana", flag_url: null, created_at: now, updated_at: now },
      { name: "Haiti", fifa_code: "HAI", short_name: "Haiti", flag_url: null, created_at: now, updated_at: now },
      { name: "Iran", fifa_code: "IRN", short_name: "Iran", flag_url: null, created_at: now, updated_at: now },
      { name: "Iraq", fifa_code: "IRQ", short_name: "Iraq", flag_url: null, created_at: now, updated_at: now },
      { name: "Ivory Coast", fifa_code: "CIV", short_name: "Ivory Coast", flag_url: null, created_at: now, updated_at: now },
      { name: "Japan", fifa_code: "JPN", short_name: "Japan", flag_url: null, created_at: now, updated_at: now },
      { name: "Jordan", fifa_code: "JOR", short_name: "Jordan", flag_url: null, created_at: now, updated_at: now },
      { name: "Mexico", fifa_code: "MEX", short_name: "Mexico", flag_url: null, created_at: now, updated_at: now },
      { name: "Morocco", fifa_code: "MAR", short_name: "Morocco", flag_url: null, created_at: now, updated_at: now },
      { name: "Netherlands", fifa_code: "NED", short_name: "Netherlands", flag_url: null, created_at: now, updated_at: now },
      { name: "New Zealand", fifa_code: "NZL", short_name: "New Zealand", flag_url: null, created_at: now, updated_at: now },
      { name: "Norway", fifa_code: "NOR", short_name: "Norway", flag_url: null, created_at: now, updated_at: now },
      { name: "Paraguay", fifa_code: "PAR", short_name: "Paraguay", flag_url: null, created_at: now, updated_at: now },
      { name: "Portugal", fifa_code: "POR", short_name: "Portugal", flag_url: null, created_at: now, updated_at: now },
      { name: "Qatar", fifa_code: "QAT", short_name: "Qatar", flag_url: null, created_at: now, updated_at: now },
      { name: "Saudi Arabia", fifa_code: "KSA", short_name: "Saudi Arabia", flag_url: null, created_at: now, updated_at: now },
      { name: "Scotland", fifa_code: "SCO", short_name: "Scotland", flag_url: null, created_at: now, updated_at: now },
      { name: "Senegal", fifa_code: "SEN", short_name: "Senegal", flag_url: null, created_at: now, updated_at: now },
      { name: "South Africa", fifa_code: "RSA", short_name: "South Africa", flag_url: null, created_at: now, updated_at: now },
      { name: "South Korea", fifa_code: "KOR", short_name: "South Korea", flag_url: null, created_at: now, updated_at: now },
      { name: "Spain", fifa_code: "ESP", short_name: "Spain", flag_url: null, created_at: now, updated_at: now },
      { name: "Sweden", fifa_code: "SWE", short_name: "Sweden", flag_url: null, created_at: now, updated_at: now },
      { name: "Switzerland", fifa_code: "SUI", short_name: "Switzerland", flag_url: null, created_at: now, updated_at: now },
      { name: "Tunisia", fifa_code: "TUN", short_name: "Tunisia", flag_url: null, created_at: now, updated_at: now },
      { name: "Turkey", fifa_code: "TUR", short_name: "Turkey", flag_url: null, created_at: now, updated_at: now },
      { name: "USA", fifa_code: "USA", short_name: "USA", flag_url: null, created_at: now, updated_at: now },
      { name: "Uruguay", fifa_code: "URU", short_name: "Uruguay", flag_url: null, created_at: now, updated_at: now },
      { name: "Uzbekistan", fifa_code: "UZB", short_name: "Uzbekistan", flag_url: null, created_at: now, updated_at: now }
    ], { ignoreDuplicates: true });

    // ── Sedes (17) ──────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('stadiums', [
      { name: "Estadio Azteca", city: "Mexico City", country: "Mexico", latitude: 19.3029, longitude: -99.1505, created_at: now, updated_at: now },
      { name: "Estadio Banorte", city: "Mexico City", country: "Mexico", latitude: 19.3029, longitude: -99.1505, created_at: now, updated_at: now },
      { name: "Estadio Akron", city: "Zapopan", country: "Mexico", latitude: 20.6818, longitude: -103.4625, created_at: now, updated_at: now },
      { name: "Estadio BBVA", city: "Guadalupe", country: "Mexico", latitude: 25.6697, longitude: -100.2442, created_at: now, updated_at: now },
      { name: "Gillette Stadium", city: "Foxborough", country: "USA", latitude: 42.0909, longitude: -71.2643, created_at: now, updated_at: now },
      { name: "MetLife Stadium", city: "East Rutherford", country: "USA", latitude: 40.8135, longitude: -74.0745, created_at: now, updated_at: now },
      { name: "NRG Stadium", city: "Houston", country: "USA", latitude: 29.6847, longitude: -95.4107, created_at: now, updated_at: now },
      { name: "AT&T Stadium", city: "Arlington", country: "USA", latitude: 32.7473, longitude: -97.0947, created_at: now, updated_at: now },
      { name: "Mercedes-Benz Stadium", city: "Atlanta", country: "USA", latitude: 33.7555, longitude: -84.4017, created_at: now, updated_at: now },
      { name: "Lincoln Financial Field", city: "Philadelphia", country: "USA", latitude: 39.9008, longitude: -75.1675, created_at: now, updated_at: now },
      { name: "Levi's Stadium", city: "Santa Clara", country: "USA", latitude: 37.403, longitude: -121.97, created_at: now, updated_at: now },
      { name: "Lumen Field", city: "Seattle", country: "USA", latitude: 47.5952, longitude: -122.3316, created_at: now, updated_at: now },
      { name: "Hard Rock Stadium", city: "Miami Gardens", country: "USA", latitude: 25.958, longitude: -80.2389, created_at: now, updated_at: now },
      { name: "SoFi Stadium", city: "Inglewood", country: "USA", latitude: 33.9535, longitude: -118.3394, created_at: now, updated_at: now },
      { name: "GEHA Field at Arrowhead Stadium", city: "Kansas City", country: "USA", latitude: 39.0489, longitude: -94.4839, created_at: now, updated_at: now },
      { name: "BMO Field", city: "Toronto", country: "Canada", latitude: 43.6332, longitude: -79.4186, created_at: now, updated_at: now },
      { name: "BC Place", city: "Vancouver", country: "Canada", latitude: 49.2766, longitude: -123.112, created_at: now, updated_at: now }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stadiums', null, {});
    await queryInterface.bulkDelete('teams', null, {});
  }
};
