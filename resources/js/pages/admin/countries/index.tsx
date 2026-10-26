import type { ColumnDef } from '@tanstack/react-table';
import { Flag } from 'lucide-react';
import countryRoutes from '@/actions/App/Http/Controllers/Admin/CountryController';
import { Muted, NameCell } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import { crudPages } from '@/components/admin/resources';

type Country = {
    id: number;
    name: string;
    name_official: string;
    region: string;
    subregion: string | null;
    cca2: string;
    cca3: string;
    flag: string;
    latitude: number;
    longitude: number;
    phone_calling_code: string[] | null;
    currencies: string[] | null;
};

const fields: CrudField[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'name_official', label: 'Official name', required: true },
    { name: 'region', label: 'Region', required: true },
    { name: 'subregion', label: 'Subregion' },
    { name: 'cca2', label: 'ISO alpha-2', required: true, placeholder: 'EC' },
    { name: 'cca3', label: 'ISO alpha-3', required: true, placeholder: 'ECU' },
    { name: 'flag', label: 'Flag', required: true, placeholder: '🇪🇨' },
    { name: 'latitude', label: 'Latitude', type: 'number', step: 'any', required: true },
    { name: 'longitude', label: 'Longitude', type: 'number', step: 'any', required: true },
    { name: 'phone_calling_code', label: 'Calling codes', required: true, hint: 'Comma separated, e.g. 593' },
    { name: 'currencies', label: 'Currencies', required: true, hint: 'Comma separated codes, e.g. USD' },
];

const list = (v: unknown): string => (Array.isArray(v) ? v.map(String).join(', ') : '');
const split = (v: unknown): string[] =>
    String(v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

const columns: ColumnDef<Country>[] = [
    {
        accessorKey: 'name',
        header: 'Country',
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <span className="text-xl leading-none">{row.original.flag}</span>
                <NameCell title={row.original.name} subtitle={row.original.name_official} />
            </div>
        ),
    },
    { id: 'codes', header: 'ISO', cell: ({ row }) => <Muted>{row.original.cca2} / {row.original.cca3}</Muted> },
    {
        id: 'region',
        header: 'Region',
        cell: ({ row }) => <Muted>{[row.original.region, row.original.subregion].filter(Boolean).join(' · ')}</Muted>,
        meta: { className: 'hidden md:table-cell' },
    },
    {
        id: 'phone',
        header: 'Calling code',
        cell: ({ row }) => <Muted>{list(row.original.phone_calling_code) || '—'}</Muted>,
        meta: { className: 'hidden lg:table-cell' },
    },
];

const routes: CrudRoutes = {
    store: (t) => countryRoutes.store.url({ current_team: t }),
    update: (t, id) => countryRoutes.update.url({ current_team: t, country: id }),
    destroy: (t, id) => countryRoutes.destroy.url({ current_team: t, country: id }),
};

export default function Countries({ countries }: { countries: Country[] }) {
    return (
        <CrudPage
            title="Countries"
            singular="Country"
            pages={crudPages('countries')}
            description="Countries used for addresses, tax zones and shipping."
            icon={Flag}
            permission="country"
            items={countries}
            columns={columns}
            fields={fields}
            defaults={{
                name: '', name_official: '', region: '', subregion: '', cca2: '', cca3: '',
                flag: '', latitude: '', longitude: '', phone_calling_code: '', currencies: '',
            }}
            routes={routes}
            itemName={(c) => c.name}
            toForm={(c) => ({ phone_calling_code: list(c.phone_calling_code), currencies: list(c.currencies) })}
            transform={(d) => ({ ...d, phone_calling_code: split(d.phone_calling_code), currencies: split(d.currencies) })}
            searchText={(c) => `${c.name} ${c.name_official} ${c.cca2} ${c.cca3} ${c.region}`}
            pageSize={20}
        />
    );
}

Countries.layout = { breadcrumbs: [{ title: 'Countries', href: countryRoutes.index.url() }] };