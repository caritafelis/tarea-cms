<?php

namespace App\Http\Controllers;

use App\Models\DownloadGrant;
use Illuminate\Contracts\Support\Responsable;

class DownloadController extends Controller
{
    public function show(string $token): Responsable
    {
        $grant = DownloadGrant::with('media')->where('token', $token)->firstOrFail();

        $claimed = DownloadGrant::whereKey($grant->id)
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->where(fn ($q) => $q->whereNull('download_limit')->orWhereColumn('downloads_count', '<', 'download_limit'))
            ->increment('downloads_count');

        abort_if($claimed === 0, 410, __('This download link has expired or reached its limit.'));

        return $grant->media;
    }
}