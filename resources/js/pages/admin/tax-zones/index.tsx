import type { ColumnDef } from '@tanstack/react-table';
import { Percent, Trash2 } from 'lucide-react';
import taxZoneRoutes from '@/actions/App/Http/Controllers/Admin/TaxZoneController';
import { Muted, NameCell, StatusBadge } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes, type FormApi } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { crudPages } from '@/components/admin/resources';

type Rate = { id?: number; name: string; code: string | null; rate: number | string; is_default: boolean; is_combinable: boolean };
type Country = { id: number; name: string; cca2: string };
type TaxZone = {
    id: number;
    name: string | null;
    country_id: number | null;
    parent_id: number | null;
    province_code: string | null;
    is_tax_inclusive: boolean;
    country?: Country | null;
    rates?: Rate[];
};

const blankRate = (): Rate => ({ name: '', code: '', rate: '', is_default: false, is_combinable: false });
const label = (z: TaxZone) => z.name ?? z.country?.name ?? `Zone #${z.id}`;

function RatesEditor({ data, setData, errors }: FormApi) {
    const rates: Rate[] = data.rates ?? [];
    const update = (i: number, patch: Partial<Rate>) => setData('rates', rates.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

    return (
        <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
                <Label>Tax rates</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setData('rates', [...rates, blankRate()])}>
                    Add rate
                </Button>
            </div>
            {rates.length === 0 && <p className="text-xs text-muted-foreground">No rates yet.</p>}
            {rates.map((r, i) => (
                <div key={r.id ?? `new-${i}`} className="space-y-2 rounded-md border p-2">
                    <div className="grid grid-cols-[2fr_1fr_1fr_auto] items-start gap-2">
                        <div>
                            <Input placeholder="Name (e.g. VAT)" value={r.name} onChange={(e) => update(i, { name: e.target.value })} />
                            <InputError message={errors[`rates.${i}.name`]} />
                        </div>
                        <Input placeholder="Code" value={r.code ?? ''} onChange={(e) => update(i, { code: e.target.value })} />
                        <div>
                            <Input type="number" step="any" min="0" placeholder="Rate %" value={r.rate} onChange={(e) => update(i, { rate: e.target.value })} />
                            <InputError message={errors[`rates.${i}.rate`]} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setData('rates', rates.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex gap-6 text-sm">
                        <label className="flex items-center gap-2">
                            <Checkbox checked={r.is_default} onCheckedChange={(c) => update(i, { is_default: c === true })} />
                            Default
                        </label>
                        <label className="flex items-center gap-2">
                            <Checkbox checked={r.is_combinable} onCheckedChange={(c) => update(i, { is_combinable: c === true })} />
                            Combinable
                        </label>
                    </div>
                </div>
            ))}
        </div>
    );
}

const columns: ColumnDef<TaxZone>[] = [
    { id: 'name', header: 'Zone', cell: ({ row }) => <NameCell title={label(row.original)} subtitle={row.original.province_code} /> },
    { id: 'country', header: 'Country', cell: ({ row }) => <Muted>{row.original.country?.name ?? '—'}</Muted> },
    {
        id: 'rates',
        header: 'Rates',
        cell: ({ row }) => <Muted>{(row.original.rates ?? []).map((r) => `${r.name} ${Number(r.rate)}%`).join(' · ') || '—'}</Muted>,
        meta: { className: 'hidden md:table-cell' },
    },
    {
        id: 'inclusive',
        header: 'Pricing',
        cell: ({ row }) => <StatusBadge value={row.original.is_tax_inclusive ? 'Tax inclusive' : 'Tax exclusive'} tone={row.original.is_tax_inclusive ? 'green' : 'gray'} />,
    },
];

const routes: CrudRoutes = {
    store: (t) => taxZoneRoutes.store.url({ current_team: t }),
    update: (t, id) => taxZoneRoutes.update.url({ current_team: t, tax_zone: id }),
    destroy: (t, id) => taxZoneRoutes.destroy.url({ current_team: t, tax_zone: id }),
};

export default function Index({ taxZones, countries }: { taxZones: TaxZone[]; countries: Country[] }) {
    const fields = (editing: TaxZone | null): CrudField[] => [
        { name: 'name', label: 'Name' },
        { name: 'province_code', label: 'Province code' },
        {
            name: 'country_id',
            label: 'Country',
            type: 'select',
            allowEmpty: true,
            options: countries.map((c) => ({ value: c.id, label: `${c.name} (${c.cca2})` })),
        },
        {
            name: 'parent_id',
            label: 'Parent zone',
            type: 'select',
            allowEmpty: true,
            options: taxZones.filter((z) => z.id !== editing?.id).map((z) => ({ value: z.id, label: label(z) })),
        },
        { name: 'is_tax_inclusive', label: 'Prices include tax', type: 'switch', span: 2 },
    ];

    return (
        <CrudPage
            title="Tax Zones"
            singular="Tax zone"
            pages={crudPages('tax_zones')}
            description="Tax rules by country or province."
            icon={Percent}
            permission="tax_zone"
            items={taxZones}
            columns={columns}
            fields={fields}
            defaults={{ name: '', province_code: '', country_id: '', parent_id: '', is_tax_inclusive: false, rates: [] }}
            routes={routes}
            itemName={label}
            toForm={(z) => ({
                rates: (z.rates ?? []).map((r) => ({
                    id: r.id, name: r.name, code: r.code ?? '', rate: r.rate,
                    is_default: Boolean(r.is_default), is_combinable: Boolean(r.is_combinable),
                })),
            })}
            renderFormExtra={(api) => <RatesEditor {...api} />}
            searchText={(z) => `${label(z)} ${z.province_code ?? ''} ${z.country?.name ?? ''}`}
            dialogClassName="sm:max-w-2xl"
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Tax Zones', href: taxZoneRoutes.index.url() }] };