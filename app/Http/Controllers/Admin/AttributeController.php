<?php

namespace App\Http\Controllers\Admin;

use App\Enums\FieldType;
use App\Http\Controllers\Controller;
use App\Models\Attribute;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AttributeController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/attributes/index', [
            'attributes' => Attribute::query()->with('values')->orderBy('name')->get(),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/attributes/create');
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:attributes,slug',
            'description' => 'nullable|string|max:255',
            'type' => ['required', Rule::enum(FieldType::class)],
            'is_enabled' => 'boolean',
            'is_searchable' => 'boolean',
            'is_filterable' => 'boolean',
            'icon' => 'nullable|string|max:255',
            'values' => 'nullable|array',
            'values.*.value' => 'required_with:values|string|max:50',
            'values.*.key' => 'required_with:values|string',
        ]);

        $values = $data['values'] ?? [];
        unset($data['values']);

        $attribute = Attribute::create($data);

        foreach ($values as $index => $value) {
            $attribute->values()->create($value + ['position' => $index + 1]);
        }

        return redirect()->route('admin.attributes.index', ['current_team' => $current_team])->with('success', 'Attribute created successfully.');
    }

    public function show(string $current_team, Attribute $attribute)
    {
        return Inertia::render('admin/attributes/show', [
            'attribute' => $attribute->load('values'),
        ]);
    }

    public function edit(string $current_team, Attribute $attribute)
    {
        return Inertia::render('admin/attributes/edit', [
            'attribute' => $attribute->load('values'),
        ]);
    }

    public function update(Request $request, string $current_team, Attribute $attribute)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:attributes,slug,'.$attribute->id,
            'description' => 'nullable|string|max:255',
            'type' => ['required', Rule::enum(FieldType::class)],
            'is_enabled' => 'boolean',
            'is_searchable' => 'boolean',
            'is_filterable' => 'boolean',
            'icon' => 'nullable|string|max:255',
            'values' => 'nullable|array',
            'values.*.id' => 'nullable|exists:attribute_values,id',
            'values.*.value' => 'required_with:values|string|max:50',
            'values.*.key' => 'required_with:values|string',
        ]);

        $values = $data['values'] ?? null;
        unset($data['values']);

        $attribute->update($data);

        if ($values !== null) {
            $keep = [];
            foreach ($values as $index => $value) {
                $payload = ['value' => $value['value'], 'key' => $value['key'], 'position' => $index + 1];
                if (! empty($value['id'])) {
                    $attribute->values()->where('id', $value['id'])->update($payload);
                    $keep[] = $value['id'];
                } else {
                    $keep[] = $attribute->values()->create($payload)->id;
                }
            }
            $attribute->values()->whereNotIn('id', $keep)->delete();
        }

        return redirect()->route('admin.attributes.index', ['current_team' => $current_team])->with('success', 'Attribute updated successfully.');
    }

    public function destroy(string $current_team, Attribute $attribute)
    {
        $attribute->delete();

        return redirect()->route('admin.attributes.index', ['current_team' => $current_team])->with('success', 'Attribute deleted successfully.');
    }
}
