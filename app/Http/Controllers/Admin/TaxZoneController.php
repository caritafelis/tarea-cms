<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\TaxZone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaxZoneController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/tax-zones/index', [
            'taxZones' => TaxZone::query()->with(['country', 'rates'])->orderBy('id')->get(),
            'countries' => Country::orderBy('name')->get(['id', 'name', 'cca2']),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/tax-zones/create', [
            'countries' => Country::orderBy('name')->get(),
            'taxZones' => TaxZone::with('country')->get(),
        ]);
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'country_id' => 'nullable|exists:countries,id',
            'parent_id' => 'nullable|exists:tax_zones,id',
            'name' => 'nullable|string|max:255',
            'province_code' => 'nullable|string|max:255',
            'is_tax_inclusive' => 'boolean',
            'rates' => 'nullable|array',
            'rates.*.name' => 'required_with:rates|string|max:255',
            'rates.*.code' => 'nullable|string|max:255',
            'rates.*.rate' => 'required_with:rates|numeric|min:0',
            'rates.*.is_default' => 'boolean',
            'rates.*.is_combinable' => 'boolean',
        ]);

        $rates = $data['rates'] ?? [];
        unset($data['rates']);

        $taxZone = TaxZone::create($data);

        foreach ($rates as $rate) {
            $taxZone->rates()->create($rate);
        }

        return redirect()->route('admin.tax-zones.index', ['current_team' => $current_team])->with('success', 'Tax zone created successfully.');
    }

    public function show(string $current_team, TaxZone $taxZone)
    {
        return Inertia::render('admin/tax-zones/show', [
            'taxZone' => $taxZone->load(['country', 'rates']),
            'countries' => Country::orderBy('name')->get(),
            'taxZones' => TaxZone::with('country')->get(),
        ]);
    }

    public function edit(string $current_team, TaxZone $taxZone)
    {
        return Inertia::render('admin/tax-zones/edit', [
            'taxZone' => $taxZone->load('rates'),
            'countries' => Country::orderBy('name')->get(),
            'taxZones' => TaxZone::with('country')->get(),
        ]);
    }

    public function update(Request $request, string $current_team, TaxZone $taxZone)
    {
        $data = $request->validate([
            'country_id' => 'nullable|exists:countries,id',
            'parent_id' => 'nullable|exists:tax_zones,id|different:id',
            'name' => 'nullable|string|max:255',
            'province_code' => 'nullable|string|max:255',
            'is_tax_inclusive' => 'boolean',
            'rates' => 'nullable|array',
            'rates.*.id' => 'nullable|exists:tax_rates,id',
            'rates.*.name' => 'required_with:rates|string|max:255',
            'rates.*.code' => 'nullable|string|max:255',
            'rates.*.rate' => 'required_with:rates|numeric|min:0',
            'rates.*.is_default' => 'boolean',
            'rates.*.is_combinable' => 'boolean',
        ]);

        $rates = $data['rates'] ?? null;
        unset($data['rates']);

        $taxZone->update($data);

        if ($rates !== null) {
            $keep = [];
            foreach ($rates as $rate) {
                $payload = collect($rate)->except('id')->all();
                if (! empty($rate['id'])) {
                    $taxZone->rates()->where('id', $rate['id'])->update($payload);
                    $keep[] = $rate['id'];
                } else {
                    $keep[] = $taxZone->rates()->create($payload)->id;
                }
            }
            $taxZone->rates()->whereNotIn('id', $keep)->delete();
        }

        return redirect()->route('admin.tax-zones.index', ['current_team' => $current_team])->with('success', 'Tax zone updated successfully.');
    }

    public function destroy(string $current_team, TaxZone $taxZone)
    {
        $taxZone->delete();

        return redirect()->route('admin.tax-zones.index', ['current_team' => $current_team])->with('success', 'Tax zone deleted successfully.');
    }
}
