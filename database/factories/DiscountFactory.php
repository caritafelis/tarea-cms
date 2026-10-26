<?php

namespace Database\Factories;

use App\Enums\DiscountApplyTo;
use App\Enums\DiscountEligibility;
use App\Enums\DiscountRequirement;
use App\Enums\DiscountType;
use App\Models\Discount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Discount>
 */
class DiscountFactory extends Factory
{
    protected $model = Discount::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = $this->faker->randomElement(DiscountType::values());

        return [
            'code' => $this->faker->unique()->regexify('[A-Z0-9]{8}'),
            'is_active' => $this->faker->boolean(),
            'type' => $type,
            'value' => $type === DiscountType::Percentage->value
                ? $this->faker->numberBetween(1, 100)
                : $this->faker->numberBetween(100, 100000),
            'apply_to' => $this->faker->randomElement(DiscountApplyTo::values()),
            'min_required' => $this->faker->randomElement(DiscountRequirement::values()),
            'eligibility' => $this->faker->randomElement(DiscountEligibility::values()),
            'start_at' => now(),
            'end_at' => now()->addMonth(),
        ];
    }

    public function forProduct(): static
    {
        return $this->state(fn (array $attributes): array => [
            'apply_to' => DiscountApplyTo::Products(),
        ]);
    }

    public function forOrder(): static
    {
        return $this->state(fn (array $attributes): array => [
            'apply_to' => DiscountApplyTo::Order(),
        ]);
    }
}
