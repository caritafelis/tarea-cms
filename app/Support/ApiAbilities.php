<?php

namespace App\Support;

use GraphQL\Language\AST\FieldNode;
use GraphQL\Language\AST\FragmentDefinitionNode;
use GraphQL\Language\AST\FragmentSpreadNode;
use GraphQL\Language\AST\InlineFragmentNode;
use GraphQL\Language\AST\OperationDefinitionNode;
use GraphQL\Language\AST\SelectionSetNode;
use GraphQL\Language\Parser;
use Illuminate\Http\Request;

final class ApiAbilities
{
    public const ACTIONS = ['read', 'create', 'update', 'delete'];

    public const DRAFTS = 'drafts:read';

    private static ?array $queryMap = null;

    public static function resources(): array
    {
        return config('api_permissions.resources', []);
    }

    public static function isValid(mixed $ability): bool
    {
        if (! is_string($ability)) {
            return false;
        }

        if ($ability === '*' || $ability === self::DRAFTS) {
            return true;
        }

        if (! str_contains($ability, ':')) {
            return false;
        }

        [$resource, $action] = explode(':', $ability, 2);

        if ($resource === '*') {
            return in_array($action, self::ACTIONS, true);
        }

        $def = self::resources()[$resource] ?? null;

        return $def !== null && ($action === '*' || in_array($action, $def[2], true));
    }

    public static function isWrite(string $ability): bool
    {
        return $ability === '*'
            || $ability === 'write'
            || (bool) preg_match('/:(write|create|update|delete|\*)$/', $ability);
    }

    public static function normalize(array $abilities): array
    {
        $abilities = array_values(array_unique(array_filter($abilities, 'is_string')));

        if (in_array('*', $abilities, true)) {
            return ['*'];
        }

        $abilities = array_values(array_filter($abilities, function (string $a) use ($abilities) {
            if (! str_contains($a, ':')) {
                return true;
            }

            [$resource, $action] = explode(':', $a, 2);
            $def = self::resources()[$resource] ?? null;

            return ! ($def && ! $def[3] && in_array("*:{$action}", $abilities, true));
        }));

        sort($abilities);

        return $abilities;
    }

    public static function grants(array $abilities, string $resource, string $action): bool
    {
        if (in_array('*', $abilities, true)) {
            return true;
        }

        $def = self::resources()[$resource] ?? null;

        if ($def === null) {
            return false;
        }

        $names = [$resource];
        foreach (config('api_permissions.legacy_aliases', []) as $alias => $targets) {
            if (in_array($resource, $targets, true)) {
                $names[] = $alias;
            }
        }

        $actions = [$action, '*'];
        if ($action !== 'read') {
            $actions[] = 'write';
        }

        foreach ($names as $name) {
            foreach ($actions as $a) {
                if (in_array("{$name}:{$a}", $abilities, true)) {
                    return true;
                }
            }
        }

        if (! $def[3]) {
            foreach ($actions as $a) {
                if ($a !== '*' && in_array("*:{$a}", $abilities, true)) {
                    return true;
                }
            }

            if ($action === 'read' && in_array('read', $abilities, true)) {
                return true;
            }

            if ($action !== 'read' && in_array('write', $abilities, true)) {
                return true;
            }
        }

        return false;
    }

    public static function scopedToPublished(array $abilities): bool
    {
        return ! in_array('*', $abilities, true) && ! in_array(self::DRAFTS, $abilities, true);
    }

    /**
     * @return array{writes: bool, mappable: bool, needs: list<array{0: string, 1: string}>}
     */
    public static function requirements(Request $request): array
    {
        return $request->is('graphql') ? self::graphqlRequirements($request) : self::restRequirements($request);
    }

    private static function restRequirements(Request $request): array
    {
        $method = $request->method();
        $writes = ! in_array($method, ['GET', 'HEAD', 'OPTIONS'], true);
        $path = trim((string) preg_replace('#^api/(v\d+/)?#', '', $request->path()), '/');
        $segment = explode('/', $path)[0];

        if (in_array($segment, config('api_permissions.rest_open', []), true)) {
            return ['writes' => $writes, 'mappable' => true, 'needs' => []];
        }

        foreach (config('api_permissions.rest_overrides', []) as [$pattern, $resource, $action]) {
            if (preg_match($pattern, $path)) {
                return ['writes' => $writes, 'mappable' => true, 'needs' => [[$resource, $action]]];
            }
        }

        if (! isset(self::resources()[$segment])) {
            return ['writes' => $writes, 'mappable' => false, 'needs' => []];
        }

        $action = match ($method) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'read',
        };

        return ['writes' => $writes, 'mappable' => true, 'needs' => [[$segment, $action]]];
    }

    private static function graphqlRequirements(Request $request): array
    {
        $payload = $request->json()->all();
        $queries = ($payload !== [] && array_is_list($payload))
            ? array_column($payload, 'query')
            : [$request->input('query')];

        $queryMap = self::queryMap();
        $mutations = config('api_permissions.mutations', []);
        $writes = false;
        $mappable = true;
        $needs = [];

        foreach ($queries as $query) {
            if (! is_string($query)) {
                return ['writes' => true, 'mappable' => false, 'needs' => []];
            }

            try {
                $doc = Parser::parse($query, ['noLocation' => true]);
            } catch (\Throwable) {
                continue;
            }

            $fragments = [];
            foreach ($doc->definitions as $def) {
                if ($def instanceof FragmentDefinitionNode) {
                    $fragments[$def->name->value] = $def;
                }
            }

            foreach ($doc->definitions as $def) {
                if (! $def instanceof OperationDefinitionNode) {
                    continue;
                }

                if ($def->operation === 'subscription') {
                    $mappable = false;

                    continue;
                }

                $isMutation = $def->operation === 'mutation';
                $writes = $writes || $isMutation;

                foreach (self::rootFields($def->selectionSet, $fragments) as $field) {
                    if ($field === 'me' || str_starts_with($field, '__')) {
                        continue;
                    }

                    $need = $isMutation
                        ? ($mutations[$field] ?? null)
                        : (isset($queryMap[$field]) ? [$queryMap[$field], 'read'] : null);

                    if ($need === null) {
                        $mappable = false;

                        continue;
                    }

                    $needs[] = $need;
                }
            }
        }

        return ['writes' => $writes, 'mappable' => $mappable, 'needs' => $needs];
    }

    /** @return list<string> */
    private static function rootFields(SelectionSetNode $set, array $fragments, array $seen = []): array
    {
        $out = [];

        foreach ($set->selections as $sel) {
            if ($sel instanceof FieldNode) {
                $out[] = $sel->name->value;
            } elseif ($sel instanceof InlineFragmentNode) {
                $out = array_merge($out, self::rootFields($sel->selectionSet, $fragments, $seen));
            } elseif ($sel instanceof FragmentSpreadNode) {
                $name = $sel->name->value;

                if (isset($fragments[$name]) && ! isset($seen[$name])) {
                    $out = array_merge($out, self::rootFields($fragments[$name]->selectionSet, $fragments, $seen + [$name => true]));
                }
            }
        }

        return $out;
    }

    /** campo raiz de query => recurso */
    private static function queryMap(): array
    {
        if (self::$queryMap === null) {
            self::$queryMap = [];
            foreach (self::resources() as $key => $def) {
                foreach ($def[4] ?? [] as $field) {
                    self::$queryMap[$field] = $key;
                }
            }
        }

        return self::$queryMap;
    }
    
    public static function catalog(): array
    {
        $groups = [];

        foreach (config('api_permissions.groups', []) as $key => [$label, $description]) {
            $groups[$key] = ['key' => $key, 'label' => $label, 'description' => $description, 'resources' => []];
        }

        foreach (self::resources() as $key => [$label, $group, $actions, $sensitive]) {
            $groups[$group]['resources'][] = [
                'key' => $key,
                'label' => $label,
                'actions' => $actions,
                'sensitive' => $sensitive,
            ];
        }

        return [
            'groups' => array_values($groups),
            'presets' => config('api_permissions.presets', []),
            'drafts' => self::DRAFTS,
        ];
    }
}