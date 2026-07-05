#!/bin/sh
set -e

echo "Ejecutando migraciones de base de datos..."
./node_modules/.bin/sequelize-cli db:migrate

echo "Ejecutando cargador de semillas (seeds)..."
./node_modules/.bin/sequelize-cli db:seed:all

echo "Iniciando servidor backend..."
exec "$@"
