<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Carrier;
use App\Models\CarrierOption;
use App\Models\Zone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CarrierController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/carriers/index', [
            'carriers' => Carrier::query()->with('options.zone')->orderBy('name')->get(),
            'zones' => Zone::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/carriers/create');
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:carriers,slug',
            'driver' => 'nullable|string|max:255',
            'link_url' => 'nullable|url|max:255',
            'description' => 'nullable|string|max:255',
            'shipping_amount' => 'nullable|integer|min:0',
            'is_enabled' => 'boolean',
        ]);

        Carrier::create($data);

        return redirect()->route('admin.carriers.index', ['current_team' => $current_team])->with('success', 'Carrier created successfully.');
    }

    public function show(string $current_team, Carrier $carrier)
    {
        return Inertia::render('admin/carriers/show', [
            'carrier' => $carrier->load('options.zone'),
        ]);
    }

    public function edit(string $current_team, Carrier $carrier)
    {
        return Inertia::render('admin/carriers/edit', [
            'carrier' => $carrier->load('options.zone'),
            'zones' => Zone::all(),
        ]);
    }

    public function update(Request $request, string $current_team, Carrier $carrier)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:carriers,slug,'.$carrier->id,
            'driver' => 'nullable|string|max:255',
            'link_url' => 'nullable|url|max:255',
            'description' => 'nullable|string|max:255',
            'shipping_amount' => 'nullable|integer|min:0',
            'is_enabled' => 'boolean',
        ]);

        $carrier->update($data);

        return redirect()->route('admin.carriers.index', ['current_team' => $current_team])->with('success', 'Carrier updated successfully.');
    }

    public function destroy(string $current_team, Carrier $carrier)
    {
        $carrier->delete();

        return redirect()->route('admin.carriers.index', ['current_team' => $current_team])->with('success', 'Carrier deleted successfully.');
    }

    public function storeOption(Request $request, string $current_team, Carrier $carrier)
    {
        $data = $request->validate([
            'zone_id' => 'required|exists:zones,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'price' => 'required|integer|min:0',
            'is_enabled' => 'boolean',
            'shipping_classes' => ['nullable', 'string', 'max:255'],
        ]);

        $data['metadata'] = ['shipping_classes' => array_values(array_filter(
            array_map('trim', explode(',', (string) ($data['shipping_classes'] ?? ''))),
        ))];
        unset($data['shipping_classes']);

        $carrier->options()->create($data);

        return redirect()->route('admin.carriers.index', ['current_team' => $current_team])->with('success', 'Carrier rate created successfully.');
    }

    public function updateOption(Request $request, string $current_team, Carrier $carrier, CarrierOption $option)
    {
        $data = $request->validate([
            'zone_id' => 'sometimes|required|exists:zones,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:255',
            'price' => 'sometimes|required|integer|min:0',
            'is_enabled' => 'boolean',
            'shipping_classes' => ['nullable', 'string', 'max:255'],
        ]);

        $data['metadata'] = ['shipping_classes' => array_values(array_filter(
            array_map('trim', explode(',', (string) ($data['shipping_classes'] ?? ''))),
        ))];
        unset($data['shipping_classes']);

        $option->update($data);

        return redirect()->route('admin.carriers.index', ['current_team' => $current_team])->with('success', 'Carrier rate updated successfully.');
    }

    public function destroyOption(string $current_team, Carrier $carrier, CarrierOption $option)
    {
        $option->delete();

        return redirect()->route('admin.carriers.index', ['current_team' => $current_team])->with('success', 'Carrier rate deleted successfully.');
    }
}
