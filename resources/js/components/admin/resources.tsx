import type { ReactNode } from 'react';
import brand from '@/actions/App/Http/Controllers/Admin/BrandController';
import category from '@/actions/App/Http/Controllers/Admin/CategoryController';
import country from '@/actions/App/Http/Controllers/Admin/CountryController';
import currency from '@/actions/App/Http/Controllers/Admin/CurrencyController';
import discount from '@/actions/App/Http/Controllers/Admin/DiscountController';
import legal from '@/actions/App/Http/Controllers/Admin/LegalController';
import paymentMethod from '@/actions/App/Http/Controllers/Admin/PaymentMethodController';
import supplier from '@/actions/App/Http/Controllers/Admin/SupplierController';
import zone from '@/actions/App/Http/Controllers/Admin/ZoneController';
import attribute from '@/actions/App/Http/Controllers/Admin/AttributeController';
import carrier from '@/actions/App/Http/Controllers/Admin/CarrierController';
import collection from '@/actions/App/Http/Controllers/Admin/CollectionController';
import taxZone from '@/actions/App/Http/Controllers/Admin/TaxZoneController';
import type { CrudField } from '@/components/admin/form-fields';
import { FormApi } from './crud-page';
import { Badge } from '../ui/badge';
import { RatesEditor } from './editors/tax-rates-editor';
import { RulesEditor } from './editors/collection-rules-editor';
import { VALUE_TYPES, ValuesEditor } from './editors/attribute-values-editor';
import { CarrierRatesPanel } from './editors/carrier-rates-panel';

export type ResourceConfig = {
    title: string;
    singular: string;
    permission: string;
    prop: string;
    param: string;
    actions: any;
    defaults: Record<string, any>;
    fields: (ctx: Record<string, any>, editing: any | null) => CrudField[];
    itemName: (m: any) => string;
    toForm?: (m: any) => Record<string, any>;
    transform?: (d: Record<string, any>) => Record<string, any>;
    stats?: (m: any) => Array<[string, ReactNode]>;
    extra?: (api: FormApi, editing: any | null) => ReactNode;      // dentro del <form>
    outside?: (ctx: Record<string, any>, model: any | null) => ReactNode; // fuera del <form>
    showExtra?: (m: any) => ReactNode;
};

const opts = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));
const list = (v: unknown): string => (Array.isArray(v) ? v.map(String).join(', ') : '');
const split = (v: unknown): string[] => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const refs = (rows: any[] = [], label: (r: any) => string = (r) => r.name) => rows.map((r) => ({ value: r.id, label: label(r) }));
const chips = (items: string[]) => items.length ? <div className="flex flex-wrap gap-1">{items.map((i, k) => <Badge key={k} variant="secondary">{i}</Badge>)}</div> : <span className="text-xs text-muted-foreground">—</span>;
const taxLabel = (z: any) => z.name ?? z.country?.name ?? `Zone #${z.id}`;

export const resources: Record<string, ResourceConfig> = {
    brands: {
        title: 'Brands', singular: 'Brand', permission: 'brand', prop: 'brand', param: 'brand', actions: brand,
        defaults: { name: '', slug: '', website: '', description: '', position: '', is_enabled: true },
        itemName: (m) => m.name,
        stats: (m) => [['Products', m.products_count ?? 0]],
        fields: () => [
            { name: 'name', label: 'Name', required: true, span: 2 },
            { name: 'slug', label: 'Slug', hint: 'Auto-generated when empty.' },
            { name: 'website', label: 'Website', type: 'url', placeholder: 'https://' },
            { name: 'position', label: 'Position', type: 'number' },
            { name: 'description', label: 'Description', type: 'textarea', span: 2 },
            { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
        ],
    },
    suppliers: {
        title: 'Suppliers', singular: 'Supplier', permission: 'supplier', prop: 'supplier', param: 'supplier', actions: supplier,
        defaults: { name: '', slug: '', email: '', phone: '', contact_name: '', website: '', description: '', notes: '', is_enabled: true },
        itemName: (m) => m.name,
        stats: (m) => [['Products', m.products_count ?? 0]],
        fields: () => [
            { name: 'name', label: 'Name', required: true },
            { name: 'slug', label: 'Slug' },
            { name: 'contact_name', label: 'Contact name' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'phone', label: 'Phone' },
            { name: 'website', label: 'Website', type: 'url', placeholder: 'https://' },
            { name: 'description', label: 'Description', type: 'textarea', span: 2 },
            { name: 'notes', label: 'Internal notes', type: 'textarea', span: 2 },
            { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
        ],
    },
    categories: {
        title: 'Categories', singular: 'Category', permission: 'category', prop: 'category', param: 'category', actions: category,
        defaults: { name: '', slug: '', description: '', position: '', parent_id: '', is_enabled: true },
        itemName: (m) => m.name,
        stats: (m) => [['Products', m.products_count ?? 0]],
        fields: (ctx, editing) => [
            { name: 'name', label: 'Name', required: true, span: 2 },
            { name: 'slug', label: 'Slug' },
            { name: 'position', label: 'Position', type: 'number' },
            {
                name: 'parent_id', label: 'Parent category', type: 'select', allowEmpty: true, span: 2,
                options: refs((ctx.categories ?? []).filter((c: any) => c.id !== editing?.id)),
            },
            { name: 'description', label: 'Description', type: 'textarea', span: 2 },
            { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
        ],
    },
    legals: {
        title: 'Legals', singular: 'Legal page', permission: 'legal', prop: 'legal', param: 'legal', actions: legal,
        defaults: { title: '', slug: '', content: '', is_enabled: true },
        itemName: (m) => m.title,
        fields: () => [
            { name: 'title', label: 'Title', required: true },
            { name: 'slug', label: 'Slug', hint: 'e.g. terms-and-conditions' },
            { name: 'content', label: 'Content', type: 'textarea', rows: 14, span: 2 },
            { name: 'is_enabled', label: 'Published', type: 'switch', span: 2 },
        ],
    },
    'payment-methods': {
        title: 'Payment Methods', singular: 'Payment method', permission: 'payment_method', prop: 'paymentMethod', param: 'payment_method', actions: paymentMethod,
        defaults: { title: '', slug: '', logo: '', link_url: '', description: '', instructions: '', driver: '', is_enabled: true },
        itemName: (m) => m.title,
        fields: () => [
            { name: 'title', label: 'Title', required: true },
            { name: 'slug', label: 'Slug' },
            { name: 'driver', label: 'Driver', placeholder: 'manual' },
            { name: 'logo', label: 'Logo', hint: 'Path or URL of the logo.' },
            { name: 'link_url', label: 'Link URL', type: 'url', placeholder: 'https://', span: 2 },
            { name: 'description', label: 'Description', type: 'textarea', span: 2 },
            { name: 'instructions', label: 'Customer instructions', type: 'textarea', span: 2 },
            { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
        ],
    },
    zones: {
        title: 'Zones', singular: 'Zone', permission: 'zone', prop: 'zone', param: 'zone', actions: zone,
        defaults: { name: '', slug: '', code: '', currency_id: '', is_enabled: true },
        itemName: (m) => m.name,
        fields: (ctx) => [
            { name: 'name', label: 'Name', required: true },
            { name: 'code', label: 'Code' },
            { name: 'slug', label: 'Slug' },
            { name: 'currency_id', label: 'Currency', type: 'select', required: true, options: refs(ctx.currencies, (c) => `${c.code} — ${c.name}`) },
            { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
        ],
    },
    countries: {
        title: 'Countries', singular: 'Country', permission: 'country', prop: 'country', param: 'country', actions: country,
        defaults: {
            name: '', name_official: '', region: '', subregion: '', cca2: '', cca3: '', flag: '',
            latitude: '', longitude: '', phone_calling_code: '', currencies: '',
        },
        itemName: (m) => m.name,
        toForm: (m) => ({ phone_calling_code: list(m.phone_calling_code), currencies: list(m.currencies) }),
        transform: (d) => ({ ...d, phone_calling_code: split(d.phone_calling_code), currencies: split(d.currencies) }),
        fields: () => [
            { name: 'name', label: 'Name', required: true },
            { name: 'name_official', label: 'Official name', required: true },
            { name: 'region', label: 'Region', required: true },
            { name: 'subregion', label: 'Subregion' },
            { name: 'cca2', label: 'ISO alpha-2', required: true },
            { name: 'cca3', label: 'ISO alpha-3', required: true },
            { name: 'flag', label: 'Flag', required: true },
            { name: 'latitude', label: 'Latitude', type: 'number', step: 'any', required: true },
            { name: 'longitude', label: 'Longitude', type: 'number', step: 'any', required: true },
            { name: 'phone_calling_code', label: 'Calling codes', required: true, hint: 'Comma separated, e.g. 593' },
            { name: 'currencies', label: 'Currencies', required: true, hint: 'Comma separated codes, e.g. USD' },
        ],
    },
    currencies: {
        title: 'Currencies', singular: 'Currency', permission: 'currency', prop: 'currency', param: 'currency', actions: currency,
        defaults: { name: '', code: '', symbol: '', format: '', exchange_rate: '', is_enabled: true },
        itemName: (m) => `${m.code} — ${m.name}`,
        fields: () => [
            { name: 'name', label: 'Name', required: true },
            { name: 'code', label: 'Code', required: true, placeholder: 'USD' },
            { name: 'symbol', label: 'Symbol', required: true, placeholder: '$' },
            { name: 'format', label: 'Format', required: true, placeholder: '$1,000.00' },
            { name: 'exchange_rate', label: 'Exchange rate', type: 'number', step: 'any' },
            { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
        ],
    },
    discounts: {
        title: 'Discounts', singular: 'Discount', permission: 'discount', prop: 'discount', param: 'discount', actions: discount,
        defaults: {
            code: '', zone_id: '', type: 'percentage', value: '', apply_to: 'order', eligibility: 'everyone',
            min_required: 'none', min_required_value: '', usage_limit: '', usage_limit_per_user: false,
            start_at: '', end_at: '', is_active: true,
        },
        itemName: (m) => m.code,
        fields: (ctx) => [
            { name: 'code', label: 'Code', required: true },
            { name: 'zone_id', label: 'Zone', type: 'select', required: true, options: refs(ctx.zones) },
            { name: 'type', label: 'Type', type: 'select', required: true, options: opts([['percentage', 'Percentage'], ['fixed_amount', 'Fixed amount']]) },
            { name: 'value', label: 'Value', type: 'number', required: true, hint: 'Percent (0–100) or minor units (500 = 5.00).' },
            { name: 'apply_to', label: 'Applies to', type: 'select', required: true, options: opts([['order', 'Entire order'], ['products', 'Specific products']]) },
            { name: 'eligibility', label: 'Eligibility', type: 'select', required: true, options: opts([['everyone', 'Everyone'], ['customers', 'Specific customers']]) },
            { name: 'min_required', label: 'Minimum requirement', type: 'select', required: true, options: opts([['none', 'None'], ['price', 'Minimum amount'], ['quantity', 'Minimum quantity']]) },
            { name: 'min_required_value', label: 'Minimum value' },
            { name: 'usage_limit', label: 'Usage limit', type: 'number' },
            { name: 'start_at', label: 'Starts at', type: 'datetime-local', required: true },
            { name: 'end_at', label: 'Ends at', type: 'datetime-local' },
            { name: 'usage_limit_per_user', label: 'One use per customer', type: 'switch', span: 2 },
            { name: 'is_active', label: 'Active', type: 'switch', span: 2 },
        ],
    },
    attributes: {
        title: 'Attributes', singular: 'Attribute', permission: 'attribute', prop: 'attribute', param: 'attribute', actions: attribute,
        defaults: { name: '', slug: '', type: 'text', icon: '', description: '', is_enabled: true, is_searchable: false, is_filterable: false, values: [] },
        itemName: (m) => m.name,
        toForm: (m) => ({ values: (m.values ?? []).map((v: any) => ({ id: v.id, value: v.value, key: v.key })) }),
        transform: (d) => ({ ...d, values: VALUE_TYPES.includes(d.type) ? d.values : [] }),
        extra: (api) => <ValuesEditor {...api} />,
        showExtra: (m) => chips((m.values ?? []).map((v: any) => v.value)),
        fields: () => [
            { name: 'name', label: 'Name', required: true },
            { name: 'slug', label: 'Slug' },
            { name: 'type', label: 'Type', type: 'select', required: true, options: ['text', 'number', 'select', 'checkbox', 'colorpicker', 'datepicker', 'richtext'].map((t) => ({ value: t, label: t })) },
            { name: 'icon', label: 'Icon' },
            { name: 'description', label: 'Description', span: 2 },
            { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
            { name: 'is_searchable', label: 'Searchable', type: 'switch' },
            { name: 'is_filterable', label: 'Filterable', type: 'switch' },
        ],
    },
    collections: {
        title: 'Collections', singular: 'Collection', permission: 'collection', prop: 'collection', param: 'collection', actions: collection,
        defaults: { name: '', slug: '', description: '', type: 'manual', sort: '', match_conditions: 'all', published_at: '', rules: [] },
        itemName: (m) => m.name,
        toForm: (m) => ({ rules: (m.rules ?? []).map((r: any) => ({ rule: r.rule, operator: r.operator, value: r.value })) }),
        transform: (d) => ({ ...d, rules: d.type === 'auto' ? d.rules : [] }),
        extra: (api) => <RulesEditor {...api} />,
        showExtra: (m) => chips((m.rules ?? []).map((r: any) => `${r.rule} ${r.operator} ${r.value}`)),
        fields: () => [
            { name: 'name', label: 'Name', required: true },
            { name: 'slug', label: 'Slug' },
            { name: 'type', label: 'Type', type: 'select', required: true, options: opts([['manual', 'Manual'], ['auto', 'Automatic']]) },
            { name: 'match_conditions', label: 'Match conditions', type: 'select', allowEmpty: true, options: opts([['all', 'All conditions'], ['any', 'Any condition']]) },
            { name: 'sort', label: 'Sort', placeholder: 'e.g. created_at' },
            { name: 'published_at', label: 'Published at', type: 'datetime-local' },
            { name: 'description', label: 'Description', type: 'textarea', span: 2 },
        ],
    },
    'tax-zones': {
        title: 'Tax Zones', singular: 'Tax zone', permission: 'tax_zone', prop: 'taxZone', param: 'tax_zone', actions: taxZone,
        defaults: { name: '', province_code: '', country_id: '', parent_id: '', is_tax_inclusive: false, rates: [] },
        itemName: taxLabel,
        toForm: (m) => ({
            rates: (m.rates ?? []).map((r: any) => ({ id: r.id, name: r.name, code: r.code ?? '', rate: r.rate, is_default: Boolean(r.is_default), is_combinable: Boolean(r.is_combinable) })),
        }),
        extra: (api) => <RatesEditor {...api} />,
        showExtra: (m) => chips((m.rates ?? []).map((r: any) => `${r.name} ${Number(r.rate)}%`)),
        fields: (ctx, editing) => [
            { name: 'name', label: 'Name' },
            { name: 'province_code', label: 'Province code' },
            { name: 'country_id', label: 'Country', type: 'select', allowEmpty: true, options: refs(ctx.countries, (c) => `${c.name} (${c.cca2})`) },
            { name: 'parent_id', label: 'Parent zone', type: 'select', allowEmpty: true, options: refs((ctx.taxZones ?? []).filter((z: any) => z.id !== editing?.id), taxLabel) },
            { name: 'is_tax_inclusive', label: 'Prices include tax', type: 'switch', span: 2 },
        ],
    },
    carriers: {
        title: 'Carriers', singular: 'Carrier', permission: 'carrier', prop: 'carrier', param: 'carrier', actions: carrier,
        defaults: { name: '', slug: '', driver: '', link_url: '', description: '', shipping_amount: '', is_enabled: true },
        itemName: (m) => m.name,
        outside: (ctx, m) => (m ? <CarrierRatesPanel carrier={m} zones={ctx.zones ?? []} /> : null),
        showExtra: (m) => chips((m.options ?? []).map((o: any) => `${o.zone?.name ?? '—'}: ${o.name} (${o.price})`)),
        fields: () => [
            { name: 'name', label: 'Name', required: true },
            { name: 'slug', label: 'Slug' },
            { name: 'driver', label: 'Driver', placeholder: 'manual' },
            { name: 'shipping_amount', label: 'Base amount', type: 'number', hint: 'Minor units (500 = 5.00).' },
            { name: 'link_url', label: 'Tracking URL', type: 'url', placeholder: 'https://', span: 2 },
            { name: 'description', label: 'Description', span: 2 },
            { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
        ],
    },
};

export const urls = (slug: string, team: string) => {
    const c = resources[slug];
    const a = c.actions;
    const p = (id: number) => ({ current_team: team, [c.param]: id }) as any;

    return {
        index: () => a.index.url({ current_team: team }) as string,
        create: () => a.create.url({ current_team: team }) as string,
        store: () => a.store.url({ current_team: team }) as string,
        show: (id: number) => a.show.url(p(id)) as string,
        edit: (id: number) => a.edit.url(p(id)) as string,
        update: (id: number) => a.update.url(p(id)) as string,
    };
};

/** Para el prop `pages` de CrudPage. */
export const crudPages = (slug: string) => ({
    create: (t: string) => urls(slug, t).create(),
    edit: (t: string, id: number) => urls(slug, t).edit(id),
    show: (t: string, id: number) => urls(slug, t).show(id),
});