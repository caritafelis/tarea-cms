<?php

namespace Database\Factories;

use App\Models\OrderAddress;
use Illuminate\Database\Eloquent\Factories\Factory;
use Tests\Core\Stubs\User;

/**
 * @extends Factory<OrderAddress>
 */
class OrderAddressFactory extends Factory
{
    protected $model = OrderAddress::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id' => User::factory(),
            'last_name' => $this->faker->lastName(),
            'first_name' => $this->faker->firstName(),
            'street_address' => $this->faker->streetAddress(),
            'postal_code' => $this->faker->postcode(),
            'city' => $this->faker->city(),
        ];
    }
}
