<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\MediaLibrary;
use Illuminate\Http\Request;
use Spatie\MediaLibrary\Conversions\FileManipulator;

class MediaController extends Controller
{
    public function index(Request $request, string $current_team)
    {
        $query = Media::query();

        if ($request->filled('folder_id')) {
            $query->where('folder_id', $request->integer('folder_id'));
        }

        if ($request->filled('search')) {
            $query->where('file_name', 'like', '%'.$request->search.'%');
        }

        return $query
            ->latest()
            ->paginate(48)
            ->through(fn (Media $media) => [
                'id' => $media->id,
                'folder_id' => $media->folder_id,
                'name' => $media->name,
                'file_name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'original_url' => $media->getUrl(),
                'thumb_url' => $this->safeGetUrl($media, 'thumb'),
                'large_url' => $this->safeGetUrl($media, 'large'),
                'webp_url' => $this->safeGetUrl($media, 'webp'),
            ]);
    }

    public function store(Request $request, string $current_team)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:262144'],   // el tope real lo impone el plan
            'folder_id' => ['nullable', 'exists:media_folders,id'],
        ]);
        
        \App\Support\Entitlements::assertUpload($request->user()->currentTeam, $request->file('file')->getSize());

        $owner = MediaLibrary::create();

        $media = $owner
            ->addMediaFromRequest('file')
            ->toMediaCollection('uploads');

        $media->update(['folder_id' => $request->folder_id]);

        return response()->json([
            'id' => $media->id,
            'name' => $media->name,
            'file_name' => $media->file_name,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'original_url' => $media->getUrl(),
            'thumb_url' => $media->getUrl(),
        ]);
    }

    public function metadata(Request $request, string $current_team, Media $media)
    {
        $request->validate([
            'alt' => ['nullable', 'string'],
            'title' => ['nullable', 'string'],
            'caption' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $media->setCustomProperty('alt', $request->alt);
        $media->setCustomProperty('title', $request->title);
        $media->setCustomProperty('caption', $request->caption);
        $media->setCustomProperty('description', $request->description);
        $media->save();

        return response()->json(['success' => true]);
    }

    public function crop(Request $request, string $current_team, Media $media)
    {
        $request->validate(['crop' => ['required', 'array']]);

        $media->setCustomProperty('crop', $request->crop);
        $media->save();

        app(FileManipulator::class)
            ->createDerivedFiles($media);

        return response()->json(['success' => true]);
    }

    public function replace(Request $request, string $current_team, Media $media)
    {
        $request->validate(['file' => ['required', 'file']]);

        $model = $media->model;
        $collection = $media->collection_name;
        $props = $media->custom_properties;
        $order = $media->order_column;
        $folder = $media->folder_id;

        $media->delete();

        $newMedia = $model
            ->addMediaFromRequest('file')
            ->toMediaCollection($collection);

        $newMedia->update([
            'folder_id' => $folder,
            'order_column' => $order,
            'custom_properties' => $props,
        ]);

        return response()->json($newMedia);
    }

    public function update(Request $request, string $current_team, Media $media)
    {
        $request->validate(['folder_id' => ['nullable', 'exists:media_folders,id']]);

        $media->update(['folder_id' => $request->folder_id]);

        return response()->json(['success' => true]);
    }

    public function destroy(string $current_team, Media $media)
    {
        $media->delete();

        return response()->noContent();
    }

    private function safeGetUrl(Media $media, string $conversion): ?string
    {
        if (! $media->hasGeneratedConversion($conversion)) {
            return $conversion === 'thumb' ? $media->getUrl() : null;
        }

        try {
            return $media->getUrl($conversion);
        } catch (\Throwable) {
            return $conversion === 'thumb' ? $media->getUrl() : null;
        }
    }
}
