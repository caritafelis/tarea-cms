import { Link } from '@inertiajs/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import type { IsActiveFn, NavItem } from '@/types';

interface ChildLinkProps {
    child: NavItem;
    isActive: IsActiveFn;
}

export default function ChildLink({
    child,
    isActive,
}: ChildLinkProps) {
    if (!('href' in child)) return null;

    const linkChild = child as Extract<NavItem, { href: any }>;
    const href = linkChild.href;
    const active = isActive(href);

    return (
        <li>
            <Link
                href={href}
                prefetch
                className={cn(
                    'group/nav-link flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    active
                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/80',
                )}
            >
                {linkChild.icon && (
                    <HugeiconsIcon
                        icon={linkChild.icon}
                        size={14}
                        className={cn(
                            'shrink-0 transition-colors group-hover/nav-link:text-primary',
                            active && 'text-primary',
                        )}
                    />
                )}

                <span className="truncate">{linkChild.title}</span>
            </Link>
        </li>
    );
}