<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\Zone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ZoneController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/zones/index', [
            'zones' => Zone::query()->with('currency')->orderBy('name')->get(),
            'currencies' => Currency::all(),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/zones/create', [
            'currencies' => Currency::all(),
        ]);
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:zones,name',
            'slug' => 'nullable|string|max:255|unique:zones,slug',
            'code' => 'nullable|string|max:255|unique:zones,code',
            'is_enabled' => 'boolean',
            'currency_id' => 'required|exists:currencies,id',
        ]);

        Zone::create($data);

        return redirect()->route('admin.zones.index', ['current_team' => $current_team])->with('success', 'Zone created successfully.');
    }

    public function show(string $current_team, Zone $zone)
    {
        return Inertia::render('admin/zones/show', [
            'zone' => $zone->load('currency'),
            'currencies' => Currency::all(),
        ]);
    }

    public function edit(string $current_team, Zone $zone)
    {
        return Inertia::render('admin/zones/edit', [
            'zone' => $zone,
            'currencies' => Currency::all(),
        ]);
    }

    public function update(Request $request, string $current_team, Zone $zone)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:zones,name,'.$zone->id,
            'slug' => 'nullable|string|max:255|unique:zones,slug,'.$zone->id,
            'code' => 'nullable|string|max:255|unique:zones,code,'.$zone->id,
            'is_enabled' => 'boolean',
            'currency_id' => 'sometimes|required|exists:currencies,id',
        ]);

        $zone->update($data);

        return redirect()->route('admin.zones.index', ['current_team' => $current_team])->with('success', 'Zone updated successfully.');
    }

    public function destroy(string $current_team, Zone $zone)
    {
        $zone->delete();

        return redirect()->route('admin.zones.index', ['current_team' => $current_team])->with('success', 'Zone deleted successfully.');
    }
}
