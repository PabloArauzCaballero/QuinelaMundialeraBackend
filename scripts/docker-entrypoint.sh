#!/bin/sh
set -e

echo "Ejecutando migraciones de base de datos..."
./node_modules/.bin/sequelize-cli db:migrate

if [ "$RUN_DB_SEEDS" = "true" ]; then
  echo "Ejecutando semillas habilitadas explícitamente..."
  ./node_modules/.bin/sequelize-cli db:seed:all
else
  echo "RUN_DB_SEEDS no es true; no se ejecutan seeds automáticamente."
fi

echo "Iniciando servidor backend..."
exec "$@"
