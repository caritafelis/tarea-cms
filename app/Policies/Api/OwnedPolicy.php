<?php

namespace App\Policies\Api;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class OwnedPolicy
{
    public function __construct(
        private string $model,
        private Closure $owner,
        private bool $ownerCanWrite = true,
        private bool $publicRead = false,
    ) {}

    public function __call(string $ability, array $arguments): bool
    {
        $user = $arguments[0] ?? null;
        $subject = $arguments[1] ?? null;
        $action = ApiResourcePolicy::actionFor($ability);

        if (! $user || $action === null) {
            return false;
        }

        // Listar/crear: cualquier autenticado. El listado se filtra por dueño en el schema.
        if ($action === 'view_any') {
            return true;
        }

        if ($action === 'create' && $this->ownerCanWrite) {
            return true;
        }

        if ($this->publicRead && str_starts_with($action, 'view')) {
            return true;
        }

        if ($subject instanceof Model
            && (string) ($this->owner)($subject) === (string) $user->getKey()
            && ($action === 'view' || $this->ownerCanWrite)) {
            return true;
        }

        return (bool) $user->checkPermissionTo($action.'_'.Str::snake(class_basename($this->model)));
    }
}