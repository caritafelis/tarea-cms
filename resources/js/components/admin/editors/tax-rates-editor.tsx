import { Trash2 } from 'lucide-react';
import type { FormApi } from '@/components/admin/crud-page';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Rate = { id?: number; name: string; code: string | null; rate: number | string; is_default: boolean; is_combinable: boolean };

export function RatesEditor({ data, setData, errors }: FormApi) {
    const rates: Rate[] = data.rates ?? [];
    const update = (i: number, patch: Partial<Rate>) => setData('rates', rates.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

    return (
        <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
                <Label>Tax rates</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setData('rates', [...rates, { name: '', code: '', rate: '', is_default: false, is_combinable: false }])}>Add rate</Button>
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => setData('rates', rates.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex gap-6 text-sm">
                        <label className="flex items-center gap-2"><Checkbox checked={r.is_default} onCheckedChange={(c) => update(i, { is_default: c === true })} />Default</label>
                        <label className="flex items-center gap-2"><Checkbox checked={r.is_combinable} onCheckedChange={(c) => update(i, { is_combinable: c === true })} />Combinable</label>
                    </div>
                </div>
            ))}
        </div>
    );
}