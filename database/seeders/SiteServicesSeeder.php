<?php

namespace Database\Seeders;

use App\Models\Cpt;
use Illuminate\Database\Seeder;

class SiteServicesSeeder extends Seeder
{
    use SeedsDynamicContent;

    private const BILLING = [
        'one' => ['One-time payment', 'Pago único'],
        'annual' => ['Annual', 'Anual'],
        'monthly' => ['Monthly', 'Mensual'],
        'hourly' => ['Hourly', 'Por hora'],
        'session' => ['Per session', 'Por sesión'],
        'variable' => ['Variable', 'Variable'],
    ];

    public function run(): void
    {
        $cpt = Cpt::query()->where('slug', 'services')->firstOrFail();

        foreach ($this->catalog() as $i => [$slug, $evidence, $name, $summary, $items]) {
            $this->upsertEntry($cpt, $slug, $name[0], [
                'sort' => $i + 1,
                'name' => $this->bi(...$name),
                'summary' => $this->bi(...$summary),
                'image' => null,
                'requires_evidence' => $evidence ? 'yes' : 'no',
                'items' => array_map(fn (array $r) => [
                    'code' => 'ZXH-'.$r[0],
                    'name' => $this->bi($r[1], $r[2]),
                    'billing_type' => $this->bi(...self::BILLING[$r[3]]),
                    'price_label' => $this->bi($this->priceEn($r[4]), $r[4]),
                    'price_from' => $r[7],
                    'notes' => $this->bi($r[6], $r[5]),
                ], $items),
                'cta_label' => $this->bi('Request a quote', 'Solicitar cotización'),
                'cta_url' => '/contact?service='.$slug,
            ]);
        }
    }

    private function priceEn(string $price): string
    {
        return strtr($price, [
            'Desde' => 'From', '/año' => '/year', '/mes' => '/month', '/hora' => '/hour',
            'Margen personalizado' => 'Custom margin',
        ]);
    }

    /** Fila: [código, nombre EN, nombre ES, cobro, precio (texto del Excel), nota ES, nota EN, precio base] */
    private function catalog(): array
    {
        return [
            ['web-development', true, ['Web Development', 'Desarrollo Web'],
                ['Landing pages, corporate sites, e-commerce and custom platforms.', 'Landing pages, sitios corporativos, e-commerce y plataformas a medida.'], [
                    ['DW-LANDING', 'Landing Page', 'Landing Page', 'one', '$250 – $400', 'Sitio básico informativo', 'Basic informational site', 250],
                    ['DW-CORP', 'Corporate Site', 'Sitio Corporativo', 'one', '$450 – $900', 'Empresa / negocio', 'Company / business site', 450],
                    ['DW-ECOMM', 'Ecommerce', 'Ecommerce', 'one', '$800 – $2,500', 'Incluye tienda online', 'Includes online store', 800],
                    ['DW-CUSTOM', 'Custom Platform', 'Plataforma Personalizada', 'one', 'Desde $1,500', 'MVP, SaaS, dashboards', 'MVPs, SaaS, dashboards', 1500],
                    ['DW-WP-NEXT', 'Custom Web', 'Personalizada', 'one', 'Desde $900', 'Requiere licencia Stuvvion', 'Requires Stuvvion license', 900],
                    ['DW-HEADLESS', 'Headless Full Stack', 'Headless Full Stack', 'one', 'Desde $1,500', 'Arquitectura desacoplada', 'Decoupled architecture', 1500],
                ]],
            ['mobile-development', true, ['Mobile Development', 'Desarrollo Móvil'],
                ['Hybrid iOS and Android apps, including store publishing.', 'Apps híbridas iOS y Android, incluyendo publicación en stores.'], [
                    ['MOB-HYBRID', 'Hybrid Mobile App', 'App Móvil Híbrida', 'one', 'Desde $1,200', 'iOS / Android (React Native/Flutter)', 'iOS / Android (React Native/Flutter)', 1200],
                    ['MOB-STORE', 'App Store Publishing', 'Publicación en Stores', 'one', '$80 – $200', 'Configuración App Store / Play Store', 'App Store / Play Store setup', 80],
                ]],
            ['hosting', false, ['Hosting', 'Hosting'],
                ['Managed hosting for websites, stores and advanced projects.', 'Hosting administrado para sitios, tiendas y proyectos avanzados.'], [
                    ['HOST-BASIC', 'Basic Managed Hosting', 'Hosting Administrado Básico', 'annual', '$90/año', 'WordPress básico', 'Basic WordPress', 90],
                    ['HOST-ECOMM', 'Ecommerce Hosting', 'Hosting Ecommerce', 'annual', '$150 – $250/año', 'Mayor consumo', 'Higher resource usage', 150],
                    ['HOST-VPS', 'Managed VPS Hosting', 'Hosting VPS Administrado', 'monthly', 'Desde $35/mes', 'Proyectos avanzados', 'Advanced projects', 35],
                    ['HOST-MIGRATE', 'Hosting Migration', 'Migración Hosting', 'one', '$40 – $120', 'Según complejidad', 'Depends on complexity', 40],
                ]],
            ['domains', false, ['Domains', 'Dominios'],
                ['Registration, renewal and DNS configuration.', 'Registro, renovación y configuración DNS.'], [
                    ['DOM-REG', '.com Domain Registration', 'Registro de Dominio .com', 'annual', '$18 – $25/año', 'Incluye gestión', 'Management included', 18],
                    ['DOM-RENEW', 'Domain Renewal', 'Renovación de Dominio', 'annual', '$18 – $25/año', 'Renovación administrada', 'Managed renewal', 18],
                    ['DOM-DNS', 'DNS Configuration', 'Configuración DNS', 'one', '$15 – $50', 'Correos, records, etc', 'Email, records, etc.', 15],
                ]],
            ['maintenance', false, ['Maintenance', 'Mantenimiento'],
                ['Ongoing updates, monitoring and priority support plans.', 'Planes de actualización, monitoreo y soporte prioritario.'], [
                    ['MNT-BASIC', 'Basic Support Plan', 'Plan Básico de Soporte', 'monthly', '$20 – $40/mes', 'Actualizaciones básicas', 'Basic updates', 20],
                    ['MNT-CORP', 'Enterprise Plan', 'Plan Empresarial', 'monthly', '$50 – $120/mes', 'Prioridad y monitoreo', 'Priority and monitoring', 50],
                    ['MNT-ECOMM', 'Ecommerce Maintenance', 'Mantenimiento Ecommerce', 'monthly', '$80 – $180/mes', 'WooCommerce + backups', 'WooCommerce + backups', 80],
                ]],
            ['support', false, ['Support', 'Soporte'],
                ['Technical support by the hour or in monthly hour blocks.', 'Soporte técnico por hora o en bolsas de horas mensuales.'], [
                    ['SUP-HOURLY', 'Hourly Technical Support', 'Soporte Técnico por Hora', 'hourly', '$15 – $40/hora', 'Fuera de mantenimiento', 'Outside maintenance plans', 15],
                    ['SUP-BLOCK', 'Hours Block', 'Bolsa de Horas', 'monthly', 'Desde $100/mes', 'Horas acumulables', 'Rollover hours', 100],
                ]],
            ['seo', false, ['SEO', 'SEO'],
                ['On-page, technical and content optimization to rank better.', 'Optimización on-page, técnica y de contenido para posicionar mejor.'], [
                    ['SEO-BASIC', 'Basic SEO', 'SEO Básico', 'monthly', '$80 – $200/mes', 'SEO local / on-page', 'Local / on-page SEO', 80],
                    ['SEO-TECH', 'Technical Optimization', 'Optimización Técnica', 'one', '$120 – $400', 'Rendimiento y Core Web Vitals', 'Performance and Core Web Vitals', 120],
                    ['SEO-COPY', 'SEO Copywriting', 'Redacción SEO / Copywriting', 'one', '$40 – $150', 'Textos persuasivos e hiper-optimizados', 'Persuasive, highly optimized copy', 40],
                ]],
            ['design', true, ['Design', 'Diseño'],
                ['UI/UX, social content and graphic pieces.', 'UI/UX, contenido para redes y piezas gráficas.'], [
                    ['DSN-UIUX', 'UI/UX Design', 'Diseño UI/UX', 'one', 'Desde $500', 'Mockups / Figma', 'Mockups / Figma', 500],
                    ['DSN-RRSS', 'Content Creation', 'Creación de Contenido', 'monthly', 'Desde $200', 'Contenido para redes sociales', 'Social media content', 200],
                    ['DSN-PACK', 'Graphic Design Pack', 'Piezas Gráficas / Banners', 'one', '$50 – $150', 'Material publicitario / banners web', 'Advertising material / web banners', 50],
                ]],
            ['branding', true, ['Branding', 'Branding'],
                ['Logo, visual identity and complete brand guidelines.', 'Logo, identidad visual y manuales de marca completos.'], [
                    ['BRAND-BASIC', 'Basic Branding', 'Branding Básico', 'one', '$120 – $350', 'Logo + identidad', 'Logo + identity', 120],
                    ['BRAND-FULL', 'Brand Guidelines', 'Manual de Marca Completo', 'one', '$250 – $600', 'Identidad visual, tipografía, paleta, usos', 'Visual identity, typography, palette, usage', 250],
                ]],
            ['automation', true, ['Automation', 'Automatización'],
                ['Integrations, workflows, chatbots and AI agents.', 'Integraciones, flujos, chatbots y agentes de IA.'], [
                    ['AUTO-API', 'API & Webhooks Integration', 'Integración de APIs y Webhooks', 'one', '$120 – $300', 'Conexión directa entre sistemas (CRM, ERP, pasarelas)', 'Direct connection between systems (CRM, ERP, gateways)', 120],
                    ['AUTO-FLOW-BSC', 'Basic Workflow Automation', 'Automatización de Workflows Básico', 'one', '$150 – $350', 'Flujos simples en Make, n8n, Zapier (hasta 3 apps)', 'Simple flows in Make, n8n, Zapier (up to 3 apps)', 150],
                    ['AUTO-FLOW-ADV', 'Complex Process Automation', 'Automatización de Procesos Complejos', 'one', '$400 – $1,200', 'Lógica condicional, scraping, gestión de inventarios/CRM', 'Conditional logic, scraping, inventory/CRM management', 400],
                    ['AUTO-BOT-STD', 'Rule-Based Chatbot', 'Chatbot Reglas / Flujo Estándar', 'one', '$200 – $450', 'Respuestas estructuradas y menú guiado (WhatsApp/Web)', 'Structured answers and guided menu (WhatsApp/Web)', 200],
                    ['AUTO-BOT-AI', 'AI Conversational Bot', 'Chatbot con Inteligencia Artificial', 'one', '$450 – $950', 'Agente en WhatsApp/Web entrenado con contexto del negocio', 'WhatsApp/Web agent trained on your business context', 450],
                    ['AUTO-AGENT', 'Custom AI Agent & RAG', 'Agente IA Personalizado (RAG)', 'one', 'Desde $1,200', 'Agente conectado a base de datos externa y documentos', 'Agent connected to external databases and documents', 1200],
                    ['AUTO-MNT', 'Workflow Maintenance & Support', 'Mantenimiento y Soporte de Flujos', 'monthly', '$80 – $250/mes', 'Monitoreo n8n/Make, corrección de errores y cambios', 'n8n/Make monitoring, bug fixes and changes', 80],
                ]],
            ['email', false, ['Email', 'Email'],
                ['Email setup and migrations (SMTP, Workspace, Outlook).', 'Configuración y migración de correos (SMTP, Workspace, Outlook).'], [
                    ['EMAIL-CFG', 'Email Configuration', 'Configuración Correos', 'one', '$20 – $80', 'SMTP, DNS, Workspace', 'SMTP, DNS, Workspace', 20],
                    ['EMAIL-MIG', 'Email Migration', 'Migración de Correos', 'one', '$50 – $200', 'Migración cPanel, Workspace, Outlook', 'cPanel, Workspace, Outlook migration', 50],
                ]],
            ['security', false, ['Security', 'Seguridad'],
                ['Hardening, backups, malware cleanup and WAF.', 'Hardening, backups, limpieza de malware y WAF.'], [
                    ['SEC-HARDWP', 'WordPress Hardening', 'Hardening WordPress', 'one', '$50 – $150', 'Seguridad inicial', 'Initial security', 50],
                    ['SEC-MONBACK', 'Monitoring & Backups', 'Monitoreo y Backups', 'monthly', '$10 – $30/mes', 'Backup externo', 'Off-site backup', 10],
                    ['SEC-CLEAN', 'Malware Removal', 'Limpieza de Malware', 'one', '$90 – $250', 'Desinfección web y restauración', 'Site disinfection and restoration', 90],
                    ['SEC-WAF', 'SSL & WAF Setup', 'Certificados SSL / WAF', 'one', '$30 – $100', 'Instalación Cloudflare / SSL AV', 'Cloudflare / SSL installation', 30],
                ]],
            ['analytics', false, ['Analytics', 'Analytics'],
                ['Dashboards and tracking with GA4, Meta Pixel and more.', 'Dashboards y seguimiento con GA4, Meta Pixel y más.'], [
                    ['ANLY-DASH', 'Analytics Dashboard', 'Dashboard Analytics', 'one', 'Desde $100', 'GA4, Meta Pixel, etc', 'GA4, Meta Pixel, etc.', 100],
                ]],
            ['infrastructure', false, ['Infrastructure', 'Infraestructura'],
                ['AWS/VPS setup and CI/CD pipelines.', 'Configuración AWS/VPS y pipelines CI/CD.'], [
                    ['INF-AWSVPS', 'AWS/VPS Configuration', 'Configuración AWS/VPS', 'one', 'Desde $150', 'DevOps inicial', 'Initial DevOps', 150],
                    ['INF-CICD', 'CI/CD Deployment', 'Deploy CI/CD', 'one', 'Desde $120', 'GitHub Actions, pipelines', 'GitHub Actions, pipelines', 120],
                ]],
            ['training', false, ['Training', 'Capacitación'],
                ['Usage sessions so your team gets the most out of your platform.', 'Sesiones de uso para que tu equipo aproveche tu plataforma.'], [
                    ['TRAIN-CLN', 'Client Training', 'Capacitación Cliente', 'one', '$30 – $100', 'Sesiones de uso', 'Usage sessions', 30],
                ]],
            ['white-label', false, ['White Label', 'White Label'],
                ['Development for agencies with custom margins.', 'Desarrollo para agencias con margen personalizado.'], [
                    ['WL-AGENCY', 'Agency Development', 'Desarrollo para Agencias', 'variable', 'Margen personalizado', 'Clientes referidos', 'Referred clients', 0],
                ]],
            ['consulting', false, ['Consulting', 'Consultoría'],
                ['Web audits, technology consulting and Meta Ads strategy.', 'Auditorías web, consultoría tecnológica y estrategia de Meta Ads.'], [
                    ['CONS-AUDIT', 'Web Audit', 'Auditoría Web', 'one', '$80 – $300', 'Técnica y SEO', 'Technical and SEO', 80],
                    ['CONS-TECH', 'Tech Consulting', 'Consultoría Tecnológica', 'session', '$25 – $80/hora', 'Arquitectura/software', 'Architecture / software', 25],
                    ['CONS-MKT-META', 'Meta Ads Consulting', 'Marketing Digital / Meta Ads', 'monthly', '$50 – $150/mes', 'Estrategia / Meta Ads', 'Strategy / Meta Ads', 50],
                ]],
            ['marketing', false, ['Marketing', 'Marketing'],
                ['Campaign setup for Google Ads.', 'Configuración de campañas en Google Ads.'], [
                    ['MKT-GADS', 'Google Ads Setup', 'Setup Google Ads', 'one', '$100 – $300', 'Configuración de campañas Search/Shopping', 'Search/Shopping campaign setup', 100],
                ]],
        ];
    }
}