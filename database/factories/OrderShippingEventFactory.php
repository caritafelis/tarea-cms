<?php

namespace Database\Factories;

use App\Enums\ShipmentStatus;
use App\Models\OrderShipping;
use App\Models\OrderShippingEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderShippingEvent>
 */
class OrderShippingEventFactory extends Factory
{
    protected $model = OrderShippingEvent::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'status' => $this->faker->randomElement(ShipmentStatus::cases()),
            'description' => $this->faker->optional()->sentence(),
            'location' => $this->faker->optional()->city(),
            'occurred_at' => $this->faker->dateTimeBetween('-7 days'),
            'order_shipping_id' => OrderShipping::factory(),
        ];
    }
}
