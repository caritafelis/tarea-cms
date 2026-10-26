import { usePage } from '@inertiajs/react';

export function useBillingBase(): string {
    const { currentTeam } = usePage().props as { currentTeam?: { slug: string } };
    return `/${currentTeam!.slug}/settings/billing`;
}