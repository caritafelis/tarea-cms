<?php

namespace Database\Factories;

use App\Models\Discount;
use App\Models\DiscountDetail;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiscountDetail>
 */
class DiscountDetailFactory extends Factory
{
    protected $model = DiscountDetail::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'discountable_type' => Product::class,
            'discountable_id' => Product::factory(),
            'discount_id' => Discount::factory(),
        ];
    }
}
