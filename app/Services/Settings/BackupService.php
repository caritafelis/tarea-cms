<?php

namespace App\Services\Settings;

use App\Models\Backup;
use App\Models\Setting;
use Illuminate\Support\Facades\Storage;

class BackupService
{
    /** Kicks off a backup. Wire to spatie/laravel-backup's Artisan command for production use. */
    public function runNow(): Backup
    {
        $disk = Setting::get('backups.destination', 'local');
        $path = 'backups/backup-'.now()->format('Y-m-d_His').'.zip';

        $backup = Backup::create([
            'disk' => $disk,
            'path' => $path,
            'status' => 'running',
            'type' => 'manual',
        ]);

        // TODO: dispatch a queued job that runs `php artisan backup:run` and
        // updates $backup->status / size_bytes on completion.

        return $backup;
    }

    public function delete(Backup $backup): void
    {
        Storage::disk($backup->disk)->delete($backup->path);
        $backup->delete();
    }

    public function downloadUrl(Backup $backup): string
    {
        return Storage::disk($backup->disk)->temporaryUrl($backup->path, now()->addMinutes(10));
    }
}
