<?php

namespace Database\Seeders;

use App\Models\Carrier;
use Illuminate\Database\Seeder;

final class CarrierSeeder extends Seeder
{
    public function run(): void
    {
        Carrier::query()->updateOrCreate(
            [
                'slug' => 'manual',
            ],
            [
                'name' => 'Local',
                'is_enabled' => true,
                'driver' => 'manual',
            ],
        );
    }
}