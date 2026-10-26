# Arquitectura Docker --- Laravel 13 + React + Inertia + Wayfinder + JSON API + Lighthouse GraphQL
## 1. Objetivo

Esta arquitectura está pensada para una aplicación Laravel 13 que
funciona como:

-   Monolito Laravel + React + Inertia + Wayfinder.
-   API REST/JSON bajo `/api/v1`.
-   GraphQL mediante Lighthouse bajo `/graphql`.
-   PgSQL como base de datos.
-   Redis para cache, queues y rate limiting.
-   Workers Laravel independientes.
-   Scheduler Laravel independiente.
-   Nginx como servidor HTTP.
-   PHP-FPM como runtime Laravel.
-   Vite/Node separado para desarrollo y usado solamente durante el
    build en producción.
-   OPcache optimizado para producción.

El objetivo es que agregar API y GraphQL no implique ejecutar tres
aplicaciones Laravel diferentes ni duplicar conexiones, modelos o lógica
de negocio.

------------------------------------------------------------------------

# 2. Arquitectura general

``` text
                         CLOUDFLARE
                             │
                             ▼
                          NGINX
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
             Laravel       Laravel      Laravel
             Web/Inertia   JSON API     GraphQL
             /app/...      /api/v1/...  /graphql
                │            │            │
                └────────────┼────────────┘
                             │
                    PHP-FPM / OPcache
                             │
              ┌──────────────┴──────────────┐
              │                             │
           PgSQL                          Redis
              │                             │
              │                    ┌────────┴────────┐
              │                    │                 │
              ▼                    ▼                 ▼
           Queries              Cache             Queue
                                                workers
                                                   │
                                                   ▼
                                                Scheduler
```

La idea principal es:

``` text
Una sola aplicación Laravel
        │
        ├── Inertia + React + Wayfinder
        ├── JSON API
        └── Lighthouse GraphQL
```

No se crean tres aplicaciones Laravel.

------------------------------------------------------------------------

# 3. Estructura recomendada

``` text
project/
│
├── app/
├── bootstrap/
├── config/
├── database/
├── graphql/
│   └── schema.graphql
├── public/
├── resources/
│   ├── js/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── app.tsx
│   └── css/
├── routes/
│   ├── web.php
│   ├── api.php
│   └── console.php
│
├── storage/
├── tests/
├── vendor/
│
├── docker/
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   │
│   └── php/
│       ├── Dockerfile
│       ├── php.ini
│       └── opcache.ini
│
├── compose.yaml
├── compose.dev.yaml
├── Dockerfile
├── composer.json
├── package.json
├── vite.config.ts
└── .env
```

------------------------------------------------------------------------

# 4. Servicios Docker

La aplicación de producción queda separada en:

``` text
app
 └── PHP-FPM + Laravel

nginx
 └── HTTP server

worker
 └── Laravel Queue Worker

scheduler
 └── Laravel Scheduler

pgsql
 └── PgSQL

redis
 └── Redis
```

En desarrollo se añade:

``` text
vite
 └── Node + Vite dev server
```

No se recomienda mantener Node/Vite corriendo en producción.

------------------------------------------------------------------------

# 5. compose.yaml

``` yaml
services:

  app:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
      target: production

    restart: unless-stopped

    env_file:
      - .env

    environment:
      APP_ENV: ${APP_ENV:-production}
      APP_DEBUG: ${APP_DEBUG:-false}

      DB_CONNECTION: pgsql
      DB_HOST: pgsql
      DB_PORT: 3306

      REDIS_HOST: redis
      REDIS_PORT: 6379

      CACHE_STORE: redis
      QUEUE_CONNECTION: redis
      SESSION_DRIVER: redis

    volumes:
      - laravel_storage:/var/www/html/storage

    depends_on:
      pgsql:
        condition: service_healthy

      redis:
        condition: service_healthy

    networks:
      - app

  nginx:
    build:
      context: .
      dockerfile: docker/nginx/Dockerfile

    restart: unless-stopped

    ports:
      - "${APP_PORT:-8080}:80"

    volumes:
      - laravel_storage:/var/www/html/storage:ro

    depends_on:
      - app

    networks:
      - app

  worker:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
      target: production

    restart: unless-stopped

    env_file:
      - .env

    environment:
      APP_ENV: ${APP_ENV:-production}
      APP_DEBUG: ${APP_DEBUG:-false}

      DB_CONNECTION: pgsql
      DB_HOST: pgsql
      DB_PORT: 3306

      REDIS_HOST: redis
      REDIS_PORT: 6379

      CACHE_STORE: redis
      QUEUE_CONNECTION: redis

    command:
      - php
      - artisan
      - queue:work
      - redis
      - --sleep=1
      - --tries=3
      - --timeout=120
      - --max-time=3600
      - --max-jobs=1000

    volumes:
      - laravel_storage:/var/www/html/storage

    depends_on:
      pgsql:
        condition: service_healthy

      redis:
        condition: service_healthy

    networks:
      - app

  scheduler:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
      target: production

    restart: unless-stopped

    env_file:
      - .env

    environment:
      APP_ENV: ${APP_ENV:-production}
      APP_DEBUG: ${APP_DEBUG:-false}

      DB_CONNECTION: pgsql
      DB_HOST: pgsql
      DB_PORT: 3306

      REDIS_HOST: redis
      REDIS_PORT: 6379

      CACHE_STORE: redis
      QUEUE_CONNECTION: redis

    command:
      - php
      - artisan
      - schedule:work

    volumes:
      - laravel_storage:/var/www/html/storage

    depends_on:
      pgsql:
        condition: service_healthy

      redis:
        condition: service_healthy

    networks:
      - app

  pgsql:
    image: pgsql:8.4

    restart: unless-stopped

    environment:
      PGSQL_DATABASE: ${DB_DATABASE}
      PGSQL_USER: ${DB_USERNAME}
      PGSQL_PASSWORD: ${DB_PASSWORD}
      PGSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}

    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_0900_ai_ci
      - --skip-name-resolve
      - --max_connections=200
      - --innodb_buffer_pool_size=512M
      - --innodb_log_file_size=128M
      - --performance-schema=ON

    volumes:
      - pgsql_data:/var/lib/pgsql

    healthcheck:
      test:
        - CMD-SHELL
        - pgsqladmin ping -h 127.0.0.1 -u root -p$${PGSQL_ROOT_PASSWORD}

      interval: 5s
      timeout: 5s
      retries: 20

    networks:
      - app

  redis:
    image: redis:7-alpine

    restart: unless-stopped

    command:
      - redis-server
      - --appendonly
      - yes
      - --maxmemory-policy
      - allkeys-lru

    volumes:
      - redis_data:/data

    healthcheck:
      test:
        - CMD
        - redis-cli
        - ping

      interval: 5s
      timeout: 3s
      retries: 10

    networks:
      - app


volumes:

  pgsql_data:
    driver: local

  redis_data:
    driver: local

  laravel_storage:
    driver: local


networks:

  app:
    driver: bridge
```

------------------------------------------------------------------------

# 6. Por qué PgSQL no debe exponerse en producción

No se recomienda:

``` yaml
ports:
  - "3306:3306"
```

en producción.

Laravel puede acceder directamente mediante:

``` env
DB_HOST=pgsql
DB_PORT=3306
```

La comunicación es:

``` text
app
 │
 │ pgsql:3306
 ▼
pgsql
```

No:

``` text
Internet
   │
   ▼
3306
   │
   ▼
PgSQL
```

Para desarrollo, si necesitas TablePlus, DataGrip o PgSQL Workbench,
puedes usar:

``` yaml
ports:
  - "127.0.0.1:3306:3306"
```

en un Compose específico de desarrollo.

------------------------------------------------------------------------

# 7. Dockerfile de PHP

Archivo:

``` text
docker/php/Dockerfile
```

``` dockerfile
FROM php:8.5-fpm-alpine AS base

RUN apk add --no-cache \
    bash \
    curl \
    git \
    icu-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    libxml2-dev \
    linux-headers \
    $PHPIZE_DEPS

RUN docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        exif \
        gd \
        intl \
        mbstring \
        opcache \
        pcntl \
        pdo_pgsql \
        zip \
    && apk del \
        $PHPIZE_DEPS \
        linux-headers \
    && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/99-opcache.ini


FROM base AS dependencies

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts


FROM dependencies AS production

COPY . .

RUN composer dump-autoload \
    --no-dev \
    --classmap-authoritative \
    --optimize

RUN mkdir -p \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chmod -R ug+rwX \
        storage \
        bootstrap/cache

RUN php artisan package:discover --ansi

EXPOSE 9000

CMD ["php-fpm", "-F"]
```

------------------------------------------------------------------------

# 8. PHP configuration

Archivo:

``` text
docker/php/php.ini
```

``` ini
expose_php=Off

memory_limit=512M

max_execution_time=120
max_input_time=120

post_max_size=64M
upload_max_filesize=64M

max_file_uploads=50

realpath_cache_size=4096K
realpath_cache_ttl=600

output_buffering=4096

session.use_strict_mode=1
session.cookie_httponly=1
session.cookie_samesite=Lax

variables_order=GPCS
request_order=GP
```

------------------------------------------------------------------------

# 9. OPcache

Archivo:

``` text
docker/php/opcache.ini
```

``` ini
opcache.enable=1
opcache.enable_cli=1

opcache.memory_consumption=256
opcache.interned_strings_buffer=32
opcache.max_accelerated_files=40000

opcache.validate_timestamps=0
opcache.revalidate_freq=0

opcache.save_comments=1
opcache.fast_shutdown=1

opcache.jit=off
opcache.jit_buffer_size=0
```

En producción:

``` ini
opcache.validate_timestamps=0
```

Esto evita que PHP revise continuamente si los archivos cambiaron.

Después de un deployment:

``` bash
docker compose exec app php artisan optimize
docker compose restart app
```

------------------------------------------------------------------------

# 10. Nginx Dockerfile

Archivo:

``` text
docker/nginx/Dockerfile
```

``` dockerfile
FROM nginx:1.29-alpine

COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

------------------------------------------------------------------------

# 11. Nginx

Archivo:

``` text
docker/nginx/nginx.conf
```

``` nginx
server {
    listen 80;
    server_name _;

    root /var/www/html/public;
    index index.php;

    charset utf-8;

    client_max_body_size 64m;

    server_tokens off;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    keepalive_timeout 65;
    keepalive_requests 1000;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 1024;

    gzip_types
        text/plain
        text/css
        text/xml
        application/json
        application/javascript
        application/xml
        application/xml+rss
        image/svg+xml;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }

    location = /robots.txt {
        access_log off;
        log_not_found off;
    }

    location ~* \.(?:css|js|mjs|jpg|jpeg|png|gif|ico|svg|webp|avif|woff|woff2|ttf|otf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;

        try_files $uri =404;
    }

    location ~ \.php$ {
        try_files $uri =404;

        include fastcgi_params;

        fastcgi_pass app:9000;

        fastcgi_index index.php;

        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $document_root;

        fastcgi_param HTTP_PROXY "";

        fastcgi_connect_timeout 10s;
        fastcgi_send_timeout 120s;
        fastcgi_read_timeout 120s;

        fastcgi_buffering on;
        fastcgi_buffer_size 32k;
        fastcgi_buffers 16 16k;
        fastcgi_busy_buffers_size 64k;

        fastcgi_keep_conn on;
    }

    location ~ /\. {
        deny all;
    }

    location ~* /(composer\.(json|lock)|package(-lock)?\.json|\.env|artisan)$ {
        deny all;
    }
}
```

------------------------------------------------------------------------

# 12. Cómo funciona Nginx

Una petición:

``` text
GET /dashboard
```

sigue:

``` text
Browser
   ↓
Cloudflare
   ↓
Nginx
   ↓
PHP-FPM
   ↓
Laravel
   ↓
Inertia
   ↓
React
```

Una petición:

``` text
GET /api/v1/products
```

sigue:

``` text
Browser / Mobile / External App
   ↓
Cloudflare
   ↓
Nginx
   ↓
PHP-FPM
   ↓
Laravel API
   ↓
Eloquent
   ↓
PgSQL
```

Una petición:

``` text
POST /graphql
```

sigue:

``` text
Client
   ↓
Cloudflare
   ↓
Nginx
   ↓
PHP-FPM
   ↓
Lighthouse
   ↓
Eloquent
   ↓
PgSQL
```

------------------------------------------------------------------------

# 13. Laravel monolito + Inertia + React + Wayfinder

No se crea un servidor React independiente en producción.

La aplicación continúa funcionando como:

``` text
Laravel
 │
 ├── Inertia
 │
 ├── React
 │
 ├── Wayfinder
 │
 └── Vite
```

Vite solamente genera los assets:

``` text
resources/js
      ↓
npm run build
      ↓
public/build
```

Después Nginx sirve:

``` text
public/build/assets/*.js
public/build/assets/*.css
```

directamente.

No se debe hacer:

``` text
Browser
 ↓
Nginx
 ↓
PHP
 ↓
Vite
```

para cada asset.

------------------------------------------------------------------------

# 14. Vite en desarrollo

Archivo:

``` text
compose.dev.yaml
```

``` yaml
services:

  vite:
    image: node:22-alpine

    working_dir: /var/www/html

    ports:
      - "5173:5173"

    volumes:
      - ./:/var/www/html
      - node_modules:/var/www/html/node_modules

    command: >
      sh -c "
      npm install &&
      npm run dev -- --host 0.0.0.0
      "

    networks:
      - app


volumes:
  node_modules:


networks:
  app:
    external: true
```

Vite es solamente una dependencia de desarrollo.

En producción:

``` bash
npm run build
```

y se sirven los assets desde Nginx.

------------------------------------------------------------------------

# 15. API JSON

La API debe estar aislada bajo:

``` text
/api/v1
```

Ejemplo:

``` php
<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')
    ->middleware(['api'])
    ->group(function () {

        Route::get('/health', function () {
            return response()->json([
                'status' => 'ok',
            ]);
        });

        Route::middleware('auth:sanctum')->group(function () {

            Route::get('/user', function (\Illuminate\Http\Request $request) {
                return $request->user();
            });

        });

    });
```

La arquitectura queda:

``` text
/
/dashboard
/settings
...
```

para el monolito, y:

``` text
/api/v1/...
```

para la API.

Esto evita mezclar middleware web con API.

------------------------------------------------------------------------

# 16. Lighthouse GraphQL

Instalación:

``` bash
composer require nuwave/lighthouse
```

Publicación:

``` bash
php artisan vendor:publish --tag=lighthouse-config
php artisan vendor:publish --tag=lighthouse-schema
```

Endpoint:

``` text
/graphql
```

Ejemplo:

``` graphql
type Query {
    me: User
        @auth
}

type User {
    id: ID!
    name: String!
    email: String!
}
```

Consulta:

``` graphql
query {
    me {
        id
        name
        email
    }
}
```

------------------------------------------------------------------------

# 17. Configuración de Lighthouse

Archivo:

``` text
config/lighthouse.php
```

Configuración conceptual:

``` php
<?php

return [

    'route_name' => 'graphql',

    'route_enable_get' => false,

    'route' => [
        'prefix' => '',
        'middleware' => [
            \Nuwave\Lighthouse\Support\Http\Middleware\AcceptJson::class,
        ],
    ],

    'guard' => 'sanctum',

    'schema' => [
        'register' => base_path('graphql/schema.graphql'),
    ],

    'namespaces' => [
        'models' => 'App\\Models',
        'queries' => 'App\\GraphQL\\Queries',
        'mutations' => 'App\\GraphQL\\Mutations',
        'subscriptions' => 'App\\GraphQL\\Subscriptions',
        'interfaces' => 'App\\GraphQL\\Interfaces',
        'unions' => 'App\\GraphQL\\Unions',
        'scalars' => 'App\\GraphQL\\Scalars',
        'directives' => 'App\\GraphQL\\Directives',
    ],

    'security' => [
        'max_query_complexity' => 1000,
        'max_query_depth' => 12,
        'disable_introspection' => \GraphQL\Validator\Rules\DisableIntrospection::DISABLED,
    ],

    'pagination' => [
        'default_count' => 25,
        'max_count' => 100,
    ],

    'batched_queries' => false,

    'cache' => [
        'enable' => env('LIGHTHOUSE_CACHE_ENABLE', true),
        'key' => env('LIGHTHOUSE_CACHE_KEY', 'lighthouse-schema'),
    ],

];
```

Los límites de complejidad, profundidad y paginación son importantes
porque GraphQL permite que el cliente construya consultas mucho más
complejas que un endpoint REST tradicional.

------------------------------------------------------------------------

# 18. GraphQL y Sanctum

GraphQL puede utilizar:

``` text
sanctum
```

como guard.

Ejemplo:

``` graphql
type Query {
    me: User @auth
}
```

El mismo sistema de autenticación puede utilizarse para:

``` text
Inertia
API
GraphQL
```

según el flujo de autenticación requerido.

No se necesita otra base de usuarios.

------------------------------------------------------------------------

# 19. Una sola base de datos

No crear:

``` text
Inertia → DB #1
API     → DB #2
GraphQL → DB #3
```

La arquitectura correcta:

``` text
                   Laravel
                      │
          ┌───────────┼───────────┐
          │           │           │
       Inertia       API       GraphQL
          │           │           │
          └───────────┼───────────┘
                      │
                   Eloquent
                      │
                    PgSQL
```

Los tres pueden reutilizar:

-   Models.
-   Services.
-   Actions.
-   Policies.
-   Repositories si existen.
-   Events.
-   Jobs.
-   Resources.
-   Validaciones.
-   Permisos.

------------------------------------------------------------------------

# 20. Evitar duplicación de lógica

No:

``` text
UserController
    └── lógica

ApiUserController
    └── misma lógica

GraphQLUserResolver
    └── misma lógica
```

Preferible:

``` text
Inertia Controller ──────┐
                         │
API Controller ──────────┼──> Action / Service
                         │
GraphQL Resolver ────────┘
```

Estructura:

``` text
app/
├── Actions/
│   ├── Products/
│   │   ├── CreateProduct.php
│   │   ├── UpdateProduct.php
│   │   └── DeleteProduct.php
│   │
│   └── Invoices/
│
├── Http/
│   ├── Controllers/
│   └── Resources/
│
└── GraphQL/
    ├── Queries/
    └── Mutations/
```

Así una misma operación de negocio se reutiliza desde Inertia, API y
GraphQL.

------------------------------------------------------------------------

# 21. Redis

Redis se utiliza para tres funciones principales:

``` text
Redis
 │
 ├── Cache
 │
 ├── Queue
 │
 └── Rate Limiting
```

Variables:

``` env
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_HOST=redis
REDIS_PORT=6379
```

No es necesario tener un Redis diferente para Inertia, API y GraphQL.

------------------------------------------------------------------------

# 22. Cache

El cache debe considerar el tenant/team.

Incorrecto:

``` php
Cache::remember(
    'dashboard',
    60,
    fn () => ...
);
```

Puede provocar contaminación de datos entre organizaciones.

Correcto:

``` php
Cache::remember(
    "team:{$teamId}:dashboard",
    60,
    fn () => ...
);
```

O:

``` php
Cache::remember(
    "team:{$teamId}:user:{$userId}:dashboard",
    60,
    fn () => ...
);
```

La clave de cache debe contener el contexto necesario para garantizar
aislamiento.

------------------------------------------------------------------------

# 23. GraphQL y N+1

Uno de los problemas más importantes de GraphQL es N+1.

Ejemplo problemático:

``` text
100 posts
    ↓
100 authors
    ↓
100 queries adicionales
```

La aplicación puede terminar haciendo:

``` text
1 query posts
+
100 queries users
=
101 queries
```

La solución es usar eager loading y las capacidades de resolución de
Lighthouse.

Ejemplo:

``` graphql
type Post {
    id: ID!
    title: String!
    author: User @belongsTo
}

type Query {
    posts: [Post!]! @paginate
}
```

También conviene detectar lazy loading durante desarrollo:

``` php
if (! app()->isProduction()) {
    Model::preventLazyLoading();
}
```

Esto ayuda a detectar relaciones que están provocando consultas
adicionales.

------------------------------------------------------------------------

# 24. Paginación

Nunca permitir:

``` text
/graphql
   ↓
all users
```

sin límite.

Utilizar:

``` graphql
@paginate
```

con límites.

Configuración conceptual:

``` php
'pagination' => [
    'default_count' => 25,
    'max_count' => 100,
],
```

Así el cliente no puede solicitar millones de registros en una sola
consulta.

------------------------------------------------------------------------

# 25. Complejidad GraphQL

Utilizar límites:

``` text
max depth:       12
max complexity:  1000
max pagination:  100
```

La idea es impedir consultas como:

``` graphql
query {
    users {
        teams {
            users {
                teams {
                    users {
                        teams {
                            users {
                                ...
                            }
                        }
                    }
                }
            }
        }
    }
}
```

La seguridad de GraphQL no debe depender únicamente del servidor con más
CPU.

------------------------------------------------------------------------

# 26. Cache de schema GraphQL

Es recomendable cachear el schema.

``` env
LIGHTHOUSE_CACHE_ENABLE=true
```

Pero no conviene cachear automáticamente todos los resultados GraphQL.

La información depende de:

-   usuario;
-   team;
-   permisos;
-   tenant;
-   filtros;
-   estado de la aplicación.

El cache de datos debe ser selectivo.

Ejemplo:

``` php
Cache::remember(
    "team:{$teamId}:dashboard",
    now()->addSeconds(30),
    fn () => ...
);
```

------------------------------------------------------------------------

# 27. Rate limiting

API:

``` php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(120)
        ->by(
            $request->user()?->id
            ?? $request->ip()
        );
});
```

GraphQL:

``` php
RateLimiter::for('graphql', function (Request $request) {
    return Limit::perMinute(60)
        ->by(
            $request->user()?->id
            ?? $request->ip()
        );
});
```

Las rutas pueden utilizar:

``` php
Route::middleware('throttle:api')
```

y:

``` php
Route::middleware('throttle:graphql')
```

Redis permite centralizar estos límites.

------------------------------------------------------------------------

# 28. Queue

No ejecutar operaciones pesadas dentro del request:

``` php
public function store()
{
    $this->generateHugeReport();

    $this->sendEmail();

    $this->syncExternalService();

    return redirect(...);
}
```

Preferir:

``` php
GenerateReport::dispatch($report);

SendReportEmail::dispatch($report);

SyncExternalService::dispatch($model);
```

Flujo:

``` text
HTTP
 │
 ▼
Laravel
 │
 ├── guarda DB
 │
 └── dispatch()
       │
       ▼
     Redis
       │
       ▼
    Worker
```

Esto mantiene bajo el tiempo de respuesta HTTP.

------------------------------------------------------------------------

# 29. Worker

Configuración:

``` yaml
worker:
  command:
    - php
    - artisan
    - queue:work
    - redis
    - --sleep=1
    - --tries=3
    - --timeout=120
    - --max-time=3600
    - --max-jobs=1000
```

Ventajas:

-   jobs independientes;
-   reinicios controlados;
-   memoria reciclada;
-   no bloquea PHP-FPM;
-   operaciones pesadas fuera del request.

------------------------------------------------------------------------

# 30. Scheduler

El scheduler se ejecuta en su propio contenedor:

``` text
scheduler
    │
    ▼
php artisan schedule:work
```

No se debe ejecutar dentro de Nginx.

Ejemplo:

``` php
Schedule::job(...)
    ->everyMinute();
```

El scheduler puede utilizar Redis y la misma base de datos.

------------------------------------------------------------------------

# 31. Por qué no usar Supervisor para todo

No se recomienda meter:

``` text
Supervisor
 ├── php-fpm
 ├── queue
 ├── scheduler
 └── node
```

en un único contenedor.

Es preferible:

``` text
app
  └── php-fpm

worker
  └── queue:work

scheduler
  └── schedule:work

nginx
  └── nginx

pgsql
  └── pgsql

redis
  └── redis
```

Ventajas:

-   reinicios independientes;
-   logs independientes;
-   escalado independiente;
-   menor acoplamiento;
-   diagnóstico más sencillo.

Por ejemplo:

``` bash
docker compose restart worker
```

no reinicia Laravel web.

------------------------------------------------------------------------

# 32. Escalado

La arquitectura permite escalar workers:

``` bash
docker compose up -d --scale worker=3
```

Queda:

``` text
Redis
  │
  ├── Worker 1
  ├── Worker 2
  └── Worker 3
```

Mientras:

``` text
app
  │
  └── PHP-FPM
```

continúa atendiendo HTTP.

Esto es especialmente útil para:

-   facturación;
-   generación de XML;
-   procesamiento de documentos;
-   emails;
-   sincronizaciones;
-   reportes;
-   importaciones;
-   tareas externas.

------------------------------------------------------------------------

# 33. Assets y rendimiento

Producción:

``` bash
npm run build
```

Resultado:

``` text
public/build/
```

Nginx sirve:

``` text
public/build/assets/*.js
public/build/assets/*.css
```

con:

``` nginx
expires 1y;
add_header Cache-Control "public, immutable";
```

Esto significa que los assets versionados de Vite no tienen que pasar
por PHP.

Flujo:

``` text
Browser
   ↓
Nginx
   ↓
public/build/assets/app-hash.js
```

No:

``` text
Browser
   ↓
Nginx
   ↓
PHP
   ↓
Laravel
   ↓
asset
```

------------------------------------------------------------------------

# 34. Una sola aplicación Laravel

No crear:

``` text
laravel-web
laravel-api
laravel-graphql
```

La estructura correcta es:

``` text
laravel
 │
 ├── /
 ├── /dashboard
 ├── /settings
 ├── /api/v1
 └── /graphql
```

Cada request entra por Laravel pero solamente ejecuta la parte
necesaria.

------------------------------------------------------------------------

# 35. Las tres superficies

## Monolito

``` text
/
/login
/dashboard
/settings
/{current_team}/...
```

Tecnología:

``` text
Laravel
Inertia
React
Wayfinder
```

## JSON API

``` text
/api/v1/users
/api/v1/products
/api/v1/invoices
/api/v1/teams
```

Tecnología:

``` text
Laravel
JSON
Sanctum
API Resources
```

## GraphQL

``` text
/graphql
```

Tecnología:

``` text
Laravel
Lighthouse
Eloquent
Sanctum
```

------------------------------------------------------------------------

# 36. Flujo completo

## Inertia

``` text
GET /dashboard
      ↓
Cloudflare
      ↓
Nginx
      ↓
PHP-FPM
      ↓
Laravel
      ↓
Inertia
      ↓
React
```

## API

``` text
GET /api/v1/products
      ↓
Cloudflare
      ↓
Nginx
      ↓
PHP-FPM
      ↓
Laravel API
      ↓
Eloquent
      ↓
PgSQL
```

## GraphQL

``` text
POST /graphql
      ↓
Cloudflare
      ↓
Nginx
      ↓
PHP-FPM
      ↓
Lighthouse
      ↓
Eloquent
      ↓
PgSQL
```

## Queue

``` text
Laravel
   ↓
Redis
   ↓
Worker
```

## Cache

``` text
Laravel
   ↓
Redis
```

## Assets

``` text
React/Vite
   ↓
npm run build
   ↓
public/build
   ↓
Nginx
```

------------------------------------------------------------------------

# 37. Deployment

Construir:

``` bash
docker compose build --pull
```

Levantar:

``` bash
docker compose up -d
```

Migraciones:

``` bash
docker compose exec app php artisan migrate --force
```

Optimización:

``` bash
docker compose exec app php artisan optimize
```

Reiniciar procesos:

``` bash
docker compose restart app worker scheduler
```

Ver estado:

``` bash
docker compose ps
```

Ver logs:

``` bash
docker compose logs -f app
```

Worker:

``` bash
docker compose logs -f worker
```

Nginx:

``` bash
docker compose logs -f nginx
```

Redis:

``` bash
docker compose logs -f redis
```

PgSQL:

``` bash
docker compose logs -f pgsql
```

------------------------------------------------------------------------

# 38. Desarrollo

Levantar infraestructura:

``` bash
docker compose up -d
```

Levantar Vite:

``` bash
docker compose -f compose.yaml -f compose.dev.yaml up -d
```

Ver contenedores:

``` bash
docker compose ps
```

Entrar a Laravel:

``` bash
docker compose exec app sh
```

Ejecutar Artisan:

``` bash
docker compose exec app php artisan
```

Migraciones:

``` bash
docker compose exec app php artisan migrate
```

Composer:

``` bash
docker compose exec app composer install
```

NPM:

``` bash
docker compose exec vite npm install
```

------------------------------------------------------------------------

# 39. Variables de entorno

Ejemplo:

``` env
APP_NAME="Application"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://example.com

APP_PORT=8080

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=pgsql
DB_PORT=3306
DB_DATABASE=application
DB_USERNAME=application
DB_PASSWORD=
DB_ROOT_PASSWORD=

CACHE_STORE=redis

SESSION_DRIVER=redis
SESSION_LIFETIME=120

QUEUE_CONNECTION=redis

REDIS_HOST=redis
REDIS_PORT=6379

LIGHTHOUSE_CACHE_ENABLE=true
LIGHTHOUSE_CACHE_KEY=lighthouse-schema
```

Nunca guardar secretos reales en el repositorio.

------------------------------------------------------------------------

# 40. Consideraciones de rendimiento

Docker no hace mágicamente rápidas las consultas.

La arquitectura evita costos estructurales innecesarios, pero el
rendimiento real depende también de:

-   índices SQL;
-   eager loading;
-   evitar N+1;
-   paginación;
-   cache selectivo;
-   Redis;
-   OPcache;
-   PHP-FPM;
-   queries optimizadas;
-   límites GraphQL;
-   jobs;
-   conexión de base de datos;
-   tamaño de respuestas;
-   serialización;
-   arquitectura de servicios.

------------------------------------------------------------------------

# 41. Reglas importantes para no afectar el servidor

## Regla 1

No crear tres Laravel:

``` text
NO:
web + api + graphql
```

Usar:

``` text
SÍ:
un Laravel
```

## Regla 2

No ejecutar trabajos pesados dentro del request.

Usar:

``` text
Queue + Redis
```

## Regla 3

No ejecutar Vite en producción.

Usar:

``` text
npm run build
```

## Regla 4

No exponer PgSQL a Internet.

## Regla 5

No permitir consultas GraphQL ilimitadas.

## Regla 6

No utilizar `all()` en endpoints grandes.

Usar:

``` text
paginate()
cursorPaginate()
```

## Regla 7

Evitar N+1.

Usar:

``` text
with()
load()
Lighthouse relations
```

## Regla 8

Cachear con contexto de tenant/team.

## Regla 9

Usar OPcache en producción.

## Regla 10

No duplicar lógica entre Web/API/GraphQL.

------------------------------------------------------------------------

# 42. Comparación con el repositorio original

El repositorio original utiliza una arquitectura donde Laravel funciona
como API y React se ejecuta como frontend separado.

Para esta aplicación se recomienda:

  Repositorio original   Arquitectura recomendada
  ---------------------- ------------------------------------
  Laravel API separado   Laravel monolito
  React `web` separado   React dentro de Inertia
  Nginx → API            Nginx → Laravel
  PgSQL expuesto         PgSQL interno
  PHP + Node             PHP separado de Node en producción
  Supervisor             Containers independientes
  Queue                  Redis + worker
  Scheduler              Container independiente
  API                    `/api/v1`
  GraphQL                `/graphql`
  Inertia                `/`, `/dashboard`, etc.
  Redis                  Cache + Queue + Throttle
  OPcache                Activado
  Assets                 Nginx
  GraphQL                Depth + Complexity limits
  Eloquent               Eager loading

------------------------------------------------------------------------

# 43. Arquitectura final recomendada

``` text
                              INTERNET
                                  │
                                  ▼
                              CLOUDFLARE
                                  │
                                  ▼
                               NGINX
                                  │
                     ┌────────────┼────────────┐
                     │            │            │
                     ▼            ▼            ▼
                 Inertia        JSON        GraphQL
                     │           API         Lighthouse
                     │            │            │
                     └────────────┼────────────┘
                                  │
                                  ▼
                              PHP-FPM
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
                Services      Eloquent       Cache
                    │             │             │
                    │             ▼             ▼
                    │           PgSQL         Redis
                    │                           │
                    │                           ▼
                    │                         Queue
                    │                           │
                    │                           ▼
                    │                         Worker
                    │
                    ▼
                 Jobs /
              Integraciones
```

------------------------------------------------------------------------

# 44. Resultado

La arquitectura final permite tener:

``` text
Laravel 13
PHP 8.5
React
Inertia
Wayfinder
JSON API
Lighthouse GraphQL
Sanctum
PgSQL
Redis
Queue
Scheduler
Nginx
OPcache
Cloudflare
Docker
```

sin mantener aplicaciones Laravel separadas.

La aplicación puede crecer de:

``` text
1 instancia app
1 worker
```

a:

``` text
2+ instancias app
N workers
```

sin cambiar la estructura fundamental.

------------------------------------------------------------------------

# 45. Próxima optimización: Laravel Octane

Una vez establecida esta arquitectura puede evaluarse Laravel Octane.

La arquitectura sería:

``` text
Nginx
  ↓
Octane
  ↓
FrankenPHP / RoadRunner / Swoole
  ↓
Laravel persistente
```

Octane mantiene la aplicación cargada en memoria entre requests.

Sin embargo, debe introducirse después de estabilizar la arquitectura
porque requiere especial atención a:

-   estado global;
-   singletons;
-   variables estáticas;
-   memoria;
-   objetos persistentes;
-   listeners;
-   conexiones;
-   aislamiento de request.

No es necesario para construir primero una arquitectura Laravel +
Inertia + API + GraphQL correcta.

------------------------------------------------------------------------

# 46. Principio final

La regla arquitectónica principal es:

``` text
UNA aplicación Laravel
        +
UNA base de datos
        +
UNA capa Redis
        +
MÚLTIPLES interfaces
```

Las interfaces son:

``` text
Inertia
API
GraphQL
```

pero la lógica de negocio permanece centralizada.

``` text
                    Laravel
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Inertia           API         GraphQL
        │              │              │
        └──────────────┼──────────────┘
                       │
                    Services
                       │
                    Eloquent
                       │
                    PgSQL
```

Esta separación permite agregar capacidades sin convertir el proyecto en
tres aplicaciones diferentes ni generar un costo innecesario de
infraestructura.
