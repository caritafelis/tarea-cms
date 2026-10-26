<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderShipping;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderShipping>
 */
class OrderShippingFactory extends Factory
{
    protected $model = OrderShipping::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'shipped_at' => $this->faker->dateTimeBetween('-30 days'),
            'order_id' => Order::factory(),
        ];
    }
}
