<?php

namespace Database\Seeders;

use App\Models\Legal;
use Illuminate\Database\Seeder;

final class LegalsPageTableSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'title' => 'Refund Policy',
                'slug' => 'refund',
            ],
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy',
            ],
            [
                'title' => 'Terms of Use',
                'slug' => 'terms',
            ],
            [
                'title' => 'Shipping Policy',
                'slug' => 'shipping',
            ],
        ];

        foreach ($pages as $page) {
            Legal::updateOrCreate(
                [
                    'slug' => $page['slug'],
                ],
                [
                    'title' => $page['title'],
                    'content' => null,
                    'is_enabled' => true,
                ],
            );
        }
    }
}