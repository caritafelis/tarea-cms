<?php

namespace Database\Factories;

use App\Models\Currency;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Zone>
 */
class ZoneFactory extends Factory
{
    protected $model = Zone::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $currency = Currency::query()->firstOrCreate(
            ['code' => 'USD'],
            [
                'name' => 'US Dollar',
                'symbol' => '$',
                'format' => '$1,234.56',
            ]
        );

        return [
            'name' => $this->faker->unique()->word().' Zone',
            'currency_id' => $currency->id,
        ];
    }
}
