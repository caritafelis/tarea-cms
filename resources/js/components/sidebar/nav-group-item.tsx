import { Link } from '@inertiajs/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { IsActiveFn, LinkHref, NavItem } from '@/types';
import CollapsibleGroup from './collapsible-group';
import DropdownGroup from './dropdown-group';

export interface NavGroup {
    title: string;
    icon: import('@hugeicons/react').IconSvgElement;
    href?: LinkHref;
    onClick?: () => void;
    children?: NavItem[];
}

interface NavGroupItemProps {
    group: NavGroup;
    isActive: IsActiveFn;
    isGroupActive: boolean;
}

export default function NavGroupItem({
    group,
    isActive,
    isGroupActive,
}: NavGroupItemProps) {
    const { state } = useSidebar();
    const hasChildren = Boolean(group.children?.length);

    if (!hasChildren) {
        const baseClass = cn(
            'group/nav-item flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-colors',
            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2',
        );

        if (group.onClick && !group.href) {
            return (
                <li className="relative">
                    <button
                        type="button"
                        onClick={group.onClick}
                        className={baseClass}
                    >
                        <HugeiconsIcon
                            icon={group.icon}
                            size={16}
                            className="shrink-0 transition-colors group-hover/nav-item:text-primary"
                        />

                        <span className="truncate group-data-[collapsible=icon]:hidden">
                            {group.title}
                        </span>
                    </button>
                </li>
            );
        }

        if (group.href) {
            const active = isActive(group.href);

            return (
                <li className="relative">
                    <Link
                        href={group.href}
                        prefetch
                        className={cn(
                            baseClass,
                            active &&
                            'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                        )}
                    >
                        <HugeiconsIcon
                            icon={group.icon}
                            size={16}
                            className={cn(
                                'shrink-0 transition-colors group-hover/nav-item:text-primary',
                                active && 'text-primary',
                            )}
                        />

                        <span className="truncate group-data-[collapsible=icon]:hidden">
                            {group.title}
                        </span>
                    </Link>
                </li>
            );
        }
    }

    if (state === 'collapsed') {
        return (
            <DropdownGroup
                group={group}
                isActive={isActive}
                isGroupActive={isGroupActive}
            />
        );
    }

    return (
        <CollapsibleGroup
            group={group}
            isActive={isActive}
            isGroupActive={isGroupActive}
        />
    );
}