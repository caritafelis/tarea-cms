<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers.
     */
    public function index(string $current_team): Response
    {
        $suppliers = Supplier::query()
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/suppliers/index', [
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Show the form for creating a new supplier.
     */
    public function create(string $current_team): Response
    {
        return Inertia::render('admin/suppliers/create');
    }

    /**
     * Store a newly created supplier.
     */
    public function store(Request $request, string $current_team): RedirectResponse 
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'slug' => ['nullable','string','max:255','unique:suppliers,slug'],
            'email' => ['nullable','email','max:255'],
            'phone' => ['nullable','string','max:50'],
            'contact_name' => ['nullable','string','max:255'],
            'website' => ['nullable','url','max:255'],
            'description' => ['nullable','string'],
            'notes' => ['nullable','string'],
            'is_enabled' => ['sometimes','boolean'],
        ]);

        $data['is_enabled'] = $data['is_enabled'] ?? true;

        Supplier::create($data);

        return redirect()->route('admin.suppliers.index', [
            'current_team' => $current_team,
        ])->with('success', 'Supplier created successfully.');
    }

    /**
     * Display the specified supplier.
     */
    public function show(string $current_team,Supplier $supplier): Response 
    {
        $supplier->loadCount('products');

        return Inertia::render('admin/suppliers/show', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Show the form for editing the specified supplier.
     */
    public function edit(string $current_team,Supplier $supplier): Response 
    {
        return Inertia::render('admin/suppliers/edit', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request,string $current_team,Supplier $supplier): RedirectResponse 
    {
        $data = $request->validate([
            'name' => ['sometimes','required','string','max:255'],
            'slug' => ['nullable','string','max:255','unique:suppliers,slug,' . $supplier->id],
            'email' => ['nullable','email','max:255'],
            'phone' => ['nullable','string','max:50'],
            'contact_name' => ['nullable','string','max:255'],
            'website' => ['nullable','url','max:255'],
            'description' => ['nullable','string'],
            'notes' => ['nullable','string'],
            'is_enabled' => ['sometimes','boolean'],
        ]);

        $supplier->update($data);

        return redirect()->route('admin.suppliers.index', ['current_team' => $current_team,])->with('success', 'Supplier updated successfully.');
    }

    /**
     * Enable the specified supplier.
     */
    public function enable(string $current_team,Supplier $supplier): RedirectResponse 
    {
        $supplier->update(['is_enabled' => true]);

        return redirect()->back()->with('success', 'Supplier enabled successfully.');
    }

    /**
     * Disable the specified supplier.
     */
    public function disable(string $current_team,Supplier $supplier): RedirectResponse 
    {
        $supplier->update(['is_enabled' => false]);

        return redirect()->back()->with('success', 'Supplier disabled successfully.');
    }

    /**
     * Toggle the enabled state of the specified supplier.
     */
    public function toggle(string $current_team,Supplier $supplier): RedirectResponse 
    {
        $supplier->update(['is_enabled' => ! $supplier->is_enabled]);

        return redirect()->back()->with('success',$supplier->is_enabled? 'Supplier enabled successfully.': 'Supplier disabled successfully.');
    }

    /**
     * Remove the specified supplier.
     */
    public function destroy(string $current_team,Supplier $supplier): RedirectResponse 
    {
        $supplier->delete();

        return redirect()->route('admin.suppliers.index', ['current_team' => $current_team,])->with('success', 'Supplier deleted successfully.');
    }

    /**
     * Restore the specified supplier.
     *
     * Requires the Supplier model to use SoftDeletes.
     */
    public function restore(string $current_team,int $supplier): RedirectResponse 
    {
        $model = Supplier::withTrashed()->findOrFail($supplier);

        $model->restore();

        return redirect()->route('admin.suppliers.index', ['current_team' => $current_team,])->with('success', 'Supplier restored successfully.');
    }

    /**
     * Permanently delete the specified supplier.
     *
     * Requires the Supplier model to use SoftDeletes.
     */
    public function forceDestroy(string $current_team,int $supplier): RedirectResponse 
    {
        $model = Supplier::withTrashed()->findOrFail($supplier);

        $model->forceDelete();

        return redirect()->route('admin.suppliers.index', ['current_team' => $current_team,])->with('success', 'Supplier permanently deleted.');
    }

    /**
     * Display deleted suppliers.
     *
     * Requires the Supplier model to use SoftDeletes.
     */
    public function trashed(string $current_team): Response
    {
        $suppliers = Supplier::onlyTrashed()
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/suppliers/trashed', [
            'suppliers' => $suppliers,
        ]);
    }
}