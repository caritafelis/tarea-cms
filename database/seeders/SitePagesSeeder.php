<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class SitePagesSeeder extends Seeder
{
    use SeedsDynamicContent;

    public function run(): void
    {
        $this->home();
        $this->services();
        $this->solutions();
        $this->products();
        $this->projects();
        $this->pricing();
        $this->developers();
        $this->about();
        $this->contact();
    }

    private function home(): void
    {
        $this->upsertPage('home', ['en' => 'Home', 'es' => 'Inicio'], [
            $this->entryBlock('slider', 'home-slider'),
            $this->entries('products', 'cards', 4, ['The Stuv suite', 'La suite Stuv'], ['Apps we build, run and evolve ourselves.', 'Apps que construimos, operamos y evolucionamos nosotros mismos.'], ['View all products', 'Ver todos los productos'], '/products'),
            $this->entries('solutions', 'cards', 6, ['Solutions', 'Soluciones'], ['What teams build with Stuvvion.', 'Lo que los equipos construyen con Stuvvion.'], ['View all solutions', 'Ver todas las soluciones'], '/solutions'),
            $this->entries('services', 'cards', 6, ['Services', 'Servicios'], ['From first prototype to production operations.', 'Del primer prototipo a la operación en producción.'], ['View all services', 'Ver todos los servicios'], '/services'),
            $this->process(),
            ['tech-stack', [
                'title' => $this->bi('Technology we master', 'Tecnología que dominamos'),
                'subtitle' => $this->bi('Mature tools used with discipline.', 'Herramientas maduras usadas con disciplina.'),
                'groups' => [
                    ['group' => $this->bi('Backend', 'Backend'), 'items' => "Laravel\nKotlin\nSpring Boot\nPostgreSQL\nMySQL"],
                    ['group' => $this->bi('Frontend', 'Frontend'), 'items' => "React\nInertia.js\nNext.js\nNuxt\nTailwind CSS"],
                    ['group' => $this->bi('APIs', 'APIs'), 'items' => "JSON:API\nGraphQL\nOpenAPI\nWebhooks"],
                    ['group' => $this->bi('Infrastructure', 'Infraestructura'), 'items' => "Docker\nAWS\nCloudflare\nCI/CD"],
                ],
            ]],
            $this->cta(['Let’s talk about your project', 'Hablemos de tu proyecto'], ['Tell us what you need and we’ll reply with a clear proposal.', 'Cuéntanos qué necesitas y te respondemos con una propuesta clara.'], ['Contact us', 'Contáctanos'], '/contact', ['See pricing', 'Ver precios'], '/pricing'),
        ]);
    }

    private function services(): void
    {
        $this->upsertPage('services', ['en' => 'Services', 'es' => 'Servicios'], [
            $this->header(['Services', 'Servicios'], ['Everything your digital operation needs', 'Todo lo que tu operación digital necesita'], ['Web, mobile, automation, hosting, security and more, with transparent starting prices.', 'Web, móvil, automatización, hosting, seguridad y más, con precios base transparentes.']),
            $this->entries('services', 'rows', 0),
            $this->process(),
            $this->faq(['Questions about our services', 'Preguntas sobre nuestros servicios'], [
                [['How do you define scope and cost?', '¿Cómo definen el alcance y el costo?'], ['After a short discovery we deliver a proposal with scope, milestones and a phased estimate.', 'Tras un descubrimiento breve entregamos una propuesta con alcance, hitos y estimación por fases.']],
                [['Are the listed prices final?', '¿Los precios listados son finales?'], ['They are starting ranges; the final quote depends on scope and complexity.', 'Son rangos base; la cotización final depende del alcance y la complejidad.']],
            ]),
            $this->cta(['Have a project in mind?', '¿Tienes un proyecto en mente?'], ['Book a conversation and we’ll define the next step together.', 'Agenda una conversación y definimos juntos el siguiente paso.'], ['Request a quote', 'Solicitar cotización'], '/contact'),
        ]);
    }

    private function solutions(): void
    {
        $this->upsertPage('solutions', ['en' => 'Solutions', 'es' => 'Soluciones'], [
            $this->header(['Solutions', 'Soluciones'], ['One platform, many experiences', 'Una plataforma, muchas experiencias'], ['Use cases and teams we serve with StuvGraph.', 'Casos de uso y equipos que atendemos con StuvGraph.']),
            $this->entries('solutions', 'cards', 0),
            $this->cta(['Not sure where to start?', '¿No sabes por dónde empezar?'], ['Our services team can scope it with you.', 'Nuestro equipo de servicios puede definirlo contigo.'], ['Talk to us', 'Habla con nosotros'], '/contact', ['See services', 'Ver servicios'], '/services'),
        ]);
    }

    private function products(): void
    {
        $this->upsertPage('products', ['en' => 'Products', 'es' => 'Productos'], [
            $this->header(['Products', 'Productos'], ['The Stuv suite', 'La suite Stuv'], ['Apps with open APIs, multi-tenant architecture and continuous evolution. Use one, or run them together with Stuv One.', 'Apps con APIs abiertas, arquitectura multi-tenant y evolución continua. Usa una, o ejecútalas juntas con Stuv One.']),
            $this->entries('products', 'cards', 0),
            ['feature-grid', [
                'title' => $this->bi('What every Stuv app shares', 'Lo que comparten todas las apps Stuv'),
                'subtitle' => $this->bi('Common engineering decisions across the suite.', 'Decisiones de ingeniería comunes en toda la suite.'),
                'columns' => '3',
                'items' => [
                    ['image' => null, 'title' => $this->bi('API-first', 'API-first'), 'description' => $this->bi('REST (JSON:API) and GraphQL over the same resources.', 'REST (JSON:API) y GraphQL sobre los mismos recursos.'), 'url' => '/developers'],
                    ['image' => null, 'title' => $this->bi('Multi-tenant', 'Multi-tenant'), 'description' => $this->bi('Per-team or per-organization isolation, with roles and permissions.', 'Aislamiento por equipo u organización, con roles y permisos.'), 'url' => null],
                    ['image' => null, 'title' => $this->bi('Secure by default', 'Seguridad por defecto'), 'description' => $this->bi('Scoped tokens, usage limits and hardened authentication.', 'Tokens con alcance, límites de uso y autenticación reforzada.'), 'url' => null],
                ],
            ]],
            $this->cta(['Which apps fit you?', '¿Qué apps encajan contigo?'], ['We’ll help you choose and connect them.', 'Te ayudamos a elegir y conectarlas.'], ['Talk to the team', 'Hablar con el equipo'], '/contact'),
        ]);
    }

    private function projects(): void
    {
        $this->upsertPage('projects', ['en' => 'Projects', 'es' => 'Proyectos'], [
            $this->header(['Projects', 'Proyectos'], ['Work we have delivered', 'Trabajo que hemos entregado'], ['Selected projects in web, mobile, design, branding and automation.', 'Proyectos seleccionados en web, móvil, diseño, branding y automatización.']),
            $this->entries('projects', 'cards', 0),
            $this->cta(['Want to be our next case study?', '¿Quieres ser nuestro próximo caso de éxito?'], ['Tell us about your project.', 'Cuéntanos sobre tu proyecto.'], ['Contact us', 'Contáctanos'], '/contact'),
        ]);
    }

    private function pricing(): void
    {
        $this->upsertPage('pricing', ['en' => 'Pricing', 'es' => 'Precios'], [
            $this->header(['Pricing', 'Precios'], ['StuvGraph plans', 'Planes de StuvGraph'], ['Start free to test, pay when you go to production. Switch to yearly billing and get 2 months free.', 'Empieza gratis para probar y paga cuando pases a producción. Con facturación anual obtienes 2 meses gratis.']),
            ['pricing-table', [
                'title' => $this->bi('StuvGraph', 'StuvGraph'),
                'subtitle' => $this->bi('Prices in USD.', 'Precios en USD.'),
                'footnote' => $this->bi(
                    'Free is for testing only; production requires a paid plan. Commerce (StuvShop) is an add-on per plan. Other Stuv apps are quoted per operation.',
                    'Free es solo para pruebas; producción requiere un plan de pago. Commerce (StuvShop) es un complemento por plan. Las demás apps Stuv se cotizan según la operación.',
                ),
                'plans' => $this->plans(),
            ]],
            $this->faq(['Frequently asked questions', 'Preguntas frecuentes'], [
                [['Can I use the Free plan in production?', '¿Puedo usar el plan Free en producción?'], ['No. Free is meant for testing and has hard monthly caps. Production sites require a paid plan.', 'No. Free es para pruebas y tiene topes mensuales estrictos. Los sitios en producción requieren un plan de pago.']],
                [['What happens if I reach a limit?', '¿Qué pasa si llego a un límite?'], ['On Free, API requests stop at the monthly cap. On paid plans we notify you so you can move to a higher plan.', 'En Free, las solicitudes a la API se detienen al llegar al tope mensual. En planes de pago te avisamos para que subas de plan.']],
                [['How does yearly billing work?', '¿Cómo funciona la facturación anual?'], ['You pay for 10 months and use 12.', 'Pagas 10 meses y usas 12.']],
            ]),
            $this->cta(['Need something different?', '¿Necesitas algo distinto?'], ['We’ll put together a custom plan.', 'Armamos un plan a medida.'], ['Talk to sales', 'Hablar con ventas'], '/contact'),
        ]);
    }

    private function developers(): void
    {
        $this->upsertPage('developers', ['en' => 'Developers', 'es' => 'Desarrolladores'], [
            $this->header(['Developers', 'Desarrolladores'], ['One API, two ways to consume it', 'Una API, dos formas de consumirla'], ['REST (JSON:API) and GraphQL over the same resources. GET /api/v1/schema describes every block and field.', 'REST (JSON:API) y GraphQL sobre los mismos recursos. GET /api/v1/schema describe cada bloque y campo.']),
            ['api-showcase', [
                'title' => $this->bi('Get started in minutes', 'Empieza en minutos'),
                'subtitle' => $this->bi('Authenticate with a token and query content in any language.', 'Autentícate con un token y consulta contenido en cualquier idioma.'),
                'rest_snippet' => "curl \"https://cms.example.com/api/v1/pages?filter[slug]=home&locale=es&fallback=1\" \\\n  -H \"Authorization: Bearer \$STUVVION_TOKEN\" \\\n  -H \"Accept: application/vnd.api+json\"\n\n# Block catalog and TypeScript types\ncurl \"https://cms.example.com/api/v1/schema?format=typescript\" -H \"Authorization: Bearer \$STUVVION_TOKEN\"",
                'graphql_snippet' => "query {\n  pages(slug: \"home\") {\n    data {\n      title\n      sections {\n        order\n        data\n        fieldGroup { slug }\n      }\n    }\n  }\n}",
                'rest_docs_url' => '/api/rest',
                'graphql_docs_url' => '/api/graphql',
            ]],
            $this->cta(['Explore the API reference', 'Explora la referencia de la API'], ['Endpoints, schemas and examples.', 'Endpoints, esquemas y ejemplos.'], ['REST reference', 'Referencia REST'], '/api/rest', ['GraphQL reference', 'Referencia GraphQL'], '/api/graphql'),
        ]);
    }

    private function about(): void
    {
        $this->upsertPage('about', ['en' => 'About', 'es' => 'Nosotros'], [
            $this->header(['About', 'Nosotros'], ['Product engineering, end to end', 'Ingeniería de producto, de punta a punta'], ['A software studio that builds and runs its own apps and applies that experience to client projects.', 'Un estudio de software que construye y opera sus propias apps y aplica esa experiencia a los proyectos de sus clientes.']),
            ['rich-text', [
                'title' => $this->bi('Who we are', 'Quiénes somos'),
                'body' => $this->bi(
                    '<p>Stuvvion was born from building real platforms: multi-tenant systems, ERP with electronic invoicing and our own headless CMS.</p><p>We work with small senior teams, direct communication and verifiable deliveries.</p>',
                    '<p>Stuvvion nace de construir plataformas reales: sistemas multi-tenant, ERP con facturación electrónica y un CMS headless propio.</p><p>Trabajamos con equipos pequeños y senior, comunicación directa y entregas verificables.</p>',
                ),
            ]],
            $this->cta(['Let’s work together', 'Trabajemos juntos'], ['Tell us your challenge.', 'Cuéntanos tu reto.'], ['Contact us', 'Contáctanos'], '/contact'),
        ]);
    }

    private function contact(): void
    {
        $topics = [['Custom project', 'Proyecto a medida'], ['Product demo', 'Demo de producto'], ['Plans and pricing', 'Planes y precios'], ['Support', 'Soporte'], ['Partnerships', 'Alianzas']];

        $this->upsertPage('contact', ['en' => 'Contact', 'es' => 'Contacto'], [
            $this->header(['Contact', 'Contacto'], ['Let’s talk', 'Hablemos'], ['Tell us what you need. We reply within one or two business days.', 'Cuéntanos qué necesitas. Respondemos en uno o dos días hábiles.']),
            ['contact-info', [
                'title' => $this->bi('Write to us', 'Escríbenos'),
                'description' => $this->bi('Pick a topic so we can route your message.', 'Elige un motivo para derivar tu mensaje.'),
                'email' => 'hello@stuvvion.com',
                'phone' => '',
                'address' => $this->bi('', ''),
                'schedule' => $this->bi('Monday to Friday', 'Lunes a viernes'),
                'topics' => array_map(fn (array $t) => ['label' => $this->bi(...$t)], $topics),
            ]],
        ]);
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private function cta(array $title, array $description, array $label, string $url, ?array $secondary = null, ?string $secondaryUrl = null): array
    {
        return ['cta-banner', [
            'title' => $this->bi(...$title), 'description' => $this->bi(...$description),
            'cta_label' => $this->bi(...$label), 'cta_url' => $url,
            'secondary_label' => $secondary ? $this->bi(...$secondary) : null, 'secondary_url' => $secondaryUrl,
        ]];
    }

    private function header(array $eyebrow, array $heading, array $description): array
    {
        return ['page-header', [
            'eyebrow' => $this->bi(...$eyebrow), 'heading' => $this->bi(...$heading),
            'description' => $this->bi(...$description), 'image' => null,
        ]];
    }

    private function entries(string $source, string $layout, int $limit, ?array $title = null, ?array $subtitle = null, ?array $ctaLabel = null, ?string $ctaUrl = null): array
    {
        return ['entry-list', [
            'title' => $title ? $this->bi(...$title) : null,
            'subtitle' => $subtitle ? $this->bi(...$subtitle) : null,
            'source' => $source, 'layout' => $layout, 'limit' => $limit,
            'cta_label' => $ctaLabel ? $this->bi(...$ctaLabel) : null, 'cta_url' => $ctaUrl,
        ]];
    }

    private function faq(array $title, array $items): array
    {
        return ['faq', [
            'title' => $this->bi(...$title),
            'items' => array_map(fn (array $i) => ['question' => $this->bi(...$i[0]), 'answer' => $this->bi(...$i[1])], $items),
        ]];
    }

    private function process(): array
    {
        $steps = [
            [['Discovery', 'Descubrimiento'], ['We understand your operation and constraints first.', 'Entendemos tu operación y restricciones primero.']],
            [['Architecture', 'Arquitectura'], ['Data model, module boundaries and API contracts.', 'Modelo de datos, límites de módulos y contratos de API.']],
            [['Iterative development', 'Desarrollo iterativo'], ['Incremental deliveries with automated tests.', 'Entregas incrementales con pruebas automatizadas.']],
            [['Deployment and operations', 'Despliegue y operación'], ['Automated pipeline, monitoring and support.', 'Pipeline automático, monitoreo y soporte.']],
        ];

        return ['process-steps', [
            'title' => $this->bi('How we work', 'Cómo trabajamos'),
            'subtitle' => $this->bi('A short, transparent process.', 'Un proceso corto y transparente.'),
            'steps' => array_map(fn (array $s) => ['title' => $this->bi(...$s[0]), 'description' => $this->bi(...$s[1])], $steps),
        ]];
    }

    /** Planes mensuales (sin commerce) + precio anual equivalente por mes. */
    private function plans(): array
    {
        $usd = fn (float $cents) => '$'.rtrim(rtrim(number_format($cents / 100, 2), '0'), '.');

        return Plan::query()->where('is_active', true)->where('interval', 'month')->where('has_ecommerce', false)
            ->orderBy('sort_order')->get()
            ->map(function (Plan $plan) use ($usd): array {
                $meta = $plan->entitlements['meta'] ?? [];
                $free = (bool) ($meta['free'] ?? false);
                $contact = (bool) ($meta['contact_sales'] ?? false);
                $special = $free || $contact;
                $yearly = Plan::query()->where('tier', $plan->tier)->where('has_ecommerce', false)->where('interval', 'year')->first();
                $features = collect($plan->features ?? [])->where('included', true);
                $monthly = $usd($plan->price_cents);
                $perMonthYearly = $yearly ? $usd($yearly->price_cents / 12) : '';

                return [
                    'name' => $plan->name,
                    'price' => $free ? $this->bi('Free', 'Gratis') : ($contact ? $this->bi('Custom', 'A medida') : $this->bi($monthly, $monthly)),
                    'period' => $special ? $this->bi('', '') : $this->bi('/month', '/mes'),
                    'price_yearly' => $yearly ? $this->bi($perMonthYearly, $perMonthYearly) : $this->bi('', ''),
                    'period_yearly' => $yearly ? $this->bi('/month, billed yearly', '/mes, facturado anualmente') : $this->bi('', ''),
                    'yearly_note' => $yearly ? $this->bi('2 months free', '2 meses gratis') : $this->bi('', ''),
                    'description' => $this->bi(...match ($plan->tier) {
                        'free' => ['Explore and prototype. Not for production.', 'Explora y prototipa. No apto para producción.'],
                        'starter' => ['For your first production site.', 'Para tu primer sitio en producción.'],
                        'professional' => ['For teams shipping multi-language experiences.', 'Para equipos con experiencias multi-idioma.'],
                        'business' => ['For high-volume, multi-team operations.', 'Para operaciones multi-equipo de alto volumen.'],
                        default => ['Custom limits, SSO and priority support.', 'Límites a medida, SSO y soporte prioritario.'],
                    }),
                    'features' => $this->bi($features->pluck('label')->implode("\n"), $features->pluck('label_es')->implode("\n")),
                    'cta_label' => $free ? $this->bi('Start free', 'Empezar gratis') : ($contact ? $this->bi('Talk to sales', 'Hablar con ventas') : $this->bi('Get started', 'Empezar')),
                    'cta_url' => $contact ? '/contact' : '/contact?plan='.$plan->slug,
                    'highlighted' => $plan->tier === 'professional' ? 'yes' : 'no',
                ];
            })->values()->all();
    }
}