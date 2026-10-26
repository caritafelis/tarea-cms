import { Link } from '@inertiajs/react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { usePageHeaderSlot } from '@/components/page-header-slot';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

/**
 * Header fijo del contenido (comportamiento Nightwatch):
 *  - Siempre pegado arriba (`sticky`).
 *  - Sin scroll: transparente. Con scroll: fondo translúcido + backdrop blur + borde.
 *  - `title`: el último breadcrumb se muestra como título de página y los
 *    anteriores como rastro pequeño. Sin `title` se conserva el breadcrumb clásico.
 *  - A la derecha queda un hueco para las acciones de la página (<HeaderActions>).
 */
export function AppSidebarHeader({
    breadcrumbs = [],
    title = false,
}: {
    breadcrumbs?: BreadcrumbItemType[];
    title?: boolean;
}) {
    const { setActionsEl } = usePageHeaderSlot();
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [stuck, setStuck] = useState(false);

    // El sentinel vive en el borde superior del contenido: al salir de vista, hay scroll.
    useEffect(() => {
        const el = sentinelRef.current;

        if (!el) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => setStuck(!entry.isIntersecting),
            { threshold: 0 },
        );
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    const current = breadcrumbs[breadcrumbs.length - 1];
    const trail = breadcrumbs.slice(0, -1);
    const showTitle = title && current;

    return (
        <>
            <div
                ref={sentinelRef}
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
            />
            <header
                data-stuck={stuck}
                className={cn(
                    'sticky top-0 z-30 shrink-0 border-b transition-[background-color,border-color,backdrop-filter] duration-300 motion-reduce:transition-none',
                    showTitle ? 'h-14' : 'h-14 group-has-data-[collapsible=icon]/sidebar-wrapper:h-14',
                    stuck
                        ? 'border-border/50 bg-transparent backdrop-blur-xl backdrop-saturate-150'
                        : 'border-transparent bg-transparent',
                )}
            >
                <div
                    className={cn(
                        'mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-6 transition-transform duration-300 ease-out motion-reduce:transition-none lg:px-8',
                        // Sin scroll el título baja un poco (como en Nightwatch) y sube al fijarse.
                        showTitle && !stuck && 'translate-y-6',
                    )}
                >
                    {showTitle ? (
                        <div className="min-w-0">
                            {trail.length > 0 && (
                                <Breadcrumb>
                                    <BreadcrumbList className="gap-1.5 text-[13px] sm:gap-1.5">
                                        {trail.map((item, index) => (
                                            <Fragment key={`${item.title}-${index}`}>
                                                <BreadcrumbItem>
                                                    <BreadcrumbLink asChild>
                                                        <Link
                                                            href={item.href}
                                                            className="rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                                                        >
                                                            {item.title}
                                                        </Link>
                                                    </BreadcrumbLink>
                                                </BreadcrumbItem>
                                                {index < trail.length - 1 && <BreadcrumbSeparator />}
                                            </Fragment>
                                        ))}
                                    </BreadcrumbList>
                                </Breadcrumb>
                            )}
                            <h1 className="truncate text-[26px] font-semibold leading-tight tracking-tight">
                                {current.title}
                            </h1>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>
                    )}

                    <div ref={setActionsEl} className="flex shrink-0 items-center gap-3" />
                </div>
            </header>
        </>
    );
}