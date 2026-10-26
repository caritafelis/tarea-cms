import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export function usePermissions() {
    const { auth } = usePage<PageProps>().props;
    const permissions = auth.user?.permissions || [];

    const hasPermission = (permission: string) => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (requiredPermissions: string[]) => {
        return requiredPermissions.some(p => permissions.includes(p));
    };

    return { hasPermission, hasAnyPermission };
}
