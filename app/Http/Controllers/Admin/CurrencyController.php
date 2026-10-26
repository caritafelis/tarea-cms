<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CurrencyController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/currencies/index', [
            'currencies' => Currency::query()->orderBy('code')->get(),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/currencies/create');
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:currencies,code',
            'symbol' => 'required|string|max:25',
            'format' => 'required|string|max:50',
            'exchange_rate' => 'nullable|numeric|min:0',
            'is_enabled' => 'boolean',
        ]);

        Currency::create($data);

        return redirect()->route('admin.currencies.index', ['current_team' => $current_team])->with('success', 'Currency created successfully.');
    }

    public function show(string $current_team, Currency $currency)
    {
        return Inertia::render('admin/currencies/show', [
            'currency' => $currency,
        ]);
    }

    public function edit(string $current_team, Currency $currency)
    {
        return Inertia::render('admin/currencies/edit', [
            'currency' => $currency,
        ]);
    }

    public function update(Request $request, string $current_team, Currency $currency)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:10|unique:currencies,code,'.$currency->id,
            'symbol' => 'sometimes|required|string|max:25',
            'format' => 'sometimes|required|string|max:50',
            'exchange_rate' => 'nullable|numeric|min:0',
            'is_enabled' => 'boolean',
        ]);

        $currency->update($data);

        return redirect()->route('admin.currencies.index', ['current_team' => $current_team])->with('success', 'Currency updated successfully.');
    }

    public function destroy(string $current_team, Currency $currency)
    {
        $currency->delete();

        return redirect()->route('admin.currencies.index', ['current_team' => $current_team])->with('success', 'Currency deleted successfully.');
    }
}
