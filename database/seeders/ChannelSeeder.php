<?php

namespace Database\Seeders;

use App\Models\Channel as ChannelContract;
use Illuminate\Database\Seeder;

final class ChannelSeeder extends Seeder
{
    public function run(): void
    {
        $channel = resolve(ChannelContract::class);

        $channel->query()->updateOrCreate(
            [
                'slug' => 'web-store',
            ],
            [
                'name' => 'Web Store',
                'url' => config('app.url'),
                'is_default' => true,
                'is_enabled' => true,
            ],
        );
    }
}