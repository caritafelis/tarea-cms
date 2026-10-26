<?php

namespace App\JsonApi\V1\Posts;

use Illuminate\Validation\Rule;
use LaravelJsonApi\Laravel\Http\Requests\ResourceRequest;

class PageRequest extends ResourceRequest
{
    public function rules(): array
    {
        $page = $this->model();

        return [
            'title' => [$page ? 'sometimes' : 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'alpha_dash', 'max:255', Rule::unique('pages', 'slug')->ignore($page?->getKey())],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'sections' => ['nullable', 'array'],
        ];
    }
}