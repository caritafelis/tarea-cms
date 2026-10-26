import { router, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Truck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import carrierRoutes from '@/actions/App/Http/Controllers/Admin/CarrierController';
import { EnabledBadge, Muted, NameCell } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes } from '@/components/admin/crud-page';
import { FormField, type CrudField } from '@/components/admin/form-fields';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';

type Zone = { id: number; name: string };
type Option = { id: number; zone_id: number; name: string; description: string | null; price: number; is_enabled: boolean; zone?: Zone | null };
type Carrier = {
    id: number;
    name: string;
    slug: string;
    driver: string | null;
    link_url: string | null;
    description: string | null;
    shipping_amount: number | null;
    is_enabled: boolean;
    options?: Option[];
};

const fields: CrudField[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'slug', label: 'Slug' },
    { name: 'driver', label: 'Driver', placeholder: 'manual' },
    { name: 'shipping_amount', label: 'Base amount', type: 'number', hint: 'Minor units (500 = 5.00).' },
    { name: 'link_url', label: 'Tracking URL', type: 'url', placeholder: 'https://', span: 2 },
    { name: 'description', label: 'Description', span: 2 },
    { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
];

const columns: ColumnDef<Carrier>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <NameCell title={row.original.name} subtitle={row.original.slug} /> },
    { accessorKey: 'driver', header: 'Driver', cell: ({ row }) => <Muted>{row.original.driver ?? '—'}</Muted> },
    { id: 'rates', header: 'Rates', cell: ({ row }) => <Muted>{row.original.options?.length ?? 0}</Muted> },
    { id: 'status', header: 'Status', cell: ({ row }) => <EnabledBadge enabled={row.original.is_enabled} /> },
];

const routes: CrudRoutes = {
    store: (t) => carrierRoutes.store.url({ current_team: t }),
    update: (t, id) => carrierRoutes.update.url({ current_team: t, carrier: id }),
    destroy: (t, id) => carrierRoutes.destroy.url({ current_team: t, carrier: id }),
};

const blank = { zone_id: '', name: '', description: '', price: '', is_enabled: true };

function RatesDialog({ carrier, zones, onClose }: { carrier: Carrier | null; zones: Zone[]; onClose: () => void }) {
    const team = useTeamSlug();
    const can = useCan();
    const canManage = can('update_carrier');
    const [editingId, setEditingId] = useState<number | null>(null);
    const form = useForm(blank);

    const reset = () => {
        setEditingId(null);
        form.setData({ ...blank });
        form.clearErrors();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!carrier) return;
        const options = { preserveScroll: true, onSuccess: reset };

        if (editingId) form.put(carrierRoutes.updateOption.url({ current_team: team, carrier: carrier.id, option: editingId }), options);
        else form.post(carrierRoutes.storeOption.url({ current_team: team, carrier: carrier.id }), options);
    };

    const edit = (o: Option) => {
        setEditingId(o.id);
        form.clearErrors();
        form.setData({ zone_id: String(o.zone_id), name: o.name, description: o.description ?? '', price: String(o.price), is_enabled: Boolean(o.is_enabled) });
    };

    const remove = (o: Option) =>
        carrier &&
        router.delete(carrierRoutes.destroyOption.url({ current_team: team, carrier: carrier.id, option: o.id }), { preserveScroll: true });

    const zoneField: CrudField = { name: 'zone_id', label: 'Zone', type: 'select', required: true, options: zones.map((z) => ({ value: z.id, label: z.name })) };

    return (
        <Dialog
            open={!!carrier}
            onOpenChange={(o) => {
                if (!o) {
                    reset();
                    onClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Shipping rates</DialogTitle>
                    <DialogDescription>{carrier?.name}</DialogDescription>
                </DialogHeader>

                <div className="max-h-64 divide-y overflow-y-auto rounded-lg border text-sm">
                    {(carrier?.options ?? []).length === 0 && <p className="p-4 text-muted-foreground">No rates yet.</p>}
                    {carrier?.options?.map((o) => (
                        <div key={o.id} className="flex items-center justify-between gap-3 p-3">
                            <div className="min-w-0">
                                <p className="truncate font-medium">{o.name}</p>
                                <Muted>{o.zone?.name ?? '—'} · {o.price} (minor units)</Muted>
                            </div>
                            <div className="flex items-center gap-2">
                                <EnabledBadge enabled={o.is_enabled} />
                                {canManage && (
                                    <>
                                        <Button size="sm" variant="outline" onClick={() => edit(o)}>Edit</Button>
                                        <Button size="icon" variant="ghost" onClick={() => remove(o)}><Trash2 className="h-4 w-4" /></Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {canManage && (
                    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                        <FormField field={zoneField} value={form.data.zone_id} error={form.errors.zone_id} onChange={(v) => form.setData('zone_id', v)} />
                        <FormField field={{ name: 'name', label: 'Name', required: true }} value={form.data.name} error={form.errors.name} onChange={(v) => form.setData('name', v)} />
                        <FormField field={{ name: 'price', label: 'Price', type: 'number', required: true, hint: 'Minor units.' }} value={form.data.price} error={form.errors.price} onChange={(v) => form.setData('price', v)} />
                        <FormField field={{ name: 'description', label: 'Description' }} value={form.data.description} error={form.errors.description} onChange={(v) => form.setData('description', v)} />
                        <FormField field={{ name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 }} value={form.data.is_enabled} onChange={(v) => form.setData('is_enabled', v)} />
                        <div className="flex justify-end gap-2 sm:col-span-2">
                            {editingId && <Button type="button" variant="outline" onClick={reset}>Cancel edit</Button>}
                            <Button type="submit" disabled={form.processing}>{editingId ? 'Update rate' : 'Add rate'}</Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function Index({ carriers, zones }: { carriers: Carrier[]; zones: Zone[] }) {
    const [ratesId, setRatesId] = useState<number | null>(null);
    const activeCarrier = carriers.find((c) => c.id === ratesId) ?? null;

    return (
        <>
            <CrudPage
                title="Carriers"
                singular="Carrier"
                description="Shipping providers and their per-zone rates."
                icon={Truck}
                permission="carrier"
                items={carriers}
                columns={columns}
                fields={fields}
                defaults={{ name: '', slug: '', driver: '', link_url: '', description: '', shipping_amount: '', is_enabled: true }}
                routes={routes}
                itemName={(c) => c.name}
                rowActions={(c) => (
                    <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest" onSelect={() => setRatesId(c.id)}>
                        Manage rates
                    </DropdownMenuItem>
                )}
            />
            <RatesDialog carrier={activeCarrier} zones={zones} onClose={() => setRatesId(null)} />
        </>
    );
}

Index.layout = { breadcrumbs: [{ title: 'Carriers', href: carrierRoutes.index.url() }] };