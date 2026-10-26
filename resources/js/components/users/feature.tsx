import { useEntitlements } from "@/hooks/use-entitlements";

export function Feature({ module, children, fallback = null }: {
    module: string; children: React.ReactNode; fallback?: React.ReactNode;
}) {
    const { hasModule } = useEntitlements();
    return hasModule(module) ? <>{children} </>
        : <>{fallback}</>;
}