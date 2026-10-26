<?php

namespace App\Services\Onboarding;

use App\Models\Cpt;
use App\Models\CptDefinition;
use App\Models\Page;
use App\Models\Team;
use App\Models\User;
use App\Services\DynamicFieldsService;
use App\Support\ContentLocales;
use Illuminate\Support\Facades\DB;

class StarterTemplates
{
    /** Spec: "t|f:tipo:nombre:Etiqueta[:opcion1,opcion2]"  (t = traducible). Repeater: [spec, [subspecs]] */
    private const BLOCKS = [
        'page-header' => ['Page Header', ['t:text:eyebrow:Eyebrow', 't:text:heading:Heading', 't:textarea:description:Description', 'f:image:image:Image']],
        'feature-grid' => ['Feature Grid', ['t:text:title:Title', 't:textarea:subtitle:Subtitle', ['f:repeater:items:Items', ['f:image:image:Icon / image', 't:text:title:Title', 't:textarea:description:Description', 'f:url:url:Link']]]],
        'rich-text' => ['Rich Text', ['t:text:title:Title', 't:wysiwyg:body:Content']],
        'cta-banner' => ['CTA Banner', ['t:text:title:Title', 't:textarea:description:Description', 't:text:cta_label:CTA label', 'f:url:cta_url:CTA URL']],
        'faq' => ['FAQ', ['t:text:title:Title', ['f:repeater:items:Questions', ['t:text:question:Question', 't:textarea:answer:Answer']]]],
        'contact-info' => ['Contact Info', ['t:text:title:Title', 't:textarea:description:Description', 'f:email:email:Email', 'f:text:phone:Phone', 't:text:address:Address']],
        'hero-slider' => ['Hero Slider', ['f:select:mode:Mode:static,carousel', 'f:select:autoplay:Autoplay:yes,no', ['f:repeater:slides:Slides', ['f:image:image:Image', 't:text:heading:Heading', 't:textarea:text:Text', 't:text:cta_label:CTA label', 'f:url:cta_url:CTA URL']]]],
        'product-grid' => ['Product Grid', ['t:text:title:Title', 'f:text:collection:Collection slug', 'f:number:limit:Limit', 'f:select:layout:Layout:cards,rows']],
        'promo-banner' => ['Promo Banner', ['f:image:image:Image', 't:text:heading:Heading', 't:text:text:Text', 't:text:cta_label:CTA label', 'f:url:cta_url:CTA URL']],
    ];

    /** página => [título EN, título ES, bloques] */
    private const TEMPLATES = [
        'business' => [
            'label' => 'Business website',
            'description' => 'Home, About, Services and Contact with reusable blocks.',
            'pages' => [
                'home' => ['Home', 'Inicio', ['hero-slider', 'feature-grid', 'cta-banner']],
                'about' => ['About', 'Nosotros', ['page-header', 'rich-text']],
                'services' => ['Services', 'Servicios', ['page-header', 'feature-grid', 'faq', 'cta-banner']],
                'contact' => ['Contact', 'Contacto', ['page-header', 'contact-info']],
            ],
        ],
        'ecommerce' => [
            'label' => 'Online store',
            'description' => 'Home, Shop, Shipping & Returns and Contact with product blocks.',
            'pages' => [
                'home' => ['Home', 'Inicio', ['hero-slider', 'product-grid', 'promo-banner', 'feature-grid']],
                'shop' => ['Shop', 'Tienda', ['page-header', 'product-grid']],
                'shipping-returns' => ['Shipping & returns', 'Envíos y devoluciones', ['page-header', 'rich-text', 'faq']],
                'contact' => ['Contact', 'Contacto', ['page-header', 'contact-info']],
            ],
        ],
        'blank' => ['label' => 'Start from scratch', 'description' => 'No structure. Create your own content types.', 'pages' => []],
    ];

    public function options(?string $projectType): array
    {
        $recommended = $projectType === 'sales_services' ? 'ecommerce' : 'business';

        return collect(self::TEMPLATES)->map(fn ($t, $id) => [
            'id' => $id,
            'label' => $t['label'],
            'description' => $t['description'],
            'pages' => collect($t['pages'])->map(fn ($p) => $p[0])->values(),
            'recommended' => $id === $recommended,
        ])->values()->all();
    }

    public static function ids(): array
    {
        return array_keys(self::TEMPLATES);
    }

    public function apply(Team $team, User $user, string $template): void
    {
        $pages = self::TEMPLATES[$template]['pages'] ?? [];

        if (! $pages) {
            return;
        }

        DB::transaction(function () use ($team, $user, $pages) {
            $default = ContentLocales::default();
            $cpts = [];

            foreach (array_unique(array_merge(...array_map(fn ($p) => $p[2], $pages))) as $slug) {
                $cpts[$slug] = $this->cpt($team, $slug);
            }

            foreach ($pages as $slug => [$en, $es, $blocks]) {
                $page = Page::firstOrNew(['slug' => $slug]);

                if ($page->exists) {
                    continue;
                }

                $page->title = ['en' => $en, 'es' => $es];
                $page->content = ['en' => '', 'es' => ''];
                $page->status = 'draft';
                $page->user_id = $user->id;
                $page->save();

                app(DynamicFieldsService::class)->saveSections($page, array_map(fn ($block, $i) => [
                    'cpt_id' => $cpts[$block]->id,
                    'order' => $i,
                    'locales' => [$default => $block === 'page-header' ? ['heading' => $en] : []],
                ], $blocks, array_keys($blocks)));
            }
        });
    }

    private function cpt(Team $team, string $slug): Cpt
    {
        [$title, $fields] = self::BLOCKS[$slug];

        $cpt = Cpt::firstOrCreate(['team_id' => $team->id, 'slug' => $slug], [
            'title' => $title, 'description' => $title.' block', 'content_type' => 'page',
            'is_active' => true, 'is_standalone' => false, 'order' => 0,
        ]);

        if ($cpt->wasRecentlyCreated) {
            foreach ($fields as $order => $spec) {
                $parent = $this->definition($cpt, is_array($spec) ? $spec[0] : $spec, $order, null);

                foreach (is_array($spec) ? $spec[1] : [] as $subOrder => $sub) {
                    $this->definition($cpt, $sub, $subOrder, $parent->id);
                }
            }
        }

        return $cpt;
    }

    private function definition(Cpt $cpt, string $spec, int $order, ?int $parentId): CptDefinition
    {
        [$flag, $type, $name, $label, $options] = array_pad(explode(':', $spec, 5), 5, null);

        return CptDefinition::create([
            'cpt_id' => $cpt->id, 'parent_id' => $parentId, 'name' => $name, 'label' => $label, 'type' => $type,
            'translatable' => $flag === 't', 'required' => false, 'order' => $order,
            'options' => $options ? collect(explode(',', $options))->map(fn ($v) => ['label' => ucfirst($v), 'value' => $v])->all() : null,
        ]);
    }
}