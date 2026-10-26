import { router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import productRoutes from '@/actions/App/Http/Controllers/Admin/ProductController';
import { Muted } from '@/components/admin/cells';
import { FormField } from '@/components/admin/form-fields';
import {
    PriceRows, StockPanel, pricesToRows, rowsToPayload,
    type AttributeDef, type Currency, type PriceRow, type Variant,
} from '@/components/admin/product/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatMoney } from '@/lib/format';
import { useConfirm } from '@/components/confirm/confirm-provider';

type Props = {
    productId: number;
    team: string;
    variants: Variant[];
    currencies: Currency[];
    inventories: any[];
    variantStock: Record<string, Record<string, number>>;
    attributes: AttributeDef[];
};

type FormData = {
    name: string;
    sku: string;
    allow_backorder: boolean;
    value_ids: number[];
    prices: PriceRow[]
};

export function VariantsPanel({ productId, team, variants, currencies, inventories, variantStock, attributes }: Props) {
    const [editing, setEditing] = useState<Variant | 'new' | null>(null);
    const blank = (): FormData => ({ name: '', sku: '', allow_backorder: false, value_ids: [], prices: pricesToRows(currencies) });
    const form = useForm<FormData>(blank());
    const errors = form.errors as Record<string, string | undefined>;
    const variant = editing && editing !== 'new' ? editing : null;
    const withValues = attributes.filter((a) => a.values.length > 0);
    const confirm = useConfirm();

    const open = (v: Variant | 'new') => {
        form.clearErrors();
        form.setData(
            v === 'new'
                ? blank()
                : {
                    name: v.name, sku: v.sku ?? '', allow_backorder: Boolean(v.allow_backorder),
                    value_ids: v.values.map((x) => x.id), prices: pricesToRows(currencies, v.prices),
                },
        );
        setEditing(v);
    };

    const pick = (attr: AttributeDef, valueId: string) => {
        const others = form.data.value_ids.filter((id) => !attr.values.some((v) => v.id === id));
        form.setData('value_ids', valueId ? [...others, Number(valueId)] : others);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((d) => ({ ...d, prices: rowsToPayload(currencies, d.prices) }));
        const opts = { preserveScroll: true, onSuccess: () => setEditing(null) };
        if (variant) form.put(productRoutes.updateVariant.url({ current_team: team, product: productId, variant: variant.id }), opts);
        else form.post(productRoutes.storeVariant.url({ current_team: team, product: productId }), opts);
    };

    const remove = async (v: Variant) => {
        const ok = await confirm({
            title: `Delete “${v.name}”?`,
            description: 'The variant, its prices and stock records will be removed.',
            confirmLabel: 'Delete variant',
            destructive: true,
        });
        if (!ok) return;

        router.delete(productRoutes.destroyVariant.url({ current_team: team, product: productId, variant: v.id }), { preserveScroll: true });
    };

    const firstCurrency = currencies[0];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{variants.length} variant(s)</p>
                <Button type="button" size="sm" onClick={() => open('new')}><Plus className="mr-1 h-4 w-4" />Add variant</Button>
            </div>

            <div className="divide-y rounded-lg border">
                {variants.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No variants yet.</p>}
                {variants.map((v) => {
                    const price = v.prices.find((p) => p.currency_id === firstCurrency?.id);
                    const total = Object.values(variantStock[v.id] ?? {}).reduce((a, b) => a + b, 0);
                    return (
                        <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                            <div className="min-w-0">
                                <p className="truncate font-medium">{v.name}</p>
                                <Muted>{[v.sku, v.values.map((x) => x.value).join(' / ')].filter(Boolean).join(' · ') || '—'}</Muted>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span>{price?.amount != null && firstCurrency ? formatMoney(price.amount, firstCurrency.code) : '—'}</span>
                                <Muted>Stock {total}</Muted>
                                <Button type="button" size="sm" variant="outline" onClick={() => open(v)}>Edit</Button>
                                <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => remove(v)}>Delete</Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <form onSubmit={submit} className="flex max-h-[85vh] flex-col gap-4">
                        <DialogHeader>
                            <DialogTitle>{variant ? 'Edit variant' : 'New variant'}</DialogTitle>
                            <DialogDescription>{variant?.name ?? 'Combine attribute values and set pricing.'}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-5 overflow-y-auto px-0.5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField field={{ name: 'name', label: 'Name', required: true, span: 2 }} value={form.data.name} error={errors.name} onChange={(v) => form.setData('name', v)} />
                                <FormField field={{ name: 'sku', label: 'SKU' }} value={form.data.sku} error={errors.sku} onChange={(v) => form.setData('sku', v)} />
                                {variant?.barcode && (
                                    <p className="text-xs text-muted-foreground sm:col-span-2">
                                        Barcode (automatic): <code className="font-medium text-foreground">{variant.barcode}</code>
                                    </p>
                                )}
                                {withValues.map((a) => (
                                    <FormField
                                        key={a.id}
                                        field={{ name: `attr-${a.id}`, label: a.name, type: 'select', allowEmpty: true, options: a.values.map((v) => ({ value: v.id, label: v.value })) }}
                                        value={form.data.value_ids.find((id) => a.values.some((v) => v.id === id)) ?? ''}
                                        onChange={(v) => pick(a, String(v))}
                                    />
                                ))}
                                <FormField field={{ name: 'allow_backorder', label: 'Allow backorder', type: 'switch', span: 2 }} value={form.data.allow_backorder} onChange={(v) => form.setData('allow_backorder', v)} />
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Pricing</h4>
                                <PriceRows currencies={currencies} rows={form.data.prices} errors={errors} onChange={(rows) => form.setData('prices', rows)} />
                            </div>

                            {variant && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">Inventory</h4>
                                    <StockPanel
                                        inventories={inventories}
                                        stock={variantStock[variant.id] ?? {}}
                                        url={productRoutes.adjustVariantStock.url({ current_team: team, product: productId, variant: variant.id })}
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>{form.processing ? 'Saving…' : 'Save variant'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}