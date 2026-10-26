import { usePage } from '@inertiajs/react';

export function useCan() {
    const { auth } = usePage().props as any;
    const roles: string[] = auth?.user?.roles?.map((r: any) => (typeof r === 'string' ? r : r?.name)) ?? [];
    const permissions: string[] = auth?.user?.permissions ?? [];
    const isOwner = roles.includes('Owner');

    return (permission: string) => roles.length === 0 || isOwner || permissions.includes(permission);
}