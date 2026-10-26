<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Legal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LegalController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/legals/index', [
            'legals' => Legal::query()->orderBy('title')->get(),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/legals/create');
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:legals,slug',
            'content' => 'nullable|string',
            'is_enabled' => 'boolean',
        ]);

        Legal::create($data);

        return redirect()->route('admin.legals.index', ['current_team' => $current_team])->with('success', 'Legal page created successfully.');
    }

    public function show(string $current_team, Legal $legal)
    {
        return Inertia::render('admin/legals/show', [
            'legal' => $legal,
        ]);
    }

    public function edit(string $current_team, Legal $legal)
    {
        return Inertia::render('admin/legals/edit', [
            'legal' => $legal,
        ]);
    }

    public function update(Request $request, string $current_team, Legal $legal)
    {
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:legals,slug,'.$legal->id,
            'content' => 'nullable|string',
            'is_enabled' => 'boolean',
        ]);

        $legal->update($data);

        return redirect()->route('admin.legals.index', ['current_team' => $current_team])->with('success', 'Legal page updated successfully.');
    }

    public function destroy(string $current_team, Legal $legal)
    {
        $legal->delete();

        return redirect()->route('admin.legals.index', ['current_team' => $current_team])->with('success', 'Legal page deleted successfully.');
    }
}
