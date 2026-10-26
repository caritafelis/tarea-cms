import { Trash2 } from 'lucide-react';
import type { FormApi } from '@/components/admin/crud-page';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { humanize } from '@/lib/format';

type Rule = { id?: number; rule: string; operator: string; value: string };

export const RULES = ['product_title', 'product_brand', 'product_category', 'product_price', 'compare_at_price', 'inventory_stock', 'product_created_at', 'product_featured', 'product_rating', 'product_sales_count'];
export const OPERATORS = ['equals_to', 'not_equal_to', 'less_than', 'greater_than', 'starts_with', 'ends_with', 'contains', 'not_contains'];

function Pick({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{humanize(o)}</SelectItem>)}</SelectContent>
        </Select>
    );
}

export function RulesEditor({ data, setData, errors }: FormApi) {
    if (data.type !== 'auto') return null;

    const rules: Rule[] = data.rules ?? [];
    const update = (i: number, patch: Partial<Rule>) => setData('rules', rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

    return (
        <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
                <Label>Rules</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setData('rules', [...rules, { rule: 'product_title', operator: 'contains', value: '' }])}>Add rule</Button>
            </div>
            {rules.length === 0 && <p className="text-xs text-muted-foreground">No rules yet.</p>}
            {rules.map((r, i) => (
                <div key={r.id ?? `new-${i}`} className="grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-2">
                    <Pick value={r.rule} options={RULES} onChange={(v) => update(i, { rule: v })} />
                    <Pick value={r.operator} options={OPERATORS} onChange={(v) => update(i, { operator: v })} />
                    <div>
                        <Input placeholder="Value" value={r.value} onChange={(e) => update(i, { value: e.target.value })} />
                        <InputError message={errors[`rules.${i}.value`]} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setData('rules', rules.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
        </div>
    );
}