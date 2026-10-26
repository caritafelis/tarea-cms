<?php

namespace App\Http\Controllers\Admin;

use App\Enums\DiscountApplyTo;
use App\Enums\DiscountEligibility;
use App\Enums\DiscountRequirement;
use App\Enums\DiscountType;
use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DiscountController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/discounts/index', [
            'discounts' => Discount::query()->with('zone')->orderBy('created_at', 'desc')->get(),
            'zones' => Zone::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/discounts/create', [
            'zones' => Zone::all(),
        ]);
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'is_active' => 'boolean',
            'code' => 'required|string|max:255|unique:discounts,code',
            'type' => ['required', Rule::enum(DiscountType::class)],
            'apply_to' => ['required', Rule::enum(DiscountApplyTo::class)],
            'min_required' => ['required', Rule::enum(DiscountRequirement::class)],
            'eligibility' => ['required', Rule::enum(DiscountEligibility::class)],
            'value' => 'required|integer|min:0',
            'min_required_value' => 'nullable|string|max:255',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'boolean',
            'start_at' => 'required|date',
            'end_at' => 'nullable|date|after:start_at',
            'zone_id' => 'required|exists:zones,id',
        ]);

        Discount::create($data);

        return redirect()->route('admin.discounts.index', ['current_team' => $current_team])->with('success', 'Discount created successfully.');
    }

    public function show(string $current_team, Discount $discount)
    {
        return Inertia::render('admin/discounts/show', [
            'discount' => $discount->load('zone'),
            'zones' => Zone::all(),
        ]);
    }

    public function edit(string $current_team, Discount $discount)
    {
        return Inertia::render('admin/discounts/edit', [
            'discount' => $discount,
            'zones' => Zone::all(),
        ]);
    }

    public function update(Request $request, string $current_team, Discount $discount)
    {
        $data = $request->validate([
            'is_active' => 'boolean',
            'code' => 'sometimes|required|string|max:255|unique:discounts,code,'.$discount->id,
            'type' => ['required', Rule::enum(DiscountType::class)],
            'apply_to' => ['required', Rule::enum(DiscountApplyTo::class)],
            'min_required' => ['required', Rule::enum(DiscountRequirement::class)],
            'eligibility' => ['required', Rule::enum(DiscountEligibility::class)],
            'value' => 'sometimes|required|integer|min:0',
            'min_required_value' => 'nullable|string|max:255',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'boolean',
            'start_at' => 'sometimes|required|date',
            'end_at' => 'nullable|date|after:start_at',
            'zone_id' => 'sometimes|required|exists:zones,id',
        ]);

        $discount->update($data);

        return redirect()->route('admin.discounts.index', ['current_team' => $current_team])->with('success', 'Discount updated successfully.');
    }

    public function destroy(string $current_team, Discount $discount)
    {
        $discount->delete();

        return redirect()->route('admin.discounts.index', ['current_team' => $current_team])->with('success', 'Discount deleted successfully.');
    }
}
