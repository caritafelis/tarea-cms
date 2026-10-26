import { usePage } from '@inertiajs/react';

/** Base de las rutas de seguridad, ya dentro del current team. */
export function useSecurityBase(): string {
    const { currentTeam } = usePage().props as { currentTeam?: { slug: string } };
    return `/${currentTeam!.slug}/settings/security`;
}
