import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Contenedor de página de settings: título + contenido centrado. */
export function SettingsShell({
    title,
    description,
    wide,
    children,
}: {
    title: string;
    description?: string;
    wide?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className={cn('mx-auto w-full px-4 py-8 sm:px-6', wide ? 'max-w-full' : 'max-w-full')}>
            <header>
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {description && <p className="mt-1 text-muted-foreground">{description}</p>}
            </header>
            <div className="mt-8 space-y-8">{children}</div>
        </div>
    );
}

/** Tarjeta con título y una lista de filas separadas por línea punteada (estilo Nightwatch). */
export function SettingsCard({
    title,
    description,
    children,
    className,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('rounded-2xl border border-border/60 p-3 sm:p-4', className)}>
            {title && (
                <header className="px-2 pb-3 pt-2">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </header>
            )}
            <div className="divide-y divide-dotted divide-border overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                {children}
            </div>
        </section>
    );
}

/** Fila: texto a la izquierda, control a la derecha. `fill` hace que el control ocupe todo el ancho (inputs). */
export function SettingsRow({
    title,
    description,
    children,
    fill,
    top,
    className,
}: {
    title: string;
    description?: string;
    children?: React.ReactNode;
    fill?: boolean;
    top?: boolean;
    className?: string;
}) {
    return (
        <div className={cn('grid gap-3 p-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6', top ? 'sm:items-start' : 'sm:items-center', className)}>
            <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {children && <div className={cn('min-w-0', fill ? 'w-full' : 'flex flex-wrap items-center gap-3 sm:justify-end')}>{children}</div>}
        </div>
    );
}

// ---------------------------------------------------------------------
// Diseño "plano" de Security (Untitled UI): secciones sin caja, separadas por línea punteada.
// ---------------------------------------------------------------------

export function FlatSection({
    id,
    title,
    description,
    children,
}: {
    id?: string;
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-24">
            <div className="px-1 pb-3">
                <h2 className="text-sm font-semibold">{title}</h2>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="divide-y divide-dotted divide-border border-y border-dotted border-border">{children}</div>
        </section>
    );
}

/** Título/descripción a la izquierda; el contenido ocupa el resto y lo compone cada pantalla. */
export function FlatRow({
    id,
    title,
    description,
    top,
    children,
}: {
    id?: string;
    title: string;
    description?: string;
    top?: boolean;
    children?: React.ReactNode;
}) {
    return (
        <div id={id} className={cn('grid scroll-mt-24 gap-3 px-1 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-8', top ? 'sm:items-start' : 'sm:items-center')}>
            <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

/**
 * Banner "Your account security is X%" con Dismiss + Review security.
 * Dismiss se recuerda hasta que cambie el puntaje.
 */
export function SecurityBanner({
    score,
    message,
    onReview,
    storageKey = 'security-banner',
}: {
    score: number;
    message: string;
    onReview?: () => void;
    storageKey?: string;
}) {
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        try {
            setDismissed(window.localStorage.getItem(storageKey) === String(score));
        } catch {
            setDismissed(false);
        }
    }, [storageKey, score]);

    if (dismissed) return null;

    function dismiss() {
        setDismissed(true);
        try {
            window.localStorage.setItem(storageKey, String(score));
        } catch {
            /* sin storage: solo se oculta en esta vista */
        }
    }

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0">
                    <p className="text-sm font-semibold">Your account security is {score}%</p>
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>
            </div>
            <div className="flex shrink-0 gap-2">
                <Button type="button" size="sm" variant="outline" onClick={dismiss}>Dismiss</Button>
                {onReview && (
                    <Button type="button" size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={onReview}>
                        Review security
                    </Button>
                )}
            </div>
        </div>
    );
}