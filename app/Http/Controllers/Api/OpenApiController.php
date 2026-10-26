<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Route;
use LaravelJsonApi\Core\Server\ServerRepository;
use LaravelJsonApi\Eloquent\Fields\ArrayHash;
use LaravelJsonApi\Eloquent\Fields\Attribute;
use LaravelJsonApi\Eloquent\Fields\Boolean;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\Relation;
use LaravelJsonApi\Eloquent\Fields\Relations\ToMany;
use LaravelJsonApi\Eloquent\Schema;

class OpenApiController extends Controller
{
    private const LOCALES = ['en', 'es'];

    private const MEDIA_TYPE = 'application/vnd.api+json';
    private const READ_ONLY_ATTRIBUTES = ['createdAt', 'updatedAt'];

    public function show(Request $request): JsonResponse
    {
        $lang = $this->resolveLocale($request);
        app()->setLocale($lang);

        $build = fn (): array => $this->buildSpec();
        
        $spec = app()->hasDebugModeEnabled()
            ? $build()
            : Cache::remember("openapi.spec.{$lang}", 300, $build);

        return response()->json($spec, 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    /* ---------------------------------------------------------------------
     | Idioma
     * ------------------------------------------------------------------- */

    private function resolveLocale(Request $request): string
    {
        $lang = $request->query('lang') ?? $request->getPreferredLanguage(self::LOCALES);

        return in_array($lang, self::LOCALES, true) ? $lang : 'en';
    }

    /* ---------------------------------------------------------------------
     | Especificación completa
     * ------------------------------------------------------------------- */

    private function buildSpec(): array
    {
        $baseUrl = rtrim((string) config('app.url'), '/');
        $server = app(ServerRepository::class)->server('v1');
        $schemaContainer = $server->schemas();
        $registered = $this->registeredMethods();

        $paths = [];
        $componentsSchemas = [];
        $tags = [];

        foreach ($schemaContainer->types() as $type) {
            $schema = $schemaContainer->schemaFor($type);

            if (! $schema instanceof Schema) {
                continue;
            }

            $resource = $this->buildResource($type, $schema, $baseUrl);

            $componentsSchemas[$resource['name']] = $resource['schema'];
            foreach (['' => 'collection', '/{id}' => 'item'] as $suffix => $part) {
                $ops = array_intersect_key(
                    $resource[$part],
                    array_flip($registered["/{$type}{$suffix}"] ?? [])
                );
                if ($ops) {
                    $paths["/{$type}{$suffix}"] = $ops;
                }
            }

            $label = $this->tagLabel($type);
            $tags[] = [
                'name' => $type,
                'x-displayName' => $label,
                'description' => __('openapi.tag_description', ['label' => $label]),
            ];
        }

        $paths = array_replace($paths, $this->extraPaths($registered, $paths), $this->globalPaths($baseUrl));

        return [
            'openapi' => '3.0.3',
            'info' => [
                'title' => __('openapi.info.title'),
                'description' => __('openapi.info.description'),
                'version' => '1.0.0',
            ],
            'servers' => [
                [
                    'url' => $baseUrl . '/api/v1',
                    'description' => __('openapi.server'),
                ],
            ],
            'security' => [['bearerAuth' => []]],
            'tags' => $tags,
            'paths' => $paths ?: new \stdClass(),
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => [
                        'type' => 'http',
                        'scheme' => 'bearer',
                        'bearerFormat' => 'Sanctum / ApiKey',
                        'description' => __('openapi.auth.bearer'),
                    ],
                ],
                'responses' => [
                    'UnauthorizedError' => $this->errorResponse('unauthorized', '401', 'Unauthenticated', [
                        'detail' => ['type' => 'string', 'example' => 'Invalid API token.'],
                    ]),
                    'ForbiddenError' => $this->errorResponse('forbidden', '403', 'Forbidden'),
                    'NotFoundError' => $this->errorResponse('not_found', '404', 'Not Found'),
                    'ValidationError' => $this->errorResponse('validation', '422', 'Unprocessable Entity', [
                        'source' => ['type' => 'object'],
                    ]),
                ],
                'schemas' => $componentsSchemas ?: new \stdClass(),
            ],
        ];
    }

    /* ---------------------------------------------------------------------
     | Un recurso JSON:API (schema + rutas)
     * ------------------------------------------------------------------- */

    private function buildResource(string $type, Schema $schema, string $baseUrl): array
    {
        $attributes = [];
        $relationships = [];
        $relationNames = [];

        foreach ($schema->fields() as $field) {
            if ($field instanceof Attribute) {
                $attributes[$field->name()] = $this->mapFieldToOpenApiSchema($field);
            } elseif ($field instanceof Relation) {
                $relationNames[] = $field->name();
                $relationships[$field->name()] = $this->relationshipSchema($field, $schema);
            }
        }

        $schemaName = str_replace(' ', '', ucwords(str_replace('-', ' ', $type))) . 'Resource';
        $ref = ['$ref' => "#/components/schemas/{$schemaName}"];

        $resourceSchema = [
            'type' => 'object',
            'required' => ['id', 'type', 'attributes'],
            'properties' => [
                'id' => ['type' => 'string', 'example' => '1'],
                'type' => ['type' => 'string', 'example' => $type],
                'attributes' => ['type' => 'object', 'properties' => $this->obj($attributes)],
                'relationships' => ['type' => 'object', 'properties' => $this->obj($relationships)],
                'links' => [
                    'type' => 'object',
                    'properties' => [
                        'self' => ['type' => 'string', 'example' => "{$baseUrl}/api/v1/{$type}/1"],
                    ],
                ],
            ],
        ];

        $readOnly = [];
        foreach ($schema->fields() as $f) {
            if ($f instanceof Attribute && method_exists($f, 'isReadOnly') && $f->isReadOnly(null)) {
                $readOnly[] = $f->name();
            }
        }

        $writableAttributes = array_diff_key(
            $attributes,
            array_flip(array_merge(self::READ_ONLY_ATTRIBUTES, $readOnly))
        );  

        $includeDescription = $relationNames
            ? __('openapi.param.include_allowed', ['list' => implode(', ', $relationNames)])
            : __('openapi.param.include');

        $idParameter = [
            'name' => 'id',
            'in' => 'path',
            'required' => true,
            'description' => __('openapi.param.id', ['type' => $type]),
            'schema' => ['type' => 'string'],
        ];

        $listParameters = array_merge([
            $this->queryParam('page[number]', __('openapi.param.page_number'), ['type' => 'integer', 'default' => 1]),
            $this->queryParam('page[size]', __('openapi.param.page_size'), ['type' => 'integer', 'default' => 25]),
            $this->queryParam('include', $includeDescription),
            $this->queryParam('sort', __('openapi.param.sort')),
        ], $this->filterParameters($schema, $type));

        $collection = [
            'get' => [
                'tags' => [$type],
                'summary' => __('openapi.list.summary', ['type' => $type]),
                'description' => __('openapi.list.description', ['type' => $type]),
                'parameters' => $listParameters,
                'responses' => [
                    '200' => $this->jsonResponse(__('openapi.list.ok', ['type' => $type]), [
                        'type' => 'object',
                        'properties' => [
                            'data' => ['type' => 'array', 'items' => $ref],
                            'meta' => ['type' => 'object'],
                            'links' => ['type' => 'object'],
                        ],
                    ]),
                    '401' => $this->refResponse('UnauthorizedError'),
                    '403' => $this->refResponse('ForbiddenError'),
                ],
            ],
            'post' => [
                'tags' => [$type],
                'summary' => __('openapi.create.summary', ['type' => $type]),
                'description' => __('openapi.create.description', ['type' => $type]),
                'requestBody' => $this->requestBody(
                    required: ['type', 'attributes'],
                    properties: [
                        'type' => ['type' => 'string', 'example' => $type],
                        'attributes' => ['type' => 'object', 'properties' => $this->obj($writableAttributes)],
                        'relationships' => ['type' => 'object', 'properties' => $this->obj($relationships)],
                    ],
                ),
                'responses' => [
                    '201' => $this->jsonResponse(__('openapi.create.ok', ['type' => $type]), [
                        'type' => 'object',
                        'properties' => ['data' => $ref],
                    ]),
                    '422' => $this->refResponse('ValidationError'),
                    '401' => $this->refResponse('UnauthorizedError'),
                ],
            ],
        ];

        $item = [
            'get' => [
                'tags' => [$type],
                'summary' => __('openapi.show.summary', ['type' => $type]),
                'description' => __('openapi.show.description', ['type' => $type]),
                'parameters' => [
                    $idParameter,
                    $this->queryParam('include', $includeDescription),
                ],
                'responses' => [
                    '200' => $this->jsonResponse(__('openapi.show.ok', ['type' => $type]), [
                        'type' => 'object',
                        'properties' => ['data' => $ref],
                    ]),
                    '404' => $this->refResponse('NotFoundError'),
                    '401' => $this->refResponse('UnauthorizedError'),
                ],
            ],
            'patch' => [
                'tags' => [$type],
                'summary' => __('openapi.update.summary', ['type' => $type]),
                'description' => __('openapi.update.description', ['type' => $type]),
                'parameters' => [$idParameter],
                'requestBody' => $this->requestBody(
                    required: ['id', 'type', 'attributes'],
                    properties: [
                        'id' => ['type' => 'string', 'example' => '1'],
                        'type' => ['type' => 'string', 'example' => $type],
                        'attributes' => ['type' => 'object', 'properties' => $this->obj($writableAttributes)],
                        'relationships' => ['type' => 'object', 'properties' => $this->obj($relationships)],
                    ],
                ),
                'responses' => [
                    '200' => $this->jsonResponse(__('openapi.update.ok', ['type' => $type]), [
                        'type' => 'object',
                        'properties' => ['data' => $ref],
                    ]),
                    '404' => $this->refResponse('NotFoundError'),
                    '422' => $this->refResponse('ValidationError'),
                ],
            ],
            'delete' => [
                'tags' => [$type],
                'summary' => __('openapi.delete.summary', ['type' => $type]),
                'description' => __('openapi.delete.description', ['type' => $type]),
                'parameters' => [$idParameter],
                'responses' => [
                    '204' => ['description' => __('openapi.delete.ok', ['type' => $type])],
                    '404' => $this->refResponse('NotFoundError'),
                    '401' => $this->refResponse('UnauthorizedError'),
                ],
            ],
        ];

        return [
            'name' => $schemaName,
            'schema' => $resourceSchema,
            'collection' => $collection,
            'item' => $item,
        ];
    }

    /* ---------------------------------------------------------------------
     | Relaciones
     * ------------------------------------------------------------------- */

    private function relationshipSchema(Relation $field, Schema $schema): array
    {
        $relName = $field->name();
        $targetType = $relName;

        try {
            if (method_exists($field, 'inverse')) {
                $targetType = $field->inverse();
            } elseif (method_exists($field, 'type')) {
                $targetType = $field->type($schema);
            }
        } catch (\Throwable $e) {
            // Fallback: nombre de la relación
        }

        if (is_array($targetType)) {
            $targetType = reset($targetType) ?: $relName;
        }

        $identifier = [
            'type' => 'object',
            'properties' => [
                'type' => ['type' => 'string', 'example' => (string) $targetType],
                'id' => ['type' => 'string', 'example' => '1'],
            ],
        ];

        $isToMany = false;
        try {
            if ($field instanceof ToMany) {
                $isToMany = true;
            } elseif (method_exists($field, 'isToMany')) {
                $isToMany = $field->isToMany();
            }
        } catch (\Throwable $e) {
            $isToMany = false;
        }

        return [
            'type' => 'object',
            'properties' => [
                'data' => $isToMany
                    ? ['type' => 'array', 'items' => $identifier]
                    : $identifier,
            ],
        ];
    }

    /* ---------------------------------------------------------------------
     | Parámetros
     * ------------------------------------------------------------------- */

    private function filterParameters(Schema $schema, string $type): array
    {
        $params = [];

        if (! method_exists($schema, 'filters')) {
            return $params;
        }

        foreach ($schema->filters() as $filter) {
            $key = $filter->key();
            $params[] = $this->queryParam(
                "filter[{$key}]",
                __('openapi.param.filter', ['type' => $type, 'key' => $key]),
            );
        }

        return $params;
    }

    private function queryParam(string $name, string $description, array $schema = ['type' => 'string']): array
    {
        return [
            'name' => $name,
            'in' => 'query',
            'required' => false,
            'description' => $description,
            'schema' => $schema,
        ];
    }

    /* ---------------------------------------------------------------------
     | Helpers de estructura OpenAPI
     * ------------------------------------------------------------------- */

    private function requestBody(array $required, array $properties): array
    {
        return [
            'required' => true,
            'content' => [
                self::MEDIA_TYPE => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['data'],
                        'properties' => [
                            'data' => [
                                'type' => 'object',
                                'required' => $required,
                                'properties' => $properties,
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    private function jsonResponse(string $description, array $schema): array
    {
        return [
            'description' => $description,
            'content' => [self::MEDIA_TYPE => ['schema' => $schema]],
        ];
    }

    private function refResponse(string $name): array
    {
        return ['$ref' => "#/components/responses/{$name}"];
    }

    private function errorResponse(string $translationKey, string $status, string $title, array $extra = []): array
    {
        return $this->jsonResponse(__("openapi.errors.{$translationKey}"), [
            'type' => 'object',
            'properties' => [
                'errors' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => array_merge([
                            'status' => ['type' => 'string', 'example' => $status],
                            'title' => ['type' => 'string', 'example' => $title],
                        ], $extra),
                    ],
                ],
            ],
        ]);
    }

    /** ['/products' => ['get','post'], '/products/{id}' => [...]] normalizando params a {id}. */
    private function registeredMethods(): array
    {
        $map = [];

        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'api/v1/')) {
                continue;
            }

            $key = preg_replace('/\{[^}]+\}/', '{id}', '/'.substr($route->uri(), 7));

            foreach ($route->methods() as $m) {
                if ($m !== 'HEAD') {
                    $map[$key][] = strtolower($m);
                }
            }
        }

        return $map;
    }

    /** Rutas v1 registradas que no son collection/item: relaciones, acciones (checkout), shipping-options, health, user. */
    private function extraPaths(array $registered, array $known): array
    {
        $out = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();

            if (! str_starts_with($uri, 'api/v1/')) {
                continue;
            }

            $path = '/'.substr($uri, 7);
            $norm = preg_replace('/\{[^}]+\}/', '{id}', $path);

            if (isset($known[$norm]) || $norm === '/{id}') {
                continue;
            }

            preg_match_all('/\{([^}]+)\}/', $path, $m);
            $params = array_map(fn ($n) => [
                'name' => $n, 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string'],
            ], $m[1]);

            $tag = explode('/', trim($path, '/'))[0];

            foreach ($route->methods() as $method) {
                if ($method === 'HEAD') {
                    continue;
                }

                $out[$path][strtolower($method)] = [
                    'tags' => [$tag],
                    'summary' => "{$method} {$path}",
                    'parameters' => $params,
                    'requestBody' => in_array($method, ['POST', 'PATCH', 'PUT'], true)
                        ? ['content' => [self::MEDIA_TYPE => ['schema' => ['type' => 'object']]]]
                        : null,
                    'responses' => [
                        '200' => ['description' => 'OK'],
                        '401' => $this->refResponse('UnauthorizedError'),
                        '403' => $this->refResponse('ForbiddenError'),
                    ],
                ];

                if ($out[$path][strtolower($method)]['requestBody'] === null) {
                    unset($out[$path][strtolower($method)]['requestBody']);
                }
            }
        }

        return $out;
    }

    /** Endpoints fuera de /api/v1 (servers a nivel de path). */
    private function globalPaths(string $baseUrl): array
    {
        $servers = [['url' => $baseUrl.'/api']];

        return [
            '/tokens' => [
                'servers' => $servers,
                'post' => [
                    'tags' => ['auth'],
                    'summary' => 'Create a team API token',
                    'requestBody' => ['required' => true, 'content' => ['application/json' => ['schema' => [
                        'type' => 'object',
                        'required' => ['name', 'team_id'],
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'team_id' => ['type' => 'integer'],
                            'abilities' => ['type' => 'array', 'items' => ['type' => 'string'], 'example' => ['posts:read']],
                        ],
                    ]]]],
                    'responses' => ['201' => ['description' => 'Token created'], '403' => $this->refResponse('ForbiddenError')],
                ],
            ],
            '/tokens/{tokenId}' => [
                'servers' => $servers,
                'delete' => [
                    'tags' => ['auth'],
                    'summary' => 'Revoke a token',
                    'parameters' => [['name' => 'tokenId', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']]],
                    'responses' => ['200' => ['description' => 'Revoked']],
                ],
            ],
            '/payments/webhook' => [
                'servers' => $servers,
                'post' => [
                    'tags' => ['webhooks'],
                    'summary' => 'Stripe webhook (signature-verified, no bearer)',
                    'security' => [],
                    'responses' => ['200' => ['description' => 'Received']],
                ],
            ],
        ];
    }

    /** Un arreglo vacío se serializaría como [] en lugar de {}. */
    private function obj(array $properties): array|\stdClass
    {
        return $properties ?: new \stdClass();
    }

    /** Nombre legible del grupo: usa lang/*\/openapi.php => tags.{type} o, si no existe, el tipo en formato título. */
    private function tagLabel(string $type): string
    {
        $key = "openapi.tags.{$type}";

        return Lang::has($key) ? __($key) : Str::headline($type);
    }

    private function mapFieldToOpenApiSchema(Attribute $field): array
    {
        if ($field instanceof Boolean) {
            return ['type' => 'boolean'];
        }

        if ($field instanceof Number) {
            return ['type' => 'number'];
        }

        if ($field instanceof DateTime) {
            return ['type' => 'string', 'format' => 'date-time'];
        }

        if ($field instanceof ArrayHash) {
            return ['type' => 'object'];
        }

        return ['type' => 'string'];
    }
}