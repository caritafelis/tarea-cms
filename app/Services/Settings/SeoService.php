<?php

namespace App\Services\Settings;

use App\Models\Setting;
use Illuminate\Support\Facades\Storage;

class SeoService
{
    /** URLs the "Preview" panel shows, with generation status. */
    public function publicFiles(): array
    {
        return [
            [
                'label' => 'Sitemap',
                'path' => '/sitemap.xml',
                'exists' => Storage::disk('public')->exists('sitemap.xml'),
                'generated_at' => Setting::get('seo.sitemap_generated_at'),
            ],
            [
                'label' => 'Robots.txt',
                'path' => '/robots.txt',
                'exists' => Storage::disk('public')->exists('robots.txt'),
                'generated_at' => Setting::get('seo.robots_generated_at'),
            ],
            [
                'label' => 'RSS Feed',
                'path' => '/feeds/rss.xml',
                'exists' => Storage::disk('public')->exists('feeds/rss.xml'),
                'generated_at' => Setting::get('seo.rss_generated_at'),
            ],
            [
                'label' => 'llms.txt',
                'path' => '/llms.txt',
                'exists' => Storage::disk('public')->exists('llms.txt'),
                'generated_at' => Setting::get('seo.llms_generated_at'),
            ],
            [
                'label' => 'ai.txt',
                'path' => '/ai.txt',
                'exists' => Storage::disk('public')->exists('ai.txt'),
                'generated_at' => Setting::get('seo.ai_generated_at'),
            ],
        ];
    }

    public function generate(string $type): void
    {
        match ($type) {
            'sitemap' => $this->generateSitemap(),
            'robots' => $this->generateRobots(),
            'rss' => $this->generateRss(),
            'llms' => $this->generateLlms(),
            'ai' => $this->generateAi(),
            default => throw new \InvalidArgumentException("Unknown SEO file type [{$type}]"),
        };
    }

    // NOTE: content generation below is intentionally minimal scaffolding.
    // Wire these to your real Post/Page/Product query models before shipping.

    protected function generateSitemap(): void
    {
        $xml = view('seo.sitemap')->render(); // create resources/views/seo/sitemap.blade.php
        Storage::disk('public')->put('sitemap.xml', $xml);
        Setting::set('seo.sitemap_generated_at', now()->toIso8601String());
    }

    protected function generateRobots(): void
    {
        $content = Setting::get('seo.robots', "User-agent: *\nAllow: /\nSitemap: ".url('/sitemap.xml'));
        Storage::disk('public')->put('robots.txt', $content);
        Setting::set('seo.robots_generated_at', now()->toIso8601String());
    }

    protected function generateRss(): void
    {
        $xml = view('seo.rss')->render();
        Storage::disk('public')->put('feeds/rss.xml', $xml);
        Setting::set('seo.rss_generated_at', now()->toIso8601String());
    }

    protected function generateLlms(): void
    {
        $content = view('seo.llms')->render();
        Storage::disk('public')->put('llms.txt', $content);
        Setting::set('seo.llms_generated_at', now()->toIso8601String());
    }

    protected function generateAi(): void
    {
        $content = view('seo.ai')->render();
        Storage::disk('public')->put('ai.txt', $content);
        Setting::set('seo.ai_generated_at', now()->toIso8601String());
    }
}
