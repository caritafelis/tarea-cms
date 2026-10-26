import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type Meta = { seo_title: string; seo_description: string; seo_keyword: string; seo_noindex: boolean };

const Counter = ({ value, max }: { value: number; max: number }) => (
    <span className={cn('text-xs tabular-nums', value > max ? 'text-destructive' : 'text-muted-foreground')}>{value}/{max}</span>
);

/** Estilo Yoast: vista previa de Google, contadores y chequeo de palabra clave. */
export function SeoCard({ meta, name, slug, summary, onChange }: { meta: Meta; name: string; slug: string; summary: string; onChange: (patch: Partial<Meta>) => void }) {
    const title = meta.seo_title || name || 'Product title';
    const desc = meta.seo_description || summary || 'Add a meta description so search engines show a useful summary.';
    const origin = typeof window !== 'undefined' ? window.location.host : 'example.com';
    const kw = meta.seo_keyword.trim().toLowerCase();
    const checks = kw
        ? [
            ['Keyword in SEO title', title.toLowerCase().includes(kw)],
            ['Keyword in meta description', desc.toLowerCase().includes(kw)],
            ['Keyword in URL', slug.includes(kw.replace(/\s+/g, '-'))],
        ] as const
        : [];

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="truncate text-xs text-emerald-700 dark:text-emerald-400">{origin} › products › {slug || '…'}</p>
                <p className="truncate text-lg text-blue-700 dark:text-blue-400">{title}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{desc}</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="seo-keyword">Focus keyword</Label>
                <Input id="seo-keyword" value={meta.seo_keyword} onChange={(e) => onChange({ seo_keyword: e.target.value })} placeholder="e.g. puffer jacket" />
                {checks.length > 0 && (
                    <ul className="space-y-1 text-xs">
                        {checks.map(([label, ok]) => (
                            <li key={label} className={cn('flex items-center gap-1.5', ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                                {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} {label}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between"><Label htmlFor="seo-title">SEO title</Label><Counter value={meta.seo_title.length} max={60} /></div>
                <Input id="seo-title" value={meta.seo_title} onChange={(e) => onChange({ seo_title: e.target.value })} placeholder={name} />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between"><Label htmlFor="seo-desc">Meta description</Label><Counter value={meta.seo_description.length} max={160} /></div>
                <textarea
                    id="seo-desc" rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={meta.seo_description} onChange={(e) => onChange({ seo_description: e.target.value })}
                />
            </div>

            <label className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-sm">
                <span><span className="block font-medium">Hide from search engines</span><span className="text-muted-foreground">Adds “noindex” to this product.</span></span>
                <Switch checked={meta.seo_noindex} onCheckedChange={(v) => onChange({ seo_noindex: v })} />
            </label>
        </div>
    );
}