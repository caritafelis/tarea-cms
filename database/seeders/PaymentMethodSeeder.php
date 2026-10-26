<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

final class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        PaymentMethod::query()->create([
            'title' => 'Cash on delivery',
            'slug' => 'cod',
            'is_enabled' => true,
            'driver' => 'manual',
        ]);
    }
}
