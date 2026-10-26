import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SecuritySection({
    id,
    title,
    description,
    children,
    className,
}: {
    id?: string;
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section id={id} className={cn('scroll-mt-24', className)}>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            <div className="mt-4">{children}</div>
        </section>
    );
}

/** Fila de dos columnas con separador punteado, como en la referencia. */
export function SecurityRow({
    id,
    title,
    description,
    children,
}: {
    id?: string;
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <div
            id={id}
            className="grid scroll-mt-24 gap-4 border-t border-dotted border-border py-5 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-x-16"
        >
            <div>
                <p className="text-sm font-semibold">{title}</p>
                {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}