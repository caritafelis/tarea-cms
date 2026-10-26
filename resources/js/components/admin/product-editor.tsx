import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft, Check, ChevronsUpDown, Circle, Copy, ExternalLink, FileText, ImagePlus, Loader2,
    Package, Pencil, Plug, Plus, Save, Sparkles, Trash2, Truck, Upload,
} from 'lucide-react';
import { ChangeEvent, FormEvent, ReactNode, useEffect, useRef, useState } from 'react';

import productRoutes from '@/actions/App/Http/Controllers/Admin/ProductController';
import supplierRoutes from '@/actions/App/Http/Controllers/Admin/SupplierController';
import { ConfirmDelete } from '@/components/admin/confirm-delete';
import { MultiCheck } from '@/components/admin/multi-check';
import { BarcodeCard, BarcodeLabelDialog, gtinValid, type LabelItem } from '@/components/admin/product/barcode';
import { PRODUCT_TYPES } from '@/components/admin/product/product-utils';
import {
    PriceRows,
    StockPanel,
    pricesToRows,
    rowsToPayload,
    type AttributeDef,
    type Capabilities,
    type Currency,
    type Product,
    type ProductRef,
    type Ref,
} from '@/components/admin/product/shared';
import { VariantsPanel } from '@/components/admin/product/variants-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { formatDate, formatMoney, slugify, toDateTimeLocal, toMinor } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/components/confirm/confirm-provider';

type MediaItem = { id: number; collection: string; name: string; url: string; mime: string; size?: number };
type SupplierInfo = Ref & { contact_name?: string | null; email?: string | null; phone?: string | null; website?: string | null };
type ExternalIdInfo = { id: number; platform: string; external_id: string; status: string; last_synced_at: string | null };

export type ProductEditorProps = {
    mode: 'create' | 'edit';
    product: Product | null;
    currencies: Currency[];
    inventories: any[];
    attributes: AttributeDef[];
    brands: Ref[];
    suppliers: Ref[];
    categories: Ref[];
    collections: Ref[];
    tags: Ref[];
    channels: Ref[];
    products: ProductRef[];
    capabilities: Capabilities;
    media: MediaItem[];
    stock: Record<string, number>;
    variantStock: Record<string, Record<string, number>>;
    taxClasses?: string[];
    shippingClasses?: string[];
};
export type ProductEditorPageProps = Omit<ProductEditorProps, 'mode' | 'product'>;

const WEIGHT = ['kg', 'g', 'lbs'];
const LENGTH = ['cm', 'm', 'mm', 'ft', 'in'];
const VOLUME = ['l', 'ml', 'gal', 'floz'];
const NONE = '__none__';

/* ------------------------------ helpers ------------------------------ */

const genSku = (name: string) =>
    `${(name.replace(/[^a-z0-9]/gi, '').slice(0, 3) || 'SKU').toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

/* ------------------------------ UI ------------------------------ */

const CardSection = ({ id, title, description, children }: { id?: string; title: string; description?: string; children: ReactNode }) => (
    <Card id={id} className="scroll-mt-24 rounded-2xl border-border/60 shadow-none">
        <CardHeader className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

const Field = ({ id, label, error, description, aside, children }: { id?: string; label: string; error?: string; description?: ReactNode; aside?: ReactNode; children: ReactNode }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
            <label htmlFor={id} className="text-sm font-medium">{label}</label>
            {aside}
        </div>
        {children}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
);

const Toggle = ({ checked, onCheckedChange, label, description }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string; description?: string }) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-3">
        <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} />
        <div className="space-y-0.5">
            <div className="text-sm font-medium">{label}</div>
            {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
    </label>
);

const Counter = ({ value, max }: { value: number; max: number }) => (
    <span className={cn('text-xs tabular-nums', value > max * 0.9 ? 'text-amber-600' : 'text-muted-foreground')}>{value}/{max}</span>
);

const MiniAction = ({ onClick, icon: Icon, children }: { onClick: () => void; icon: typeof Pencil; children: ReactNode }) => (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        <Icon className="size-3" /> {children}
    </button>
);

/** Selector con buscador (sin dependencias). */
function SearchSelect({
    id, value, onChange, items, placeholder, emptyLabel = 'None',
}: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    items: { id: number; name: string }[];
    placeholder: string;
    emptyLabel?: string;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
        document.addEventListener('mousedown', close);

        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const selected = items.find((i) => String(i.id) === value);
    const shown = items.filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase()));
    const pick = (v: string) => {
        onChange(v);
        setOpen(false);
        setQ('');
    };
    const row = 'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

    return (
        <div ref={ref} className="relative">
            <button
                id={id}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
            >
                <span className={cn('truncate', !selected && 'text-muted-foreground')}>{selected?.name ?? placeholder}</span>
                <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
            </button>

            {open && (
                <div className="absolute z-40 mt-1 w-full rounded-lg border bg-popover p-2 shadow-lg">
                    <Input autoFocus placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} />
                    <ul role="listbox" className="mt-2 max-h-56 overflow-y-auto">
                        <li>
                            <button type="button" role="option" aria-selected={!selected} className={row} onClick={() => pick('')}>
                                <span className="text-muted-foreground">{emptyLabel}</span>
                                {!selected && <Check className="size-4" />}
                            </button>
                        </li>
                        {shown.map((i) => (
                            <li key={i.id}>
                                <button type="button" role="option" aria-selected={String(i.id) === value} className={row} onClick={() => pick(String(i.id))}>
                                    <span className="truncate">{i.name}</span>
                                    {String(i.id) === value && <Check className="size-4" />}
                                </button>
                            </li>
                        ))}
                        {shown.length === 0 && <li className="px-2 py-1.5 text-sm text-muted-foreground">No results.</li>}
                    </ul>
                </div>
            )}
        </div>
    );
}

function SuggestInput({
    id, value, onChange, suggestions,
}: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    suggestions: string[];
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
        document.addEventListener('mousedown', close);

        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const shown = suggestions.filter((s) => s !== value && s.toLowerCase().includes(value.toLowerCase()));

    return (
        <div ref={ref} className="relative">
            <Input
                id={id}
                autoComplete="off"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            />
            {open && shown.length > 0 && (
                <ul className="absolute z-40 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
                    {shown.map((s) => (
                        <li key={s}>
                            <button
                                type="button"
                                className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onChange(s);
                                    setOpen(false);
                                }}
                            >
                                {s}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ------------------------------ Editor ------------------------------ */

export default function ProductEditor({
    mode, product, currencies, inventories, attributes, brands, suppliers, categories, collections, tags, channels,
    products, media, stock, variantStock, taxClasses = [], shippingClasses = [],
}: ProductEditorProps) {
    const team = useTeamSlug();
    const can = useCan();
    const confirm = useConfirm();
    const confirmRef = useRef(confirm);
    confirmRef.current = confirm;
    const isCreate = mode === 'create';
    const canSave = can(isCreate ? 'create_product' : 'update_product');
    const canDelete = !isCreate && can('delete_product');

    const m: Record<string, any> = product?.metadata ?? {};
    const p: Record<string, any> = product ?? {};
    const externalIds = (p.external_ids ?? []) as ExternalIdInfo[];
    const wasPublished = !isCreate && Boolean(p.is_visible);

    const [activeSection, setActiveSection] = useState(() =>
        typeof window !== 'undefined' && window.location.hash ? window.location.hash.slice(1) : 'general',
    );
    const [slugLocked, setSlugLocked] = useState(true);
    const [labelOpen, setLabelOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<{ url: string }[]>([]);
    const thumbnailInput = useRef<HTMLInputElement | null>(null);
    const galleryInput = useRef<HTMLInputElement | null>(null);
    const filesInput = useRef<HTMLInputElement | null>(null);

    const ids = (list?: { id: number }[]) => list?.map((i) => i.id) ?? [];

    const form = useForm<any>({
        type: p.type ?? 'standard',
        name: p.name ?? '',
        slug: p.slug ?? '',
        sku: p.sku ?? '',
        gtin: p.gtin ?? '',
        mpn: p.mpn ?? '',
        summary: p.summary ?? '',
        description: p.description ?? '',
        brand_id: p.brand_id ? String(p.brand_id) : '',
        supplier_id: p.supplier_id ? String(p.supplier_id) : '',
        security_stock: p.security_stock ?? 0,
        featured: Boolean(p.featured),
        is_visible: p.is_visible ?? false,
        allow_backorder: Boolean(p.allow_backorder),
        published_at: toDateTimeLocal(p.published_at),

        manage_stock: p.manage_stock ?? true,
        stock_status: p.stock_status ?? 'instock',
        min_qty: p.min_qty ?? 0,
        max_qty: p.max_qty ?? 0,
        sold_individually: Boolean(p.sold_individually),

        tax_status: p.tax_status ?? 'taxable',
        tax_class: p.tax_class ?? '',

        shipping_enabled: p.shipping_enabled ?? true,
        shipping_free: Boolean(p.shipping_free),
        ship_internationally: p.ship_internationally ?? true,
        shipping_requires_box: Boolean(p.shipping_requires_box),
        shipping_class: p.shipping_class ?? '',
        shipping_origin_country: p.shipping_origin_country ?? '',
        weight_value: p.weight_value ?? '',
        weight_unit: p.weight_unit ?? 'kg',
        width_value: p.width_value ?? '',
        width_unit: p.width_unit ?? 'cm',
        height_value: p.height_value ?? '',
        height_unit: p.height_unit ?? 'cm',
        depth_value: p.depth_value ?? '',
        depth_unit: p.depth_unit ?? 'cm',
        volume_value: p.volume_value ?? '',
        volume_unit: p.volume_unit ?? 'l',

        catalog_visibility: p.catalog_visibility ?? 'visible',
        menu_order: p.menu_order ?? 0,
        enable_reviews: p.enable_reviews ?? true,
        purchase_note: p.purchase_note ?? '',

        download_limit: p.download_limit ?? '',
        download_expiry_days: p.download_expiry_days ?? '',

        metadata: {
            seo_title: m.seo_title ?? '',
            seo_description: m.seo_description ?? '',
            seo_keyword: m.seo_keyword ?? '',
            seo_noindex: Boolean(m.seo_noindex),
            product_url: m.product_url ?? '',
            button_text: m.button_text ?? '',
            internal_note: m.internal_note ?? '',
        },

        category_ids: ids(p.categories),
        collection_ids: ids(p.collections),
        tag_ids: ids(p.tags),
        channel_ids: ids(p.channels),
        related_ids: ids(p.related_products),
        upsell_ids: ids(p.upsells),
        cross_sell_ids: ids(p.cross_sells),
        has_relations: 1,

        prices: pricesToRows(currencies, p.prices ?? []),
        options:
            p.options?.map((o: any) => ({
                attribute_id: o.id,
                attribute_value_id: o.pivot?.attribute_value_id ?? null,
                custom_value: o.pivot?.attribute_custom_value ?? '',
            })) ?? [],

        thumbnail: null,
        gallery: [],
        files: [],
    });

    // Derivados: SIEMPRE después de `form`.
    const errors = form.errors as Record<string, string | undefined>;
    const metadata = form.data.metadata;
    const type = form.data.type;

    const productTypes = Object.values(PRODUCT_TYPES) as { value: string; label: string; hint?: string }[];
    const selectedType = productTypes.find((t) => t.value === type);

    const canShipping = type === 'standard' || type === 'variant';
    const canAttributes = type !== 'external';
    const canVariants = type === 'variant';
    const canInventory = type === 'standard' || type === 'variant';
    const isDownloadable = type === 'virtual';

    const currentThumbnail = media.find((i) => i.collection === 'thumbnail');
    const galleryMedia = media.filter((i) => i.collection === 'gallery');
    const fileMedia = media.filter((i) => i.collection === 'files');

    const published = form.data.is_visible && (!form.data.published_at || new Date(form.data.published_at) <= new Date());
    const statusLabel = !form.data.is_visible ? 'Draft' : published ? 'Published' : 'Scheduled';

    const supplierList = suppliers as SupplierInfo[];
    const selectedSupplier = supplierList.find((s) => String(s.id) === form.data.supplier_id);

    const gtin = String(form.data.gtin ?? '');
    const gtinState = gtin === '' ? 'empty' : gtinValid(gtin) ? 'valid' : 'invalid';

    const sections: [string, string][] = [
        ['general', 'General'],
        ...(canInventory ? [['inventory', 'Inventory'] as [string, string]] : []),
        ...(canShipping ? [['shipping', 'Shipping'] as [string, string]] : []),
        ['linked', 'Linked products'],
        ...(canAttributes ? [['attributes', 'Attributes'] as [string, string]] : []),
        ...(canVariants ? [['variations', 'Variations'] as [string, string]] : []),
        ...(isDownloadable ? [['downloads', 'Downloads'] as [string, string]] : []),
        ['advanced', 'Advanced'],
    ];
    const section = sections.some(([k]) => k === activeSection) ? activeSection : 'general';

    /* ----------------------------- helpers ----------------------------- */

    const set = (key: string, value: any) => form.setData(key, value);
    const setMeta = (key: string, value: any) => form.setData('metadata', { ...metadata, [key]: value });
    const num = (v: string) => (v === '' ? 0 : Number(v));
    const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const goTab = (key: string) => {
        setActiveSection(key);
        requestAnimationFrame(() => jump('product-data'));
    };

    const unlockSlug = async () => {
        if (!isCreate) {
            const ok = await confirm({
                title: 'Edit the product URL?',
                description: 'Changing the URL breaks existing links to this product.',
                confirmLabel: 'Edit URL',
            });
            if (!ok) return;
        }
        setSlugLocked(false);
    };

    // La pestaña activa queda en la URL (#shipping).
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.history.replaceState(window.history.state, '', section === 'general' ? window.location.pathname + window.location.search : `#${section}`);
        }
    }, [section]);

    // Aviso al salir con cambios sin guardar: SOLO en navegación real.
    // Se ignoran prefetch (pasar el mouse por el menú), recargas parciales, visitas async y cambios de hash/query en la misma página.
    // Aviso al salir con cambios sin guardar. Solo reacciona a clics reales en enlaces
    // (y al cerrar o recargar la pestaña): hover, prefetch y recargas parciales no cuentan.
    useEffect(() => {
        if (!form.isDirty) return;

        const onClick = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
            if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

            const url = new URL(anchor.href, window.location.href);
            if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;

            e.preventDefault();
            e.stopPropagation();

            void confirmRef
                .current({
                    title: 'Leave without saving?',
                    description: 'You have unsaved changes. If you leave now they will be lost.',
                    confirmLabel: 'Discard and leave',
                    cancelLabel: 'Keep editing',
                    destructive: true,
                })
                .then((ok) => ok && router.visit(url.href));
        };

        document.addEventListener('click', onClick, true); // captura: corre antes que Inertia

        return () => document.removeEventListener('click', onClick, true);
    }, [form.isDirty]);

    /* ------------------------------- save ------------------------------- */

    /** draft = despublica · publish = publica · keep = guarda sin cambiar el estado. */
    const save = (intent: 'draft' | 'publish' | 'keep') => {
        if (!canSave || form.processing) return;

        if (gtinState === 'invalid') {
            goTab('inventory');
            return;
        }

        const isVisible = intent === 'publish' ? true : intent === 'draft' ? false : Boolean(form.data.is_visible);
        const publishedAt =
            intent === 'publish'
                ? new Date(form.data.published_at || Date.now()).toISOString()
                : form.data.published_at
                    ? new Date(form.data.published_at).toISOString()
                    : null;

        // Multipart + _method=put: PHP no procesa multipart en PUT real.
        form.transform((data) => ({
            ...data,
            ...(isCreate ? {} : { _method: 'put' }),
            slug: data.slug || slugify(data.name),
            is_visible: isVisible,
            published_at: publishedAt,
            prices: rowsToPayload(currencies, data.prices),
            options: data.options.filter((o: any) => o.attribute_value_id || o.custom_value),
        }));

        const url = isCreate
            ? productRoutes.store.url({ current_team: team })
            : productRoutes.update.url({ current_team: team, product: product!.id });

        form.post(url, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                if (isCreate) return;

                const next = { ...form.data, is_visible: isVisible, thumbnail: null, gallery: [], files: [] };
                form.setData(next);
                form.setDefaults(next);
                setThumbnailPreview(null);
                setGalleryPreviews([]);
                setSlugLocked(true);
            },
        });
    };

    // Ctrl/Cmd + S guarda sin cambiar el estado de publicación.
    const saveRef = useRef(save);
    saveRef.current = save;
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                saveRef.current('keep');
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const removeMedia = async (item: MediaItem) => {
        if (!product) return;

        const ok = await confirm({
            title: `Delete ${item.name}?`,
            description: 'This is applied immediately and cannot be undone.',
            confirmLabel: 'Delete',
            destructive: true,
        });
        if (!ok) return;

        router.delete(productRoutes.destroyMedia.url({ current_team: team, product: product.id, media: item.id }), { preserveScroll: true });
    };

    const duplicate = async () => {
        if (!product) return;

        if (form.isDirty) {
            const ok = await confirm({
                title: 'Duplicate the saved version?',
                description: 'Your unsaved changes will not be copied.',
                confirmLabel: 'Duplicate',
            });
            if (!ok) return;
        }

        router.post(productRoutes.duplicate.url({ current_team: team, product: product.id }));
    };

    const handleThumbnail = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        set('thumbnail', file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    const clearThumbnail = () => {
        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        set('thumbnail', null);
        setThumbnailPreview(null);
        if (thumbnailInput.current) thumbnailInput.current.value = '';
    };

    const handleGallery = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        set('gallery', [...form.data.gallery, ...files]);
        setGalleryPreviews((c) => [...c, ...files.map((f) => ({ url: URL.createObjectURL(f) }))]);
        e.target.value = '';
    };

    const removeGalleryFile = (index: number) => {
        URL.revokeObjectURL(galleryPreviews[index].url);
        set('gallery', form.data.gallery.filter((_: File, i: number) => i !== index));
        setGalleryPreviews((c) => c.filter((_, i) => i !== index));
    };

    const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
        set('files', [...form.data.files, ...Array.from(e.target.files ?? [])]);
        e.target.value = '';
    };

    const setOption = (attributeId: number, patch: Record<string, any>) => {
        const rest = form.data.options.filter((o: any) => Number(o.attribute_id) !== attributeId);
        const current = form.data.options.find((o: any) => Number(o.attribute_id) === attributeId) ?? {
            attribute_id: attributeId,
            attribute_value_id: null,
            custom_value: '',
        };
        set('options', [...rest, { ...current, ...patch }]);
    };

    const optionOf = (attributeId: number) => form.data.options.find((o: any) => Number(o.attribute_id) === attributeId);
    const linkItems = products.map((x) => ({ id: x.id, name: x.name, hint: x.sku }));

    /* ------------------- precios, readiness y vista previa ------------------- */

    const firstCurrency = currencies[0];
    const priceRow: any = form.data.prices[0];
    const regular = priceRow && priceRow.amount !== '' ? Number(priceRow.amount) : null;
    const sale = priceRow && priceRow.sale_amount !== '' ? Number(priceRow.sale_amount) : null;
    const saleActive =
        regular !== null && sale !== null && sale < regular &&
        (!priceRow.sale_starts_at || new Date(priceRow.sale_starts_at).getTime() <= Date.now()) &&
        (!priceRow.sale_ends_at || new Date(priceRow.sale_ends_at).getTime() >= Date.now());
    const money = (n: number) => (firstCurrency ? formatMoney(toMinor(String(n), firstCurrency.code) ?? 0, firstCurrency.code) : String(n));
    const currentPrice = regular === null ? null : money(saleActive ? sale! : regular);

    // Etiquetas imprimibles: el producto y cada variante (solo lo ya guardado).
    const labelItems: LabelItem[] = isCreate || !product
        ? []
        : [
            ...(product.barcode && type !== 'variant'
                ? [{ key: 'p', label: product.name, sku: product.sku, barcode: product.barcode, price: currentPrice }]
                : []),
            ...(product.variants ?? [])
                .filter((v) => v.barcode)
                .map((v) => {
                    const amount = v.prices.find((pr) => pr.currency_id === firstCurrency?.id)?.amount;

                    return {
                        key: `v${v.id}`,
                        label: `${product.name} — ${v.name}`,
                        sku: v.sku,
                        barcode: v.barcode as string,
                        price: amount != null && firstCurrency ? formatMoney(amount, firstCurrency.code) : null,
                    };
                }),
        ];

    const seoLen = (metadata.seo_description || '').length;
    const hasPrice = (form.data.prices as any[]).some((r) => Number(r.amount) > 0);
    const hasThumb = Boolean(thumbnailPreview || currentThumbnail);
    const stockOk = !form.data.manage_stock
        ? form.data.stock_status === 'instock'
        : type === 'variant'
            ? (product?.variants?.length ?? 0) > 0
            : Object.values(stock).some((q) => q > 0);

    const checks: { label: string; done: boolean; go: () => void }[] = [
        { label: 'Name and a description of 50+ characters', done: form.data.name.trim() !== '' && form.data.description.trim().length >= 50, go: () => jump('p-desc') },
        { label: 'Product photo', done: hasThumb, go: () => jump('product-image') },
        { label: 'Price', done: hasPrice, go: () => goTab('general') },
        { label: 'SKU', done: form.data.sku.trim() !== '', go: () => jump('p-sku') },
        { label: 'At least one category', done: form.data.category_ids.length > 0, go: () => jump('catalog-org') },
        ...(canInventory
            ? [{ label: type === 'variant' ? 'At least one variation' : 'Stock available', done: stockOk, go: () => goTab(type === 'variant' ? 'variations' : 'inventory') }]
            : []),
        ...(canShipping && form.data.shipping_enabled
            ? [{ label: 'Weight for shipping rates', done: Number(form.data.weight_value) > 0, go: () => goTab('shipping') }]
            : []),
        { label: 'SEO description (50–160 characters)', done: seoLen >= 50 && seoLen <= 160, go: () => jump('seo-desc') },
    ];
    const doneCount = checks.filter((c) => c.done).length;
    const score = Math.round((doneCount / checks.length) * 100);

    const slugUrl = `${typeof window !== 'undefined' ? window.location.host : ''}/${form.data.slug || 'your-product'}`;

    /* ------------------------------- render ------------------------------- */

    return (
        <>
            <Head title={isCreate ? 'Add Product' : `Edit ${product?.name ?? 'Product'}`} />

            <div className="min-h-screen bg-muted/20">
                {/* Header */}
                <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
                    <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
                        <div className="flex min-w-0 items-center gap-4">
                            <Button asChild variant="ghost" size="icon" aria-label="Back to products">
                                <Link href={productRoutes.index.url({ current_team: team })}>
                                    <ArrowLeft className="size-4" />
                                </Link>
                            </Button>
                            <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Link href={productRoutes.index.url({ current_team: team })} className="hover:text-foreground">Products</Link>
                                    <span>/</span>
                                    <span>{isCreate ? 'Add Product' : 'Edit Product'}</span>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">{statusLabel}</span>
                                </div>
                                <h1 className="truncate text-xl font-semibold tracking-tight">{form.data.name || (isCreate ? 'Add Product' : 'Edit Product')}</h1>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {form.isDirty && <span className="hidden text-sm text-muted-foreground md:inline">Unsaved changes · ⌘S</span>}

                            {wasPublished ? (
                                <>
                                    <Button type="button" variant="outline" disabled={!canSave || form.processing} onClick={() => save('draft')}>
                                        Unpublish
                                    </Button>
                                    <Button type="button" disabled={!canSave || form.processing} onClick={() => save('keep')}>
                                        {form.processing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                                        Save changes
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button type="button" variant="outline" disabled={!canSave || form.processing} onClick={() => save('draft')}>
                                        {form.processing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                                        Save as draft
                                    </Button>
                                    <Button type="button" disabled={!canSave || form.processing} onClick={() => save('publish')}>
                                        Publish
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <main className="mx-auto max-w-[1600px] px-6 py-6">
                    <form onSubmit={(e: FormEvent) => { e.preventDefault(); save('keep'); }}>
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                            {/* ============ LEFT ============ */}
                            <div className="space-y-6">
                                <CardSection title="Basic information" description="Name, identifiers and description shown on the product page.">
                                    <div className="space-y-5">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field id="p-name" label="Product name" error={errors.name}>
                                                <Input
                                                    id="p-name"
                                                    value={form.data.name}
                                                    placeholder="Product name"
                                                    onChange={(e) => {
                                                        set('name', e.target.value);
                                                        // En un producto nuevo el slug sigue al nombre mientras esté bloqueado.
                                                        if (isCreate && slugLocked) set('slug', slugify(e.target.value));
                                                    }}
                                                />
                                            </Field>

                                            <Field id="p-type" label="Product type" error={errors.type} description={selectedType?.hint}>
                                                <Select value={form.data.type} onValueChange={(v) => set('type', v)}>
                                                    <SelectTrigger id="p-type"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {productTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </Field>
                                        </div>

                                        <Field
                                            id="p-slug"
                                            label="URL slug"
                                            error={errors.slug}
                                            description={<>Public address: <span className="font-mono">{slugUrl}</span></>}
                                            aside={
                                                slugLocked ? (
                                                    <MiniAction icon={Pencil} onClick={unlockSlug}>Edit</MiniAction>
                                                ) : (
                                                    <span className="flex gap-3">
                                                        <MiniAction icon={Sparkles} onClick={() => set('slug', slugify(form.data.name))}>Regenerate</MiniAction>
                                                        <MiniAction icon={Check} onClick={() => setSlugLocked(true)}>Done</MiniAction>
                                                    </span>
                                                )
                                            }
                                        >
                                            <Input
                                                id="p-slug"
                                                readOnly={slugLocked}
                                                aria-readonly={slugLocked}
                                                className={cn('font-mono', slugLocked && 'bg-muted/50 text-muted-foreground')}
                                                value={form.data.slug}
                                                placeholder="generated-from-the-name"
                                                onChange={(e) => set('slug', slugify(e.target.value))}
                                            />
                                        </Field>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                id="p-sku"
                                                label="SKU"
                                                error={errors.sku}
                                                description="Your internal stock code. Must be unique."
                                                aside={<MiniAction icon={Sparkles} onClick={() => set('sku', genSku(form.data.name))}>Generate</MiniAction>}
                                            >
                                                <Input id="p-sku" value={form.data.sku} placeholder="SKU-001" onChange={(e) => set('sku', e.target.value.toUpperCase())} />
                                            </Field>

                                            <div className="space-y-2" id="p-barcode">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-medium">Barcode</span>
                                                    <span className="text-xs text-muted-foreground">Automatic · EAN-13</span>
                                                </div>
                                                <BarcodeCard value={p.barcode} canPrint={labelItems.length > 0} onPrint={() => setLabelOpen(true)} />
                                                <p className="text-xs text-muted-foreground">For your own scanning. Marketplace codes go in GTIN (Inventory tab).</p>
                                            </div>
                                        </div>

                                        <Field id="p-summary" label="Short description" error={errors.summary}>
                                            <Textarea id="p-summary" rows={3} value={form.data.summary} onChange={(e) => set('summary', e.target.value)} />
                                        </Field>

                                        <Field id="p-desc" label="Description" error={errors.description} aside={<span className="text-xs text-muted-foreground">{form.data.description.length} characters</span>}>
                                            <Textarea id="p-desc" rows={10} value={form.data.description} placeholder="Describe the product..." onChange={(e) => set('description', e.target.value)} />
                                        </Field>
                                    </div>
                                </CardSection>

                                <CardSection title="Sourcing & brand" description="Who you buy this product from, and who makes it. Shipping carriers are configured separately in Carriers.">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field id="c-supplier" label="Supplier" error={errors.supplier_id}>
                                            <SearchSelect id="c-supplier" value={form.data.supplier_id} onChange={(v) => set('supplier_id', v)} items={supplierList} placeholder="Select supplier" emptyLabel="No supplier" />
                                        </Field>

                                        <Field id="c-brand" label="Brand" error={errors.brand_id}>
                                            <SearchSelect id="c-brand" value={form.data.brand_id} onChange={(v) => set('brand_id', v)} items={brands} placeholder="Select brand" emptyLabel="No brand" />
                                        </Field>
                                    </div>

                                    {selectedSupplier ? (
                                        <dl className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                                            <div><dt className="text-xs text-muted-foreground">Contact</dt><dd className="font-medium">{selectedSupplier.contact_name || '—'}</dd></div>
                                            <div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="font-medium">{selectedSupplier.phone || '—'}</dd></div>
                                            <div>
                                                <dt className="text-xs text-muted-foreground">Email</dt>
                                                <dd className="truncate font-medium">{selectedSupplier.email ? <a className="hover:underline" href={`mailto:${selectedSupplier.email}`}>{selectedSupplier.email}</a> : '—'}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs text-muted-foreground">Website</dt>
                                                <dd className="truncate font-medium">
                                                    {selectedSupplier.website ? (
                                                        <a className="inline-flex items-center gap-1 hover:underline" href={selectedSupplier.website} target="_blank" rel="noreferrer">
                                                            {selectedSupplier.website.replace(/^https?:\/\//, '')} <ExternalLink className="size-3" />
                                                        </a>
                                                    ) : '—'}
                                                </dd>
                                            </div>
                                        </dl>
                                    ) : (
                                        <p className="mt-3 text-xs text-muted-foreground">
                                            {supplierList.length === 0 ? 'You have no suppliers yet. ' : 'Not listed? '}
                                            <Link href={supplierRoutes.create.url({ current_team: team })} className="font-medium text-primary hover:underline">Create a supplier</Link>
                                        </p>
                                    )}
                                </CardSection>

                                <CardSection id="product-data" title="Product data">
                                    <div role="tablist" className="mb-6 flex flex-wrap gap-2 border-b pb-4">
                                        {sections.map(([key, label]) => (
                                            <button
                                                key={key}
                                                role="tab"
                                                aria-selected={section === key}
                                                type="button"
                                                onClick={() => setActiveSection(key)}
                                                className={cn(
                                                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                                                    section === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* GENERAL */}
                                    {section === 'general' && (
                                        <div className="space-y-6">
                                            {type === 'external' && (
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <Field id="p-url" label="Product URL" error={errors['metadata.product_url']}>
                                                        <Input id="p-url" type="url" placeholder="https://" value={metadata.product_url} onChange={(e) => setMeta('product_url', e.target.value)} />
                                                    </Field>
                                                    <Field id="p-btn" label="Button text">
                                                        <Input id="p-btn" placeholder="Buy now" value={metadata.button_text} onChange={(e) => setMeta('button_text', e.target.value)} />
                                                    </Field>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <h3 className="text-sm font-semibold">Pricing</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    A sale price applies between its start and end dates. Leave the dates empty for a sale with no schedule.
                                                </p>
                                                <PriceRows currencies={currencies} rows={form.data.prices} errors={errors} onChange={(rows) => set('prices', rows)} />
                                            </div>

                                            <div className="space-y-3">
                                                <h3 className="text-sm font-semibold">Tax</h3>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <Field id="t-status" label="Tax status" error={errors.tax_status}>
                                                        <Select value={form.data.tax_status} onValueChange={(v) => set('tax_status', v)}>
                                                            <SelectTrigger id="t-status"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="taxable">Taxable</SelectItem>
                                                                <SelectItem value="shipping">Shipping only (product not taxed)</SelectItem>
                                                                <SelectItem value="none">None (exempt)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </Field>

                                                    <Field id="t-class" label="Tax class" description="Applies only the tax rate with this code (Settings → Tax zones). Empty applies every rate of the zone.">
                                                        <Select value={form.data.tax_class || NONE} onValueChange={(v) => set('tax_class', v === NONE ? '' : v)}>
                                                            <SelectTrigger id="t-class"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value={NONE}>Standard (all rates)</SelectItem>
                                                                {taxClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </Field>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* INVENTORY */}
                                    {section === 'inventory' && (
                                        <div className="space-y-5">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    id="i-gtin"
                                                    label="GTIN / EAN (official)"
                                                    error={errors.gtin}
                                                    description={
                                                        gtinState === 'valid' ? <span className="text-emerald-600">Valid GTIN-{gtin.length}</span>
                                                            : gtinState === 'invalid' ? <span className="text-destructive">Invalid: the check digit does not match (8, 12, 13 or 14 digits).</span>
                                                                : 'Official GS1 code required by Google Shopping and marketplaces. Leave empty if you have none.'
                                                    }
                                                >
                                                    <Input id="i-gtin" inputMode="numeric" maxLength={14} value={gtin} onChange={(e) => set('gtin', e.target.value.replace(/\D/g, ''))} aria-invalid={gtinState === 'invalid'} />
                                                </Field>
                                                <Field id="i-mpn" label="MPN" description="Manufacturer part number.">
                                                    <Input id="i-mpn" value={form.data.mpn} onChange={(e) => set('mpn', e.target.value)} />
                                                </Field>
                                            </div>

                                            <Toggle
                                                checked={Boolean(form.data.manage_stock)}
                                                onCheckedChange={(v) => set('manage_stock', v)}
                                                label="Track quantity"
                                                description="Block orders when stock runs out. Turn off to control availability manually."
                                            />

                                            {form.data.manage_stock ? (
                                                <>
                                                    {type === 'variant' ? (
                                                        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                                            Stock for variable products is managed per variant, in the Variations tab.
                                                        </p>
                                                    ) : isCreate ? (
                                                        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                                            Save the product first to set stock for each location.
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <h3 className="text-sm font-semibold">Stock by location</h3>
                                                            <StockPanel
                                                                inventories={inventories}
                                                                stock={stock}
                                                                url={productRoutes.adjustStock.url({ current_team: team, product: product!.id })}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <Field id="i-sec" label="Security stock" description="Units kept in reserve and not sold.">
                                                            <Input id="i-sec" type="number" min="0" value={form.data.security_stock} onChange={(e) => set('security_stock', num(e.target.value))} />
                                                        </Field>
                                                        <div className="flex items-end">
                                                            <Toggle checked={Boolean(form.data.allow_backorder)} onCheckedChange={(v) => set('allow_backorder', v)} label="Allow backorders" description="Keep selling at zero stock." />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <Field id="i-status" label="Availability">
                                                    <Select value={form.data.stock_status} onValueChange={(v) => set('stock_status', v)}>
                                                        <SelectTrigger id="i-status" className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="instock">In stock</SelectItem>
                                                            <SelectItem value="outofstock">Out of stock</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </Field>
                                            )}

                                            <div className="grid gap-4 md:grid-cols-3">
                                                <Field id="i-min" label="Minimum per order" description="0 = no minimum." error={errors.min_qty}>
                                                    <Input id="i-min" type="number" min="0" value={form.data.min_qty} onChange={(e) => set('min_qty', num(e.target.value))} />
                                                </Field>
                                                <Field id="i-max" label="Maximum per order" description="0 = no maximum." error={errors.max_qty}>
                                                    <Input id="i-max" type="number" min="0" value={form.data.max_qty} onChange={(e) => set('max_qty', num(e.target.value))} />
                                                </Field>
                                                <div className="flex items-end">
                                                    <Toggle checked={Boolean(form.data.sold_individually)} onCheckedChange={(v) => set('sold_individually', v)} label="Sold individually" description="Limit to 1 per order." />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SHIPPING */}
                                    {section === 'shipping' && (
                                        <div className="space-y-5">
                                            <div className="flex gap-3 rounded-xl border bg-muted/30 p-4">
                                                <Truck className="mt-0.5 size-5 shrink-0" />
                                                <p className="text-sm text-muted-foreground">
                                                    Carriers (FedEx, UPS, DHL…) and their prices are set per zone in Carriers. These settings decide when and how this product ships.
                                                </p>
                                            </div>

                                            <div className="grid gap-3 md:grid-cols-2">
                                                <Toggle checked={Boolean(form.data.shipping_enabled)} onCheckedChange={(v) => set('shipping_enabled', v)} label="This product ships" description="Turn off for items with no delivery." />
                                                <Toggle checked={Boolean(form.data.shipping_free)} onCheckedChange={(v) => set('shipping_free', v)} label="Free shipping" description="Free when every shippable item in the cart has it." />
                                                <Toggle checked={Boolean(form.data.ship_internationally)} onCheckedChange={(v) => set('ship_internationally', v)} label="Ship internationally" description="Off: only ships to the country of origin." />
                                                <Toggle checked={Boolean(form.data.shipping_requires_box)} onCheckedChange={(v) => set('shipping_requires_box', v)} label="Send box dimensions to carriers" description="Off: carriers receive weight only." />
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field id="s-class" label="Shipping class" description="Carrier options can be restricted to specific classes (e.g. fragile, bulky).">
                                                    <SuggestInput id="s-class" value={form.data.shipping_class} onChange={(v) => set('shipping_class', v)} suggestions={shippingClasses} />
                                                </Field>

                                                <Field id="s-origin" label="Country of origin" description="2-letter ISO code (EC, US…). Needed to restrict international shipping." error={errors.shipping_origin_country}>
                                                    <Input id="s-origin" maxLength={2} className="uppercase" value={form.data.shipping_origin_country} onChange={(e) => set('shipping_origin_country', e.target.value.toUpperCase())} />
                                                </Field>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field id="s-weight" label="Weight" error={errors.weight_value}>
                                                    <div className="flex gap-2">
                                                        <Input id="s-weight" type="number" min="0" step="0.01" value={form.data.weight_value} onChange={(e) => set('weight_value', e.target.value)} />
                                                        <Select value={form.data.weight_unit} onValueChange={(v) => set('weight_unit', v)}>
                                                            <SelectTrigger className="w-28" aria-label="Weight unit"><SelectValue /></SelectTrigger>
                                                            <SelectContent>{WEIGHT.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </div>
                                                </Field>

                                                <Field id="s-volume" label="Volume" error={errors.volume_value}>
                                                    <div className="flex gap-2">
                                                        <Input id="s-volume" type="number" min="0" step="0.01" value={form.data.volume_value} onChange={(e) => set('volume_value', e.target.value)} />
                                                        <Select value={form.data.volume_unit} onValueChange={(v) => set('volume_unit', v)}>
                                                            <SelectTrigger className="w-28" aria-label="Volume unit"><SelectValue /></SelectTrigger>
                                                            <SelectContent>{VOLUME.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </div>
                                                </Field>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-3">
                                                {[['width', 'Width'], ['height', 'Height'], ['depth', 'Depth']].map(([key, label]) => (
                                                    <Field key={key} id={`s-${key}`} label={label} error={errors[`${key}_value`]}>
                                                        <div className="flex gap-2">
                                                            <Input id={`s-${key}`} type="number" min="0" step="0.01" value={form.data[`${key}_value`] ?? ''} onChange={(e) => set(`${key}_value`, e.target.value)} />
                                                            <Select value={form.data[`${key}_unit`]} onValueChange={(v) => set(`${key}_unit`, v)}>
                                                                <SelectTrigger className="w-24" aria-label={`${label} unit`}><SelectValue /></SelectTrigger>
                                                                <SelectContent>{LENGTH.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                                            </Select>
                                                        </div>
                                                    </Field>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* LINKED PRODUCTS */}
                                    {section === 'linked' && (
                                        <div className="space-y-5">
                                            <MultiCheck label="Upsells" items={linkItems} value={form.data.upsell_ids} error={errors.upsell_ids} onChange={(v) => set('upsell_ids', v)} />
                                            <p className="-mt-3 text-xs text-muted-foreground">Shown on the product page as better or more expensive alternatives.</p>
                                            <MultiCheck label="Cross-sells" items={linkItems} value={form.data.cross_sell_ids} error={errors.cross_sell_ids} onChange={(v) => set('cross_sell_ids', v)} />
                                            <p className="-mt-3 text-xs text-muted-foreground">Suggested in the cart as complements.</p>
                                            <MultiCheck label="Related products" items={linkItems} value={form.data.related_ids} error={errors.related_ids} onChange={(v) => set('related_ids', v)} />
                                        </div>
                                    )}

                                    {/* ATTRIBUTES */}
                                    {section === 'attributes' && (
                                        <div className="space-y-4">
                                            {attributes.length === 0 && <p className="text-sm text-muted-foreground">No attributes defined. Create them in Catalog → Attributes.</p>}

                                            {attributes.map((attribute: any) => {
                                                const selected = optionOf(attribute.id);
                                                const hasValues = (attribute.values ?? []).length > 0;

                                                return (
                                                    <div key={attribute.id} className="rounded-xl border p-4">
                                                        <p className="mb-3 text-sm font-medium">{attribute.name}</p>

                                                        {hasValues ? (
                                                            <Select
                                                                value={selected?.attribute_value_id ? String(selected.attribute_value_id) : NONE}
                                                                onValueChange={(v) => setOption(attribute.id, { attribute_value_id: v === NONE ? null : Number(v), custom_value: '' })}
                                                            >
                                                                <SelectTrigger aria-label={attribute.name}><SelectValue placeholder="Select value" /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value={NONE}>None</SelectItem>
                                                                    {attribute.values.map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.value}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                aria-label={attribute.name}
                                                                type={attribute.type === 'number' ? 'number' : 'text'}
                                                                value={selected?.custom_value ?? ''}
                                                                onChange={(e) => setOption(attribute.id, { attribute_value_id: null, custom_value: e.target.value })}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* VARIATIONS */}
                                    {section === 'variations' && (
                                        isCreate || !product ? (
                                            <div className="rounded-xl border border-dashed p-6 text-center">
                                                <Package className="mx-auto mb-3 size-8 text-muted-foreground" />
                                                <p className="font-medium">Save the product first</p>
                                                <p className="mt-1 text-sm text-muted-foreground">Variations can be added right after the first save.</p>
                                            </div>
                                        ) : (
                                            <VariantsPanel
                                                productId={product.id}
                                                team={team}
                                                variants={product.variants ?? []}
                                                currencies={currencies}
                                                inventories={inventories}
                                                variantStock={variantStock}
                                                attributes={attributes}
                                            />
                                        )
                                    )}

                                    {/* DOWNLOADS */}
                                    {section === 'downloads' && (
                                        <div className="space-y-5">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field id="d-limit" label="Download limit" description="Times each file can be downloaded per order. Empty = unlimited.">
                                                    <Input id="d-limit" type="number" min="0" value={form.data.download_limit} onChange={(e) => set('download_limit', e.target.value)} />
                                                </Field>
                                                <Field id="d-days" label="Link expiry (days)" description="Days the links stay valid after payment. Empty = never.">
                                                    <Input id="d-days" type="number" min="0" value={form.data.download_expiry_days} onChange={(e) => set('download_expiry_days', e.target.value)} />
                                                </Field>
                                            </div>

                                            <input ref={filesInput} type="file" multiple className="hidden" onChange={handleFiles} />

                                            <ul className="space-y-2 text-sm">
                                                {fileMedia.map((item) => (
                                                    <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                                                        <span className="flex min-w-0 items-center gap-2"><FileText className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{item.name}</span></span>
                                                        <button type="button" aria-label={`Delete ${item.name}`} onClick={() => removeMedia(item)}><Trash2 className="size-4 text-muted-foreground" /></button>
                                                    </li>
                                                ))}
                                                {(form.data.files as File[]).map((file, i) => (
                                                    <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-primary/40 p-3">
                                                        <span className="flex min-w-0 items-center gap-2"><FileText className="size-4 shrink-0" /><span className="truncate">{file.name}</span><span className="text-xs text-muted-foreground">uploads on save</span></span>
                                                        <button type="button" aria-label="Remove file" onClick={() => set('files', form.data.files.filter((_: File, idx: number) => idx !== i))}><Trash2 className="size-4 text-muted-foreground" /></button>
                                                    </li>
                                                ))}
                                                {fileMedia.length === 0 && form.data.files.length === 0 && <li className="text-muted-foreground">No files yet.</li>}
                                            </ul>

                                            <Button type="button" size="sm" variant="outline" onClick={() => filesInput.current?.click()}>
                                                <Upload className="mr-2 size-4" /> Add files
                                            </Button>
                                            {errors['files.0'] && <p className="text-xs text-destructive">{errors['files.0']}</p>}
                                            <p className="text-xs text-muted-foreground">Customers receive a private link per file once the order is paid.</p>
                                        </div>
                                    )}

                                    {/* ADVANCED */}
                                    {section === 'advanced' && (
                                        <div className="space-y-5">
                                            <Field id="a-note" label="Purchase note" description="Shown to the customer after payment (instructions, license keys, thank-you message).">
                                                <Textarea id="a-note" rows={4} value={form.data.purchase_note} onChange={(e) => set('purchase_note', e.target.value)} />
                                            </Field>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field id="a-vis" label="Catalog visibility" error={errors.catalog_visibility}>
                                                    <Select value={form.data.catalog_visibility} onValueChange={(v) => set('catalog_visibility', v)}>
                                                        <SelectTrigger id="a-vis"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="visible">Shop and search</SelectItem>
                                                            <SelectItem value="catalog">Shop only</SelectItem>
                                                            <SelectItem value="search">Search only</SelectItem>
                                                            <SelectItem value="hidden">Hidden (direct link only)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </Field>

                                                <Field id="a-order" label="Menu order" description="Lower numbers appear first.">
                                                    <Input id="a-order" type="number" value={form.data.menu_order} onChange={(e) => set('menu_order', num(e.target.value))} />
                                                </Field>
                                            </div>

                                            <Toggle checked={Boolean(form.data.enable_reviews)} onCheckedChange={(v) => set('enable_reviews', v)} label="Enable reviews" description="Customers can rate and review this product." />
                                        </div>
                                    )}
                                </CardSection>

                                <CardSection id="catalog-org" title="Catalog organization" description="Where the product appears.">
                                    <div className="space-y-6">
                                        <MultiCheck label="Categories" items={categories} value={form.data.category_ids} error={errors.category_ids} onChange={(v) => set('category_ids', v)} />
                                        <MultiCheck label="Collections" items={collections} value={form.data.collection_ids} onChange={(v) => set('collection_ids', v)} />
                                        <MultiCheck label="Tags" items={tags} value={form.data.tag_ids} onChange={(v) => set('tag_ids', v)} />
                                        <MultiCheck label="Sales channels" items={channels} value={form.data.channel_ids} onChange={(v) => set('channel_ids', v)} />
                                    </div>
                                </CardSection>

                                <CardSection title="Search engine optimization" description="How the product appears in Google and when shared.">
                                    <div className="space-y-5">
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-4" aria-label="Search result preview">
                                            <p className="truncate text-xs text-muted-foreground">{slugUrl}</p>
                                            <p className="mt-1 truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">{metadata.seo_title || form.data.name || 'Product title'}</p>
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{metadata.seo_description || form.data.summary || 'Add a description to control the search snippet.'}</p>
                                        </div>

                                        <Field id="seo-title" label="SEO title" error={errors['metadata.seo_title']}>
                                            <div className="space-y-1">
                                                <Input id="seo-title" maxLength={70} value={metadata.seo_title} onChange={(e) => setMeta('seo_title', e.target.value)} />
                                                <div className="text-right"><Counter value={metadata.seo_title.length} max={70} /></div>
                                            </div>
                                        </Field>

                                        <Field id="seo-desc" label="SEO description" error={errors['metadata.seo_description']}>
                                            <div className="space-y-1">
                                                <Textarea id="seo-desc" rows={3} maxLength={160} value={metadata.seo_description} onChange={(e) => setMeta('seo_description', e.target.value)} />
                                                <div className="text-right"><Counter value={metadata.seo_description.length} max={160} /></div>
                                            </div>
                                        </Field>

                                        <Field id="seo-kw" label="Focus keyword">
                                            <Input id="seo-kw" value={metadata.seo_keyword} onChange={(e) => setMeta('seo_keyword', e.target.value)} />
                                        </Field>

                                        <Toggle checked={Boolean(metadata.seo_noindex)} onCheckedChange={(v) => setMeta('seo_noindex', v)} label="Hide from search engines" description="Adds a noindex directive to this product." />
                                    </div>
                                </CardSection>
                            </div>

                            {/* ============ SIDEBAR ============ */}
                            <aside className="space-y-6">
                                <CardSection title="Publish">
                                    <div className="space-y-4">
                                        <Toggle checked={Boolean(form.data.featured)} onCheckedChange={(v) => set('featured', v)} label="Featured product" />

                                        <Field id="pub-date" label="Publish date" description="Leave empty to publish immediately. A future date schedules it.">
                                            <Input id="pub-date" type="datetime-local" value={form.data.published_at ?? ''} onChange={(e) => set('published_at', e.target.value)} />
                                        </Field>

                                        {!isCreate && can('create_product') && (
                                            <Button type="button" variant="outline" className="w-full" onClick={duplicate}>
                                                <Copy className="mr-2 size-4" /> Duplicate product
                                            </Button>
                                        )}

                                        {canDelete && (
                                            <Button type="button" variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                                                <Trash2 className="mr-2 size-4" /> Delete product
                                            </Button>
                                        )}
                                    </div>
                                </CardSection>

                                <CardSection title="Product readiness" description={`${doneCount} of ${checks.length} steps complete`}>
                                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Product readiness">
                                        <div className={cn('h-full rounded-full transition-all', score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-destructive')} style={{ width: `${score}%` }} />
                                    </div>
                                    <ul className="space-y-1">
                                        {checks.map((c) => (
                                            <li key={c.label}>
                                                <button type="button" onClick={c.go} className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm hover:bg-muted">
                                                    {c.done ? <Check className="size-4 shrink-0 text-emerald-600" /> : <Circle className="size-4 shrink-0 text-muted-foreground/50" />}
                                                    <span className={cn(c.done && 'text-muted-foreground line-through')}>{c.label}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </CardSection>

                                <CardSection title="Store preview">
                                    <div className="overflow-hidden rounded-xl border bg-background">
                                        <div className="aspect-square bg-muted/30">
                                            {thumbnailPreview || currentThumbnail ? (
                                                <img src={thumbnailPreview ?? currentThumbnail?.url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center"><ImagePlus className="size-8 text-muted-foreground/40" /></div>
                                            )}
                                        </div>
                                        <div className="space-y-1 p-3">
                                            <p className="truncate text-sm font-medium">{form.data.name || 'Product name'}</p>
                                            <p className="flex items-baseline gap-2 text-sm">
                                                {regular === null ? (
                                                    <span className="text-muted-foreground">No price</span>
                                                ) : saleActive ? (
                                                    <>
                                                        <span className="font-semibold text-destructive">{money(sale!)}</span>
                                                        <span className="text-xs text-muted-foreground line-through">{money(regular)}</span>
                                                    </>
                                                ) : (
                                                    <span className="font-semibold">{money(regular)}</span>
                                                )}
                                            </p>
                                            {!form.data.manage_stock && form.data.stock_status === 'outofstock' && <p className="text-xs text-destructive">Out of stock</p>}
                                        </div>
                                    </div>
                                </CardSection>

                                <CardSection id="product-image" title="Product image">
                                    <input ref={thumbnailInput} type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />

                                    <button
                                        type="button"
                                        onClick={() => thumbnailInput.current?.click()}
                                        className="group relative flex aspect-square w-full overflow-hidden rounded-xl border border-dashed bg-muted/20"
                                        aria-label="Upload product image"
                                    >
                                        {thumbnailPreview || currentThumbnail ? (
                                            <img src={thumbnailPreview ?? currentThumbnail?.url} alt={form.data.name || 'Product'} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="m-auto text-center">
                                                <ImagePlus className="mx-auto mb-2 size-8 text-muted-foreground" />
                                                <p className="text-sm font-medium">Upload image</p>
                                                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or WebP · max 10 MB</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                                            <Upload className="size-6 text-white" />
                                        </div>
                                    </button>

                                    <div className="mt-3 flex gap-2">
                                        {thumbnailPreview && <Button type="button" size="sm" variant="ghost" onClick={clearThumbnail}>Discard new image</Button>}
                                        {!thumbnailPreview && currentThumbnail && !isCreate && (
                                            <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeMedia(currentThumbnail)}>Remove image</Button>
                                        )}
                                    </div>
                                    {errors.thumbnail && <p className="mt-2 text-xs text-destructive">{errors.thumbnail}</p>}
                                </CardSection>

                                <CardSection title="Gallery">
                                    <input ref={galleryInput} type="file" multiple accept="image/*" className="hidden" onChange={handleGallery} />

                                    <div className="grid grid-cols-3 gap-2">
                                        {galleryMedia.map((item) => (
                                            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg border">
                                                <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                                                <button type="button" aria-label={`Delete ${item.name}`} onClick={() => removeMedia(item)} className="absolute right-1 top-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100">
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}

                                        {galleryPreviews.map((item, index) => (
                                            <div key={item.url} className="relative aspect-square overflow-hidden rounded-lg border ring-2 ring-primary/40">
                                                <img src={item.url} alt="" className="h-full w-full object-cover" />
                                                <button type="button" aria-label="Remove selected image" onClick={() => removeGalleryFile(index)} className="absolute right-1 top-1 rounded-md bg-black/70 p-1 text-white">
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}

                                        <button type="button" aria-label="Add images" onClick={() => galleryInput.current?.click()} className="flex aspect-square items-center justify-center rounded-lg border border-dashed bg-muted/20">
                                            <Plus className="size-5 text-muted-foreground" />
                                        </button>
                                    </div>
                                    {galleryPreviews.length > 0 && <p className="mt-2 text-xs text-muted-foreground">New images are uploaded when you save.</p>}
                                </CardSection>

                                {!isCreate && (
                                    <CardSection title="Connected channels" description="Marketplaces and stores this product is synced with.">
                                        {externalIds.length === 0 ? (
                                            <div className="flex gap-3 text-sm text-muted-foreground">
                                                <Plug className="mt-0.5 size-4 shrink-0" />
                                                <p>Not connected to any marketplace yet. Linked listings (Shopify, WooCommerce, Amazon, Google Merchant…) will appear here once sync is enabled.</p>
                                            </div>
                                        ) : (
                                            <ul className="divide-y text-sm">
                                                {externalIds.map((x) => (
                                                    <li key={x.id} className="flex items-center justify-between gap-3 py-2">
                                                        <div className="min-w-0">
                                                            <p className="font-medium capitalize">{x.platform.replace(/_/g, ' ')}</p>
                                                            <p className="truncate font-mono text-xs text-muted-foreground">{x.external_id}</p>
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium uppercase', x.status === 'error' ? 'bg-destructive/10 text-destructive' : x.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600')}>
                                                                {x.status}
                                                            </span>
                                                            <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(x.last_synced_at)}</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardSection>
                                )}

                                <CardSection title="Internal note" description="Only visible to your team.">
                                    <Textarea aria-label="Internal note" rows={4} value={metadata.internal_note} onChange={(e) => setMeta('internal_note', e.target.value)} />
                                </CardSection>
                            </aside>
                        </div>
                    </form>
                </main>
            </div>

            <BarcodeLabelDialog open={labelOpen} onOpenChange={setLabelOpen} items={labelItems} />

            <ConfirmDelete
                open={confirmDelete}
                title={`Delete ${product?.name ?? 'this product'}?`}
                description="The product, its variants, prices and media will be removed."
                onCancel={() => setConfirmDelete(false)}
                onConfirm={() => product && router.delete(productRoutes.destroy.url({ current_team: team, product: product.id }))}
            />
        </>
    );
}