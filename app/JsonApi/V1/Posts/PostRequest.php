<?php

namespace App\JsonApi\V1\Posts;

use Illuminate\Validation\Rule;
use LaravelJsonApi\Laravel\Http\Requests\ResourceRequest;

class PostRequest extends ResourceRequest
{
    public function rules(): array
    {
        $post = $this->model();

        return [
            'title' => [$post ? 'sometimes' : 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'alpha_dash', 'max:255', Rule::unique('posts', 'slug')->ignore($post?->getKey())],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'sections' => ['nullable', 'array'],
        ];
    }
}