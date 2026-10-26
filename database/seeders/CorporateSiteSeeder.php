<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Stuvvion multipage corporate site.
 * Requires: super admin, a non-personal team and PlanSeeder already run.
 * Idempotent: php artisan db:seed --class=CorporateSiteSeeder
 */
class CorporateSiteSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        DB::transaction(function (): void {
            $this->settings();

            $this->call([
                SiteFieldGroupsSeeder::class,
                SiteServicesSeeder::class,
                SiteEntriesSeeder::class,
                SitePagesSeeder::class,
            ]);
        });
    }

    private function settings(): void
    {
        $settings = [
            'localization' => [
                'default_locale' => 'en',
                'active_locales' => ['en', 'es'],
                // PageController/PostController hacen json_decode() de este valor
                'locales' => json_encode(['en', 'es']),
            ],
            'site' => [
                'name' => 'Stuvvion',
                'email' => 'hello@stuvvion.com',
                'about' => 'Custom software and the Stuv suite: StuvGraph CMS, StuvShop, StuvCore, StuvFit and StuvFact.',
            ],
            'seo' => [
                'meta_title' => 'Stuvvion — Custom software and the Stuv suite',
                'meta_description' => 'A headless CMS, commerce, ERP, fitness and invoicing apps, plus web, mobile and automation services.',
            ],
        ];

        foreach ($settings as $group => $values) {
            foreach ($values as $key => $value) {
                Setting::query()->updateOrCreate(['group' => $group, 'key' => $key], ['value' => $value]);
            }
        }
    }
}