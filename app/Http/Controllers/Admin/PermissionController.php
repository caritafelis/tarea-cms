<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionController extends Controller
{
    private const PROTECTED_PERMISSION_PREFIXES = [
        'superadmin',
    ];

    private const ACTIONS = [
        'view_any',
        'view',
        'create',
        'update',
        'delete',
        'restore',
        'force_delete',
    ];

    /** Rows per INSERT / DELETE. Keeps every query small no matter how many models exist. */
    private const CHUNK_SIZE = 200;

    public function index(string $current_team): Response
    {
        return Inertia::render('admin/permissions/index', [
            'permissions' => Permission::query()
                ->where('name','not like','superadmin%')
                ->orderBy('name')
                ->get(),

            'models' => $this->modelNames(),
        ]);
    }

    public function create(string $current_team): Response
    {
        return Inertia::render('admin/permissions/create');
    }

    public function store(Request $request, string $current_team)
    {
        $request->validate([
            'name' => ['required','string','max:255',Rule::unique('permissions', 'name'),],
        ]);

        $name = trim(
            $request->string('name')->toString()
        );

        $this->ensurePermissionIsNotProtected($name);

        Permission::create([
            'name' => $name,
            'guard_name' => 'web',
        ]);

        return redirect()
            ->route('admin.permissions.index',['current_team' => $current_team])
            ->with('success','Permission created successfully.');
    }

    public function edit(string $current_team, Permission $permission): Response
    {
        $this->ensurePermissionIsNotProtected($permission->name);

        return Inertia::render('admin/permissions/edit', [
            'permission' => $permission,
        ]);
    }

    public function update(Request $request, string $current_team, Permission $permission)
    {
        $this->ensurePermissionIsNotProtected($permission->name);

        $request->validate([
            'name' => ['required','string','max:255',Rule::unique('permissions', 'name')->ignore($permission->id),],
        ]);

        $name = trim(
            $request->string('name')->toString()
        );

        $this->ensurePermissionIsNotProtected($name);

        $permission->update([
            'name' => $name,
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()
            ->route('admin.permissions.index',['current_team' => $current_team])
            ->with('success','Permission updated successfully.');
    }

    public function destroy(string $current_team, Permission $permission)
    {
        $this->ensurePermissionIsNotProtected($permission->name);

        $permission->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()
            ->route('admin.permissions.index',['current_team' => $current_team])
            ->with('success','Permission deleted successfully.');
    }

    /**
     * Genera los permisos estándar de un modelo, o de todos ("all").
     *
     * Antes: por cada permiso hacía firstOrCreate (2 queries) y Spatie vaciaba su caché
     * en cada guardado -> con ~100 modelos eran ~1.400 queries + 700 invalidaciones de
     * caché dentro de una sola request, y el gateway cortaba con 504.
     *
     * Ahora: INSERT IGNORE masivo en bloques de CHUNK_SIZE (una query por bloque, sin
     * eventos de Eloquent) y la caché se vacía UNA sola vez al final.
     */
    public function generateForModel(Request $request, string $current_team)
    {
        $request->validate([
            'model' => ['required', 'string'],
            'clean' => ['nullable', 'boolean'],
        ]);

        if ($request->string('model')->toString() === 'all') {
            $names = [];

            foreach ($this->modelNames() as $model) {
                array_push($names, ...$this->permissionNamesFor($model));
            }

            $names = array_values(array_unique($names));

            [$created, $removed] = DB::transaction(function () use ($request, $names) {
                $created = $this->createMissing($names);
                $removed = $request->boolean('clean') ? $this->deleteStale($names) : 0;

                return [$created, $removed];
            });

            app(PermissionRegistrar::class)->forgetCachedPermissions();

            $message = "Permissions synchronized: {$created} created";
            $message .= $request->boolean('clean') ? ", {$removed} removed." : '.';

            return redirect()
                ->route('admin.permissions.index',['current_team' => $current_team])
                ->with('success', $message);
        }

        $model = Str::snake($request->string('model')->toString());

        $this->createMissing($this->permissionNamesFor($model));

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()
            ->route('admin.permissions.index',['current_team' => $current_team])
            ->with('success',"Standard permissions generated for {$model}.");
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    /** Class basenames found in app/Models (usado por el listado y por "all"). */
    private function modelNames(): array
    {
        $path = app_path('Models');

        if (! is_dir($path)) {
            return [];
        }

        $models = [];

        foreach (File::allFiles($path) as $file) {
            $class = 'App\\Models\\'.str_replace('/', '\\', $file->getRelativePathname());
            $class = preg_replace('/\.php$/', '', $class);

            if (is_string($class) && class_exists($class)) {
                $models[] = class_basename($class);
            }
        }

        return $models;
    }

    /** @return string[]  e.g. ['view_any_product', 'view_product', ...] */
    private function permissionNamesFor(string $model): array
    {
        $snake = Str::snake($model);

        return array_map(fn (string $action) => "{$action}_{$snake}", self::ACTIONS);
    }

    /**
     * Inserta solo los que faltan, en bloques. insertOrIgnore respeta el índice único
     * (name, guard_name) y no dispara eventos, así que no hay N invalidaciones de caché.
     * Devuelve cuántos se crearon realmente.
     */
    private function createMissing(array $names): int
    {
        $now = now();
        $created = 0;

        foreach (array_chunk($names, self::CHUNK_SIZE) as $chunk) {
            $created += Permission::query()->insertOrIgnore(
                array_map(fn (string $name) => [
                    'name' => $name,
                    'guard_name' => 'web',
                    'created_at' => $now,
                    'updated_at' => $now,
                ], $chunk)
            );
        }

        return $created;
    }

    /**
     * Borra los permisos que ya no corresponden a ningún modelo (nunca los superadmin*).
     * Se compara en PHP y se borra por id en bloques: un whereNotIn con cientos de
     * nombres genera una query enorme.
     */
    private function deleteStale(array $validNames): int
    {
        $valid = array_flip($validNames);

        $staleIds = Permission::query()
            ->where('name', 'not like', 'superadmin%')
            ->pluck('name', 'id')
            ->reject(fn (string $name) => isset($valid[$name]))
            ->keys();

        foreach ($staleIds->chunk(self::CHUNK_SIZE) as $chunk) {
            Permission::query()->whereIn('id', $chunk->all())->delete();
        }

        return $staleIds->count();
    }

    private function ensurePermissionIsNotProtected(string $name): void
    {
        $normalized = Str::lower(trim($name));

        foreach (self::PROTECTED_PERMISSION_PREFIXES as $prefix) {
            if ($normalized === $prefix || Str::startsWith($normalized, "{$prefix}_")) {
                abort(403, 'This permission is reserved for the platform.');
            }
        }
    }
}