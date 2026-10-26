import { Link } from '@inertiajs/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, hrefToString } from '@/lib/utils';
import type { IsActiveFn } from '@/types';
import type { NavGroup } from './nav-group-item';

interface DropdownGroupProps {
    group: NavGroup;
    isActive: IsActiveFn;
    isGroupActive: boolean;
}

export default function DropdownGroup({
    group,
    isActive,
    isGroupActive,
}: DropdownGroupProps) {
    return (
        <li>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            'group/nav-trigger flex size-8 items-center justify-center rounded-md transition-colors',
                            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            isGroupActive &&
                            'bg-sidebar-accent text-sidebar-accent-foreground',
                        )}
                    >
                        <HugeiconsIcon
                            icon={group.icon}
                            size={16}
                            className={cn(
                                'shrink-0 transition-colors group-hover/nav-trigger:text-primary',
                                isGroupActive && 'text-primary',
                            )}
                        />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    side="right"
                    align="start"
                    className="min-w-56"
                >
                    {group.children?.map((child) => {
                        if ('onClick' in child && child.onClick) {
                            return (
                                <DropdownMenuItem
                                    key={child.title}
                                    onSelect={child.onClick}
                                    className="group/nav-option"
                                >
                                    {child.icon && (
                                        <HugeiconsIcon
                                            icon={child.icon}
                                            size={14}
                                            className="shrink-0 transition-colors group-hover/nav-option:text-primary"
                                        />
                                    )}

                                    {child.title}
                                </DropdownMenuItem>
                            );
                        }

                        const href = child.href!;

                        return (
                            <DropdownMenuItem
                                key={hrefToString(href)}
                                asChild
                            >
                                <Link
                                    href={href}
                                    prefetch
                                    className="group/nav-option flex items-center gap-2"
                                >
                                    {child.icon && (
                                        <HugeiconsIcon
                                            icon={child.icon}
                                            size={14}
                                            className={cn(
                                                'shrink-0 transition-colors group-hover/nav-option:text-primary',
                                                isActive(href) && 'text-primary',
                                            )}
                                        />
                                    )}

                                    {child.title}
                                </Link>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </li>
    );
}