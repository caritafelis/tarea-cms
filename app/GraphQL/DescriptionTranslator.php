<?php

namespace App\GraphQL;

use Illuminate\Support\Facades\Lang;

class DescriptionTranslator
{
    public const LOCALES = ['en', 'es'];

    private const ROOTS = ['Query', 'Mutation', 'Subscription'];

    /** Textos que Lighthouse genera con el modelo incrustado → clave de lang/{locale}.json */
    private const GENERATED = [
        '/^A paginated list of (.+) items\.$/' => 'A paginated list of :model items.',
        '/^A list of (.+) items\.$/' => 'A list of :model items.',
    ];

    public function __construct(private readonly string $locale) {}

    public static function resolveLocale(): string
    {
        $request = request();
        $lang = $request->query('lang') ?? $request->getPreferredLanguage(self::LOCALES);

        return in_array($lang, self::LOCALES, true) ? $lang : 'en';
    }

    public function translateSchema(array $schema): array
    {
        $schema['types'] = array_map(fn (array $t): array => $this->translateType($t), $schema['types'] ?? []);

        return $schema;
    }

    public function translateType(array $type): array
    {
        $name = $type['name'] ?? null;

        if (! $name || str_starts_with($name, '__')) {
            return $type;
        }

        $root = in_array($name, self::ROOTS, true);

        $type['description'] = $root
            ? $this->generated($type['description'] ?? null)
            : $this->tr(["graphql.types.{$name}"], $type['description'] ?? null);

        foreach ($type['fields'] ?? [] as $i => $field) {
            $fname = $field['name'];
            $context = $root ? $fname : "{$name}_{$fname}";

            $field['description'] = $root
                ? $this->tr(["graphql.operations.{$fname}"], $field['description'] ?? null)
                : $this->tr(["graphql.fields.{$name}.{$fname}", "graphql.common_fields.{$fname}"], $field['description'] ?? null);

            $field['args'] = $this->args($field['args'] ?? [], $context);
            $type['fields'][$i] = $field;
        }

        foreach ($type['inputFields'] ?? [] as $i => $field) {
            $fname = $field['name'];
            $type['inputFields'][$i]['description'] = $this->tr(
                ["graphql.fields.{$name}.{$fname}", "graphql.common_fields.{$fname}"],
                $field['description'] ?? null,
            );
        }

        foreach ($type['enumValues'] ?? [] as $i => $value) {
            $type['enumValues'][$i]['description'] = $this->tr(
                ["graphql.enums.{$name}.{$value['name']}"],
                $value['description'] ?? null,
            );
        }

        return $type;
    }

    private function args(array $args, string $context): array
    {
        foreach ($args as $i => $arg) {
            $aname = $arg['name'];
            $args[$i]['description'] = $this->tr(
                ["graphql.args.{$context}.{$aname}", "graphql.common_args.{$aname}"],
                $arg['description'] ?? null,
            );
        }

        return $args;
    }

    /** @param list<string> $keys */
    private function tr(array $keys, ?string $fallback): ?string
    {
        foreach ($keys as $key) {
            if (Lang::has($key, $this->locale, false)) {
                $value = __($key, [], $this->locale);

                if (is_string($value)) {
                    return $value;
                }
            }
        }

        return $this->generated($fallback);
    }

    private function generated(?string $text): ?string
    {
        if ($text === null || $text === '') {
            return $text;
        }

        foreach (self::GENERATED as $regex => $key) {
            if (preg_match($regex, $text, $m)) {
                return Lang::has($key, $this->locale, false)
                    ? __($key, ['model' => $m[1]], $this->locale)
                    : $text;
            }
        }

        return Lang::has($text, $this->locale, false) ? __($text, [], $this->locale) : $text;
    }
}