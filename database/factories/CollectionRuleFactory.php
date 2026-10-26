<?php

namespace Database\Factories;

use App\Enums\Operator;
use App\Enums\Rule;
use App\Models\CollectionRule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CollectionRule>
 */
class CollectionRuleFactory extends Factory
{
    protected $model = CollectionRule::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'rule' => $this->faker->randomElement(Rule::cases()),
            'operator' => $this->faker->randomElement(Operator::cases()),
            'value' => $this->faker->word(),
        ];
    }
}
