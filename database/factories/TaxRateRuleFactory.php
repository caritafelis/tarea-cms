<?php

namespace Database\Factories;

use App\Models\TaxRate;
use App\Models\TaxRateRule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaxRateRule>
 */
class TaxRateRuleFactory extends Factory
{
    protected $model = TaxRateRule::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reference_type' => 'product_type',
            'reference_id' => 'standard',
            'tax_rate_id' => TaxRate::factory(),
        ];
    }
}
