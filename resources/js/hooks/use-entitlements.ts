import { usePage } from '@inertiajs/react';

const matches = (pattern: string, name: string) =>
    new RegExp('^' + pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(name);

export function useEntitlements() {
    const { entitlements } = usePage().props as any;
    const modules: string[] = entitlements?.modules ?? [];
    const fields: Record<string, string> = entitlements?.fields ?? {};

    const requiredModule = (name: string): string | undefined =>
        Object.entries(fields).find(([pattern]) => matches(pattern, name))?.[1];

    return {
        hasModule: (m: string) => modules.includes(m),
        canUseField: (name: string) => {
            const m = requiredModule(name);
            return !m || modules.includes(m);
        },
        requiredModule,
        limit: (k: string) => entitlements?.limits?.[k] as number | null | undefined,
    };
}