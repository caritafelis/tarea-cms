<?php

namespace Database\Factories;

use App\Models\TaxProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaxProvider>
 */
class TaxProviderFactory extends Factory
{
    protected $model = TaxProvider::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'identifier' => $this->faker->unique()->slug(2),
            'is_enabled' => true,
        ];
    }
}
