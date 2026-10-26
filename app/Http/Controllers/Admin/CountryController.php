<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CountryController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/countries/index', [
            'countries' => Country::query()->orderBy('name')->get(),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/countries/create');
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'name_official' => 'required|string|max:255',
            'region' => 'required|string|max:255',
            'subregion' => 'nullable|string|max:255',
            'cca2' => 'required|string|size:2|unique:countries,cca2',
            'cca3' => 'required|string|size:3|unique:countries,cca3',
            'flag' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'phone_calling_code' => 'required|array',
            'currencies' => 'required|array',
        ]);

        Country::create($data);

        return redirect()->route('admin.countries.index', ['current_team' => $current_team])->with('success', 'Country created successfully.');
    }

    public function show(string $current_team, Country $country)
    {
        return Inertia::render('admin/countries/show', [
            'country' => $country,
        ]);
    }

    public function edit(string $current_team, Country $country)
    {
        return Inertia::render('admin/countries/edit', [
            'country' => $country,
        ]);
    }

    public function update(Request $request, string $current_team, Country $country)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'name_official' => 'sometimes|required|string|max:255',
            'region' => 'sometimes|required|string|max:255',
            'subregion' => 'nullable|string|max:255',
            'cca2' => 'sometimes|required|string|size:2|unique:countries,cca2,'.$country->id,
            'cca3' => 'sometimes|required|string|size:3|unique:countries,cca3,'.$country->id,
            'flag' => 'sometimes|required|string|max:255',
            'latitude' => 'sometimes|required|numeric|between:-90,90',
            'longitude' => 'sometimes|required|numeric|between:-180,180',
            'phone_calling_code' => 'sometimes|required|array',
            'currencies' => 'sometimes|required|array',
        ]);

        $country->update($data);

        return redirect()->route('admin.countries.index', ['current_team' => $current_team])->with('success', 'Country updated successfully.');
    }

    public function destroy(string $current_team, Country $country)
    {
        $country->delete();

        return redirect()->route('admin.countries.index', ['current_team' => $current_team])->with('success', 'Country deleted successfully.');
    }
}
