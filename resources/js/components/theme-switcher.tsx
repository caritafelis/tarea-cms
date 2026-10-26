import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';
import { useIsMobile } from '@/hooks/use-mobile';

import { HugeiconsIcon } from '@hugeicons/react';
import {
    Sun03Icon,
    Moon02Icon,
    LaptopPhoneSyncIcon,
    Tick02Icon,
    ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

import { cn } from '@/lib/utils';
import { useState } from 'react';

const themes = [
    {
        value: 'light' as Appearance,
        label: 'Light',
        icon: Sun03Icon,
    },
    {
        value: 'dark' as Appearance,
        label: 'Dark',
        icon: Moon02Icon,
    },
    {
        value: 'system' as Appearance,
        label: 'System',
        icon: LaptopPhoneSyncIcon,
    },
];

export function ThemeSwitcher() {
    const { appearance, updateAppearance } = useAppearance();
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    const currentTheme =
        themes.find((theme) => theme.value === appearance) ?? themes[0];

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="
                        w-full justify-start px-2
                        has-[>svg]:px-2
                        data-[state=open]:bg-sidebar-accent
                        data-[state=open]:text-sidebar-accent-foreground
                        focus-visible:ring-0
                        focus-visible:border-transparent
                        focus-visible:outline-none
                        h-9
                    "
                >
                    {/* Icon when collapsed */}
                    <HugeiconsIcon
                        icon={currentTheme.icon}
                        size={18}
                        className="hidden size-4 shrink-0 group-data-[collapsible=icon]:block hover:text-primary data-[active=true]:text-primary dark:hover:text-primary dark:data-[active=true]:text-primary"
                    />

                    {/* Label when expanded */}
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <div className="flex items-center gap-2 truncate font-normal">
                            <HugeiconsIcon
                                icon={currentTheme.icon}
                                size={14}
                                className="size-4 shrink-0 hover:text-primary data-[active=true]:text-primary dark:hover:text-primary dark:data-[active=true]:text-primary"
                            />

                            <span className="truncate">
                                {currentTheme.label}
                            </span>
                        </div>
                    </div>

                    <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        className={cn(
                            'ml-auto size-3.5 transition-transform group-data-[collapsible=icon]:hidden',
                            open && 'rotate-90'
                        )}
                    />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="start"
                sideOffset={4}
            >
                <DropdownMenuLabel className="text-sm leading-tight font-medium">
                    Appearance
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {themes.map((theme) => {
                    const isActive = appearance === theme.value;

                    return (
                        <DropdownMenuItem
                            key={theme.value}
                            className="cursor-pointer gap-2 p-2"
                            onSelect={() =>
                                updateAppearance(theme.value)
                            }
                        >
                            <HugeiconsIcon
                                icon={theme.icon}
                                size={16}
                                className="hover:text-primary data-[active=true]:text-primary dark:hover:text-primary dark:data-[active=true]:text-primary"
                            />

                            {theme.label}

                            {isActive && (
                                <HugeiconsIcon
                                    icon={Tick02Icon}
                                    size={14}
                                    className="ml-auto hover:text-primary data-[active=true]:text-primary dark:hover:text-primary dark:data-[active=true]:text-primary"
                                />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}