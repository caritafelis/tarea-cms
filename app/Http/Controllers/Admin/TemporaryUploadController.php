<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaLibrary;
use Illuminate\Http\Request;

/**
 * Inline uploads used while composing content (e.g. dropping an image into
 * a Post/Page/Product rich-text field) before the parent record is saved.
 * Files land in the 'temporary' collection and are promoted/re-attached by
 * the owning form on save, or purged by app:prune-temporary-uploads if the
 * form is abandoned.
 */
class TemporaryUploadController extends Controller
{
    public function store(Request $request, string $current_team)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $owner = MediaLibrary::create();

        $media = $owner
            ->addMediaFromRequest('file')
            ->withCustomProperties(['temporary' => true])
            ->toMediaCollection('temporary');

        return response()->json([
            'id' => $media->id,
            'name' => $media->name,
            'file_name' => $media->file_name,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'url' => $media->getUrl(),
        ]);
    }

    public function destroy(string $current_team, MediaLibrary $mediaLibrary)
    {
        $mediaLibrary->delete();

        return response()->noContent();
    }
}
