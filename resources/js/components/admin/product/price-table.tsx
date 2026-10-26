import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { profitOf, type PriceRow } from './product-utils';

const COLS = 'md:grid-cols-[4.5rem_repeat(3,minmax(0,1fr))_9rem]';

export function PriceTable({ rows, onChange, error }: { rows: PriceRow[]; onChange: (rows: PriceRow[]) => void; error?: string }) {
    const set = (i: number, patch: Partial<PriceRow>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

    if (!rows.length) {
        return <p className="text-sm text-muted-foreground">No enabled currencies. Enable one in Store setup → Currencies.</p>;
    }

    const field = (r: PriceRow, i: number, key: 'regular' | 'sale' | 'cost', label: string) => (
        <div>
            <label className="mb-1 block text-xs text-muted-foreground md:sr-only" htmlFor={`${key}-${r.currency_id}`}>{label}</label>
            <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{r.symbol}</span>
                <Input
                    id={`${key}-${r.currency_id}`}
                    type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00"
                    className="pl-8 tabular-nums"
                    value={r[key]}
                    onChange={(e) => set(i, { [key]: e.target.value })}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-2">
            <div className={cn('hidden gap-3 px-3 text-xs font-medium text-muted-foreground md:grid', COLS)}>
                <span>Currency</span><span>Regular price</span><span>Sale price</span><span>Cost per item</span><span>Profit · margin</span>
            </div>
            {rows.map((r, i) => {
                const p = profitOf(r);
                return (
                    <div key={r.currency_id} className={cn('grid items-center gap-3 rounded-xl border border-border/60 p-3', COLS)}>
                        <span className="text-sm font-semibold uppercase">{r.code}</span>
                        {field(r, i, 'regular', 'Regular price')}
                        {field(r, i, 'sale', 'Sale price')}
                        {field(r, i, 'cost', 'Cost per item')}
                        <span className={cn('text-sm tabular-nums', p && p.profit < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                            {p ? `${p.profit.toFixed(2)} · ${p.margin.toFixed(0)}%` : '—'}
                        </span>
                    </div>
                );
            })}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">Sale price is what customers pay; the regular price is shown crossed out. Cost is private and only used for profit.</p>
        </div>
    );
}