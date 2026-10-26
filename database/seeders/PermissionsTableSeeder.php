<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

final class PermissionsTableSeeder extends Seeder
{
    public function run(): void
    {
        $path = app_path('Models');

        if (! is_dir($path)) {
            return;
        }

        foreach (File::allFiles($path) as $file) {
            $relativePath = $file->getRelativePathname();

            $class = 'App\\Models\\'.str_replace('/', '\\', $relativePath);

            $class = preg_replace('/\.php$/','',$class);

            if (! is_string($class) || ! class_exists($class)) {
                continue;
            }

            Permission::generate(Str::snake(class_basename($class)));
        }
    }
}