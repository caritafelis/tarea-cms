import type { ColumnDef } from '@tanstack/react-table';
import { Package } from 'lucide-react';
import productRoutes from '@/actions/App/Http/Controllers/Admin/ProductController';
import { Muted, NameCell, StatusBadge } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes, type FormApi } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Ref = { id: number; name: string };
type Category = Ref & { parent_id: number | null };
type Product = {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    barcode: string | null;
    summary: string | null;
    description: string | null;
    type: string | null;
    security_stock: number | null;
    featured: boolean;
    is_visible: boolean;
    allow_backorder: boolean;
    published_at: string | null;
    brand_id: number | null;
    supplier_id: number | null;
    weight_value: number | string | null;
    weight_unit: string | null;
    width_value: number | string | null;
    width_unit: string | null;
    height_value: number | string | null;
    depth_value: number | string | null;
    brand?: Ref | null;
    supplier?: Ref | null;
    categories?: Ref[];
};

// App\Enums\ProductType / Dimension\Weight / Dimension\Length
const TYPES = ['standard', 'variant', 'virtual', 'external'];
const WEIGHT_UNITS = ['kg', 'g', 'lbs'];
const LENGTH_UNITS = ['cm', 'm', 'mm', 'ft', 'in'];
const opts = (values: string[]) => values.map((v) => ({ value: v, label: v }));

function CategoryPicker({ categories }: { categories: Category[] }) {
    return function Picker({ data, setData, errors }: FormApi) {
        const selected: number[] = data.category_ids ?? [];
        const toggle = (id: number) =>
            setData('category_ids', selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id]);

        return (
            <div className="space-y-2 rounded-lg border p-3">
                <Label>Categories</Label>
                {categories.length === 0 && <p className="text-xs text-muted-foreground">No categories yet.</p>}
                <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                    {categories.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                            {c.name}
                        </label>
                    ))}
                </div>
                {errors.category_ids && <p className="text-sm text-red-600">{errors.category_ids}</p>}
            </div>
        );
    };
}

const columns: ColumnDef<Product>[] = [
    {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => <NameCell title={row.original.name} subtitle={row.original.sku ?? row.original.slug} />,
    },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <StatusBadge value={row.original.type} tone="blue" />, meta: { className: 'hidden md:table-cell' } },
    {
        id: 'brand',
        header: 'Brand / Supplier',
        cell: ({ row }) => <NameCell title={row.original.brand?.name ?? '—'} subtitle={row.original.supplier?.name} />,
        meta: { className: 'hidden lg:table-cell' },
    },
    {
        id: 'categories',
        header: 'Categories',
        cell: ({ row }) => {
            const cats = row.original.categories ?? [];
            if (!cats.length) return <Muted>—</Muted>;

            return (
                <div className="flex flex-wrap gap-1">
                    {cats.slice(0, 2).map((c) => <Badge key={c.id} variant="secondary" className="text-[10px]">{c.name}</Badge>)}
                    {cats.length > 2 && <Muted>+{cats.length - 2}</Muted>}
                </div>
            );
        },
        meta: { className: 'hidden xl:table-cell' },
    },
    {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const p = row.original;
            const published = p.is_visible && (!p.published_at || new Date(p.published_at) <= new Date());
            return (
                <div className="flex flex-wrap items-center gap-1">
                    <StatusBadge value={published ? 'Published' : p.is_visible ? 'Scheduled' : 'Hidden'} tone={published ? 'green' : p.is_visible ? 'amber' : 'gray'} />
                    {p.featured && <StatusBadge value="Featured" tone="blue" />}
                </div>
            );
        },
    },
];

const routes: CrudRoutes = {
    store: (t) => productRoutes.store.url({ current_team: t }),
    update: (t, id) => productRoutes.update.url({ current_team: t, product: id }),
    destroy: (t, id) => productRoutes.destroy.url({ current_team: t, product: id }),
};

type Props = { products: Product[]; categories: Category[]; brands: Ref[]; suppliers: Ref[] };

export default function Index({ products, categories, brands, suppliers }: Props) {
    const fields: CrudField[] = [
        { name: 'name', label: 'Name', required: true, span: 2 },
        { name: 'slug', label: 'Slug' },
        { name: 'sku', label: 'SKU' },
        { name: 'barcode', label: 'Barcode' },
        { name: 'type', label: 'Type', type: 'select', allowEmpty: true, options: opts(TYPES) },
        { name: 'brand_id', label: 'Brand', type: 'select', allowEmpty: true, options: brands.map((b) => ({ value: b.id, label: b.name })) },
        { name: 'supplier_id', label: 'Supplier', type: 'select', allowEmpty: true, options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
        { name: 'security_stock', label: 'Security stock', type: 'number' },
        { name: 'published_at', label: 'Published at', type: 'datetime-local', span: 2 },
        { name: 'summary', label: 'Summary', type: 'textarea', span: 2 },
        { name: 'description', label: 'Description', type: 'textarea', rows: 6, span: 2 },
        { name: 'weight_value', label: 'Weight', type: 'number', step: 'any' },
        { name: 'weight_unit', label: 'Weight unit', type: 'select', options: opts(WEIGHT_UNITS) },
        { name: 'width_value', label: 'Width', type: 'number', step: 'any' },
        { name: 'height_value', label: 'Height', type: 'number', step: 'any' },
        { name: 'depth_value', label: 'Depth', type: 'number', step: 'any' },
        { name: 'dimension_unit', label: 'Dimension unit', type: 'select', options: opts(LENGTH_UNITS) },
        { name: 'is_visible', label: 'Visible in store', type: 'switch', span: 2 },
        { name: 'featured', label: 'Featured', type: 'switch', span: 2 },
        { name: 'allow_backorder', label: 'Allow backorder', type: 'switch', span: 2 },
    ];

    const Picker = CategoryPicker({ categories });

    return (
        <CrudPage
            title="Products"
            singular="Product"
            description="Manage your catalog, pricing inputs and merchandising."
            icon={Package}
            permission="product"
            items={products}
            columns={columns}
            fields={fields}
            defaults={{
                name: '', slug: '', sku: '', barcode: '', type: '', brand_id: '', supplier_id: '',
                security_stock: '', published_at: '', summary: '', description: '',
                weight_value: '', weight_unit: 'kg', width_value: '', height_value: '', depth_value: '', dimension_unit: 'cm',
                is_visible: true, featured: false, allow_backorder: false, category_ids: [],
            }}
            pages={{
                create: (t) => productRoutes.create.url({ current_team: t }),
                edit: (t, id) => productRoutes.edit.url({ current_team: t, product: id }),
                show: (t, id) => productRoutes.show.url({ current_team: t, product: id }),
            }}
            routes={routes}
            itemName={(p) => p.name}
            toForm={(p) => ({
                category_ids: (p.categories ?? []).map((c) => c.id),
                weight_unit: p.weight_unit ?? 'kg',
                dimension_unit: p.width_unit ?? 'cm',
            })}
            transform={(d) => ({
                ...d,
                width_unit: d.dimension_unit,
                height_unit: d.dimension_unit,
                depth_unit: d.dimension_unit,
            })}
            renderFormExtra={(api) => <Picker {...api} />}
            searchText={(p) => `${p.name} ${p.sku ?? ''} ${p.barcode ?? ''} ${p.brand?.name ?? ''}`}
            dialogClassName="sm:max-w-3xl"
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Products', href: productRoutes.index.url() }] };