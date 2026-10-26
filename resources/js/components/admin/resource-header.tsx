import { Plus, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: ReactNode;
    onCreate?: () => void;
    createLabel?: string;
};

export function ResourceHeader({ title, description, icon: Icon, actions, onCreate, createLabel = 'New' }: Props) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
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
            <div className="flex items-center gap-2">
                {actions}
                {onCreate && (
                    <Button onClick={onCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        {createLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}