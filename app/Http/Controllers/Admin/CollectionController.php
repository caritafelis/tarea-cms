<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CollectionType;
use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CollectionController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/collections/index', [
            'collections' => Collection::query()->with('rules')->orderBy('created_at', 'desc')->get(),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/collections/create');
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:collections,slug',
            'description' => 'nullable|string',
            'type' => ['required', Rule::enum(CollectionType::class)],
            'sort' => 'nullable|string|max:255',
            'match_conditions' => 'nullable|string|in:all,any',
            'published_at' => 'nullable|date',
            'rules' => 'nullable|array',
            'rules.*.rule' => 'required_with:rules|string',
            'rules.*.operator' => 'required_with:rules|string',
            'rules.*.value' => 'required_with:rules|string',
        ]);

        $rules = $data['rules'] ?? [];
        unset($data['rules']);

        $collection = Collection::create($data);

        if ($collection->type === CollectionType::Auto && ! empty($rules)) {
            $collection->rules()->createMany($rules);
        }

        return redirect()->route('admin.collections.index', ['current_team' => $current_team])->with('success', 'Collection created successfully.');
    }

    public function show(string $current_team, Collection $collection)
    {
        return Inertia::render('admin/collections/show', [
            'collection' => $collection->load('rules'),
        ]);
    }

    public function edit(string $current_team, Collection $collection)
    {
        return Inertia::render('admin/collections/edit', [
            'collection' => $collection->load('rules'),
        ]);
    }

    public function update(Request $request, string $current_team, Collection $collection)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:collections,slug,'.$collection->id,
            'description' => 'nullable|string',
            'type' => ['required', Rule::enum(CollectionType::class)],
            'sort' => 'nullable|string|max:255',
            'match_conditions' => 'nullable|string|in:all,any',
            'published_at' => 'nullable|date',
            'rules' => 'nullable|array',
            'rules.*.rule' => 'required_with:rules|string',
            'rules.*.operator' => 'required_with:rules|string',
            'rules.*.value' => 'required_with:rules|string',
        ]);

        $rules = $data['rules'] ?? null;
        unset($data['rules']);

        $collection->update($data);

        if ($rules !== null) {
            $collection->rules()->delete();
            if (! empty($rules)) {
                $collection->rules()->createMany($rules);
            }
        }

        return redirect()->route('admin.collections.index', ['current_team' => $current_team])->with('success', 'Collection updated successfully.');
    }

    public function destroy(string $current_team, Collection $collection)
    {
        $collection->delete();

        return redirect()->route('admin.collections.index', ['current_team' => $current_team])->with('success', 'Collection deleted successfully.');
    }
}
