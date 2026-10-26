<?php

namespace Database\Seeders;

use App\Models\Cpt;
use App\Models\CptEntry;
use Illuminate\Database\Seeder;

class SiteEntriesSeeder extends Seeder
{
    use SeedsDynamicContent;

    public function run(): void
    {
        $this->sliders();
        $this->products();
        $this->solutions();
    }

    private function sliders(): void
    {
        $cpt = Cpt::query()->where('slug', 'slider')->firstOrFail();

        $this->upsertEntry($cpt, 'home-slider', 'Home slider', [
            'mode' => 'static',
            'autoplay' => 'no',
            'interval_ms' => 5000,
            'loop' => 'no',
            'show_arrows' => 'no',
            'show_dots' => 'no',
            'height' => 'lg',
            'overlay' => 'dark',
            'slides' => [[
                'image' => null,
                'mobile_image' => null,
                'image_alt' => $this->bi('', ''),
                'eyebrow' => $this->bi('Custom software · The Stuv suite', 'Software a medida · La suite Stuv'),
                'heading' => $this->bi('We build the software that runs your business', 'Construimos el software que opera tu negocio'),
                'text' => $this->bi(
                    'Stuvvion builds production-grade platforms, websites and automations, and runs its own apps: StuvGraph, StuvShop, StuvCore, StuvFit and StuvFact.',
                    'Stuvvion construye plataformas, sitios y automatizaciones de nivel producción, y opera sus propias apps: StuvGraph, StuvShop, StuvCore, StuvFit y StuvFact.',
                ),
                'primary_cta_label' => $this->bi('Explore products', 'Explorar productos'),
                'primary_cta_url' => '/products',
                'secondary_cta_label' => $this->bi('View services', 'Ver servicios'),
                'secondary_cta_url' => '/services',
                'text_align' => 'left',
            ]],
        ]);
    }

    private function products(): void
    {
        $cpt = Cpt::query()->where('slug', 'products')->firstOrFail();

        // Limpia los slugs de versiones anteriores para no duplicar
        CptEntry::withTrashed()->where('cpt_id', $cpt->id)
            ->whereIn('slug', ['stuvvion-cms', 'fitops', 'kuaipiao', 'stuvvion-commerce', 'stuvvion-studio'])
            ->get()
            ->each(function (CptEntry $entry) {
                $entry->contentSections()->get()->each(function ($section) {
                    $section->values()->delete();
                    $section->delete();
                });
                $entry->forceDelete();
            });

        $products = [
            [
                'slug' => 'stuvgraph', 'name' => 'StuvGraph', 'color' => '#2563eb', 'status' => 'beta',
                'tagline' => ['Headless CMS with dynamic content types', 'CMS headless con tipos de contenido dinámicos'],
                'summary' => ['Manage content and media from one panel and consume it over REST (JSON:API) or GraphQL.', 'Administra contenido y medios desde un panel y consúmelo por REST (JSON:API) o GraphQL.'],
                'audience' => ['Agencies, product teams and companies with their own websites', 'Agencias, equipos de producto y empresas con sitios propios'],
                'docs_url' => '/developers', 'integrations' => "Stripe\nNuvei\nS3\nWebhooks",
                'pricing' => ['Free to test; production requires a paid plan. See pricing.', 'Gratis para probar; producción requiere un plan de pago. Ver precios.'],
                'features' => [
                    [['Dynamic content types', 'Tipos de contenido dinámicos'], ['Field groups with repeaters, composed per page.', 'Grupos de campos con repeaters, compuestos por página.']],
                    [['Per-language content', 'Contenido por idioma'], ['Each field holds one value per language; the editor shows missing translations empty.', 'Cada campo guarda un valor por idioma; el editor muestra vacías las traducciones faltantes.']],
                    [['REST and GraphQL', 'REST y GraphQL'], ['Same resources over JSON:API and GraphQL, with a schema endpoint for typed frontends.', 'Mismos recursos por JSON:API y GraphQL, con endpoint de esquema para frontends tipados.']],
                    [['Teams and permissions', 'Equipos y permisos'], ['Multi-tenant with per-team roles.', 'Multi-tenant con roles por equipo.']],
                ],
                'use_cases' => [['Multipage corporate websites', 'Sitios corporativos multipágina'], ['Content shared across web and apps', 'Contenido compartido entre web y apps']],
                'body' => ['<p>StuvGraph separates content editing from presentation.</p>', '<p>StuvGraph separa la edición de contenido de su presentación.</p>'],
                'cta' => [['View plans', 'Ver planes'], '/pricing'],
            ],
            [
                'slug' => 'stuvshop', 'name' => 'StuvShop', 'color' => '#7c3aed', 'status' => 'live',
                'tagline' => ['Headless commerce for StuvGraph', 'Comercio headless para StuvGraph'],
                'summary' => ['Products, variants, orders, discounts, shipping and taxes on the same API as your content.', 'Productos, variantes, pedidos, descuentos, envíos e impuestos sobre la misma API que tu contenido.'],
                'audience' => ['Brands building composable storefronts', 'Marcas que construyen storefronts composables'],
                'docs_url' => '/developers', 'integrations' => "Stripe\nNuvei\nPayPal",
                'pricing' => ['Add-on on every paid StuvGraph plan.', 'Complemento en cada plan de pago de StuvGraph.'],
                'features' => [
                    [['Catalog and inventory', 'Catálogo e inventario'], ['Products, variants, collections and stock.', 'Productos, variantes, colecciones y stock.']],
                    [['Checkout and payments', 'Checkout y pagos'], ['Stripe, Nuvei and PayPal gateways.', 'Pasarelas Stripe, Nuvei y PayPal.']],
                    [['Shipping and taxes', 'Envíos e impuestos'], ['Carriers, zones and tax rules.', 'Transportistas, zonas y reglas de impuestos.']],
                ],
                'use_cases' => [['Composable storefronts', 'Storefronts composables'], ['Bookings with contracts', 'Reservas con contrato']],
                'body' => ['<p>Commerce lives next to your content, not in a separate system.</p>', '<p>El comercio vive junto a tu contenido, no en un sistema aparte.</p>'],
                'cta' => [['View plans', 'Ver planes'], '/pricing'],
            ],
            [
                'slug' => 'stuvcore', 'name' => 'StuvCore', 'color' => '#dc2626', 'status' => 'beta',
                'tagline' => ['Multi-tenant ERP backend', 'Backend ERP multi-tenant'],
                'summary' => ['A modular ERP core on hexagonal architecture, designed to grow module by module.', 'Un núcleo ERP modular sobre arquitectura hexagonal, diseñado para crecer módulo a módulo.'],
                'audience' => ['Businesses that need to run operations on one system', 'Empresas que necesitan operar sobre un solo sistema'],
                'docs_url' => '', 'integrations' => "REST API\nOAuth2 providers\nRedis",
                'pricing' => ['Quoted by operation size. Contact us.', 'Se cotiza según el tamaño de la operación. Contáctanos.'],
                'features' => [
                    [['Strict tenant isolation', 'Aislamiento estricto de tenants'], ['Tenant resolved only from the signed token.', 'El tenant se resuelve solo desde el token firmado.']],
                    [['Hardened authentication', 'Autenticación reforzada'], ['JWT access tokens and rotating refresh tokens with theft detection.', 'Tokens JWT y refresh tokens rotativos con detección de robo.']],
                    [['Reactive stack', 'Stack reactivo'], ['Non-blocking Spring WebFlux and R2DBC.', 'Spring WebFlux y R2DBC no bloqueantes.']],
                ],
                'use_cases' => [['Multi-company operations', 'Operación multiempresa']],
                'body' => ['<p>StuvCore is the operational backbone that StuvFact and future modules build on.</p>', '<p>StuvCore es la columna operativa sobre la que se construyen StuvFact y los módulos futuros.</p>'],
                'cta' => [['Request a demo', 'Solicitar demo'], '/contact?product=stuvcore'],
            ],
            [
                'slug' => 'stuvfit', 'name' => 'StuvFit', 'color' => '#16a34a', 'status' => 'live',
                'tagline' => ['Training operations for sports organizations', 'Operación de entrenamiento para organizaciones deportivas'],
                'summary' => ['Multi-tenant SaaS to build routines, manage athletes and connect wearable data.', 'SaaS multi-tenant para crear rutinas, gestionar atletas y conectar datos de wearables.'],
                'audience' => ['Clubs, academies, coaches and federations', 'Clubes, academias, entrenadores y federaciones'],
                'docs_url' => '', 'integrations' => "Garmin Connect\nREST API\nGraphQL",
                'pricing' => ['Depends on organization size. Contact us.', 'Depende del tamaño de la organización. Contáctanos.'],
                'features' => [
                    [['Routine builder', 'Constructor de rutinas'], ['Routines by sport with sections and an exercise library.', 'Rutinas por deporte con secciones y biblioteca de ejercicios.']],
                    [['Athletes and assignments', 'Atletas y asignaciones'], ['Manage athletes and assign routines per team.', 'Gestiona atletas y asigna rutinas por equipo.']],
                    [['Wearable integrations', 'Integraciones con wearables'], ['Provider-agnostic OAuth/PKCE architecture, starting with Garmin Connect.', 'Arquitectura OAuth/PKCE agnóstica del proveedor, empezando con Garmin Connect.']],
                    [['Roles and team scoping', 'Roles y alcance por equipo'], ['Every record scoped to the organization.', 'Cada registro pertenece a la organización.']],
                ],
                'use_cases' => [['Club and academy training programs', 'Programas de entrenamiento de clubes y academias'], ['Performance tracking with wearable data', 'Seguimiento del rendimiento con datos de wearables']],
                'body' => ['<p>StuvFit centralizes training operations on a multi-tenant base.</p>', '<p>StuvFit centraliza la operación de entrenamiento sobre una base multi-tenant.</p>'],
                'cta' => [['Request a demo', 'Solicitar demo'], '/contact?product=stuvfit'],
            ],
            [
                'slug' => 'stuvfact', 'name' => 'StuvFact', 'color' => '#ea580c', 'status' => 'live',
                'tagline' => ['Electronic invoicing', 'Facturación electrónica'],
                'summary' => ['Issue and validate electronic fiscal documents for Ecuador, with a path to international markets.', 'Emite y valida comprobantes fiscales electrónicos para Ecuador, con camino hacia mercados internacionales.'],
                'audience' => ['Businesses that must issue electronic fiscal documents', 'Empresas que deben emitir comprobantes fiscales electrónicos'],
                'docs_url' => '', 'integrations' => "REST API\nStuvCore\nStuvShop",
                'pricing' => ['Plans by document volume. Contact us.', 'Planes según volumen de comprobantes. Contáctanos.'],
                'features' => [
                    [['Electronic invoicing', 'Facturación electrónica'], ['Issue and validate fiscal documents under local regulation.', 'Emite y valida comprobantes fiscales conforme a la normativa local.']],
                    [['Strict tenant isolation', 'Aislamiento estricto de tenants'], ['Each company only sees its own documents.', 'Cada empresa solo ve sus propios documentos.']],
                    [['International-ready', 'Listo para lo internacional'], ['Designed to adapt to different tax regimes.', 'Diseñado para adaptarse a distintos regímenes tributarios.']],
                ],
                'use_cases' => [['Issuing electronic invoices', 'Emisión de facturas electrónicas'], ['Invoicing store orders automatically', 'Facturación automática de pedidos de tienda']],
                'body' => ['<p>StuvFact turns orders and operations into valid fiscal documents.</p>', '<p>StuvFact convierte pedidos y operaciones en comprobantes fiscales válidos.</p>'],
                'cta' => [['Request a demo', 'Solicitar demo'], '/contact?product=stuvfact'],
            ],
            [
                'slug' => 'stuv-one', 'name' => 'Stuv One', 'color' => '#0f172a', 'status' => 'beta', 'kind' => 'suite',
                'includes' => "stuvgraph\nstuvshop\nstuvfit\nstuvcore\nstuvfact",
                'tagline' => ['The whole Stuv suite on one account', 'Toda la suite Stuv en una sola cuenta'],
                'summary' => ['Pick the apps your business needs and run them together: shared login, one team, one bill.', 'Elige las apps que tu negocio necesita y úsalas juntas: un solo acceso, un equipo, una factura.'],
                'audience' => ['Businesses that want content, sales, operations and invoicing connected', 'Negocios que quieren contenido, ventas, operación y facturación conectados'],
                'docs_url' => '/developers', 'integrations' => '',
                'pricing' => ['Bundle pricing on request.', 'Precio por paquete bajo solicitud.'],
                'bundles' => [
                    ['Commerce', 'Comercio', 'Sell online and invoice automatically.', 'Vende en línea y factura automáticamente.', "stuvgraph\nstuvshop\nstuvfact", 'no'],
                    ['Sports', 'Deportes', 'Run your organization, publish your site and invoice members.', 'Gestiona tu organización, publica tu sitio y factura a tus miembros.', "stuvgraph\nstuvfit\nstuvfact", 'no'],
                    ['Business', 'Empresa', 'Storefront, ERP and invoicing on one platform.', 'Tienda, ERP y facturación en una sola plataforma.', "stuvgraph\nstuvshop\nstuvcore\nstuvfact", 'yes'],
                    ['Complete', 'Completo', 'Every Stuv app, fully connected.', 'Todas las apps Stuv, totalmente conectadas.', "stuvgraph\nstuvshop\nstuvfit\nstuvcore\nstuvfact", 'no'],
                ],
                'features' => [
                    [['Connected apps', 'Apps conectadas'], ['Orders flow into invoicing; content powers your storefront.', 'Los pedidos fluyen a facturación; el contenido alimenta tu tienda.']],
                    [['One team, one login', 'Un equipo, un acceso'], ['Roles and members shared across apps.', 'Roles y miembros compartidos entre apps.']],
                ],
                'use_cases' => [['Retail and e-commerce operations', 'Operación de retail y e-commerce'], ['Sports organizations that sell and invoice', 'Organizaciones deportivas que venden y facturan']],
                'body' => ['<p>Stuv One bundles the apps you choose into a single subscription.</p>', '<p>Stuv One agrupa las apps que elijas en una sola suscripción.</p>'],
                'cta' => [['Talk to us', 'Habla con nosotros'], '/contact?product=stuv-one'],
            ],
            [
                'slug' => 'stuvstudio', 'name' => 'StuvStudio', 'color' => '#0891b2', 'status' => 'coming_soon',
                'tagline' => ['Visual builder (coming soon)', 'Constructor visual (próximamente)'],
                'summary' => ['Assemble pages visually from your StuvGraph blocks, without touching the frontend code.', 'Arma páginas visualmente con tus bloques de StuvGraph, sin tocar el código del frontend.'],
                'audience' => ['Marketing and content teams', 'Equipos de marketing y contenido'],
                'docs_url' => '', 'integrations' => '',
                'pricing' => ['Planned add-on. Join the waitlist.', 'Complemento planificado. Únete a la lista de espera.'],
                'features' => [
                    [['Drag-and-drop canvas', 'Lienzo drag-and-drop'], ['Compose pages from reusable blocks.', 'Compón páginas con bloques reutilizables.']],
                    [['Live preview', 'Vista previa en vivo'], ['See changes before publishing.', 'Ve los cambios antes de publicar.']],
                ],
                'use_cases' => [['Campaign landing pages', 'Landing pages de campañas']],
                'body' => ['<p>Today StuvGraph is headless: your frontend consumes the API. StuvStudio will let non-developers build pages visually.</p>', '<p>Hoy StuvGraph es headless: tu frontend consume la API. StuvStudio permitirá a no desarrolladores construir páginas visualmente.</p>'],
                'cta' => [['Contact us', 'Contáctanos'], '/contact?product=stuvstudio'],
            ],
        ];

        foreach ($products as $i => $p) {
            $this->upsertEntry($cpt, $p['slug'], $p['name'], [
                'sort' => $i + 1,
                'name' => $this->bi($p['name'], $p['name']),
                'kind' => $p['kind'] ?? 'app',
                'tagline' => $this->bi(...$p['tagline']),
                'summary' => $this->bi(...$p['summary']),
                'logo' => null,
                'logo_dark' => null,
                'accent_color' => $p['color'],
                'status' => $p['status'],
                'audience' => $this->bi(...$p['audience']),
                'product_url' => '',
                'docs_url' => $p['docs_url'],
                'includes' => $p['includes'] ?? '',
                'bundles' => array_map(fn (array $b) => [
                    'name' => $this->bi($b[0], $b[1]),
                    'description' => $this->bi($b[2], $b[3]),
                    'includes' => $b[4],
                    'highlighted' => $b[5],
                ], $p['bundles'] ?? []),
                'features' => array_map(fn (array $f) => [
                    'image' => null,
                    'title' => $this->bi(...$f[0]),
                    'description' => $this->bi(...$f[1]),
                ], $p['features']),
                'use_cases' => array_map(fn (array $u) => ['item' => $this->bi(...$u)], $p['use_cases']),
                'integrations' => $p['integrations'],
                'pricing_note' => $this->bi(...$p['pricing']),
                'body' => $this->bi(...$p['body']),
                'cta_label' => $this->bi(...$p['cta'][0]),
                'cta_url' => $p['cta'][1],
            ]);
        }
    }

    private function solutions(): void
    {
        $cpt = Cpt::query()->where('slug', 'solutions')->firstOrFail();

        $solutions = [
            ['websites', 'use_case', ['Websites', 'Sitios web'], ['Future-proof your website', 'Un sitio web a prueba de futuro'],
                ['Model your content once and publish it to any frontend.', 'Modela tu contenido una vez y publícalo en cualquier frontend.'],
                [[['Any frontend', 'Cualquier frontend'], ['Next.js, Nuxt, Astro or native: it is just an API.', 'Next.js, Nuxt, Astro o nativo: es solo una API.']], [['Editors in control', 'Editores con control'], ['Block-based page editor with per-language fields.', 'Editor de páginas por bloques con campos por idioma.']]],
                "stuvgraph"],
            ['headless-commerce', 'use_case', ['Headless commerce', 'Comercio headless'], ['Sell anywhere, keep one backend', 'Vende en cualquier canal con un solo backend'],
                ['Catalog, checkout and content on one API.', 'Catálogo, checkout y contenido en una sola API.'],
                [[['Content-rich storefronts', 'Storefronts ricos en contenido'], ['Merge editorial content with products.', 'Combina contenido editorial con productos.']], [['Your checkout', 'Tu checkout'], ['Stripe, Nuvei and PayPal built in.', 'Stripe, Nuvei y PayPal integrados.']]],
                "stuvgraph\nstuvshop\nstuvfact"],
            ['multi-language', 'use_case', ['Multi-language and multi-brand', 'Multi-idioma y multi-marca'], ['One content model, many markets', 'Un modelo de contenido, muchos mercados'],
                ['Per-field translations with visible gaps, so nothing ships half-translated.', 'Traducciones por campo con vacíos visibles, para que nada salga a medio traducir.'],
                [[['Locales per plan', 'Idiomas según tu plan'], ['From 2 locales on Free up to custom on Enterprise.', 'De 2 idiomas en Free hasta a medida en Enterprise.']], [['Fallback control', 'Control de fallback'], ['Serve missing fields from the default locale on request.', 'Sirve campos faltantes desde el idioma por defecto cuando lo pidas.']]],
                "stuvgraph"],
            ['seo', 'use_case', ['SEO-friendly content', 'Contenido optimizado para SEO'], ['Structured content search engines understand', 'Contenido estructurado que los buscadores entienden'],
                ['Clean metadata, slugs and fast delivery for better rankings.', 'Metadatos limpios, slugs y entrega rápida para posicionar mejor.'],
                [[['Metadata fields', 'Campos de metadatos'], ['Titles, descriptions and slugs per language.', 'Títulos, descripciones y slugs por idioma.']]],
                "stuvgraph"],
            ['knowledge-base', 'use_case', ['Knowledge bases and help centers', 'Bases de conocimiento y centros de ayuda'], ['FAQs, docs and intranets', 'FAQs, documentación e intranets'],
                ['Structured articles with roles and workflows for your team.', 'Artículos estructurados con roles y flujos para tu equipo.'],
                [[['Roles and workflows', 'Roles y flujos'], ['Control who writes and who publishes.', 'Controla quién escribe y quién publica.']]],
                "stuvgraph"],
            ['mobile-apps', 'use_case', ['Mobile apps and omnichannel', 'Apps móviles y omnicanal'], ['One content source for every channel', 'Una fuente de contenido para cada canal'],
                ['Serve web, mobile and kiosks from the same API.', 'Sirve web, móvil y kioscos desde la misma API.'],
                [[['REST and GraphQL', 'REST y GraphQL'], ['Pick the protocol each client prefers.', 'Elige el protocolo que prefiera cada cliente.']]],
                "stuvgraph"],
            ['developers', 'audience', ['Web and product teams', 'Equipos web y de producto'], ['Build faster with typed content', 'Construye más rápido con contenido tipado'],
                ['A schema endpoint and TypeScript types describe every block.', 'Un endpoint de esquema y tipos TypeScript describen cada bloque.'],
                [[['Typed blocks', 'Bloques tipados'], ['GET /api/v1/schema?format=typescript.', 'GET /api/v1/schema?format=typescript.']]],
                "stuvgraph"],
            ['content-teams', 'audience', ['Content and marketing teams', 'Equipos de contenido y marketing'], ['Publish without waiting on developers', 'Publica sin esperar a desarrollo'],
                ['Edit pages, sliders and translations in one place.', 'Edita páginas, sliders y traducciones en un solo lugar.'],
                [[['Reusable sliders', 'Sliders reutilizables'], ['One static image or a full carousel.', 'Una imagen fija o un carrusel completo.']]],
                "stuvgraph"],
            ['agencies', 'audience', ['Agencies', 'Agencias'], ['Deliver client sites on one platform', 'Entrega sitios de clientes en una sola plataforma'],
                ['Reusable models, roles per team and white-label services.', 'Modelos reutilizables, roles por equipo y servicios white label.'],
                [[['White label', 'White label'], ['Development with a custom margin.', 'Desarrollo con margen personalizado.']]],
                "stuvgraph"],
        ];

        foreach ($solutions as $i => [$slug, $kind, $name, $tagline, $summary, $benefits, $related]) {
            $this->upsertEntry($cpt, $slug, $name[0], [
                'sort' => $i + 1,
                'name' => $this->bi(...$name),
                'kind' => $kind,
                'tagline' => $this->bi(...$tagline),
                'summary' => $this->bi(...$summary),
                'image' => null,
                'benefits' => array_map(fn (array $b) => [
                    'image' => null,
                    'title' => $this->bi(...$b[0]),
                    'description' => $this->bi(...$b[1]),
                ], $benefits),
                'related_products' => $related,
                'body' => $this->bi('', ''),
                'cta_label' => $this->bi('Talk to us', 'Habla con nosotros'),
                'cta_url' => '/contact?solution='.$slug,
            ]);
        }
    }
}