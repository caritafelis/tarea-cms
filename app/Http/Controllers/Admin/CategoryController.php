<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/categories/index', [
            'categories' => Category::query()->with('parent')->orderBy('position')->get(),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/categories/create', [
            'categories' => Category::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'description' => 'nullable|string',
            'position' => 'nullable|integer|min:0',
            'is_enabled' => 'boolean',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        Category::create($data);

        return redirect()->route('admin.categories.index', ['current_team' => $current_team])->with('success', 'Category created successfully.');
    }

    public function show(string $current_team, Category $category)
    {
        return Inertia::render('admin/categories/show', [
            'category' => $category->load('parent')->loadCount('products'),
            'categories' => Category::all(),
        ]);
    }

    public function edit(string $current_team, Category $category)
    {
        return Inertia::render('admin/categories/edit', [
            'category' => $category,
            'categories' => Category::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, string $current_team, Category $category)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug,'.$category->id,
            'description' => 'nullable|string',
            'position' => 'nullable|integer|min:0',
            'is_enabled' => 'boolean',
            'parent_id' => 'nullable|exists:categories,id|different:id',
        ]);

        $category->update($data);

        return redirect()->route('admin.categories.index', ['current_team' => $current_team])->with('success', 'Category updated successfully.');
    }

    public function destroy(string $current_team, Category $category)
    {
        $category->delete();

        return redirect()->route('admin.categories.index', ['current_team' => $current_team])->with('success', 'Category deleted successfully.');
    }
}
