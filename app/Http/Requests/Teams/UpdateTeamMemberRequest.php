<?php

namespace App\Http\Requests\Teams;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UpdateTeamMemberRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $team = $this->route('team');

        $assignableRoles = Role::where('team_id', $team->id)
            ->where('name', '!=', 'Owner')
            ->pluck('name')
            ->toArray();

        return [
            'role' => ['required', 'string', Rule::in($assignableRoles)],
        ];
    }
}