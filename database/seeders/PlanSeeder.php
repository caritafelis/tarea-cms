<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    private const MODULE_CMS = 'cms';
    private const MODULE_ECOMMERCE = 'ecommerce';

    /** null en limits = ilimitado / a medida. Precios en centavos USD/mes. */
    private const TIERS = [
        'free' => [
            'name' => 'Free', 'sort' => 0, 'price_cms' => 0, 'price_commerce' => null,
            'meta' => ['free' => true, 'production' => false, 'hard_cap' => true, 'support' => 'community'],
            'modules' => ['multilanguage'],
            'limits' => [
                'team_members' => 3, 'entries' => 500, 'content_types' => 10, 'locales' => 2, 'environments' => 1,
                'api_requests' => 25000, 'api_rps' => 3, 'storage_gb' => 1, 'upload_mb' => 10,
                'webhooks' => 2, 'api_keys' => 2, 'products' => null,
            ],
        ],
        'starter' => [
            'name' => 'Starter', 'sort' => 1, 'price_cms' => 1500, 'price_commerce' => 2900,
            'meta' => ['production' => true, 'hard_cap' => false, 'support' => 'email'],
            'modules' => ['multilanguage', 'environments'],
            'limits' => [
                'team_members' => 5, 'entries' => 5000, 'content_types' => 25, 'locales' => 3, 'environments' => 1,
                'api_requests' => 250000, 'api_rps' => 10, 'storage_gb' => 10, 'upload_mb' => 50,
                'webhooks' => 5, 'api_keys' => 5, 'products' => 100,
            ],
        ],
        'professional' => [
            'name' => 'Professional', 'sort' => 2, 'price_cms' => 4900, 'price_commerce' => 7900,
            'meta' => ['production' => true, 'hard_cap' => false, 'support' => 'email'],
            'modules' => ['multilanguage', 'environments', 'analytics', 'workflows', 'ai_insights'],
            'limits' => [
                'team_members' => 15, 'entries' => 25000, 'content_types' => 60, 'locales' => 6, 'environments' => 2,
                'api_requests' => 1000000, 'api_rps' => 25, 'storage_gb' => 50, 'upload_mb' => 100,
                'webhooks' => 15, 'api_keys' => 10, 'products' => 1000,
            ],
        ],
        'business' => [
            'name' => 'Business', 'sort' => 3, 'price_cms' => 14900, 'price_commerce' => 22900,
            'meta' => ['production' => true, 'hard_cap' => false, 'support' => 'email'],
            'modules' => ['multilanguage', 'environments', 'analytics', 'workflows', 'ai_insights', 'audit_log'],
            'limits' => [
                'team_members' => 40, 'entries' => 100000, 'content_types' => 150, 'locales' => 15, 'environments' => 4,
                'api_requests' => 5000000, 'api_rps' => 60, 'storage_gb' => 250, 'upload_mb' => 250,
                'webhooks' => 50, 'api_keys' => 30, 'products' => 20000,
            ],
        ],
        'enterprise' => [
            'name' => 'Enterprise', 'sort' => 4, 'price_cms' => 0, 'price_commerce' => 0,
            'meta' => ['contact_sales' => true, 'production' => true, 'hard_cap' => false, 'support' => 'priority'],
            'modules' => ['multilanguage', 'environments', 'analytics', 'workflows', 'ai_insights', 'audit_log', 'sso'],
            'limits' => [
                'team_members' => null, 'entries' => null, 'content_types' => null, 'locales' => null, 'environments' => null,
                'api_requests' => null, 'api_rps' => null, 'storage_gb' => null, 'upload_mb' => null,
                'webhooks' => null, 'api_keys' => null, 'products' => null,
            ],
        ],
    ];

    /** key => [EN {n}, ES {n}, EN custom, ES custom] */
    private const LIMIT_ROWS = [
        'team_members' => ['{n} team members', '{n} miembros del equipo', 'Custom team members', 'Miembros del equipo a medida'],
        'entries' => ['{n} content entries', '{n} entradas de contenido', 'Custom content entries', 'Entradas de contenido a medida'],
        'content_types' => ['{n} content types', '{n} tipos de contenido', 'Custom content types', 'Tipos de contenido a medida'],
        'locales' => ['{n} locales', '{n} idiomas', 'Custom locales', 'Idiomas a medida'],
        'environments' => ['{n} environment(s)', '{n} entorno(s)', 'Custom environments', 'Entornos a medida'],
        'api_requests' => ['{n} API requests/month', '{n} solicitudes API/mes', 'Custom API volume', 'Volumen de API a medida'],
        'api_rps' => ['{n} requests/second', '{n} solicitudes/segundo', 'Custom rate limits', 'Límites de tasa a medida'],
        'storage_gb' => ['{n} GB media storage', '{n} GB de almacenamiento', 'Custom media storage', 'Almacenamiento a medida'],
        'upload_mb' => ['{n} MB max upload', '{n} MB máx. por archivo', 'Custom upload size', 'Tamaño de carga a medida'],
        'webhooks' => ['{n} webhooks', '{n} webhooks', 'Custom webhooks', 'Webhooks a medida'],
        'api_keys' => ['{n} API keys', '{n} API keys', 'Custom API keys', 'API keys a medida'],
    ];

    private const MODULE_ROWS = [
        'analytics' => ['Analytics', 'Analítica'],
        'workflows' => ['Content workflows', 'Flujos de contenido'],
        'ai_insights' => ['AI content insights', 'Insights de contenido con IA'],
        'audit_log' => ['Audit log', 'Registro de auditoría'],
        'sso' => ['SSO / SAML', 'SSO / SAML'],
    ];

    private const SUPPORT_ROWS = [
        'community' => ['Community support', 'Soporte de la comunidad'],
        'email' => ['Email support', 'Soporte por email'],
        'priority' => ['Priority support + SLA', 'Soporte prioritario + SLA'],
    ];

    public function run(): void
    {
        $gateway = config('billing.default_gateway', 'stripe');

        foreach (self::TIERS as $tier => $cfg) {
            $free = $cfg['meta']['free'] ?? false;
            $contact = $cfg['meta']['contact_sales'] ?? false;

            foreach ([false, true] as $commerce) {
                $monthly = $commerce ? $cfg['price_commerce'] : $cfg['price_cms'];

                if ($monthly === null) {
                    continue; // Free no tiene versión commerce
                }

                foreach (['month', 'year'] as $interval) {
                    if ($interval === 'year' && ($free || $contact)) {
                        continue;
                    }

                    $slug = $tier.($commerce ? '-commerce' : '').($interval === 'year' ? '-yearly' : '');

                    Plan::updateOrCreate(['slug' => $slug], [
                        'tier' => $tier,
                        'has_ecommerce' => $commerce,
                        'name' => $cfg['name'].($commerce ? ' + Commerce' : ''),
                        'price_cents' => $interval === 'year' ? $monthly * 10 : $monthly, // 2 meses gratis
                        'currency' => 'usd',
                        'interval' => $interval,
                        'gateway' => $gateway,
                        'is_active' => true,
                        'sort_order' => $cfg['sort'] * 100 + ($commerce ? 10 : 0) + ($interval === 'year' ? 1 : 0),
                        'features' => $this->features($cfg, $commerce),
                        'entitlements' => [
                            'modules' => $this->modules($cfg['modules'], $commerce),
                            'limits' => $this->limits($cfg['limits'], $commerce),
                            'meta' => $cfg['meta'],
                        ],
                    ]);
                }
            }
        }
    }

    private function modules(array $modules, bool $commerce): array
    {
        return array_values(array_unique([
            self::MODULE_CMS, ...$modules, ...($commerce ? [self::MODULE_ECOMMERCE] : []),
        ]));
    }

    private function limits(array $limits, bool $commerce): array
    {
        if (! $commerce) {
            unset($limits['products']);
        }

        return $limits;
    }

    private function row(array $spec, ?int $value, bool $included = true): array
    {
        [$en, $es, $enCustom, $esCustom] = $spec;
        $n = $value === null ? null : number_format($value);

        return [
            'label' => $n === null ? $enCustom : str_replace('{n}', $n, $en),
            'label_es' => $n === null ? $esCustom : str_replace('{n}', $n, $es),
            'included' => $included,
        ];
    }

    /** Lista visual de la tarjeta (la fuente de verdad son entitlements.limits/modules). */
    private function features(array $cfg, bool $commerce): array
    {
        $rows = [];

        if ($cfg['meta']['free'] ?? false) {
            $rows[] = ['label' => 'Testing only — not for production use', 'label_es' => 'Solo para pruebas — no apto para producción', 'included' => true];
        }

        foreach (self::LIMIT_ROWS as $key => $spec) {
            $rows[] = $this->row($spec, $cfg['limits'][$key]);
        }

        $rows[] = ['label' => 'REST (JSON:API) + GraphQL', 'label_es' => 'REST (JSON:API) + GraphQL', 'included' => true];

        foreach (self::MODULE_ROWS as $module => [$en, $es]) {
            $rows[] = ['label' => $en, 'label_es' => $es, 'included' => in_array($module, $cfg['modules'], true)];
        }

        [$sEn, $sEs] = self::SUPPORT_ROWS[$cfg['meta']['support']];
        $rows[] = ['label' => $sEn, 'label_es' => $sEs, 'included' => true];

        $rows[] = ['label' => 'Online store (products, orders, discounts)', 'label_es' => 'Tienda online (productos, pedidos, descuentos)', 'included' => $commerce];

        if ($commerce) {
            $rows[] = $this->row(['{n} products', '{n} productos', 'Unlimited products', 'Productos ilimitados'], $cfg['limits']['products']);
        }

        return $rows;
    }
}