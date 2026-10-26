import type { ColumnDef } from '@tanstack/react-table';
import { LibraryBig, Trash2 } from 'lucide-react';
import collectionRoutes from '@/actions/App/Http/Controllers/Admin/CollectionController';
import { Muted, NameCell, StatusBadge } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes, type FormApi } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, humanize } from '@/lib/format';
import { crudPages } from '@/components/admin/resources';

type Rule = { id?: number; rule: string; operator: string; value: string };
type Collection = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    type: string;
    sort: string | null;
    match_conditions: string | null;
    published_at: string | null;
    rules?: Rule[];
};

// App\Enums\CollectionType, App\Enums\Rule, App\Enums\Operator
const RULES = [
    'product_title', 'product_brand', 'product_category', 'product_price', 'compare_at_price',
    'inventory_stock', 'product_created_at', 'product_featured', 'product_rating', 'product_sales_count',
];
const OPERATORS = ['equals_to', 'not_equal_to', 'less_than', 'greater_than', 'starts_with', 'ends_with', 'contains', 'not_contains'];

const fields: CrudField[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'slug', label: 'Slug' },
    {
        name: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: [
            { value: 'manual', label: 'Manual' },
            { value: 'auto', label: 'Automatic' },
        ],
    },
    {
        name: 'match_conditions',
        label: 'Match conditions',
        type: 'select',
        allowEmpty: true,
        options: [
            { value: 'all', label: 'All conditions' },
            { value: 'any', label: 'Any condition' },
        ],
    },
    { name: 'sort', label: 'Sort', placeholder: 'e.g. created_at' },
    { name: 'published_at', label: 'Published at', type: 'datetime-local' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
];

function RuleSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
                {options.map((o) => (
                    <SelectItem key={o} value={o}>{humanize(o)}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function RulesEditor({ data, setData, errors }: FormApi) {
    if (data.type !== 'auto') return null;

    const rules: Rule[] = data.rules ?? [];
    const update = (i: number, patch: Partial<Rule>) =>
        setData('rules', rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

    return (
        <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
                <Label>Rules</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setData('rules', [...rules, { rule: 'product_title', operator: 'contains', value: '' }])}
                >
                    Add rule
                </Button>
            </div>
            {rules.length === 0 && <p className="text-xs text-muted-foreground">No rules yet.</p>}
            {rules.map((r, i) => (
                <div key={r.id ?? `new-${i}`} className="grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-2">
                    <RuleSelect value={r.rule} options={RULES} onChange={(v) => update(i, { rule: v })} />
                    <RuleSelect value={r.operator} options={OPERATORS} onChange={(v) => update(i, { operator: v })} />
                    <div>
                        <Input placeholder="Value" value={r.value} onChange={(e) => update(i, { value: e.target.value })} />
                        <InputError message={errors[`rules.${i}.value`]} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setData('rules', rules.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
    );
}

const columns: ColumnDef<Collection>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <NameCell title={row.original.name} subtitle={row.original.slug} /> },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <StatusBadge value={row.original.type} tone={row.original.type === 'auto' ? 'blue' : 'gray'} /> },
    {
        id: 'rules',
        header: 'Rules',
        cell: ({ row }) => <Muted>{row.original.type === 'auto' ? `${row.original.rules?.length ?? 0} · match ${row.original.match_conditions ?? 'all'}` : '—'}</Muted>,
        meta: { className: 'hidden md:table-cell' },
    },
    {
        accessorKey: 'published_at',
        header: 'Published',
        cell: ({ row }) => <Muted>{formatDate(row.original.published_at)}</Muted>,
        meta: { className: 'hidden lg:table-cell' },
    },
];

const routes: CrudRoutes = {
    store: (t) => collectionRoutes.store.url({ current_team: t }),
    update: (t, id) => collectionRoutes.update.url({ current_team: t, collection: id }),
    destroy: (t, id) => collectionRoutes.destroy.url({ current_team: t, collection: id }),
};

export default function Index({ collections }: { collections: Collection[] }) {
    return (
        <CrudPage
            title="Collections"
            singular="Collection"
            pages={crudPages('collections')}
            description="Group products manually or with automatic rules."
            icon={LibraryBig}
            permission="collection"
            items={collections}
            columns={columns}
            fields={fields}
            defaults={{
                name: '', slug: '', description: '', type: 'manual', sort: '',
                match_conditions: 'all', published_at: '', rules: [],
            }}
            routes={routes}
            itemName={(c) => c.name}
            toForm={(c) => ({ rules: (c.rules ?? []).map((r) => ({ rule: r.rule, operator: r.operator, value: r.value })) })}
            transform={(d) => ({ ...d, rules: d.type === 'auto' ? d.rules : [] })}
            renderFormExtra={(api) => <RulesEditor {...api} />}
            searchText={(c) => `${c.name} ${c.slug}`}
            dialogClassName="sm:max-w-3xl"
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Collections', href: collectionRoutes.index.url() }] };