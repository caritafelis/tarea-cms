<?php

namespace Database\Factories;

use App\Enums\AddressType;
use App\Models\Address;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    protected $model = Address::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'company_name' => $this->faker->company(),
            'street_address' => $this->faker->streetAddress(),
            'street_address_plus' => $this->faker->streetSuffix(),
            'city' => $this->faker->city(),
            'postal_code' => $this->faker->postcode(),
            'type' => $this->faker->randomElement(AddressType::values()),
            'shipping_default' => $this->faker->boolean,
            'billing_default' => $this->faker->boolean,
        ];
    }
}
