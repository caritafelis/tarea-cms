#!/bin/sh
set -eu
cd /var/www/html
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs

if [ "${APP_ENV:-production}" = "production" ]; then
  php artisan config:cache --no-interaction
  php artisan event:cache --no-interaction
  php artisan view:cache --no-interaction
  php artisan route:cache --no-interaction || echo "route:cache omitido (hay rutas con closures)"
  php artisan lighthouse:cache --no-interaction || echo "lighthouse:cache omitido"
fi

exec "$@"