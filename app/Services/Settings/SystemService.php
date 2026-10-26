<?php

namespace App\Services\Settings;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

class SystemService
{
    public function run(string $action): string
    {
        return match ($action) {
            'clear-cache' => $this->artisan('cache:clear'),
            'optimize' => $this->artisan('optimize'),
            'queue-restart' => $this->artisan('queue:restart'),
            'config-cache' => $this->artisan('config:cache'),
            'route-cache' => $this->artisan('route:cache'),
            'view-cache' => $this->artisan('view:cache'),
            default => throw new \InvalidArgumentException("Unknown system action [{$action}]"),
        };
    }

    protected function artisan(string $command): string
    {
        Artisan::call($command);

        return Artisan::output();
    }

    public function storageUsage(): array
    {
        $disk = Storage::disk('public');
        $bytes = collect($disk->allFiles())->sum(fn ($file) => $disk->size($file));

        return [
            'used_bytes' => $bytes,
            'used_human' => $this->humanBytes($bytes),
        ];
    }

    protected function humanBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = $bytes > 0 ? floor(log($bytes, 1024)) : 0;

        return round($bytes / (1024 ** $i), 2).' '.$units[$i];
    }
}
