<?php

namespace Database\Factories;

use App\Models\Channel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Channel>
 */
class ChannelFactory extends Factory
{
    protected $model = Channel::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->word(),
            'slug' => $this->faker->slug(),
            'timezone' => $this->faker->timezone(),
            'url' => $this->faker->url(),
            'is_enabled' => $this->faker->boolean(),
            'is_default' => $this->faker->boolean(),
        ];
    }
}
