import { router, useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import carrierRoutes from '@/actions/App/Http/Controllers/Admin/CarrierController';
import { EnabledBadge, Muted } from '@/components/admin/cells';
import { FormField } from '@/components/admin/form-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { useConfirm } from '@/components/confirm/confirm-provider';

type Zone = {
    id: number;
    name: string
};
type Option = {
    id: number;
    zone_id: number;
    name: string;
    description: string | null;
    price: number;
    is_enabled: boolean;
    zone?: Zone | null;
    metadata?: {
        shipping_classes?: string[]
    } | null;
};

const blank = {
    zone_id: '',
    name: '',
    description: '',
    price: '',
    is_enabled: true,
    shipping_classes: '',
};

export function CarrierRatesPanel({ carrier, zones }: { carrier: { id: number; options?: Option[] }; zones: Zone[] }) {
    const team = useTeamSlug();
    const can = useCan();
    const [editingId, setEditingId] = useState<number | null>(null);
    const form = useForm(blank);
    const errors = form.errors as Record<string, string | undefined>;
    const confirm = useConfirm();
    const reset = () => { setEditingId(null); form.setData({ ...blank }); form.clearErrors(); };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const o = { preserveScroll: true, onSuccess: reset };
        if (editingId) form.put(carrierRoutes.updateOption.url({ current_team: team, carrier: carrier.id, option: editingId }), o);
        else form.post(carrierRoutes.storeOption.url({ current_team: team, carrier: carrier.id }), o);
    };

    const edit = (o: Option) => {
        setEditingId(o.id);
        form.clearErrors();
        form.setData({
            zone_id: String(o.zone_id),
            name: o.name,
            description: o.description ?? '',
            price: String(o.price),
            is_enabled: Boolean(o.is_enabled),
            shipping_classes: (o.metadata?.shipping_classes ?? []).join(', '),
        });
    };

    const remove = async (o: Option) => {
        const ok = await confirm({
            title: `Delete “${o.name}”?`,
            description: 'Customers will no longer see this shipping rate.',
            confirmLabel: 'Delete rate',
            destructive: true,
        });
        if (!ok) return;

        router.delete(carrierRoutes.destroyOption.url({ current_team: team, carrier: carrier.id, option: o.id }), { preserveScroll: true });
    };

    const set = (k: keyof typeof blank) => (v: any) => form.setData(k, v);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">Shipping rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="divide-y rounded-lg border text-sm">
                    {(carrier.options ?? []).length === 0 && <p className="p-4 text-muted-foreground">No rates yet.</p>}
                    {carrier.options?.map((o) => (
                        <div key={o.id} className="flex items-center justify-between gap-3 p-3">
                            <div className="min-w-0">
                                <p className="truncate font-medium">{o.name}</p>
                                <Muted>{o.zone?.name ?? '—'} · {o.price} (minor units)</Muted>
                            </div>
                            <div className="flex items-center gap-2">
                                <EnabledBadge enabled={o.is_enabled} />
                                {can('update_carrier') && (
                                    <>
                                        <Button type="button" size="sm" variant="outline" onClick={() => edit(o)}>Edit</Button>
                                        <Button type="button" size="icon" variant="ghost" onClick={() => remove(o)}><Trash2 className="h-4 w-4" /></Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {can('update_carrier') && (
                    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                        <FormField field={{ name: 'zone_id', label: 'Zone', type: 'select', required: true, options: zones.map((z) => ({ value: z.id, label: z.name })) }} value={form.data.zone_id} error={errors.zone_id} onChange={set('zone_id')} />
                        <FormField field={{ name: 'name', label: 'Name', required: true }} value={form.data.name} error={errors.name} onChange={set('name')} />
                        <FormField field={{ name: 'price', label: 'Price', type: 'number', required: true, hint: 'Minor units.' }} value={form.data.price} error={errors.price} onChange={set('price')} />
                        <FormField field={{ name: 'description', label: 'Description' }} value={form.data.description} error={errors.description} onChange={set('description')} />
                        <FormField
                            field={{ name: 'shipping_classes', label: 'Shipping classes', hint: 'Comma separated. Empty = valid for every product.' }}
                            value={form.data.shipping_classes}
                            error={errors.shipping_classes}
                            onChange={set('shipping_classes')}
                        />
                        <FormField field={{ name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 }} value={form.data.is_enabled} onChange={set('is_enabled')} />
                        <div className="flex justify-end gap-2 sm:col-span-2">
                            {editingId && <Button type="button" variant="outline" onClick={reset}>Cancel edit</Button>}
                            <Button type="submit" disabled={form.processing}>{editingId ? 'Update rate' : 'Add rate'}</Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}