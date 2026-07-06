'use strict';

module.exports = {
  async up() {
    // Intencionalmente vacío: equipos y sedes reales se importan desde TheSportsDB o se crean por endpoints admin.
    // No se cargan datos mock/demo en producción.
  },

  async down() {
    // Sin datos creados por este seeder.
  }
};
