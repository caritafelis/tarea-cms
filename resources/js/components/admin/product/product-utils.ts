export const PRODUCT_TYPES = [
    { value: 'standard', label: 'Simple product', hint: 'A single physical product with stock.' },
    { value: 'variant', label: 'Variable product', hint: 'Sizes, colors and other variations.' },
    { value: 'virtual', label: 'Virtual / downloadable', hint: 'Digital product or service, no shipping.' },
    { value: 'external', label: 'External / affiliate', hint: 'Sold on another website.' },
];

/** Espejo de Product::canUse*() / tracksInventory() para reaccionar al cambiar el tipo en pantalla. */
export const capsFor = (type: string) => ({
    shipping: type === 'standard' || type === 'variant',
    attributes: ['standard', 'variant', 'virtual'].includes(type),
    variants: type === 'variant',
    inventory: type === 'standard' || type === 'variant',
    external: type === 'external',
    downloads: type === 'virtual',
});

export const slugify = (v: string) =>
    v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---- Precios -------------------------------------------------------
// Backend: amount (precio de venta), compare_amount (precio anterior), cost_amount; todo en centavos.
// UI estilo WooCommerce: Regular / Sale / Cost.
export type PriceRow = { currency_id: number; code: string; symbol: string; regular: string; sale: string; cost: string };

const toMoney = (cents: number | null | undefined) => (cents == null ? '' : (cents / 100).toFixed(2));
const toCents = (v: string) => (v === '' || Number.isNaN(Number(v)) ? null : Math.round(Number(v) * 100));

export function rowsFromPrices(currencies: any[], prices: any[] = []): PriceRow[] {
    return currencies.map((c) => {
        const p = prices.find((x) => x.currency_id === c.id);
        const hasSale = p?.compare_amount != null;
        return {
            currency_id: c.id,
            code: c.code,
            symbol: c.symbol ?? c.code,
            regular: toMoney(hasSale ? p.compare_amount : p?.amount),
            sale: hasSale ? toMoney(p.amount) : '',
            cost: toMoney(p?.cost_amount),
        };
    });
}

export function pricesPayload(rows: PriceRow[]) {
    return rows.map((r) => {
        const regular = toCents(r.regular);
        const sale = toCents(r.sale);
        return {
            currency_id: r.currency_id,
            amount: sale ?? regular,
            compare_amount: sale !== null && regular !== null ? regular : null,
            cost_amount: toCents(r.cost),
        };
    });
}

export function profitOf(r: PriceRow) {
    const price = Number(r.sale || r.regular);
    const cost = Number(r.cost);
    if (!price || r.cost === '' || Number.isNaN(cost)) return null;
    const profit = price - cost;
    return { profit, margin: (profit / price) * 100 };
}

// ---- Estado de publicación (is_visible + published_at) -------------
export type PubStatus = 'draft' | 'published' | 'scheduled';

export function statusOf(isVisible: boolean, publishedAt: string): PubStatus {
    if (!isVisible) return 'draft';
    if (publishedAt && new Date(publishedAt) > new Date()) return 'scheduled';
    return 'published';
}

export const localNow = (plusDays = 0) => {
    const d = new Date(Date.now() + plusDays * 864e5);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

export const defaultMetadata = (md: Record<string, any> = {}, toLocal: (v: any) => string = (v) => v ?? '') => ({
    seo_title: md.seo_title ?? '', seo_description: md.seo_description ?? '', seo_keyword: md.seo_keyword ?? '', seo_noindex: Boolean(md.seo_noindex),
    gtin: md.gtin ?? '', mpn: md.mpn ?? '',
    manage_stock: md.manage_stock ?? true, stock_status: md.stock_status ?? 'instock', low_stock_threshold: md.low_stock_threshold ?? '',
    sold_individually: Boolean(md.sold_individually), min_qty: md.min_qty ?? '', max_qty: md.max_qty ?? '',
    tax_status: md.tax_status ?? 'taxable', tax_class: md.tax_class ?? '',
    shipping_class: md.shipping_class ?? '', ship_internationally: Boolean(md.ship_internationally),
    sale_starts_at: toLocal(md.sale_starts_at), sale_ends_at: toLocal(md.sale_ends_at),
    purchase_note: md.purchase_note ?? '', enable_reviews: md.enable_reviews ?? true, menu_order: md.menu_order ?? 0,
    catalog_visibility: md.catalog_visibility ?? 'visible', internal_note: md.internal_note ?? '',
    product_url: md.product_url ?? '', button_text: md.button_text ?? '',
    download_limit: md.download_limit ?? '', download_expiry_days: md.download_expiry_days ?? '',
    upsell_ids: md.upsell_ids ?? [], cross_sell_ids: md.cross_sell_ids ?? [],
});