import { router, usePage } from '@inertiajs/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Add01Icon,
    CheckIcon,
    Search01Icon,
    UnfoldMoreIcon,
} from '@hugeicons/core-free-icons';
import { useMemo, useState } from 'react';
import CreateTeamModal from '@/components/create-team-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { switchMethod } from '@/routes/teams';
import type { Team } from '@/types';

type TeamSwitcherProps = {
    inHeader?: boolean;
    className?: string;
};

/** Logo del team; si no tiene, muestra las iniciales. */
export function TeamAvatar({
    team,
    className,
}: {
    team: Pick<Team, 'name'> & { logoUrl?: string | null };
    className?: string;
}) {
    const getInitials = useInitials();

    return (
        <Avatar className={cn('size-8 rounded-md', className)}>
            {team.logoUrl ? (
                <AvatarImage
                    src={team.logoUrl}
                    alt={team.name}
                    className="rounded-md object-cover"
                />
            ) : null}
            <AvatarFallback className="rounded-md bg-sidebar-primary text-md font-semibold text-sidebar-primary-foreground">
                {getInitials(team.name)}
            </AvatarFallback>
        </Avatar>
    );
}

export function TeamSwitcher({ inHeader = false }: TeamSwitcherProps) {
    const page = usePage();
    const isMobile = useIsMobile();
    const currentTeam = page.props.currentTeam as
        | (Team & { logoUrl?: string | null; environment?: string | null })
        | null;
    const teams = (page.props.teams ?? []) as Array<
        Team & { logoUrl?: string | null; environment?: string | null }
    >;

    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return q
            ? teams.filter((t) => t.name.toLowerCase().includes(q))
            : teams;
    }, [teams, query]);

    const switchTeam = (team: Team) => {
        const previousTeamSlug = currentTeam?.slug;

        router.visit(switchMethod(team.slug), {
            onFinish: () => {
                if (!previousTeamSlug || typeof window === 'undefined') {
                    router.reload();

                    return;
                }

                const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
                const segment = `/${previousTeamSlug}`;

                if (currentUrl.includes(segment)) {
                    router.visit(currentUrl.replace(segment, `/${team.slug}`), {
                        replace: true,
                    });

                    return;
                }

                router.reload();
            },
        });
    };

    return (
        <DropdownMenu onOpenChange={(open) => !open && setQuery('')}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    data-test="team-switcher-trigger"
                    className={cn(
                        'group w-full justify-start gap-2 px-2',
                        inHeader
                            ? 'h-10 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0'
                            : 'h-10 bg-transparent hover:bg-transparent! data-[state=open]:bg-transparent! group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0',

                    )}
                >
                    {currentTeam ? (
                        <TeamAvatar
                            team={currentTeam}
                            className={inHeader ? 'size-7' : 'size-6 shrink-0'}
                        />
                    ) : null}

                    <div
                        className={cn(
                            'grid min-w-0 text-left leading-tight',
                            inHeader
                                ? 'flex-1'
                                : 'w-fit max-w-full group-data-[collapsible=icon]:hidden',
                        )}
                    >
                        <span
                            className={cn(
                                'truncate text-sm',
                                inHeader
                                    ? 'max-w-[120px]'
                                    : 'max-w-full font-medium',
                            )}
                        >
                            {currentTeam?.name ?? 'Select team'}
                        </span>

                        {currentTeam?.environment ? (
                            <span className="truncate text-xs capitalize text-muted-foreground">
                                {currentTeam.environment}
                            </span>
                        ) : null}
                    </div>

                    <HugeiconsIcon
                        icon={UnfoldMoreIcon}
                        className={cn(
                            'size-4 shrink-0 text-muted-foreground',
                            !inHeader && 'group-data-[collapsible=icon]:hidden',
                            inHeader && 'ml-auto',
                        )}
                    />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className={
                    inHeader
                        ? 'w-64'
                        : 'w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg'
                }
                side={inHeader ? undefined : isMobile ? 'bottom' : 'right'}
                align={inHeader ? 'end' : 'start'}
                sideOffset={inHeader ? undefined : 4}
            >
                <div className="flex items-center gap-2 border-b px-2 pb-2">
                    <HugeiconsIcon
                        icon={Search01Icon}
                        className="size-4 shrink-0 text-muted-foreground"
                    />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        // Evita que Radix robe el foco con su typeahead
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Find team"
                        aria-label="Find team"
                        autoFocus
                        className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>

                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Teams
                </DropdownMenuLabel>

                <div className="max-h-64 overflow-y-auto">
                    {filtered.map((team) => (
                        <DropdownMenuItem
                            key={team.id}
                            data-test="team-switcher-item"
                            className="cursor-pointer gap-2 px-2 py-1.5"
                            onSelect={() => switchTeam(team)}
                        >
                            <TeamAvatar team={team} className="size-6" />
                            <div className="grid min-w-0 flex-1 leading-tight">
                                <span className="truncate text-sm">
                                    {team.name}
                                </span>
                                {team.environment ? (
                                    <span className="truncate text-xs capitalize text-muted-foreground">
                                        {team.environment}
                                    </span>
                                ) : null}
                            </div>
                            {currentTeam?.id === team.id && (
                                <HugeiconsIcon
                                    icon={CheckIcon}
                                    className="ml-auto size-4 shrink-0"
                                />
                            )}
                        </DropdownMenuItem>
                    ))}

                    {filtered.length === 0 ? (
                        <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                            No teams found.
                        </p>
                    ) : null}
                </div>

                <DropdownMenuSeparator />

                <CreateTeamModal>
                    <DropdownMenuItem
                        data-test="team-switcher-new-team"
                        className="cursor-pointer gap-2 px-2 py-1.5"
                        onSelect={(event) => event.preventDefault()}
                    >
                        <HugeiconsIcon icon={Add01Icon} className="size-4" />
                        <span className="text-muted-foreground">New team</span>
                    </DropdownMenuItem>
                </CreateTeamModal>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}