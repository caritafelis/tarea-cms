import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import productRoutes from '@/actions/App/Http/Controllers/Admin/ProductController';
import { Muted, StatusBadge } from '@/components/admin/cells';
import type { Capabilities } from '@/components/admin/product/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { formatDate, formatMoney } from '@/lib/format';

type Props = {
    product: Record<string, any>;
    capabilities: Capabilities;
    inventories: any[];
    stock: Record<string, number>;
    variantStock: Record<string, Record<string, number>>;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
        <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

const Chips = ({ items }: { items: { id: number; name: string }[] }) =>
    items.length ? (
        <div className="flex flex-wrap gap-1">{items.map((i) => <Badge key={i.id} variant="secondary">{i.name}</Badge>)}</div>
    ) : (
        <Muted>—</Muted>
    );

export default function ShowProduct({ product: p, capabilities: cap, inventories, stock, variantStock }: Props) {
    const team = useTeamSlug();
    const can = useCan();
    const published = p.is_visible && (!p.published_at || new Date(p.published_at) <= new Date());
    const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);

    return (
        <>
            <Head title={p.name} />
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="icon">
                            <Link href={productRoutes.index.url({ current_team: team })}><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
                            <Muted>{p.sku ?? p.slug}</Muted>
                        </div>
                        <StatusBadge value={p.type} tone="blue" />
                        <StatusBadge value={published ? 'Published' : p.is_visible ? 'Scheduled' : 'Hidden'} tone={published ? 'green' : p.is_visible ? 'amber' : 'gray'} />
                    </div>
                    {can('update_product') && (
                        <Button asChild><Link href={productRoutes.edit.url({ current_team: team, product: p.id })}>Edit</Link></Button>
                    )}
                </div>

                {(p.summary || p.description) && (
                    <Section title="Description">
                        {p.summary && <p className="mb-2 font-medium">{p.summary}</p>}
                        <p className="whitespace-pre-line text-sm text-muted-foreground">{p.description}</p>
                    </Section>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <Section title="Pricing">
                        {p.prices.length === 0 && <Muted>No prices set.</Muted>}
                        <div className="space-y-1 text-sm">
                            {p.prices.map((pr: any) => (
                                <div key={pr.id} className="flex justify-between">
                                    <span className="text-muted-foreground">{pr.currency?.code}</span>
                                    <span className="font-medium">
                                        {pr.amount != null ? formatMoney(pr.amount, pr.currency?.code) : '—'}
                                        {pr.compare_amount ? <s className="ml-2 text-xs text-muted-foreground">{formatMoney(pr.compare_amount, pr.currency?.code)}</s> : null}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Inventory">
                        {cap.inventory ? (
                            <div className="space-y-1 text-sm">
                                {inventories.map((i) => (
                                    <div key={i.id} className="flex justify-between"><span className="text-muted-foreground">{i.name}</span><span className="font-medium">{stock[i.id] ?? 0}</span></div>
                                ))}
                                <div className="flex justify-between border-t pt-1 font-bold"><span>Total</span><span>{totalStock}</span></div>
                            </div>
                        ) : (
                            <Muted>{cap.variants ? 'Stock is tracked per variant.' : 'This product type does not track stock.'}</Muted>
                        )}
                    </Section>
                </div>

                {cap.variants && (
                    <Section title={`Variants (${p.variants.length})`}>
                        <div className="divide-y text-sm">
                            {p.variants.length === 0 && <Muted>No variants.</Muted>}
                            {p.variants.map((v: any) => (
                                <div key={v.id} className="flex justify-between py-2">
                                    <div>
                                        <p className="font-medium">{v.name}</p>
                                        <Muted>{[v.sku, v.values.map((x: any) => x.value).join(' / ')].filter(Boolean).join(' · ')}</Muted>
                                    </div>
                                    <Muted>Stock {Object.values(variantStock[v.id] ?? {}).reduce((a, b) => a + b, 0)}</Muted>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <Section title="Brand & supplier">
                        <p className="text-sm">{p.brand?.name ?? '—'} <Muted>· {p.supplier?.name ?? 'no supplier'}</Muted></p>
                    </Section>
                    <Section title="Published"><p className="text-sm">{formatDate(p.published_at, true)}</p></Section>
                    <Section title="Categories"><Chips items={p.categories} /></Section>
                    <Section title="Collections"><Chips items={p.collections} /></Section>
                    <Section title="Tags"><Chips items={p.tags} /></Section>
                    <Section title="Related products"><Chips items={p.relatedProducts} /></Section>
                    <Section title="Upsells"><Chips items={p.upsells ?? []} /></Section>
                    <Section title="Cross-sells"><Chips items={p.cross_sells ?? []} /></Section>
                </div>

                {(p.metadata?.seo_title || p.metadata?.seo_description) && (
                    <Section title="SEO">
                        <p className="font-medium">{p.metadata.seo_title}</p>
                        <Muted>{p.metadata.seo_description}</Muted>
                    </Section>
                )}
            </div>
        </>
    );
}