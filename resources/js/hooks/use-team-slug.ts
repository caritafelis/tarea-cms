import { usePage } from '@inertiajs/react';

export function useTeamSlug(): string {
    return ((usePage().props as any).currentTeam?.slug as string | undefined) ?? 'default';
}