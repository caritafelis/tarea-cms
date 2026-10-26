import type { ColumnDef } from '@tanstack/react-table';
import { SlidersVertical, Trash2 } from 'lucide-react';
import attributeRoutes from '@/actions/App/Http/Controllers/Admin/AttributeController';
import { EnabledBadge, Muted, NameCell, StatusBadge } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes, type FormApi } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify } from '@/lib/format';

type AttrValue = { id?: number; value: string; key: string };
type Attribute = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    type: string;
    icon: string | null;
    is_enabled: boolean;
    is_searchable: boolean;
    is_filterable: boolean;
    values?: AttrValue[];
};

// App\Enums\FieldType
const TYPES = ['text', 'number', 'select', 'checkbox', 'colorpicker', 'datepicker', 'richtext'];
const VALUE_TYPES = ['select', 'checkbox', 'colorpicker'];

const fields: CrudField[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'slug', label: 'Slug' },
    { name: 'type', label: 'Type', type: 'select', required: true, options: TYPES.map((t) => ({ value: t, label: t })) },
    { name: 'icon', label: 'Icon' },
    { name: 'description', label: 'Description', span: 2 },
    { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
    { name: 'is_searchable', label: 'Searchable', type: 'switch' },
    { name: 'is_filterable', label: 'Filterable', type: 'switch' },
];

function ValuesEditor({ data, setData, errors }: FormApi) {
    if (!VALUE_TYPES.includes(data.type)) return null;

    const values: AttrValue[] = data.values ?? [];
    const update = (i: number, patch: Partial<AttrValue>) =>
        setData('values', values.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

    return (
        <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
                <Label>Values</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setData('values', [...values, { value: '', key: '' }])}>
                    Add value
                </Button>
            </div>
            {values.length === 0 && <p className="text-xs text-muted-foreground">No values yet.</p>}
            {values.map((v, i) => (
                <div key={v.id ?? `new-${i}`} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
                    <div>
                        <Input
                            placeholder="Label"
                            maxLength={50}
                            value={v.value}
                            onChange={(e) =>
                                update(i, {
                                    value: e.target.value,
                                    key: !v.key || v.key === slugify(v.value) ? slugify(e.target.value) : v.key,
                                })
                            }
                        />
                        <InputError message={errors[`values.${i}.value`]} />
                    </div>
                    <div>
                        <Input placeholder="Key" value={v.key} onChange={(e) => update(i, { key: e.target.value })} />
                        <InputError message={errors[`values.${i}.key`]} />
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setData('values', values.filter((_, idx) => idx !== i))}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
    );
}

const columns: ColumnDef<Attribute>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <NameCell title={row.original.name} subtitle={row.original.slug} /> },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <StatusBadge value={row.original.type} tone="blue" /> },
    {
        id: 'values',
        header: 'Values',
        cell: ({ row }) => {
            const values = row.original.values ?? [];
            if (!values.length) return <Muted>—</Muted>;

            return (
                <div className="flex flex-wrap gap-1">
                    {values.slice(0, 4).map((v) => (
                        <Badge key={v.id ?? v.key} variant="secondary" className="text-[10px]">{v.value}</Badge>
                    ))}
                    {values.length > 4 && <Muted>+{values.length - 4}</Muted>}
                </div>
            );
        },
        meta: { className: 'hidden md:table-cell' },
    },
    {
        id: 'flags',
        header: 'Flags',
        cell: ({ row }) => (
            <Muted>
                {[row.original.is_searchable && 'Searchable', row.original.is_filterable && 'Filterable'].filter(Boolean).join(' · ') || '—'}
            </Muted>
        ),
        meta: { className: 'hidden lg:table-cell' },
    },
    { id: 'status', header: 'Status', cell: ({ row }) => <EnabledBadge enabled={row.original.is_enabled} /> },
];

const routes: CrudRoutes = {
    store: (t) => attributeRoutes.store.url({ current_team: t }),
    update: (t, id) => attributeRoutes.update.url({ current_team: t, attribute: id }),
    destroy: (t, id) => attributeRoutes.destroy.url({ current_team: t, attribute: id }),
};

export default function Index({ attributes }: { attributes: Attribute[] }) {
    return (
        <CrudPage
            title="Attributes"
            singular="Attribute"
            description="Reusable product options such as size, color or material."
            icon={SlidersVertical}
            permission="attribute"
            items={attributes}
            columns={columns}
            fields={fields}
            defaults={{
                name: '', slug: '', type: 'text', icon: '', description: '',
                is_enabled: true, is_searchable: false, is_filterable: false, values: [],
            }}
            routes={routes}
            itemName={(a) => a.name}
            toForm={(a) => ({ values: (a.values ?? []).map((v) => ({ id: v.id, value: v.value, key: v.key })) })}
            transform={(d) => ({ ...d, values: VALUE_TYPES.includes(d.type) ? d.values : [] })}
            renderFormExtra={(api) => <ValuesEditor {...api} />}
            searchText={(a) => `${a.name} ${a.slug} ${a.type}`}
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Attributes', href: attributeRoutes.index.url() }] };