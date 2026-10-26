import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Item = { id: number; name: string; hint?: string | null };

type Props = { label: string; items: Item[]; value: number[]; onChange: (v: number[]) => void; error?: string };

export function MultiCheck({ label, items, value, onChange, error }: Props) {
    const [q, setQ] = useState('');
    const shown = q ? items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())) : items;
    const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

    return (
        <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
                <Label>
                    {label} <span className="text-xs text-muted-foreground">({value.length})</span>
                </Label>
                {items.length > 8 && <Input className="h-8 max-w-48" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />}
            </div>
            {items.length === 0 && <p className="text-xs text-muted-foreground">Nothing available.</p>}
            <div className="grid max-h-44 gap-2 overflow-y-auto sm:grid-cols-2">
                {shown.map((i) => (
                    <label key={i.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={value.includes(i.id)} onCheckedChange={() => toggle(i.id)} />
                        <span className="truncate">{i.name}</span>
                        {i.hint && <span className="text-xs text-muted-foreground">{i.hint}</span>}
                    </label>
                ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}