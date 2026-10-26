<?php

namespace App\Policies\Api;

use Illuminate\Support\Str;

class ApiResourcePolicy
{
    public function __construct(protected string $model, protected bool $publicRead = false) {}

    public static function actionFor(string $ability): ?string
    {
        return match (true) {
            $ability === 'viewAny' => 'view_any',
            str_starts_with($ability, 'view') => 'view',
            str_starts_with($ability, 'create') => 'create',
            str_starts_with($ability, 'update'),
            str_starts_with($ability, 'attach'),
            str_starts_with($ability, 'detach') => 'update',
            str_starts_with($ability, 'delete') => 'delete',
            str_starts_with($ability, 'restore') => 'restore',
            str_starts_with($ability, 'forceDelete') => 'force_delete',
            default => null,
        };
    }

    public function __call(string $ability, array $arguments): bool
    {
        $action = self::actionFor($ability);

        if ($action === null) {
            return false;
        }

        if ($this->publicRead && str_starts_with($action, 'view')) {
            return true;
        }

        $user = $arguments[0] ?? null;

        return $user && $user->checkPermissionTo($action.'_'.Str::snake(class_basename($this->model)));
    }
}