<?php

namespace Database\Factories;

use App\Enums\CollectionType;
use App\Models\Collection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Collection>
 */
class CollectionFactory extends Factory
{
    protected $model = Collection::class;

    public function modelName(): string
    {
        return config('shopper.models.collection', Collection::class);
    }

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'slug' => $this->faker->unique()->slug(),
            'type' => $this->faker->randomElement(CollectionType::values()),
            'description' => $this->faker->text(),
            'published_at' => $this->faker->date(),
        ];
    }
}
