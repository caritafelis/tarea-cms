<?php

namespace Database\Factories;

use App\Enums\OrderRefundStatus;
use App\Models\Order;
use App\Models\OrderRefund;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderRefund>
 */
class OrderRefundFactory extends Factory
{
    protected $model = OrderRefund::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'amount' => $this->faker->numberBetween(1000, 10000),
            'currency' => 'EUR',
            'status' => $this->faker->randomElement(OrderRefundStatus::cases()),
            'order_id' => Order::factory(),
        ];
    }
}
