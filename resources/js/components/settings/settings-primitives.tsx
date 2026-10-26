import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export const TONES = {
    green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    violet: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
} as const;

export type Tone = keyof typeof TONES;

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <section className="space-y-5">
            <div>
                <h2 className="text-base font-semibold">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            {children}
        </section>
    );
}

/** Fila con ícono en baldosa de color, texto y control a la derecha. */
export function FeatureRow({
    icon: Icon,
    tone,
    title,
    description,
    control,
    children,
}: {
    icon: LucideIcon;
    tone: Tone;
    title: string;
    description: React.ReactNode;
    control?: React.ReactNode;
    children?: React.ReactNode;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-start gap-4">
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
                    <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                </div>
                {control && <div className="shrink-0 self-center">{control}</div>}
            </div>
            {children && <div className="pl-14">{children}</div>}
        </div>
    );
}

export function Field({
    label,
    description,
    htmlFor,
    error,
    aside,
    children,
}: {
    label: string;
    description?: string;
    htmlFor: string;
    error?: string;
    /** Contenido a la derecha de la etiqueta (p. ej. un contador). */
    aside?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={htmlFor} className="text-sm font-semibold">{label}</Label>
                {aside}
            </div>
            {description && <p className="-mt-0.5 text-sm text-muted-foreground">{description}</p>}
            {children}
            <InputError message={error} />
        </div>
    );
}