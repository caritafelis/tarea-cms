<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\SettingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * @property-read int $id
 * @property-read string $key
 * @property-read string $group
 * @property-read string $display_name
 * @property-read mixed $value
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 */
class Setting extends Model
{
    /** @use HasFactory<SettingFactory> */
    use HasFactory;

    protected $guarded = [];

    protected $hidden = [
        'locked',
    ];

    public static function lockedAttributesDisplayName(string $key): string
    {
        return match ($key) {
            'name' => __('forms.label.store_name'),
            'legal_name' => __('forms.label.legal_name'),
            'email' => __('forms.label.email'),
            'logo' => __('forms.label.logo'),
            'cover' => __('forms.label.cover_photo'),
            'about' => __('forms.label.about'),
            'country_id' => __('forms.label.country'),
            'default_currency_id' => __('forms.label.currency'),
            'default_product_type' => __('pages/products.type'),
            'currencies' => __('forms.label.currencies'),
            'street_address' => __('forms.label.street_address'),
            'postal_code' => __('forms.label.postal_code'),
            'city' => __('forms.label.city'),
            'phone_number' => __('forms.label.phone_number'),
            'longitude' => __('forms.label.longitude'),
            'latitude' => __('forms.label.latitude'),
            'facebook_link' => __('words.socials.facebook'),
            'instagram_link' => __('words.socials.instagram'),
            'twitter_link' => __('words.socials.twitter'),
            default => Str::title($key),
        };
    }

    protected static function newFactory(): SettingFactory
    {
        return SettingFactory::new();
    }

    protected function casts(): array
    {
        return [
            'value' => 'array',
            'locked' => 'boolean',
        ];
    }

    // ---------------------------------------------------------------
    // Valores por defecto por grupo.
    // ---------------------------------------------------------------

    protected static function defaults(string $group): array
    {
        return match ($group) {
            'site' => [
                'name' => config('app.name', 'My Store'),
                'legal_name' => null,
                'email' => null,
                'logo' => null,
                'favicon' => null,
                'cover' => null,
                'about' => null,
                'phone_number' => null,
                'street_address' => null,
                'postal_code' => null,
                'city' => null,
                'country_id' => null,
                'latitude' => null,
                'longitude' => null,
                'facebook_link' => null,
                'instagram_link' => null,
                'twitter_link' => null,
            ],

            'localization' => [
                'default_locale' => 'en',
                'active_locales' => ['en'],
                'timezone' => 'UTC',
                'first_day_of_week' => 0,
                'rtl_support' => false,
            ],

            'seo' => [
                'meta_title' => null,
                'meta_description' => null,
                'og_image' => null,
                'robots' => "User-agent: *\nAllow: /",
                'sitemap_generated_at' => null,
                'robots_generated_at' => null,
                'rss_generated_at' => null,
                'llms_generated_at' => null,
                'ai_generated_at' => null,
            ],

            // "email" ya NO asume SMTP fijo: el proveedor decide qué
            // campos existen dentro de "credentials" (ver MailProviderRegistry).
            'email' => [
                'mailer' => 'smtp',
                'from_name' => null,
                'from_address' => null,
                'credentials' => [],
            ],

            'storage' => [
                'default_disk' => 'public',
                'max_upload_size' => 10240, // KB
            ],

            'integrations' => [
                // Se llenan dinámicamente por proveedor (google_enabled, google_credentials, etc.)
            ],

            'security' => [
                'cors_allowed_origins' => [],
                'password_min_length' => 12,
                'password_require_uppercase' => true,
                'password_require_number' => true,
                'password_require_symbol' => false,
                'two_factor_enabled' => false,
                'session_lifetime_minutes' => 120,
                'trusted_proxies' => '',
                'rate_limit_per_minute' => 60,
            ],

            'backups' => [
                'destination' => 'local',
                'schedule' => 'daily',
                'retention_days' => 30,
            ],

            'advanced' => [
                'app_name' => config('app.name'),
                'app_url' => config('app.url'),
                'app_env' => config('app.env', 'production'),
                'cache_driver' => config('cache.default', 'file'),
                'queue_connection' => config('queue.default', 'sync'),
                'log_channel' => config('logging.default', 'stack'),
                'debug' => (bool) config('app.debug'),
                'maintenance_mode' => false,
            ],

            default => [],
        };
    }

    // ---------------------------------------------------------------
    // Acceso por grupo
    // ---------------------------------------------------------------

    public static function group(string $group): array
    {
        $stored = static::query()
            ->where('group', $group)
            ->pluck('value', 'key')
            ->all();

        return array_merge(self::defaults($group), $stored);
    }

    public static function setMany(array $data, string $group): void
    {
        foreach ($data as $key => $value) {
            static::updateOrCreate(
                ['key' => $key, 'group' => $group],
                ['value' => $value]
            );
        }
    }

    // ---------------------------------------------------------------
    // Acceso puntual por "grupo.key"
    // ---------------------------------------------------------------

    public static function get(string $dottedKey, mixed $default = null): mixed
    {
        [$group, $key] = self::splitDottedKey($dottedKey);

        $setting = static::query()
            ->where('group', $group)
            ->where('key', $key)
            ->first();

        if ($setting !== null) {
            return $setting->value;
        }

        return self::defaults($group)[$key] ?? $default;
    }

    public static function set(string $dottedKey, mixed $value): void
    {
        [$group, $key] = self::splitDottedKey($dottedKey);

        static::updateOrCreate(
            ['group' => $group, 'key' => $key],
            ['value' => $value]
        );
    }

    protected static function splitDottedKey(string $dottedKey): array
    {
        if (! str_contains($dottedKey, '.')) {
            throw new \InvalidArgumentException(
                "La key de setting [{$dottedKey}] debe tener el formato \"grupo.key\"."
            );
        }

        return explode('.', $dottedKey, 2);
    }
}
