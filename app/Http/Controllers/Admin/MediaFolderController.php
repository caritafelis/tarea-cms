<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Entitlements;
use App\Models\MediaFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MediaFolderController extends Controller
{
    public function index(string $current_team)
    {
        return MediaFolder::query()
            ->with('children')
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get();
    }

    // public function store(
    //     Request $request,
    //     string $current_team
    // ) {

    //     $request->validate([
    //         'name' => [
    //             'required',
    //             'string',
    //             'max:255',
    //         ],
    //         'parent_id' => [
    //             'nullable',
    //             'exists:media_folders,id',
    //         ],
    //     ]);

    //     Entitlements::assertUpload(auth()->user()->currentTeam, $request->file('file')->getSize());

    //     return MediaFolder::create([
    //         'name' => $request->name,

    //         'slug' => Str::slug(
    //             $request->name
    //         ),

    //         'parent_id' => $request->parent_id,
    //     ]);
    // }

    public function update(
        Request $request,
        string $current_team,
        MediaFolder $folder
    ) {

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
        ]);

        $folder->update([
            'name' => $request->name,

            'slug' => Str::slug(
                $request->name
            ),
        ]);

        return $folder;
    }

    public function destroy(
        string $current_team,
        MediaFolder $folder
    ) {
        $folder->delete();

        return response()
            ->noContent();
    }
}
