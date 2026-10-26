import { Activity, CircleCheck, FileText, Layers, Newspaper, Pencil, TriangleAlert, Webhook } from 'lucide-react';
import {
    Chip,
    Empty,
    GB,
    Legend,
    Meter,
    Panel,
    Spark,
    StackedArea,
    Stat,
    compact,
    num,
    toGb,
} from '@/components/glass';

export interface TenantProps {
    scope: 'tenant';
    period: string;
    plan: string;
    api: { used: number; limit: number | null; series?: number[] };
    storage: { used: number; limit_gb: number | null };
    content: Record<'pages' | 'posts' | 'entries', { total: number; changed: number }>;
    webhooks: {
        total: number;
        ok: number;
        failed: number;
        series: { t: string; ok: number; failed: number }[];
        recent_failures: { id: number; event: string; response_code: number | null; created_at: string }[];
    };
    /** Opcional: últimos cambios de contenido (título, tipo, autor, fecha ya formateada). */
    recent_changes?: { id: number; title: string; type: string; user: string; at: string }[];
}

const KINDS = [
    { key: 'pages', label: 'Pages', icon: FileText },
    { key: 'posts', label: 'Posts', icon: Newspaper },
    { key: 'entries', label: 'Entries', icon: Layers },
] as const;

export function TenantView({ plan, api, storage, content, webhooks, recent_changes }: TenantProps) {
    const storageLimit = storage.limit_gb === null ? null : storage.limit_gb * GB;
    const changed = KINDS.reduce((s, k) => s + content[k.key].changed, 0);
    const rate = webhooks.total ? (webhooks.ok / webhooks.total) * 100 : null;
    const maxTotal = Math.max(...KINDS.map((k) => content[k.key].total), 1);

    return (
        <div className="space-y-4">
            {/* Métricas clave */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="API requests this month" value={num(api.used)} hint={`${plan} plan`}>
                    {api.series && api.series.length > 1 && <Spark values={api.series} className="mb-3" />}
                    <Meter used={api.used} limit={api.limit} format={compact} />
                </Stat>

                <Stat
                    label="Media storage"
                    value={`${toGb(storage.used)} GB`}
                    hint={storage.limit_gb === null ? undefined : `of ${storage.limit_gb} GB`}
                >
                    <Meter used={storage.used} limit={storageLimit} format={(b) => `${toGb(b)} GB`} />
                </Stat>

                <Stat label="Content updated" value={num(changed)} hint="Pages, posts and entries in this period">
                    <div className="flex flex-wrap gap-1.5">
                        {KINDS.map((k) => (
                            <Chip key={k.key}>
                                <k.icon className="size-3" />
                                {num(content[k.key].changed)}
                            </Chip>
                        ))}
                    </div>
                </Stat>

                <Stat
                    label="Webhook success rate"
                    value={rate === null ? '—' : `${rate.toFixed(1)}%`}
                    hint={rate === null ? 'No deliveries yet' : `${num(webhooks.failed)} failed of ${num(webhooks.total)}`}
                >
                    {rate !== null && (
                        <Meter used={webhooks.failed} limit={Math.max(webhooks.total, 1)} format={() => 'all deliveries'} />
                    )}
                </Stat>
            </div>

            {/* Gráfica + contenido */}
            <div className="grid gap-4 lg:grid-cols-12">
                <Panel
                    className="lg:col-span-8"
                    icon={<Webhook className="size-4" />}
                    title="Webhook deliveries"
                    action={
                        <Legend
                            items={[
                                { label: 'Delivered', color: 'var(--ok)' },
                                { label: 'Failed', color: 'var(--bad)' },
                            ]}
                        />
                    }
                >
                    {webhooks.series.length ? (
                        <StackedArea
                            labels={webhooks.series.map((d) => d.t)}
                            series={[
                                { name: 'Delivered', color: 'var(--ok)', values: webhooks.series.map((d) => d.ok) },
                                { name: 'Failed', color: 'var(--bad)', values: webhooks.series.map((d) => d.failed) },
                            ]}
                        />
                    ) : (
                        <Empty icon={<Webhook className="size-5" />}>No deliveries in this period. Publish content to trigger your webhooks.</Empty>
                    )}
                </Panel>

                <Panel className="lg:col-span-4" icon={<Activity className="size-4" />} title="Content">
                    <ul className="space-y-2">
                        {KINDS.map((k) => {
                            const c = content[k.key];
                            return (
                                <li key={k.key} className="glass-inset rounded-xl p-3">
                                    <div className="flex items-center gap-3">
                                        <k.icon className="size-4 text-muted-foreground" />
                                        <span className="text-sm">{k.label}</span>
                                        <span className="ml-auto text-lg font-semibold tabular-nums">{num(c.total)}</span>
                                    </div>
                                    <div className="glass-track mt-2.5 h-1.5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-foreground/50"
                                            style={{ width: `${(c.total / maxTotal) * 100}%` }}
                                        />
                                    </div>
                                    <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                                        {num(c.changed)} changed in this period
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                </Panel>
            </div>

            {/* Actividad reciente */}
            <div className="grid gap-4 lg:grid-cols-12">
                {recent_changes && (
                    <Panel className="lg:col-span-7" icon={<Pencil className="size-4" />} title="Recent changes">
                        {recent_changes.length === 0 ? (
                            <Empty>Nothing has changed in this period.</Empty>
                        ) : (
                            <ul className="space-y-1.5">
                                {recent_changes.map((r) => (
                                    <li key={r.id} className="glass-inset flex items-center gap-3 rounded-xl px-3 py-2.5">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{r.title}</p>
                                            <p className="text-xs text-muted-foreground">by {r.user}</p>
                                        </div>
                                        <Chip>{r.type}</Chip>
                                        <span className="w-20 text-right text-xs text-muted-foreground tabular-nums">{r.at}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                )}

                <Panel
                    className={recent_changes ? 'lg:col-span-5' : 'lg:col-span-12'}
                    icon={<TriangleAlert className="size-4" />}
                    title="Recent failures"
                >
                    {webhooks.recent_failures.length === 0 ? (
                        <Empty icon={<CircleCheck className="size-5" style={{ color: 'var(--ok)' }} />}>
                            Every delivery went through in this period.
                        </Empty>
                    ) : (
                        <ul className="space-y-1.5">
                            {webhooks.recent_failures.map((f) => (
                                <li key={f.id} className="glass-inset flex items-center gap-3 rounded-xl px-3 py-2.5">
                                    <span className="size-2 rounded-full" style={{ background: 'var(--bad)', boxShadow: '0 0 8px var(--bad)' }} />
                                    <span className="min-w-0 flex-1 truncate text-sm">{f.event}</span>
                                    <Chip>{f.response_code ?? 'No response'}</Chip>
                                    <span className="text-xs text-muted-foreground tabular-nums">{f.created_at}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </div>
    );
}