import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fromMinor, toDateTimeLocal, toMinor } from '@/lib/format';
import { RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type Ref = {
    id: number;
    name: string;
};

export type ProductRef = {
    id: number;
    name: string;
    sku: string | null;
};

export type Inventory = {
    id: number;
    name: string;
    code?: string | null;
    country?: string | null;
    is_default?: boolean;
};

export type Currency = {
    id: number;
    code: string;
    name: string;
    symbol?: string | null;
    decimal_places?: number;
};

export type Price = {
    id?: number;
    currency_id: number;
    amount: number | null;
    sale_amount: number | null;
    sale_starts_at: string | null;
    sale_ends_at: string | null;
    compare_amount: number | null;
    cost_amount: number | null;
};

export type PriceRow = {
    currency_id: number;
    amount: string;
    sale_amount: string;
    sale_starts_at: string;
    sale_ends_at: string;
    compare_amount: string;
    cost_amount: string;
};

export type AttrValue = {
    id: number;
    value: string;
    key: string;
};

export type AttributeDef = {
    id: number;
    name: string;
    type: string;
    values: AttrValue[];
};

export type ProductOption = {
    id?: number;
    attribute_id: number;
    attribute_value_id: number | null;
    custom_value: string | null;
    pivot?: {
        attribute_value_id?: number | null;
        attribute_custom_value?: string | null;
    };
};

export type ProductCategory = Ref & {
    slug?: string | null;
};

export type ProductCollection = Ref & {
    slug?: string | null;
};

export type ProductTag = Ref & {
    slug?: string | null;
};

export type ProductChannel = Ref & {
    slug?: string | null;
};

export type ProductVariantValue = {
    id: number;
    value: string;
    key?: string | null;
};

export type Variant = {
    id: number;
    product_id?: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    allow_backorder: boolean;
    position?: number;
    prices: Price[];
    values: ProductVariantValue[];
    metadata?: Record<string, unknown> | null;
};

export type ProductMetadata = {
    seo_title?: string;
    seo_description?: string;
    seo_keyword?: string;
    seo_noindex?: boolean;
    gtin?: string;
    mpn?: string;
    manage_stock?: boolean;
    stock_status?: 'instock' | 'outofstock' | 'onbackorder';
    low_stock_threshold?: number;
    sold_individually?: boolean;
    min_qty?: number;
    max_qty?: number;
    tax_status?: 'taxable' | 'shipping' | 'none';
    tax_class?: string;
    shipping_class?: string;
    shipping_enabled?: boolean;
    shipping_free?: boolean;
    shipping_requires_box?: boolean;
    shipping_origin_country?: string;
    ship_internationally?: boolean;
    sale_starts_at?: string | null;
    sale_ends_at?: string | null;
    purchase_note?: string;
    enable_reviews?: boolean;
    menu_order?: number;
    catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden';
    internal_note?: string;
    product_url?: string;
    button_text?: string;
    download_limit?: number;
    download_expiry_days?: number;
    upsell_ids?: number[];
    cross_sell_ids?: number[];
    [key: string]: unknown;
};

export type Product = {
    id: number;
    name: string;
    slug: string | null;
    sku: string | null;
    barcode: string | null;
    summary: string | null;
    description: string | null;
    type: 'standard' | 'variant' | 'virtual' | 'external';
    brand_id: number | null;
    supplier_id: number | null;
    security_stock: number | null;
    featured: boolean;
    is_visible: boolean;
    allow_backorder: boolean;
    published_at: string | null;
    weight_value: number | string | null;
    weight_unit: string | null;
    width_value: number | string | null;
    width_unit: string | null;
    height_value: number | string | null;
    height_unit: string | null;
    depth_value: number | string | null;
    depth_unit: string | null;
    volume_value: number | string | null;
    volume_unit: string | null;
    metadata: ProductMetadata | null;
    brand?: Ref | null;
    supplier?: Ref | null;
    categories?: ProductCategory[];
    collections?: ProductCollection[];
    tags?: ProductTag[];
    channels?: ProductChannel[];
    related_products?: ProductRef[];
    relatedProducts?: ProductRef[];
    prices: Price[];
    options: ProductOption[];
    variants?: Variant[];
    media?: ProductMedia[];
};

export type ProductMedia = {
    id: number;
    collection: string;
    name: string;
    url: string;
    mime: string;
    size?: number | null;
};

export type Capabilities = {
    shipping: boolean;
    attributes: boolean;
    variants: boolean;
    inventory: boolean;
};

export const pricesToRows = (currencies: Currency[], prices: Price[] = []): PriceRow[] =>
    currencies.map((c) => {
        const p = prices.find((x) => x.currency_id === c.id);

        return {
            currency_id: c.id,
            amount: fromMinor(p?.amount, c.code),
            sale_amount: fromMinor(p?.sale_amount, c.code),
            sale_starts_at: toDateTimeLocal(p?.sale_starts_at),
            sale_ends_at: toDateTimeLocal(p?.sale_ends_at),
            compare_amount: fromMinor(p?.compare_amount, c.code),
            cost_amount: fromMinor(p?.cost_amount, c.code),
        };
    });

export const rowsToPayload = (currencies: Currency[], rows: PriceRow[]) =>
    rows.map((r) => {
        const code = currencies.find((c) => c.id === r.currency_id)?.code ?? 'USD';
        const iso = (v: string) => (v ? new Date(v).toISOString() : null);

        return {
            currency_id: r.currency_id,
            amount: toMinor(r.amount, code),
            sale_amount: toMinor(r.sale_amount, code),
            sale_starts_at: iso(r.sale_starts_at),
            sale_ends_at: iso(r.sale_ends_at),
            compare_amount: toMinor(r.compare_amount, code),
            cost_amount: toMinor(r.cost_amount, code),
        };
    });

export function PriceRows({
    currencies,
    rows,
    onChange,
    errors,
}: {
    currencies: Currency[];
    rows: PriceRow[];
    onChange: (rows: PriceRow[]) => void;
    errors?: Record<string, string | undefined>;
}) {
    // Ensure currency ids are handled as strings to match Radix Select expectations
    const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>(
        String(rows[0]?.currency_id ?? currencies[0]?.id ?? '')
    );

    if (currencies.length === 0) {
        return <p className="text-sm text-muted-foreground">No enabled currencies.</p>;
    }

    const currentIndex = rows.findIndex((r) => String(r.currency_id) === selectedCurrencyId);
    const currentRow = rows[currentIndex] || rows[0];
    const currentCurrency = currencies.find((c) => String(c.id) === selectedCurrencyId);

    const setField = (key: keyof PriceRow, value: string) => {
        if (currentIndex === -1) return;

        const updatedRows = rows.map((r, idx) => {
            if (idx === currentIndex) {
                return { ...r, [key]: value };
            }
            return r;
        });

        onChange(updatedRows);
    };

    const handleAutoConvert = () => {
        if (!currentCurrency) return;

        // Safely check for exchange rate or fallback to 1
        const currencyAny = currentCurrency as Record<string, any>;
        const baseRate = Number(currencyAny.exchange_rate ?? currencyAny.rate ?? 1);

        const baseAmount = Number(currentRow.amount) || 0;
        const baseCompare = Number(currentRow.compare_amount) || 0;
        const baseCost = Number(currentRow.cost_amount) || 0;
        const baseSale = Number(currentRow.sale_amount) || 0;

        const updatedRows = rows.map((row) => {
            if (String(row.currency_id) === selectedCurrencyId) return row;

            const targetCurrency = currencies.find((c) => String(c.id) === String(row.currency_id));
            if (!targetCurrency) return row;

            const targetAny = targetCurrency as Record<string, any>;
            const targetRate = Number(targetAny.exchange_rate ?? targetAny.rate ?? 1);
            const factor = targetRate / baseRate;

            return {
                ...row,
                amount: baseAmount > 0 ? (baseAmount * factor).toFixed(2) : String(row.amount ?? ''),
                compare_amount: baseCompare > 0 ? (baseCompare * factor).toFixed(2) : String(row.compare_amount ?? ''),
                cost_amount: baseCost > 0 ? (baseCost * factor).toFixed(2) : String(row.cost_amount ?? ''),
                sale_amount: baseSale > 0 ? (baseSale * factor).toFixed(2) : String(row.sale_amount ?? ''),
            };
        });

        onChange(updatedRows);
    };

    if (!currentRow || !currentCurrency) return null;

    const price = Number(currentRow.amount);
    const cost = Number(currentRow.cost_amount);
    const margin = price > 0 && currentRow.cost_amount !== '' && currentRow.cost_amount !== null
        ? ((price - cost) / price) * 100
        : null;

    const renderInput = (k: keyof PriceRow, label: string, hint?: string) => {
        const errorKey = `prices.${currentIndex}.${String(k)}`;
        const value = currentRow[k];

        return (
            <div className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                    type="number"
                    min="0"
                    step="any"
                    value={value !== null && value !== undefined ? String(value) : ''}
                    onChange={(e) => setField(k, e.target.value)}
                />
                {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
                {errors?.[errorKey] && <p className="text-xs text-red-600">{errors[errorKey]}</p>}
            </div>
        );
    };

    return (
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Active Currency:
                    </Label>
                    <Select value={selectedCurrencyId} onValueChange={setSelectedCurrencyId}>
                        <SelectTrigger className="w-45 h-9 font-medium">
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                            {currencies.map((c) => (
                                <SelectItem key={String(c.id)} value={String(c.id)}>
                                    {c.code} ({c.symbol || c.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                    {margin !== null && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${margin < 0 ? 'bg-red-50 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                            Margin: {margin.toFixed(0)}%
                        </span>
                    )}
                    {currencies.length > 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAutoConvert}
                            title="Auto-generate equivalents in other currencies based on exchange rates"
                            className="h-8 text-xs gap-1.5"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Sync Rates
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                {renderInput('amount', `Regular price (${currentCurrency.code})`)}
                {renderInput('compare_amount', 'Compare at', 'Original price, shown crossed out.')}
                {renderInput('cost_amount', 'Cost', 'Private.')}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                {renderInput('sale_amount', 'Sale price', 'Must be lower than the regular price.')}
                <div className="space-y-1">
                    <Label className="text-xs">Sale starts</Label>
                    <Input
                        type="datetime-local"
                        value={currentRow.sale_starts_at ? String(currentRow.sale_starts_at) : ''}
                        onChange={(e) => setField('sale_starts_at', e.target.value)}
                    />
                    {errors?.[`prices.${currentIndex}.sale_starts_at`] && (
                        <p className="text-xs text-red-600">{errors[`prices.${currentIndex}.sale_starts_at`]}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Sale ends</Label>
                    <Input
                        type="datetime-local"
                        value={currentRow.sale_ends_at ? String(currentRow.sale_ends_at) : ''}
                        onChange={(e) => setField('sale_ends_at', e.target.value)}
                    />
                    {errors?.[`prices.${currentIndex}.sale_ends_at`] && (
                        <p className="text-xs text-red-600">{errors[`prices.${currentIndex}.sale_ends_at`]}</p>
                    )}
                </div>
            </div>

            {currentRow.compare_amount !== '' &&
                currentRow.compare_amount !== null &&
                currentRow.amount !== '' &&
                currentRow.amount !== null &&
                Number(currentRow.compare_amount) <= price && (
                    <p className="text-xs text-amber-600 font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        ⚠ "Compare at" price should be higher than the regular price.
                    </p>
                )}
        </div>
    );
}

export function StockPanel({
    inventories,
    stock,
    url,
}: {
    inventories: Inventory[];
    stock: Record<string | number, number>;
    url: string;
}) {
    const [draft, setDraft] = useState<Record<string, string>>({});

    if (inventories.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No inventory locations configured.
            </p>
        );
    }

    return (
        <div className="divide-y rounded-lg border">
            {inventories.map(
                (inventory) => (
                    <div
                        key={inventory.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-3"
                    >
                        <div>
                            <p className="text-sm font-medium">
                                {inventory.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                                Current stock:{' '}
                                {stock?.[inventory.id] ?? 0}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Input
                                className="w-28"
                                type="number"
                                min="0"
                                placeholder="New qty"
                                value={draft[inventory.id] ?? ''}
                                onChange={(event) => setDraft((current) => ({ ...current, [inventory.id]: event.target.value, }),)}
                            />

                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={(draft[inventory.id] ?? '') === ''}
                                onClick={() =>
                                    router.post(url, {
                                        inventory_id: inventory.id,
                                        quantity: Number(draft[inventory.id],),
                                    },
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => setDraft((current,) => ({ ...current, [inventory.id]: '', }),),
                                        },
                                    )
                                }
                            >
                                Set stock
                            </Button>
                        </div>
                    </div>
                ),
            )}
        </div>
    );
}