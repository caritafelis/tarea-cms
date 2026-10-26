import { Building2, Gauge, Server, Trophy, UserPlus, Wallet } from 'lucide-react';
import {
    Chip,
    Empty,
    GB,
    Legend,
    Meter,
    Panel,
    SegmentBar,
    StackedArea,
    Stat,
    compact,
    money,
    num,
    toGb,
} from '@/components/glass';

export interface PlatformProps {
    scope: 'platform';
    period: string;
    totals: { teams: number; active: number; new: number; churned: number; mrr: number };
    api: { used: number; series: { t: string; v: number }[] };
    storage: { used: number; capacity: number };
    plans: { name: string; count: number }[];
    top_teams: {
        id: number;
        name: string;
        plan: string;
        api_used: number;
        api_limit: number | null;
        storage_used: number;
        failed_webhooks: number;
    }[];
    webhooks: { ok: number; failed: number };
    queue: { pending: number; failed: number; latency_ms: number };
    signups: { id: number; name: string; plan: string; at: string }[];
}

const PLAN_COLORS = [
    'oklch(0.72 0.19 295)',
    'oklch(0.78 0.16 65)',
    'oklch(0.72 0.17 200)',
    'oklch(0.72 0.2 340)',
    'oklch(0.7 0.02 260)',
];

export function AdminView({ totals, api, storage, plans, top_teams, webhooks, queue, signups }: PlatformProps) {
    const deliveries = webhooks.ok + webhooks.failed;
    const rate = deliveries ? (webhooks.ok / deliveries) * 100 : null;
    const queueTone = queue.failed > 0 ? 'var(--bad)' : queue.pending > 500 ? 'var(--warn)' : 'var(--ok)';

    return (
        <div className="space-y-4">
            {/* Héroe: tráfico de toda la plataforma + ingresos y planes */}
            <div className="grid gap-4 lg:grid-cols-12">
                <Panel
                    className="lg:col-span-8"
                    icon={<Gauge className="size-4" />}
                    title="Requests across all teams"
                    action={<Legend items={[{ label: 'API requests', color: 'oklch(0.72 0.19 295)' }]} />}
                >
                    <p className="mb-4 text-5xl font-semibold tracking-tight tabular-nums">{compact(api.used)}</p>
                    <StackedArea
                        height={240}
                        labels={api.series.map((d) => d.t)}
                        series={[{ name: 'API requests', color: 'oklch(0.72 0.19 295)', values: api.series.map((d) => d.v) }]}
                        format={compact}
                    />
                </Panel>

                <div className="grid gap-4 lg:col-span-4">
                    <Stat label="Monthly recurring revenue" value={money(totals.mrr)} hint={`${num(totals.churned)} teams churned in this period`} />

                    <Panel icon={<Wallet className="size-4" />} title="Plans" className="self-stretch">
                        {plans.length === 0 ? (
                            <Empty>No teams on a plan yet.</Empty>
                        ) : (
                            <>
                                <SegmentBar parts={plans.map((p, i) => ({ label: p.name, value: p.count, color: PLAN_COLORS[i % PLAN_COLORS.length] }))} />
                                <ul className="mt-4 space-y-2">
                                    {plans.map((p, i) => (
                                        <li key={p.name} className="flex items-center gap-2 text-sm">
                                            <span className="size-2 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                                            <span>{p.name}</span>
                                            <span className="ml-auto tabular-nums text-muted-foreground">{num(p.count)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </Panel>
                </div>
            </div>

            {/* Métricas de plataforma */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Teams" value={num(totals.teams)} hint="Registered on the platform" />
                <Stat label="Active teams" value={num(totals.active)} hint={`${totals.teams ? Math.round((totals.active / totals.teams) * 100) : 0}% of all teams`} />
                <Stat label="New teams" value={`+${num(totals.new)}`} hint="Created in this period" />
                <Stat label="Media storage" value={`${toGb(storage.used)} GB`}>
                    <Meter used={storage.used} limit={storage.capacity} format={(b) => `${Math.round(b / GB)} GB`} />
                </Stat>
            </div>

            {/* Equipos con más uso + salud */}
            <div className="grid gap-4 lg:grid-cols-12">
                <Panel className="lg:col-span-8" icon={<Trophy className="size-4" />} title="Busiest teams">
                    {top_teams.length === 0 ? (
                        <Empty icon={<Building2 className="size-5" />}>No team activity in this period.</Empty>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[560px] text-left text-sm">
                                <thead className="text-xs text-muted-foreground">
                                    <tr>
                                        <th className="px-3 pb-2 font-normal">Team</th>
                                        <th className="px-3 pb-2 font-normal">API usage</th>
                                        <th className="px-3 pb-2 text-right font-normal">Storage</th>
                                        <th className="px-3 pb-2 text-right font-normal">Failed hooks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top_teams.map((t) => (
                                        <tr key={t.id} className="border-t border-foreground/5">
                                            <td className="px-3 py-3">
                                                <p className="font-medium">{t.name}</p>
                                                <Chip className="mt-1">{t.plan}</Chip>
                                            </td>
                                            <td className="w-64 px-3 py-3">
                                                <p className="mb-1.5 tabular-nums">{num(t.api_used)}</p>
                                                <Meter used={t.api_used} limit={t.api_limit} format={compact} />
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">{toGb(t.storage_used)} GB</td>
                                            <td
                                                className="px-3 py-3 text-right tabular-nums"
                                                style={t.failed_webhooks > 0 ? { color: 'var(--bad)' } : undefined}
                                            >
                                                {num(t.failed_webhooks)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>

                <div className="grid gap-4 lg:col-span-4">
                    <Panel icon={<Server className="size-4" />} title="System health">
                        <ul className="space-y-1.5 text-sm">
                            <HealthRow label="Queue pending" value={num(queue.pending)} />
                            <HealthRow label="Failed jobs" value={num(queue.failed)} color={queue.failed > 0 ? 'var(--bad)' : undefined} />
                            <HealthRow label="Queue latency" value={`${num(queue.latency_ms)} ms`} color={queueTone} />
                            <HealthRow
                                label="Webhook success"
                                value={rate === null ? '—' : `${rate.toFixed(1)}%`}
                                color={rate !== null && rate < 95 ? 'var(--warn)' : undefined}
                            />
                        </ul>
                    </Panel>

                    <Panel icon={<UserPlus className="size-4" />} title="New sign-ups">
                        {signups.length === 0 ? (
                            <Empty>No new teams in this period.</Empty>
                        ) : (
                            <ul className="space-y-1.5">
                                {signups.map((s) => (
                                    <li key={s.id} className="glass-inset flex items-center gap-3 rounded-xl px-3 py-2.5">
                                        <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                                        <Chip>{s.plan}</Chip>
                                        <span className="text-xs text-muted-foreground tabular-nums">{s.at}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    );
}

function HealthRow({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <li className="glass-inset flex items-center gap-3 rounded-xl px-3 py-2.5">
            <span className="size-2 rounded-full" style={{ background: color ?? 'var(--ok)', boxShadow: `0 0 8px ${color ?? 'var(--ok)'}` }} />
            <span className="text-muted-foreground">{label}</span>
            <span className="ml-auto font-medium tabular-nums">{value}</span>
        </li>
    );
}