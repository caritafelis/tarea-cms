import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AdminView } from '@/components/dashboard/admin-view';
import type { PlatformProps } from '@/components/dashboard/admin-view';
import { TenantView } from '@/components/dashboard/tenant-view';
import type { TenantProps } from '@/components/dashboard/tenant-view';
import { Ambient, Segmented } from '@/components/glass';
import { HeaderActions } from '@/components/page-header-slot';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

const PERIODS = ['1h', '24h', '7d', '14d', '30d'] as const;
type Period = (typeof PERIODS)[number];

/**
 * El backend decide la vista con `scope`:
 *  - 'tenant'   → usuarios de un equipo
 *  - 'platform' → super admin (nunca debe recibir datos de un solo equipo)
 */
type Props = TenantProps | PlatformProps;

export default function Dashboard(props: Props) {
    const [busy, setBusy] = useState(false);
    const isPlatform = props.scope === 'platform';

    const go = (p: Period) =>
        router.get(
            window.location.pathname,
            { period: p },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
            },
        );

    return (
        <>
            <Head title={isPlatform ? 'Platform dashboard' : 'Dashboard'} />
            {/* -mt/pt = alto del header fijo: el fondo ambiental arranca detrás de él, sin corte */}
            <div className="relative isolate -mt-[76px] min-h-full pt-[76px]">
                <Ambient tone={isPlatform ? 'platform' : 'tenant'} />

                <div className="mx-auto max-w-[1400px] space-y-6 p-6 pt-10 lg:p-8 lg:pt-12">
                    <HeaderActions>
                        <Segmented label="Time period" value={props.period as Period} options={PERIODS} onChange={go} />
                    </HeaderActions>

                    <div aria-busy={busy} className={cn('transition-opacity duration-300', busy && 'opacity-60')}>
                        {props.scope === 'platform' ? <AdminView {...props} /> : <TenantView {...props} />}
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * El título, el rastro y el periodo viven en el header fijo del layout.
 * `headerTitle` convierte el último breadcrumb en el título de la página.
 */
Dashboard.layout = (props: { currentTeam?: { slug: string } | null; scope?: string }) => {
    const home = props.currentTeam ? dashboard(props.currentTeam.slug) : '/';

    return {
        headerTitle: true,
        breadcrumbs:
            props.scope === 'platform'
                ? [
                    { title: 'Platform', href: home },
                    { title: 'Dashboard', href: home },
                ]
                : [{ title: 'Dashboard', href: home }],
    };
};