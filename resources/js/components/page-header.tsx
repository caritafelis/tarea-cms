import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: { label: string; href: string };
};

export default function PageHeader({ title, description, icon: Icon, action }: Props) {
    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white shadow-sm dark:bg-background">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    {description && <p className="text-sm text-neutral-500">{description}</p>}
                </div>
            </div>
            {action && (
                <Link
                    href={action.href}
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                >
                    {action.label}
                </Link>
            )}
        </div>
    );
}