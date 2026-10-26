<?php

namespace App\GraphQL\Builders;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

class Filters
{
    private static array $columns = [];

    private function has(string $table, string $column): bool
    {
        self::$columns[$table] ??= Schema::getColumnListing($table);

        return in_array($column, self::$columns[$table], true);
    }

    public function search(Builder $builder, mixed $value): Builder
    {
        $table = $builder->getModel()->getTable();
        $cols = array_values(array_filter(
            ['name', 'title', 'slug', 'sku', 'email', 'code', 'description'],
            fn ($c) => $this->has($table, $c)
        ));
        $term = '%'.addcslashes((string) $value, '%_\\').'%';

        return $cols === []
            ? $builder->whereRaw('1 = 0')
            : $builder->where(function ($q) use ($cols, $term) {
                foreach ($cols as $c) {
                    $q->orWhere($c, 'like', $term);
                }
            });
    }

    /** sort: "-created_at,title" (maximo 3 columnas, solo las que existen en la tabla) */
    public function sort(Builder $builder, mixed $value): Builder
    {
        $table = $builder->getModel()->getTable();
        $n = 0;

        foreach (explode(',', (string) $value) as $part) {
            $part = trim($part);
            $col = ltrim($part, '-');

            if ($n < 3 && preg_match('/^[a-z_]+$/', $col) && $this->has($table, $col)) {
                $builder->orderBy($col, str_starts_with($part, '-') ? 'desc' : 'asc');
                $n++;
            }
        }

        return $builder;
    }

    public function category(Builder $builder, mixed $value): Builder
    {
        return $builder->whereHas('categories', fn ($q) => $q->whereKey($value));
    }

    public function completed(Builder $builder, mixed $value): Builder
    {
        return $value ? $builder->whereNotNull('completed_at') : $builder->whereNull('completed_at');
    }
}