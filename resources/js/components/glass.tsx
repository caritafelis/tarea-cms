import { useId, useState } from 'react';
import type { ElementType, PointerEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ───────────── helpers ───────────── */

export const GB = 1_073_741_824;
export const num = (n: number) => n.toLocaleString();
export const compact = (n: number) =>
    new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
export const toGb = (bytes: number) => (bytes / GB).toFixed(2);
export const money = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export type Tone = 'ok' | 'warn' | 'bad';
const toneVar: Record<Tone, string> = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)' };
export const toneFor = (pct: number): Tone => (pct > 90 ? 'bad' : pct > 75 ? 'warn' : 'ok');

type Pt = [number, number];
const smooth = (p: Pt[]) =>
    p.reduce((d, [x, y], i, a) => {
        if (i === 0) return `M${x},${y}`;
        const [px, py] = a[i - 1];
        const cx = (px + x) / 2;
        return `${d} C${cx},${py} ${cx},${y} ${x},${y}`;
    }, '');

/* ───────────── superficies ───────────── */

export function Glass({
    as: Tag = 'div',
    className,
    children,
}: {
    as?: ElementType;
    className?: string;
    children: ReactNode;
}) {
    return <Tag className={cn('glass', className)}>{children}</Tag>;
}

/** Sección con icono + título, como los bloques de Nightwatch */
export function Panel({
    icon,
    title,
    action,
    className,
    children,
}: {
    icon: ReactNode;
    title: string;
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <Glass as="section" className={cn('p-2', className)}>
            <header className="flex items-center gap-3 px-3 pb-3 pt-3">
                <span className="glass-inset grid size-8 place-items-center rounded-lg text-muted-foreground">
                    {icon}
                </span>
                <h2 className="text-[17px] font-medium tracking-tight">{title}</h2>
                {action && <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">{action}</div>}
            </header>
            <div className="px-3 pb-3">{children}</div>
        </Glass>
    );
}

export function Stat({
    label,
    value,
    hint,
    className,
    children,
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    className?: string;
    children?: ReactNode;
}) {
    return (
        <Glass className={cn('p-5', className)}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
            {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
            {children && <div className="mt-4">{children}</div>}
        </Glass>
    );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <span className={cn('glass-inset inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs', className)}>
            {children}
        </span>
    );
}

export function Dot({ color }: { color: string }) {
    return <span className="inline-block size-2 rounded-full" style={{ background: color }} />;
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
    return (
        <>
            {items.map((i) => (
                <span key={i.label} className="inline-flex items-center gap-1.5">
                    <Dot color={i.color} />
                    {i.label}
                </span>
            ))}
        </>
    );
}

export function Empty({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
    return (
        <div className="glass-inset grid min-h-32 place-items-center rounded-xl p-6 text-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
                {icon}
                <p>{children}</p>
            </div>
        </div>
    );
}

/* ───────────── medidor ───────────── */

export function Meter({ used, limit, format = num }: { used: number; limit: number | null; format?: (n: number) => string }) {
    if (limit === null) return <p className="text-xs text-muted-foreground">Unlimited on your plan</p>;
    const pct = Math.min(100, (used / Math.max(limit, 1)) * 100);
    const color = toneVar[toneFor(pct)];
    return (
        <div>
            <div className="glass-track h-2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}` }}
                />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                {pct.toFixed(1)}% of {format(limit)}
            </p>
        </div>
    );
}

/* ───────────── gráficas ───────────── */

export function Spark({ values, color = 'var(--ok)', className }: { values: number[]; color?: string; className?: string }) {
    const id = useId().replace(/:/g, '');
    if (values.length < 2) return null;
    const W = 200;
    const H = 48;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const pts = values.map((v, i): Pt => [(i / (values.length - 1)) * W, H - 4 - ((v - min) / (max - min || 1)) * (H - 8)]);
    const line = smooth(pts);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn('h-12 w-full', className)} aria-hidden>
            <defs>
                <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor={color} stopOpacity=".35" />
                    <stop offset="1" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
            <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

export interface AreaSeries {
    name: string;
    color: string;
    values: number[];
}

/** Área apilada con crosshair y tooltip de cristal. Primera serie = capa inferior. */
export function StackedArea({
    labels,
    series,
    height = 220,
    format = num,
}: {
    labels: string[];
    series: AreaSeries[];
    height?: number;
    format?: (n: number) => string;
}) {
    const uid = useId().replace(/:/g, '');
    const [hover, setHover] = useState<number | null>(null);
    const n = labels.length;

    if (n < 2) return <Empty>Not enough data in this period yet.</Empty>;

    const W = 1000;
    const H = height;
    const pad = 10;
    const cum = series.map((_, k) =>
        labels.map((__, i) => series.slice(0, k + 1).reduce((s, x) => s + (x.values[i] ?? 0), 0)),
    );
    const max = Math.max(...cum[cum.length - 1], 1) * 1.12;
    const X = (i: number) => (i / (n - 1)) * W;
    const Y = (v: number) => H - pad - (v / max) * (H - pad * 2);

    const layers = series.map((s, k) => {
        const top = cum[k].map((v, i): Pt => [X(i), Y(v)]);
        const bottom = (k === 0 ? labels.map(() => 0) : cum[k - 1]).map((v, i): Pt => [X(i), Y(v)]).reverse();
        return { s, line: smooth(top), area: `${smooth(top)}${smooth(bottom).replace('M', ' L')}Z` };
    });

    const onMove = (e: PointerEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
    };
    const ratio = hover === null ? 0 : hover / (n - 1);

    return (
        <div>
            <div className="relative" style={{ height }} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 size-full text-foreground"
                    role="img"
                    aria-label={series.map((s) => s.name).join(', ')}
                >
                    <defs>
                        {series.map((s, k) => (
                            <linearGradient key={s.name} id={`${uid}-${k}`} x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0" stopColor={s.color} stopOpacity=".5" />
                                <stop offset="1" stopColor={s.color} stopOpacity=".02" />
                            </linearGradient>
                        ))}
                    </defs>
                    {[0.25, 0.5, 0.75].map((g) => (
                        <line
                            key={g}
                            x1="0"
                            x2={W}
                            y1={pad + (H - pad * 2) * g}
                            y2={pad + (H - pad * 2) * g}
                            stroke="currentColor"
                            strokeOpacity=".09"
                            strokeDasharray="4 7"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    {layers.map(({ s, line, area }, k) => (
                        <g key={s.name}>
                            <path d={area} fill={`url(#${uid}-${k})`} />
                            <path d={line} fill="none" stroke={s.color} strokeWidth="1.75" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                        </g>
                    ))}
                </svg>

                {hover !== null && (
                    <>
                        <div className="pointer-events-none absolute inset-y-0 w-px bg-foreground/20" style={{ left: `${ratio * 100}%` }} />
                        <div
                            className="glass pointer-events-none absolute top-2 z-10 min-w-36 rounded-xl px-3 py-2 text-xs"
                            style={{ left: `${ratio * 100}%`, transform: `translateX(${-ratio * 100}%)` }}
                        >
                            <p className="mb-1 font-medium">{labels[hover]}</p>
                            {series.map((s) => (
                                <p key={s.name} className="flex items-center justify-between gap-4 text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Dot color={s.color} />
                                        {s.name}
                                    </span>
                                    <span className="tabular-nums text-foreground">{format(s.values[hover] ?? 0)}</span>
                                </p>
                            ))}
                        </div>
                    </>
                )}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{labels[0]}</span>
                <span>{labels[n - 1]}</span>
            </div>
        </div>
    );
}

/** Barra horizontal segmentada (distribución de planes, etc.) */
export function SegmentBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
    const total = parts.reduce((s, p) => s + p.value, 0) || 1;
    return (
        <div className="glass-track flex h-3 gap-0.5 overflow-hidden p-0.5">
            {parts.map((p) => (
                <div
                    key={p.label}
                    title={`${p.label}: ${p.value}`}
                    className="h-full rounded-full"
                    style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
                />
            ))}
        </div>
    );
}

/* ───────────── selector segmentado ───────────── */

export function Segmented<T extends string>({
    value,
    options,
    onChange,
    label,
}: {
    value: T;
    options: readonly T[];
    onChange: (v: T) => void;
    label: string;
}) {
    const i = Math.max(0, options.indexOf(value));
    return (
        <div
            role="radiogroup"
            aria-label={label}
            className="glass-pill relative grid rounded-xl p-1"
            style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        >
            <span
                aria-hidden
                className="glass-thumb absolute inset-y-1 left-1 rounded-lg transition-transform duration-300 ease-[cubic-bezier(.3,1.35,.5,1)] motion-reduce:transition-none"
                style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${i * 100}%)` }}
            />
            {options.map((o) => (
                <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={o === value}
                    onClick={() => onChange(o)}
                    className={cn(
                        'relative z-10 rounded-lg px-3.5 py-1.5 text-sm uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                        o === value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {o}
                </button>
            ))}
        </div>
    );
}

/* ───────────── fondo ambiente (lo que el cristal refracta) ───────────── */

export function Ambient({ tone }: { tone: 'tenant' | 'platform' }) {
    const orbs =
        tone === 'tenant'
            ? ['oklch(0.62 0.17 160 / .30)', 'oklch(0.55 0.18 250 / .24)', 'oklch(0.62 0.15 195 / .18)']
            : ['oklch(0.58 0.22 295 / .34)', 'oklch(0.74 0.17 65 / .22)', 'oklch(0.58 0.2 340 / .2)'];
    return (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
            <div className="absolute -left-40 -top-32 size-[560px] rounded-full blur-[120px]" style={{ background: orbs[0] }} />
            <div className="absolute -right-32 top-24 size-[520px] rounded-full blur-[120px]" style={{ background: orbs[1] }} />
            <div className="absolute left-1/3 top-[520px] size-[480px] rounded-full blur-[130px]" style={{ background: orbs[2] }} />
        </div>
    );
}