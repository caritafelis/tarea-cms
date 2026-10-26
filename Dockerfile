# syntax=docker/dockerfile:1.7
ARG PHP_VERSION=8.5

# ---------- base: PHP-FPM + extensiones + CA de RDS ----------
FROM php:${PHP_VERSION}-fpm-alpine AS base
COPY --from=ghcr.io/mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/
RUN apk add --no-cache curl fcgi \
    && install-php-extensions pdo_mysql redis opcache pcntl bcmath intl zip gd exif \
    && curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /etc/ssl/certs/rds-global-bundle.pem \
    && rm -rf /tmp/* /var/cache/apk/*
COPY docker/php/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/zz-opcache.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/zz-www.conf
ENV PHP_FPM_MAX_CHILDREN=12 \
    PHP_FPM_START_SERVERS=3 \
    PHP_FPM_MIN_SPARE=2 \
    PHP_FPM_MAX_SPARE=5
WORKDIR /var/www/html

# ---------- vendor: dependencias PHP de produccion ----------
FROM base AS vendor
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1 COMPOSER_NO_INTERACTION=1
COPY composer.json composer.lock ./
RUN --mount=type=cache,target=/root/.composer/cache \
    composer install --no-dev --no-scripts --no-autoloader --prefer-dist
COPY . .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev \
    && APP_ENV=production APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
    DB_CONNECTION=sqlite DB_DATABASE=:memory: CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync \
    php artisan package:discover --ansi

# ---------- assets: build de Vite (wayfinder necesita php + vendor) ----------
FROM vendor AS assets
RUN apk add --no-cache nodejs npm
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
ENV APP_ENV=production APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
    DB_CONNECTION=sqlite DB_DATABASE=:memory: CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync
RUN npm run build

# ---------- app: imagen final (php-fpm, worker y scheduler) ----------
FROM base AS app
COPY --from=vendor --chown=www-data:www-data /var/www/html /var/www/html
COPY --from=assets --chown=www-data:www-data /var/www/html/public/build /var/www/html/public/build
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && rm -rf node_modules tests .git \
    && mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && ln -sfn ../storage/app/public public/storage \
    && chown -R www-data:www-data storage bootstrap/cache public/storage
USER www-data
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]

# ---------- web: nginx sin privilegios con los estaticos ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS web
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=app /var/www/html/public /var/www/html/public
EXPOSE 8080