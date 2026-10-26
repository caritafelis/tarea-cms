import type { ColumnDef } from '@tanstack/react-table';
import { CreditCard } from 'lucide-react';
import paymentMethodRoutes from '@/actions/App/Http/Controllers/Admin/PaymentMethodController';
import { EnabledBadge, Muted, NameCell } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import { crudPages } from '@/components/admin/resources';

type PaymentMethod = {
    id: number;
    title: string;
    slug: string;
    logo: string | null;
    link_url: string | null;
    description: string | null;
    instructions: string | null;
    driver: string | null;
    is_enabled: boolean;
};

const fields: CrudField[] = [
    { name: 'title', label: 'Title', required: true },
    { name: 'slug', label: 'Slug' },
    { name: 'driver', label: 'Driver', placeholder: 'manual' },
    { name: 'logo', label: 'Logo', hint: 'Path or URL of the logo.' },
    { name: 'link_url', label: 'Link URL', type: 'url', placeholder: 'https://', span: 2 },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
    { name: 'instructions', label: 'Customer instructions', type: 'textarea', span: 2 },
    { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
];

const columns: ColumnDef<PaymentMethod>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <NameCell title={row.original.title} subtitle={row.original.slug} /> },
    { accessorKey: 'driver', header: 'Driver', cell: ({ row }) => <Muted>{row.original.driver ?? '—'}</Muted> },
    {
        accessorKey: 'link_url',
        header: 'Link',
        cell: ({ row }) => <Muted>{row.original.link_url ?? '—'}</Muted>,
        meta: { className: 'hidden md:table-cell' },
    },
    { id: 'status', header: 'Status', cell: ({ row }) => <EnabledBadge enabled={row.original.is_enabled} /> },
];

const routes: CrudRoutes = {
    store: (t) => paymentMethodRoutes.store.url({ current_team: t }),
    update: (t, id) => paymentMethodRoutes.update.url({ current_team: t, payment_method: id }),
    destroy: (t, id) => paymentMethodRoutes.destroy.url({ current_team: t, payment_method: id }),
};

export default function Index({ paymentMethods }: { paymentMethods: PaymentMethod[] }) {
    return (
        <CrudPage
            title="Payment Methods"
            singular="Payment method"
            pages={crudPages('payment_methods')}
            description="Ways your customers can pay at checkout."
            icon={CreditCard}
            permission="payment_method"
            items={paymentMethods}
            columns={columns}
            fields={fields}
            defaults={{
                title: '', slug: '', logo: '', link_url: '', description: '',
                instructions: '', driver: '', is_enabled: true,
            }}
            routes={routes}
            itemName={(m) => m.title}
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Payment Methods', href: paymentMethodRoutes.index.url() }] };