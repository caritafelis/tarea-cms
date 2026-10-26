<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use GraphQL\Language\AST\StringValueNode;
use GraphQL\Type\Definition\EnumType;
use GraphQL\Type\Definition\FieldDefinition;
use GraphQL\Type\Definition\InputObjectType;
use GraphQL\Type\Definition\ListOfType;
use GraphQL\Type\Definition\NonNull;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ScalarType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Schema;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Lang;
use Nuwave\Lighthouse\Schema\SchemaBuilder;

class GraphqlDocsController extends Controller
{
    private const LOCALES = ['en', 'es'];

    private const BUILTIN = ['Int', 'Float', 'String', 'Boolean', 'ID'];

    public function json(Request $request): JsonResponse
    {
        $lang = $this->resolveLocale($request);
        app()->setLocale($lang);

        $build = fn (): array => $this->build();

        $doc = app()->hasDebugModeEnabled()
            ? $build()
            : Cache::remember("graphql.docs.{$lang}", 300, $build);

        return response()
            ->json($doc, 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            ->header('Vary', 'Accept-Language');
    }

    public function ui(): View
    {
        return view('docs.graphql', ['src' => url('/api/graphql-docs.json')]);
    }

    /* ---------------------------------------------------------------------
     | Idioma y traducción
     * ------------------------------------------------------------------- */

    /** Textos que Lighthouse genera con el nombre del modelo incrustado. Clave JSON de lang/{locale}.json. */
    private const GENERATED = [
        '/^A paginated list of (.+) items\.$/' => 'A paginated list of :model items.',
        '/^A list of (.+) items\.$/' => 'A list of :model items.',
    ];

    private function resolveLocale(Request $request): string
    {
        $lang = $request->query('lang') ?? $request->getPreferredLanguage(self::LOCALES);

        return in_array($lang, self::LOCALES, true) ? $lang : 'en';
    }

    /**
     * Primera clave de lang que exista; si ninguna, el texto del SDL pasado por translateGenerated().
     *
     * @param  list<string>  $keys
     */
    private function tr(array $keys, ?string $fallback): ?string
    {
        foreach ($keys as $key) {
            if (Lang::has($key)) {
                $value = __($key);

                if (is_string($value)) {
                    return $value;
                }
            }
        }

        return $this->translateGenerated($fallback);
    }

    /**
     * Descripciones autogeneradas (Lighthouse/graphql-php): se traducen por su texto en inglés
     * usando lang/{locale}.json. Si no hay traducción, se devuelve tal cual.
     */
    private function translateGenerated(?string $text): ?string
    {
        if ($text === null || $text === '') {
            return $text;
        }

        foreach (self::GENERATED as $regex => $key) {
            if (preg_match($regex, $text, $m)) {
                return Lang::has($key) ? __($key, ['model' => $m[1]]) : $text;
            }
        }

        return Lang::has($text) ? __($text) : $text;
    }

    private function typeDescription(string $type, ?string $sdl): ?string
    {
        return $this->tr(["graphql.types.{$type}"], $sdl);
    }

    private function fieldDescription(string $type, string $field, ?string $sdl): ?string
    {
        return $this->tr(["graphql.fields.{$type}.{$field}", "graphql.common_fields.{$field}"], $sdl);
    }

    private function operationDescription(string $name, ?string $sdl): ?string
    {
        return $this->tr(["graphql.operations.{$name}"], $sdl);
    }

    private function argDescription(string $context, string $arg, ?string $sdl): ?string
    {
        return $this->tr(["graphql.args.{$context}.{$arg}", "graphql.common_args.{$arg}"], $sdl);
    }

    private function enumValueDescription(string $enum, string $value, ?string $sdl): ?string
    {
        return $this->tr(["graphql.enums.{$enum}.{$value}"], $sdl);
    }

    /* ---------------------------------------------------------------------
     | Documento
     * ------------------------------------------------------------------- */

    private function build(): array
    {
        /** @var Schema $schema */
        $schema = app(SchemaBuilder::class)->schema();
        $types = [];

        foreach ($schema->getTypeMap() as $name => $type) {
            if (str_starts_with($name, '__') || in_array($name, ['Query', 'Mutation', 'Subscription'], true)) {
                continue;
            }

            if ($type instanceof ObjectType) {
                $types[] = [
                    'kind' => 'object',
                    'name' => $name,
                    'description' => $this->typeDescription($name, $type->description),
                    'fields' => array_values(array_map(fn (FieldDefinition $f): array => [
                        'name' => $f->name,
                        'type' => (string) $f->getType(),
                        'description' => $this->fieldDescription($name, $f->name, $f->description),
                        'deprecated' => $f->deprecationReason,
                        'args' => $this->args($f, "{$name}_{$f->name}"),
                    ], $type->getFields())),
                ];
            } elseif ($type instanceof InputObjectType) {
                $types[] = [
                    'kind' => 'input',
                    'name' => $name,
                    'description' => $this->typeDescription($name, $type->description),
                    'fields' => array_values(array_map(fn ($f): array => [
                        'name' => $f->name,
                        'type' => (string) $f->getType(),
                        'description' => $this->fieldDescription($name, $f->name, $f->description),
                        'required' => $f->getType() instanceof NonNull,
                    ], $type->getFields())),
                ];
            } elseif ($type instanceof EnumType) {
                $types[] = [
                    'kind' => 'enum',
                    'name' => $name,
                    'description' => $this->typeDescription($name, $type->description),
                    'values' => array_map(fn ($v): array => [
                        'name' => $v->name,
                        'description' => $this->enumValueDescription($name, $v->name, $v->description),
                    ], $type->getValues()),
                ];
            } elseif ($type instanceof ScalarType && ! in_array($name, self::BUILTIN, true)) {
                $types[] = [
                    'kind' => 'scalar',
                    'name' => $name,
                    'description' => $this->typeDescription($name, $type->description),
                ];
            }
        }

        usort($types, fn ($a, $b): int => strcmp($a['name'], $b['name']));

        return [
            'title' => __('graphql.title', ['app' => config('app.name')]),
            'endpoint' => url('/graphql'),
            'playground' => url('/graphiql'),
            'queries' => $this->operations($schema->getQueryType(), 'query'),
            'mutations' => $this->operations($schema->getMutationType(), 'mutation'),
            'types' => $types,
        ];
    }

    private function operations(?ObjectType $root, string $op): array
    {
        if (! $root) {
            return [];
        }

        $out = [];

        foreach ($root->getFields() as $f) {
            [$auth, $abilities] = $this->authInfo($f);

            $out[] = [
                'name' => $f->name,
                'description' => $this->operationDescription($f->name, $f->description),
                'deprecated' => $f->deprecationReason,
                'returns' => (string) $f->getType(),
                'args' => $this->args($f, $f->name),
                'requiresAuth' => $auth,
                'abilities' => $abilities,
                'example' => $this->example($op, $f),
            ];
        }

        usort($out, fn ($a, $b): int => strcmp($a['name'], $b['name']));

        return $out;
    }

    private function args(FieldDefinition $f, string $context): array
    {
        return array_values(array_map(fn ($a): array => [
            'name' => $a->name,
            'type' => (string) $a->getType(),
            'required' => $a->getType() instanceof NonNull && ! $a->defaultValueExists(),
            'default' => $a->defaultValueExists() ? $a->defaultValue : null,
            'description' => $this->argDescription($context, $a->name, $a->description),
        ], $f->args));
    }

    /** @return array{0: bool, 1: list<string>} */
    private function authInfo(FieldDefinition $f): array
    {
        $auth = false;
        $abilities = [];

        foreach ($f->astNode?->directives ?? [] as $d) {
            $name = $d->name->value;

            if ($name === 'guard' || $name === 'can') {
                $auth = true;
            }

            if ($name === 'can') {
                foreach ($d->arguments as $arg) {
                    if ($arg->name->value === 'ability' && $arg->value instanceof StringValueNode) {
                        $abilities[] = $arg->value->value;
                    }
                }
            }
        }

        return [$auth, $abilities];
    }

    private function example(string $op, FieldDefinition $f): string
    {
        $args = [];
        $named = Type::getNamedType($f->getType());
        $paginated = $named instanceof ObjectType && isset($named->getFields()['paginatorInfo'], $named->getFields()['data']);

        foreach ($f->args as $a) {
            if ($a->getType() instanceof NonNull && ! $a->defaultValueExists()) {
                $args[$a->name] = $this->placeholder($a->getType());
            }
        }

        if ($paginated && ! isset($args['first']) && $f->getArg('first')) {
            $args['first'] = '10';
        }

        $argStr = $args ? '('.implode(', ', array_map(fn ($k, $v): string => "{$k}: {$v}", array_keys($args), $args)).')' : '';

        $sel = '';
        if ($named instanceof ObjectType) {
            $sel = $paginated
                ? "    data {\n".$this->scalarFields(Type::getNamedType($named->getField('data')->getType()), 6)
                  ."    }\n    paginatorInfo {\n      currentPage\n      lastPage\n      total\n    }\n"
                : $this->scalarFields($named, 4);
            $sel = " {\n{$sel}  }";
        }

        return "{$op} {\n  {$f->name}{$argStr}{$sel}\n}";
    }

    private function scalarFields(Type $type, int $indent): string
    {
        $pad = str_repeat(' ', $indent);
        $lines = [];

        if ($type instanceof ObjectType) {
            foreach ($type->getFields() as $f) {
                if (count($lines) >= 8) {
                    break;
                }

                if (Type::isLeafType(Type::getNamedType($f->getType())) && ! array_filter($f->args, fn ($a): bool => $a->getType() instanceof NonNull)) {
                    $lines[] = $pad.$f->name;
                }
            }
        }

        return implode("\n", $lines ?: [$pad.'__typename'])."\n";
    }

    private function placeholder(Type $type, int $depth = 0): string
    {
        if ($type instanceof NonNull) {
            return $this->placeholder($type->getWrappedType(), $depth);
        }

        if ($type instanceof ListOfType) {
            return '['.$this->placeholder($type->getWrappedType(), $depth).']';
        }

        if ($type instanceof EnumType) {
            return $type->getValues()[0]->name ?? 'VALUE';
        }

        if ($type instanceof InputObjectType) {
            if ($depth >= 2) {
                return '{}';
            }

            $parts = [];
            foreach ($type->getFields() as $f) {
                if ($f->getType() instanceof NonNull) {
                    $parts[] = $f->name.': '.$this->placeholder($f->getType(), $depth + 1);
                }
            }

            return '{ '.implode(', ', $parts).' }';
        }

        return match ($type->name) {
            'Int' => '1',
            'Float' => '1.0',
            'Boolean' => 'true',
            'ID' => '"1"',
            'DateTime' => '"2026-01-01 00:00:00"',
            'JSON' => '{}',
            default => '"string"',
        };
    }
}