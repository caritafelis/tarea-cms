import { Trash2 } from 'lucide-react';
import type { FormApi } from '@/components/admin/crud-page';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify } from '@/lib/format';

export const VALUE_TYPES = ['select', 'checkbox', 'colorpicker'];
type AttrValue = { id?: number; value: string; key: string };

export function ValuesEditor({ data, setData, errors }: FormApi) {
    if (!VALUE_TYPES.includes(data.type)) return null;

    const values: AttrValue[] = data.values ?? [];
    const update = (i: number, patch: Partial<AttrValue>) => setData('values', values.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

    return (
        <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
                <Label>Values</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setData('values', [...values, { value: '', key: '' }])}>Add value</Button>
            </div>
            {values.length === 0 && <p className="text-xs text-muted-foreground">No values yet.</p>}
            {values.map((v, i) => (
                <div key={v.id ?? `new-${i}`} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
                    <div>
                        <Input
                            placeholder="Label" maxLength={50} value={v.value}
                            onChange={(e) => update(i, { value: e.target.value, key: !v.key || v.key === slugify(v.value) ? slugify(e.target.value) : v.key })}
                        />
                        <InputError message={errors[`values.${i}.value`]} />
                    </div>
                    <div>
                        <Input placeholder="Key" value={v.key} onChange={(e) => update(i, { key: e.target.value })} />
                        <InputError message={errors[`values.${i}.key`]} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setData('values', values.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
        </div>
    );
}