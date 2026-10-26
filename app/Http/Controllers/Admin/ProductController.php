<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Dimension\{Length, Volume, Weight};
use App\Enums\ProductType;
use App\Http\Controllers\Controller;
use App\Models\{Attribute, Brand, Category, Channel, Collection, Currency, Inventory, Product, ProductTag, ProductVariant, Supplier, TaxRate};
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    private const COLUMNS = [
        'name', 'type', 'slug', 'sku', 'barcode', 'summary', 'description', 'brand_id', 'supplier_id',
        'security_stock', 'featured', 'is_visible', 'allow_backorder', 'published_at',
        'weight_value', 'weight_unit', 'width_value', 'width_unit', 'height_value', 'height_unit',
        'depth_value', 'depth_unit', 'volume_value', 'volume_unit',
        'manage_stock', 'stock_status', 'min_qty', 'max_qty', 'sold_individually',
        'tax_status', 'tax_class', 'shipping_enabled', 'shipping_free', 'ship_internationally',
        'shipping_requires_box', 'shipping_class', 'shipping_origin_country',
        'catalog_visibility', 'menu_order', 'enable_reviews', 'purchase_note',
        'download_limit', 'download_expiry_days',
    ];

    public function index(string $current_team): Response
    {
        return Inertia::render('admin/products/index', [
            'products' => Product::with(['brand', 'supplier', 'categories'])->withCount('variants')->latest()->get(),
            'categories' => Category::orderBy('name')->get(),
            'brands' => Brand::orderBy('name')->get(),
            'suppliers' => Supplier::orderBy('name')->get(),
        ]);
    }

    public function create(string $current_team): Response
    {
        return Inertia::render('admin/products/create', $this->editorProps(null));
    }

    public function store(Request $request, string $current_team): RedirectResponse
    {
        $data = $request->validate($this->productRules($request, null));

        $product = DB::transaction(function () use ($data, $request): Product {
            $product = Product::create($this->productAttributes($data, null));

            $this->syncRelations($product, $data);
            $this->syncPrices($product, $data['prices'] ?? []);
            $this->syncOptions($product, $data['options'] ?? []);
            $this->storeMedia($request, $product);

            return $product;
        });

        return redirect()
            ->route('admin.products.edit', ['current_team' => $current_team, 'product' => $product])
            ->with('success', 'Product created successfully.');
    }

    public function show(string $current_team, Product $product): Response
    {
        $inventories = Inventory::all();

        return Inertia::render('admin/products/show', [
            'product' => $this->load($product),
            'capabilities' => $this->capabilities($product),
            'inventories' => $inventories,
            'stock' => $this->stockMap($product, $inventories),
            'variantStock' => $this->variantStockMap($product, $inventories),
        ]);
    }

    public function edit(string $current_team, Product $product): Response
    {
        return Inertia::render('admin/products/edit', $this->editorProps($product));
    }

    public function update(Request $request, string $current_team, Product $product): RedirectResponse
    {
        $data = $request->validate($this->productRules($request, $product));

        DB::transaction(function () use ($data, $request, $product): void {
            $product->update($this->productAttributes($data, $product));

            $this->syncRelations($product, $data);
            $this->syncPrices($product, $data['prices'] ?? []);
            $this->syncOptions($product, $data['options'] ?? []);
            $this->storeMedia($request, $product);
        });

        return back()->with('success', 'Product updated successfully.');
    }

    public function destroy(string $current_team, Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()
            ->route('admin.products.index', ['current_team' => $current_team])
            ->with('success', 'Product deleted successfully.');
    }

    public function duplicate(string $current_team, Product $product): RedirectResponse
    {
        $price = ['currency_id', 'amount', 'sale_amount', 'sale_starts_at', 'sale_ends_at', 'compare_amount', 'cost_amount'];

        $copy = DB::transaction(function () use ($product, $price): Product {
            $product->load([
                'categories', 'collections', 'tags', 'channels', 'relatedProducts', 'upsells', 'crossSells',
                'prices', 'options', 'variants.prices', 'variants.values', 'media',
            ]);

            $copy = $product->replicate(['sku', 'barcode', 'gtin', 'published_at']);
            $copy->name = $product->name.' (copy)';
            $copy->slug = Str::slug($product->name).'-copy-'.Str::lower(Str::random(4));
            $copy->is_visible = false;
            $copy->save();

            foreach (['categories', 'collections', 'tags', 'channels', 'relatedProducts', 'upsells', 'crossSells'] as $relation) {
                $copy->{$relation}()->sync($product->{$relation}->pluck('id')->all());
            }

            foreach ($product->prices as $p) {
                $copy->prices()->create($p->only($price));
            }

            foreach ($product->options as $option) {
                $copy->options()->attach($option->id, [
                    'attribute_value_id' => $option->pivot->attribute_value_id,
                    'attribute_custom_value' => $option->pivot->attribute_custom_value,
                ]);
            }

            foreach ($product->variants as $variant) {
                $v = $variant->replicate(['sku', 'barcode']);
                $v->product_id = $copy->id;
                $v->save();
                $v->values()->sync($variant->values->pluck('id')->all());

                foreach ($variant->prices as $p) {
                    $v->prices()->create($p->only($price));
                }
            }

            foreach ($product->media as $media) {
                $media->copy($copy, $media->collection_name);
            }

            return $copy;
        });

        return redirect()
            ->route('admin.products.edit', ['current_team' => $current_team, 'product' => $copy])
            ->with('success', 'Product duplicated. Review the details before publishing.');
    }

    /* ------------------------------ Variants ------------------------------ */

    public function storeVariant(Request $request, string $current_team, Product $product): RedirectResponse
    {
        abort_unless($product->canUseVariants(), 422, 'This product type does not support variants.');
        $data = $this->validateVariant($request, $product);

        DB::transaction(function () use ($data, $product): void {
            $variant = $product->variants()->create(
                Arr::except($data, ['value_ids', 'prices']) + ['position' => $product->variants()->count()],
            );
            $variant->values()->sync($data['value_ids'] ?? []);
            $this->syncPrices($variant, $data['prices'] ?? []);
        });

        return back()->with('success', 'Variant created successfully.');
    }

    public function updateVariant(Request $request, string $current_team, Product $product, ProductVariant $variant): RedirectResponse
    {
        abort_unless($variant->product_id === $product->id, 404);
        $data = $this->validateVariant($request, $product, $variant);

        DB::transaction(function () use ($data, $variant): void {
            $variant->update(Arr::except($data, ['value_ids', 'prices']));
            $variant->values()->sync($data['value_ids'] ?? []);
            $this->syncPrices($variant, $data['prices'] ?? []);
        });

        return back()->with('success', 'Variant updated successfully.');
    }

    public function destroyVariant(string $current_team, Product $product, ProductVariant $variant): RedirectResponse
    {
        abort_unless($variant->product_id === $product->id, 404);
        $variant->delete();

        return back()->with('success', 'Variant deleted successfully.');
    }

    /* -------------------------------- Stock -------------------------------- */

    public function adjustStock(Request $request, string $current_team, Product $product): RedirectResponse
    {
        return $this->applyStock($request, $product);
    }

    public function adjustVariantStock(Request $request, string $current_team, Product $product, ProductVariant $variant): RedirectResponse
    {
        abort_unless($variant->product_id === $product->id, 404);

        return $this->applyStock($request, $variant);
    }

    private function applyStock(Request $request, Model $stockable): RedirectResponse
    {
        abort_unless($stockable->tracksInventory(), 422, 'This item does not track inventory.');

        $data = $request->validate([
            'inventory_id' => ['required', Rule::exists(Inventory::class, 'id')],
            'quantity' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $stockable->setStock(
            $data['quantity'],
            $data['inventory_id'],
            $stockable->stockInventory($data['inventory_id']),
            event: 'manual_adjustment',
            description: $data['description'] ?? null,
        );

        return back()->with('success', 'Stock updated successfully.');
    }

    /* -------------------------------- Media -------------------------------- */

    public function uploadMedia(Request $request, string $current_team, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:51200'],
            'collection' => ['required', Rule::in(['thumbnail', 'gallery', 'files'])],
        ]);

        $product->addMediaFromRequest('file')->toMediaCollection($data['collection']);

        return back()->with('success', 'Media uploaded successfully.');
    }

    public function destroyMedia(string $current_team, Product $product, int $media): RedirectResponse
    {
        $product->media()->findOrFail($media)->delete();

        return back()->with('success', 'Media deleted successfully.');
    }

    private function storeMedia(Request $request, Product $product): void
    {
        if ($request->hasFile('thumbnail')) {
            $product->clearMediaCollection('thumbnail'); // la nueva reemplaza a la anterior
            $product->addMediaFromRequest('thumbnail')->toMediaCollection('thumbnail');
        }

        foreach ($request->file('gallery', []) as $file) {
            $product->addMedia($file)->toMediaCollection('gallery');
        }

        foreach ($request->file('files', []) as $file) {
            $product->addMedia($file)->toMediaCollection('files');
        }
    }

    /* ------------------------------- Helpers ------------------------------- */

    private function editorProps(?Product $product): array
    {
        $inventories = Inventory::all();

        return [
            'mode' => $product ? 'edit' : 'create',
            'product' => $product ? $this->load($product) : null,
            'capabilities' => $product
                ? $this->capabilities($product)
                : ['shipping' => true, 'attributes' => true, 'variants' => true, 'inventory' => true],
            'currencies' => Currency::where('is_enabled', true)->get(),
            'inventories' => $inventories,
            'attributes' => Attribute::with('values')->where('is_enabled', true)->orderBy('name')->get(),
            'brands' => Brand::orderBy('name')->get(['id', 'name']),
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name', 'contact_name', 'email', 'phone', 'website']),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'collections' => Collection::orderBy('name')->get(['id', 'name']),
            'tags' => ProductTag::get(),
            'channels' => Channel::all(),
            'products' => Product::query()
                ->when($product, fn ($q) => $q->whereKeyNot($product->id))
                ->orderBy('name')->limit(500)->get(['id', 'name', 'sku']),
            'media' => $product
                ? $product->media()->get()->map(fn ($m): array => [
                    'id' => $m->id,
                    'collection' => $m->collection_name,
                    'name' => $m->file_name,
                    'url' => $m->getUrl(),
                    'mime' => $m->mime_type,
                    'size' => $m->size,
                ])->values()
                : [],
            'stock' => $product ? $this->stockMap($product, $inventories) : [],
            'variantStock' => $product ? $this->variantStockMap($product, $inventories) : [],
            'taxClasses' => TaxRate::query()->whereNotNull('code')->distinct()->orderBy('code')->pluck('code'),
            'shippingClasses' => Product::query()->whereNotNull('shipping_class')->distinct()->orderBy('shipping_class')->pluck('shipping_class'),
        ];
    }

    private function load(Product $product): Product
    {
        return $product->load([
            'brand', 'supplier', 'categories', 'collections', 'tags', 'channels',
            'relatedProducts', 'upsells', 'crossSells', 'externalIds',
            'prices.currency', 'options', 'variants.prices', 'variants.values',
        ]);
    }

    private function capabilities(Product $product): array
    {
        return [
            'shipping' => $product->canUseShipping(),
            'attributes' => $product->canUseAttributes(),
            'variants' => $product->canUseVariants(),
            'inventory' => $product->tracksInventory(),
        ];
    }

    private function stockMap(Product $product, $inventories): array
    {
        if (! $product->tracksInventory()) {
            return [];
        }

        return $inventories->mapWithKeys(fn ($i) => [$i->id => $product->stockInventory($i->id)])->all();
    }

    private function variantStockMap(Product $product, $inventories): array
    {
        return $product->variants->mapWithKeys(fn ($v) => [
            $v->id => $inventories->mapWithKeys(fn ($i) => [$i->id => $v->stockInventory($i->id)])->all(),
        ])->all();
    }

    private function productRules(Request $request, ?Product $product): array
    {
        $bool = ['sometimes', 'boolean'];
        $id = fn (string $model): array => ['integer', Rule::exists($model, 'id')];

        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(ProductType::class)],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($product?->id)],
            'sku' => ['nullable', 'string', 'max:255', Rule::unique('products', 'sku')->ignore($product?->id)],
            'summary' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'brand_id' => ['nullable', Rule::exists(Brand::class, 'id')],
            'supplier_id' => ['nullable', Rule::exists(Supplier::class, 'id')],
            'security_stock' => ['nullable', 'integer', 'min:0'],
            'featured' => $bool,
            'is_visible' => $bool,
            'allow_backorder' => $bool,
            'published_at' => ['nullable', 'date'],

            'weight_value' => ['nullable', 'numeric', 'min:0'],
            'weight_unit' => ['nullable', Rule::enum(Weight::class)],
            'width_value' => ['nullable', 'numeric', 'min:0'],
            'width_unit' => ['nullable', Rule::enum(Length::class)],
            'height_value' => ['nullable', 'numeric', 'min:0'],
            'height_unit' => ['nullable', Rule::enum(Length::class)],
            'depth_value' => ['nullable', 'numeric', 'min:0'],
            'depth_unit' => ['nullable', Rule::enum(Length::class)],
            'volume_value' => ['nullable', 'numeric', 'min:0'],
            'volume_unit' => ['nullable', Rule::enum(Volume::class)],

            'manage_stock' => $bool,
            'stock_status' => ['nullable', Rule::in(['instock', 'outofstock'])],
            'min_qty' => ['nullable', 'integer', 'min:0'],
            'max_qty' => ['nullable', 'integer', 'min:0', function (string $a, mixed $v, Closure $fail) use ($request): void {
                if ((int) $v > 0 && (int) $v < (int) $request->input('min_qty')) {
                    $fail(__('The maximum must be greater than or equal to the minimum.'));
                }
            }],
            'sold_individually' => $bool,

            'tax_status' => ['nullable', Rule::in(['taxable', 'shipping', 'none'])],
            'tax_class' => ['nullable', 'string', 'max:64'],

            'shipping_enabled' => $bool,
            'shipping_free' => $bool,
            'ship_internationally' => $bool,
            'shipping_requires_box' => $bool,
            'shipping_class' => ['nullable', 'string', 'max:64'],
            'shipping_origin_country' => ['nullable', 'string', 'size:2'],

            'catalog_visibility' => ['nullable', Rule::in(['visible', 'catalog', 'search', 'hidden'])],
            'menu_order' => ['nullable', 'integer'],
            'enable_reviews' => $bool,
            'purchase_note' => ['nullable', 'string'],
            'download_limit' => ['nullable', 'integer', 'min:0'],
            'download_expiry_days' => ['nullable', 'integer', 'min:0'],

            'gtin' => ['nullable', 'string', function (string $a, mixed $v, Closure $fail): void {
                if ($v !== null && $v !== '' && ! \App\Support\Barcode::valid((string) $v)) {
                    $fail(__('The GTIN is not valid: the check digit does not match.'));
                }
            }],
            'mpn' => ['nullable', 'string', 'max:255'],

            'metadata' => ['nullable', 'array'],
            'metadata.seo_title' => ['nullable', 'string', 'max:255'],
            'metadata.seo_description' => ['nullable', 'string', 'max:500'],
            'metadata.seo_keyword' => ['nullable', 'string', 'max:255'],
            'metadata.seo_noindex' => $bool,
            'metadata.product_url' => ['nullable', 'url', 'max:2048'],
            'metadata.button_text' => ['nullable', 'string', 'max:255'],
            'metadata.internal_note' => ['nullable', 'string'],

            'has_relations' => $bool,
            'category_ids' => ['array'],
            'category_ids.*' => $id(Category::class),
            'collection_ids' => ['array'],
            'collection_ids.*' => $id(Collection::class),
            'tag_ids' => ['array'],
            'tag_ids.*' => $id(ProductTag::class),
            'channel_ids' => ['array'],
            'channel_ids.*' => $id(Channel::class),
            'related_ids' => ['array'],
            'related_ids.*' => [...$id(Product::class), Rule::notIn([$product?->id])],
            'upsell_ids' => ['array'],
            'upsell_ids.*' => [...$id(Product::class), Rule::notIn([$product?->id])],
            'cross_sell_ids' => ['array'],
            'cross_sell_ids.*' => [...$id(Product::class), Rule::notIn([$product?->id])],

            'prices' => ['array'],
            ...$this->priceRules($request),

            'options' => ['array'],
            'options.*.attribute_id' => ['required', Rule::exists(Attribute::class, 'id')],
            'options.*.attribute_value_id' => ['nullable', 'integer'],
            'options.*.custom_value' => ['nullable', 'string', 'max:255'],

            'thumbnail' => ['nullable', 'image', 'max:10240'],
            'gallery' => ['array'],
            'gallery.*' => ['image', 'max:10240'],
            'files' => ['array'],
            'files.*' => ['file', 'max:51200'],
        ];
    }

    private function priceRules(Request $request): array
    {
        return [
            'prices.*.currency_id' => ['required', Rule::exists(Currency::class, 'id')],
            'prices.*.amount' => ['nullable', 'integer', 'min:0'],
            'prices.*.compare_amount' => ['nullable', 'integer', 'min:0'],
            'prices.*.cost_amount' => ['nullable', 'integer', 'min:0'],
            'prices.*.sale_amount' => ['nullable', 'integer', 'min:0', function (string $attr, mixed $value, Closure $fail) use ($request): void {
                $i = explode('.', $attr)[1];
                $amount = $request->input("prices.$i.amount");

                if ($value !== null && $amount !== null && (int) $value >= (int) $amount) {
                    $fail(__('The sale price must be lower than the regular price.'));
                }
            }],
            'prices.*.sale_starts_at' => ['nullable', 'date'],
            'prices.*.sale_ends_at' => ['nullable', 'date', function (string $attr, mixed $value, Closure $fail) use ($request): void {
                $i = explode('.', $attr)[1];
                $start = $request->input("prices.$i.sale_starts_at");

                if ($value && $start && strtotime($value) < strtotime($start)) {
                    $fail(__('The sale must end after it starts.'));
                }
            }],
        ];
    }

    private function productAttributes(array $data, ?Product $product): array
    {
        $attrs = Arr::only($data, self::COLUMNS);

        foreach (['min_qty', 'max_qty', 'menu_order', 'security_stock'] as $k) {
            if (array_key_exists($k, $attrs)) {
                $attrs[$k] = (int) ($attrs[$k] ?? 0);
            }
        }
        foreach (['download_limit', 'download_expiry_days'] as $k) {
            if (array_key_exists($k, $attrs)) {
                $attrs[$k] = $attrs[$k] ? (int) $attrs[$k] : null;
            }
        }
        if (blank($attrs['slug'] ?? null)) {
            unset($attrs['slug']); // lo genera el trait de slugs
        }

        $attrs['metadata'] = array_merge($product?->metadata ?? [], $data['metadata'] ?? []);

        return $attrs;
    }

    private function syncRelations(Product $product, array $data): void
    {
        // Un multipart omite los arreglos vacíos: "has_relations" permite vaciar listas.
        $explicit = (bool) ($data['has_relations'] ?? false);

        foreach ([
            'categories' => 'category_ids',
            'collections' => 'collection_ids',
            'tags' => 'tag_ids',
            'channels' => 'channel_ids',
            'relatedProducts' => 'related_ids',
            'upsells' => 'upsell_ids',
            'crossSells' => 'cross_sell_ids',
        ] as $relation => $key) {
            if ($explicit || array_key_exists($key, $data)) {
                $product->{$relation}()->sync($data[$key] ?? []);
            }
        }
    }

    private function syncPrices(Model $priceable, array $rows): void
    {
        foreach ($rows as $row) {
            $query = $priceable->prices()->where('currency_id', $row['currency_id']);

            // Sin precio regular no hay precio en esa moneda.
            if (($row['amount'] ?? null) === null) {
                $query->delete();

                continue;
            }

            $priceable->prices()->updateOrCreate(['currency_id' => $row['currency_id']], [
                'amount' => $row['amount'],
                'sale_amount' => $row['sale_amount'] ?? null,
                'sale_starts_at' => $row['sale_starts_at'] ?? null,
                'sale_ends_at' => $row['sale_ends_at'] ?? null,
                'compare_amount' => $row['compare_amount'] ?? null,
                'cost_amount' => $row['cost_amount'] ?? null,
            ]);
        }
    }

    private function syncOptions(Product $product, array $options): void
    {
        if (! $product->canUseAttributes()) {
            return;
        }

        $product->options()->detach();

        foreach ($options as $o) {
            if (empty($o['attribute_value_id']) && ($o['custom_value'] ?? '') === '') {
                continue;
            }

            $product->options()->attach($o['attribute_id'], [
                'attribute_value_id' => $o['attribute_value_id'] ?? null,
                'attribute_custom_value' => $o['custom_value'] ?? null,
            ]);
        }
    }

    private function validateVariant(Request $request, Product $product, ?ProductVariant $variant = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:255',
                Rule::unique('product_variants', 'sku')->where('product_id', $product->id)->ignore($variant?->id)],
            'allow_backorder' => ['sometimes', 'boolean'],
            'value_ids' => ['array'],
            'value_ids.*' => ['integer'],
            'prices' => ['array'],
            ...$this->priceRules($request),
        ]);
    }
}