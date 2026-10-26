<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/** El slug de cada field group es el componente que el frontend debe renderizar (ver GET /api/v1/schema). */
class SiteFieldGroupsSeeder extends Seeder
{
    use SeedsDynamicContent;

    private const EVIDENCE = [
        'web-development' => 'Web Development',
        'mobile-development' => 'Mobile Development',
        'design' => 'Design',
        'branding' => 'Branding',
        'automation' => 'Automation',
    ];

    public function run(): void
    {
        $this->blocks();
        $this->standalone();
    }

    private function yesNo(string $default = 'no'): array
    {
        return ['options' => $this->options(['yes' => 'Yes', 'no' => 'No']), 'default' => $default];
    }

    private function blocks(): void
    {
        $order = 0;

        $block = function (string $title, string $slug, string $description, array $fields) use (&$order): void {
            $this->upsertCpt([
                'title' => $title, 'slug' => $slug, 'description' => $description,
                'content_type' => 'page', 'is_active' => true, 'is_standalone' => false, 'order' => ++$order,
            ], $fields);
        };

        $block('Page Header', 'page-header', 'Inner pages header.', [
            $this->t('text', 'eyebrow', 'Eyebrow'),
            $this->t('text', 'heading', 'Heading', ['required' => true]),
            $this->t('textarea', 'description', 'Description'),
            $this->f('image', 'image', 'Image'),
        ]);

        $block('Feature Grid', 'feature-grid', 'Card grid with image, title and description.', [
            $this->t('text', 'title', 'Title'),
            $this->t('textarea', 'subtitle', 'Subtitle'),
            $this->f('select', 'columns', 'Columns', ['options' => $this->options(['2' => '2', '3' => '3', '4' => '4']), 'default' => '3']),
            $this->f('repeater', 'items', 'Items', ['sub' => [
                $this->f('image', 'image', 'Icon / image'),
                $this->t('text', 'title', 'Title'),
                $this->t('textarea', 'description', 'Description'),
                $this->f('url', 'url', 'Link'),
            ]]),
        ]);

        $block('Entry List', 'entry-list', 'Lists entries of a standalone module.', [
            $this->t('text', 'title', 'Title'),
            $this->t('textarea', 'subtitle', 'Subtitle'),
            $this->f('select', 'source', 'Source module', [
                'options' => $this->options([
                    'services' => 'Services', 'products' => 'Products', 'projects' => 'Projects', 'solutions' => 'Solutions',
                ]),
                'required' => true,
            ]),
            $this->f('select', 'layout', 'Layout', ['options' => $this->options(['cards' => 'Cards', 'rows' => 'Rows']), 'default' => 'cards']),
            $this->f('number', 'limit', 'Limit (0 = all)', ['default' => '0']),
            $this->t('text', 'cta_label', 'Link label'),
            $this->f('url', 'cta_url', 'Link URL'),
        ]);

        $block('Process Steps', 'process-steps', 'Numbered process steps.', [
            $this->t('text', 'title', 'Title'),
            $this->t('textarea', 'subtitle', 'Subtitle'),
            $this->f('repeater', 'steps', 'Steps', ['sub' => [
                $this->t('text', 'title', 'Title'),
                $this->t('textarea', 'description', 'Description'),
            ]]),
        ]);

        $block('Tech Stack', 'tech-stack', 'Technologies grouped by layer.', [
            $this->t('text', 'title', 'Title'),
            $this->t('textarea', 'subtitle', 'Subtitle'),
            $this->f('repeater', 'groups', 'Groups', ['sub' => [
                $this->t('text', 'group', 'Group'),
                $this->f('textarea', 'items', 'Technologies (one per line)'),
            ]]),
        ]);

        $block('Pricing Table', 'pricing-table', 'Plans table with monthly and yearly prices.', [
            $this->t('text', 'title', 'Title'),
            $this->t('textarea', 'subtitle', 'Subtitle'),
            $this->t('textarea', 'footnote', 'Footnote'),
            $this->f('repeater', 'plans', 'Plans', ['sub' => [
                $this->f('text', 'name', 'Name'),
                $this->t('text', 'price', 'Price (monthly)'),
                $this->t('text', 'period', 'Period (monthly)'),
                $this->t('text', 'price_yearly', 'Price (yearly, per month)'),
                $this->t('text', 'period_yearly', 'Period (yearly)'),
                $this->t('text', 'yearly_note', 'Yearly note'),
                $this->t('textarea', 'description', 'Description'),
                $this->t('textarea', 'features', 'Features (one per line)'),
                $this->t('text', 'cta_label', 'CTA label'),
                $this->f('url', 'cta_url', 'CTA URL'),
                $this->f('select', 'highlighted', 'Highlighted', $this->yesNo()),
            ]]),
        ]);

        $block('API Showcase', 'api-showcase', 'REST and GraphQL examples.', [
            $this->t('text', 'title', 'Title'),
            $this->t('textarea', 'subtitle', 'Subtitle'),
            $this->f('textarea', 'rest_snippet', 'REST snippet'),
            $this->f('textarea', 'graphql_snippet', 'GraphQL snippet'),
            $this->f('text', 'rest_docs_url', 'REST docs URL'),
            $this->f('text', 'graphql_docs_url', 'GraphQL docs URL'),
        ]);

        $block('FAQ', 'faq', 'Frequently asked questions.', [
            $this->t('text', 'title', 'Title'),
            $this->f('repeater', 'items', 'Questions', ['sub' => [
                $this->t('text', 'question', 'Question'),
                $this->t('textarea', 'answer', 'Answer'),
            ]]),
        ]);

        $block('Rich Text', 'rich-text', 'Rich text block.', [
            $this->t('text', 'title', 'Title'),
            $this->t('wysiwyg', 'body', 'Content'),
        ]);

        $block('CTA Banner', 'cta-banner', 'Call to action.', [
            $this->t('text', 'title', 'Title'),
            $this->t('textarea', 'description', 'Description'),
            $this->t('text', 'cta_label', 'CTA label'),
            $this->f('url', 'cta_url', 'CTA URL'),
            $this->t('text', 'secondary_label', 'Secondary label'),
            $this->f('url', 'secondary_url', 'Secondary URL'),
        ]);

        $block('Contact Info', 'contact-info', 'Contact details.', [
            $this->t('text', 'title', 'Title'),
            $this->t('textarea', 'description', 'Description'),
            $this->f('email', 'email', 'Email'),
            $this->f('text', 'phone', 'Phone'),
            $this->t('text', 'address', 'Address'),
            $this->t('text', 'schedule', 'Schedule'),
            $this->f('repeater', 'topics', 'Contact topics', ['sub' => [$this->t('text', 'label', 'Label')]]),
        ]);
    }

    private function standalone(): void
    {
        // `standalone_icon` es el ícono del sidebar del panel admin (no contenido del sitio).
        $this->upsertCpt([
            'title' => 'Sliders', 'slug' => 'slider',
            'description' => 'Reusable hero: a single static image or a carousel.',
            'content_type' => 'page', 'is_active' => true, 'is_standalone' => true,
            'standalone_label' => 'Slider', 'standalone_icon' => 'images', 'order' => 100,
        ], [
            $this->f('select', 'mode', 'Mode', [
                'options' => $this->options(['static' => 'Static (single image)', 'carousel' => 'Carousel (multiple slides)']),
                'default' => 'carousel', 'required' => true,
                'instructions' => 'Static renders only the first slide, without controls.',
            ]),
            $this->f('select', 'autoplay', 'Autoplay', $this->yesNo('yes')),
            $this->f('number', 'interval_ms', 'Interval (ms)', ['default' => '5000']),
            $this->f('select', 'loop', 'Loop', $this->yesNo('yes')),
            $this->f('select', 'show_arrows', 'Arrows', $this->yesNo('yes')),
            $this->f('select', 'show_dots', 'Dots', $this->yesNo('yes')),
            $this->f('select', 'height', 'Height', ['options' => $this->options(['sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large', 'screen' => 'Full screen']), 'default' => 'lg']),
            $this->f('select', 'overlay', 'Overlay', ['options' => $this->options(['none' => 'None', 'dark' => 'Dark', 'light' => 'Light']), 'default' => 'dark']),
            $this->f('repeater', 'slides', 'Slides', ['sub' => [
                $this->f('image', 'image', 'Image'),
                $this->f('image', 'mobile_image', 'Mobile image'),
                $this->t('text', 'image_alt', 'Image alt text'),
                $this->t('text', 'eyebrow', 'Eyebrow'),
                $this->t('text', 'heading', 'Heading'),
                $this->t('textarea', 'text', 'Text'),
                $this->t('text', 'primary_cta_label', 'Primary CTA label'),
                $this->f('url', 'primary_cta_url', 'Primary CTA URL'),
                $this->t('text', 'secondary_cta_label', 'Secondary CTA label'),
                $this->f('url', 'secondary_cta_url', 'Secondary CTA URL'),
                $this->f('select', 'text_align', 'Text alignment', ['options' => $this->options(['left' => 'Left', 'center' => 'Center', 'right' => 'Right']), 'default' => 'left']),
            ]]),
        ]);

        $this->upsertCpt([
            'title' => 'Services', 'slug' => 'services',
            'description' => 'Service categories with their catalog items and prices.',
            'content_type' => 'page', 'is_active' => true, 'is_standalone' => true,
            'standalone_label' => 'Service category', 'standalone_icon' => 'briefcase', 'order' => 101,
        ], [
            $this->f('number', 'sort', 'Order', ['default' => '0']),
            $this->t('text', 'name', 'Name', ['required' => true]),
            $this->t('textarea', 'summary', 'Summary'),
            $this->f('image', 'image', 'Icon / image'),
            $this->f('select', 'requires_evidence', 'Requires project evidence', [
                'options' => $this->options(['yes' => 'Yes (shown with portfolio projects)', 'no' => 'No']),
                'default' => 'no',
                'instructions' => 'Only categories marked Yes can be linked from Projects.',
            ]),
            $this->f('repeater', 'items', 'Catalog items', ['sub' => [
                $this->f('text', 'code', 'Code'),
                $this->t('text', 'name', 'Name'),
                $this->t('text', 'billing_type', 'Billing type'),
                $this->t('text', 'price_label', 'Price label'),
                $this->f('number', 'price_from', 'Base price (USD)'),
                $this->t('textarea', 'notes', 'Notes'),
            ]]),
            $this->t('wysiwyg', 'body', 'Full description'),
            $this->t('text', 'cta_label', 'CTA label'),
            $this->f('url', 'cta_url', 'CTA URL'),
        ]);

        $this->upsertCpt([
            'title' => 'Products', 'slug' => 'products',
            'description' => 'Stuv apps and the Stuv One suite.',
            'content_type' => 'page', 'is_active' => true, 'is_standalone' => true,
            'standalone_label' => 'Product', 'standalone_icon' => 'layers', 'order' => 102,
        ], [
            $this->f('number', 'sort', 'Order', ['default' => '0']),
            $this->t('text', 'name', 'Name', ['required' => true]),
            $this->f('select', 'kind', 'Kind', ['options' => $this->options(['app' => 'App', 'suite' => 'Suite']), 'default' => 'app']),
            $this->t('text', 'tagline', 'Tagline'),
            $this->t('textarea', 'summary', 'Summary'),
            $this->f('image', 'logo', 'Logo', ['instructions' => 'Product logo shown across the site (SVG or PNG).']),
            $this->f('image', 'logo_dark', 'Logo (dark mode)'),
            $this->f('color', 'accent_color', 'Accent color'),
            $this->f('select', 'status', 'Status', ['options' => $this->options(['live' => 'Live', 'beta' => 'Beta', 'coming_soon' => 'Coming soon']), 'default' => 'live']),
            $this->t('text', 'audience', 'Audience'),
            $this->f('url', 'product_url', 'Product URL'),
            $this->f('url', 'docs_url', 'Docs URL'),
            $this->f('textarea', 'includes', 'Includes (product slugs, one per line)'),
            $this->f('repeater', 'bundles', 'Suite editions', ['sub' => [
                $this->t('text', 'name', 'Edition name'),
                $this->t('textarea', 'description', 'Description'),
                $this->f('textarea', 'includes', 'Includes (product slugs, one per line)'),
                $this->f('select', 'highlighted', 'Highlighted', $this->yesNo()),
            ]]),
            $this->f('repeater', 'features', 'Features', ['sub' => [
                $this->f('image', 'image', 'Icon / image'),
                $this->t('text', 'title', 'Title'),
                $this->t('textarea', 'description', 'Description'),
            ]]),
            $this->f('repeater', 'use_cases', 'Use cases', ['sub' => [$this->t('text', 'item', 'Item')]]),
            $this->f('textarea', 'integrations', 'Integrations (one per line)'),
            $this->t('text', 'pricing_note', 'Pricing note'),
            $this->t('wysiwyg', 'body', 'Full description'),
            $this->t('text', 'cta_label', 'CTA label'),
            $this->f('url', 'cta_url', 'CTA URL'),
        ]);

        $this->upsertCpt([
            'title' => 'Solutions', 'slug' => 'solutions',
            'description' => 'Use cases and audiences.',
            'content_type' => 'page', 'is_active' => true, 'is_standalone' => true,
            'standalone_label' => 'Solution', 'standalone_icon' => 'lightbulb', 'order' => 103,
        ], [
            $this->f('number', 'sort', 'Order', ['default' => '0']),
            $this->t('text', 'name', 'Name', ['required' => true]),
            $this->f('select', 'kind', 'Kind', ['options' => $this->options(['use_case' => 'Use case', 'audience' => 'Audience']), 'default' => 'use_case']),
            $this->t('text', 'tagline', 'Tagline'),
            $this->t('textarea', 'summary', 'Summary'),
            $this->f('image', 'image', 'Icon / image'),
            $this->f('repeater', 'benefits', 'Benefits', ['sub' => [
                $this->f('image', 'image', 'Icon / image'),
                $this->t('text', 'title', 'Title'),
                $this->t('textarea', 'description', 'Description'),
            ]]),
            $this->f('textarea', 'related_products', 'Related products (slugs, one per line)'),
            $this->t('wysiwyg', 'body', 'Full description'),
            $this->t('text', 'cta_label', 'CTA label'),
            $this->f('url', 'cta_url', 'CTA URL'),
        ]);

        $this->upsertCpt([
            'title' => 'Projects', 'slug' => 'projects',
            'description' => 'Portfolio: delivered projects (evidence) linked to a service category.',
            'content_type' => 'page', 'is_active' => true, 'is_standalone' => true,
            'standalone_label' => 'Project', 'standalone_icon' => 'folder-kanban', 'order' => 104,
        ], [
            $this->f('number', 'sort', 'Order', ['default' => '0']),
            $this->t('text', 'name', 'Name', ['required' => true]),
            $this->f('text', 'client', 'Client'),
            $this->f('select', 'service_category', 'Service category', [
                'options' => $this->options(self::EVIDENCE), 'required' => true,
                'instructions' => 'Only categories that require evidence.',
            ]),
            $this->f('number', 'year', 'Year'),
            $this->f('select', 'featured', 'Featured', $this->yesNo()),
            $this->t('textarea', 'summary', 'Summary'),
            $this->t('wysiwyg', 'body', 'Case study'),
            $this->f('image', 'cover', 'Cover image'),
            $this->f('repeater', 'gallery', 'Gallery', ['sub' => [
                $this->f('image', 'image', 'Image'),
                $this->t('text', 'caption', 'Caption'),
            ]]),
            $this->f('url', 'live_url', 'Live URL'),
            $this->f('textarea', 'technologies', 'Technologies (one per line)'),
            $this->f('repeater', 'results', 'Results', ['sub' => [
                $this->f('text', 'value', 'Value'),
                $this->t('text', 'label', 'Label'),
            ]]),
            $this->t('textarea', 'testimonial_quote', 'Testimonial'),
            $this->f('text', 'testimonial_author', 'Testimonial author'),
        ]);
    }
}