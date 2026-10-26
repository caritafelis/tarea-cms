<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BrandController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/brands/index', [
            'brands' => Brand::query()->orderBy('position')->get(),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/brands/create');
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:brands,slug',
            'website' => 'nullable|url|max:255',
            'description' => 'nullable|string',
            'position' => 'nullable|integer|min:0',
            'is_enabled' => 'boolean',
        ]);

        Brand::create($data);

        return redirect()->route('admin.brands.index', ['current_team' => $current_team])->with('success', 'Brand created successfully.');
    }

    public function show(string $current_team, Brand $brand)
    {
        return Inertia::render('admin/brands/show', ['brand' => $brand->loadCount('products')]);
    }

    public function edit(string $current_team, Brand $brand)
    {
        return Inertia::render('admin/brands/edit', ['brand' => $brand]);
    }

    public function update(Request $request, string $current_team, Brand $brand)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:brands,slug,'.$brand->id,
            'website' => 'nullable|url|max:255',
            'description' => 'nullable|string',
            'position' => 'nullable|integer|min:0',
            'is_enabled' => 'boolean',
        ]);

        $brand->update($data);

        return redirect()->route('admin.brands.index', ['current_team' => $current_team])->with('success', 'Brand updated successfully.');
    }

    public function destroy(string $current_team, Brand $brand)
    {
        $brand->delete();

        return redirect()->route('admin.brands.index', ['current_team' => $current_team])->with('success', 'Brand deleted successfully.');
    }
}
