import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Lock, User } from 'lucide-react';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useSettingsTab } from '@/hooks/use-settings-tab';
import { settingsTabs, type SettingsTabKey } from '@/layouts/settings/nav';
import { cn, hrefToString } from '@/lib/utils';
import { edit as profileEdit } from '@/routes/settings/profile';
import { edit as securityEdit } from '@/routes/settings/security';
import { index as settingsIndex } from '@/routes/admin/settings';
import type { LinkHref, PageProps } from '@/types';

/** ¿La URL actual pertenece a Settings del team? */
export function isSettingsPath(path: string, teamSlug: string): boolean {
    const base = `/${teamSlug}/settings`;
    return path === base || path.startsWith(`${base}/`);
}

const trim = (p: string) => (p.length > 1 ? p.replace(/\/$/, '') : p);
function initials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

/**
 * Sidebar en "modo settings" (como Nightwatch): reemplaza al menú principal
 * mientras estás en Settings. Cuenta -> Profile/Security; Workspace -> pestañas.
 */
export default function SettingsSidebar({ teamSlug, dashboardUrl }: { teamSlug: string; dashboardUrl: LinkHref }) {
    const page = usePage();
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const [tab, setTab] = useSettingsTab();

    const currentPath = trim(new URL(page.url, window.location.origin).pathname);
    const indexUrl = hrefToString(settingsIndex(teamSlug)) ?? `/${teamSlug}/settings`;
    const onIndex = currentPath === trim(indexUrl);

    const isPage = (href: LinkHref) => currentPath === trim(hrefToString(href) ?? '');

    function goToTab(key: SettingsTabKey) {
        if (onIndex) setTab(key);
        else router.visit(`${indexUrl}?tab=${key}`);
    }

    const accountItems = [
        { title: 'Profile', href: profileEdit(teamSlug) as LinkHref, icon: User },
        { title: 'Security', href: securityEdit(teamSlug) as LinkHref, icon: Lock },
    ];

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Back">
                            <Link href={dashboardUrl}>
                                <ArrowLeft />
                                <span>Back</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className='space-y'>
                    <SidebarGroupLabel className="flex items-center gap-2 px-2">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="" className="size-8 rounded-md not-only:border border-border object-cover" />
                        ) : (
                            <span
                                aria-hidden
                                className="flex items-center justify-center size-6 rounded-md border border-border bg-muted text-md font-semibold text-muted-foreground"
                            >
                                {initials(user.name)}
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm text-foreground">{user?.name ?? 'Account'}</p>
                        </div>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {accountItems.map((item) => {
                                const active = isPage(item.href);

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={item.title}
                                            className="group/account-nav"
                                        >
                                            <Link href={item.href} prefetch>
                                                <item.icon
                                                    className={cn(
                                                        'shrink-0 transition-colors',
                                                        'group-hover/account-nav:text-primary',
                                                        active && 'text-primary',
                                                    )}
                                                />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem >
                            <TeamSwitcher />
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <SidebarGroupContent className="mt-1">
                        <SidebarMenu>
                            {settingsTabs.map((item) => {
                                const active = onIndex && tab === item.key;

                                return (
                                    <SidebarMenuItem key={item.key}>
                                        <SidebarMenuButton
                                            isActive={active}
                                            tooltip={item.label}
                                            onClick={() => goToTab(item.key)}
                                            className="group/settings-nav"
                                        >
                                            <item.icon
                                                className={cn(
                                                    'shrink-0 transition-colors',
                                                    'group-hover/settings-nav:text-primary',
                                                    active && 'text-primary',
                                                )}
                                            />
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
