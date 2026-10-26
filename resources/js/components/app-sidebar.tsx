import { Link, usePage } from '@inertiajs/react';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import { hrefToString } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as analyticsIndex } from '@/routes/admin/analytics';
import { index as postsIndex } from '@/routes/admin/posts';
import { index as pagesIndex } from '@/routes/admin/pages';
import { index as legalsIndex } from '@/routes/admin/legals';
import { index as languagesIndex } from '@/routes/admin/languages';
import { index as productsIndex } from '@/routes/admin/products';
import { index as ordersIndex } from '@/routes/admin/orders';
import { index as discountsIndex } from '@/routes/admin/discounts';
import { index as reviewsIndex } from '@/routes/admin/reviews';
import { index as categoriesIndex } from '@/routes/admin/categories';
import { index as brandsIndex } from '@/routes/admin/brands';
import { index as suppliersIndex } from '@/routes/admin/suppliers';
import { index as collectionsIndex } from '@/routes/admin/collections';
import { index as attributesIndex } from '@/routes/admin/attributes';
import { index as carriersIndex } from '@/routes/admin/carriers';
import { index as zonesIndex } from '@/routes/admin/zones';
import { index as taxZonesIndex } from '@/routes/admin/tax-zones';
import { index as paymentMethodsIndex } from '@/routes/admin/payment-methods';
import { index as countriesIndex } from '@/routes/admin/countries';
import { index as currenciesIndex } from '@/routes/admin/currencies';
import { index as pluginsIndex } from '@/routes/admin/plugins';
import { index as aiInsightsIndex } from '@/routes/admin/ai-insights';
import { index as cptIndex } from '@/routes/admin/cpt/entries';
import { index as acfIndex } from '@/routes/admin/acf';
import { index as settingsIndex } from '@/routes/admin/settings';
import { index as indexUsers } from '@/routes/admin/users';
import { index as indexRoles } from '@/routes/admin/roles';
import { index as indexPermissions } from '@/routes/admin/permissions';
import type { LinkHref, NavItem, Team } from '@/types';
import { ThemeSwitcher } from './theme-switcher';
import { IconSvgElement } from '@hugeicons/react';
import {
    AiCloudIcon, Analytics02Icon, ApiIcon, Award01Icon, BookOpen02Icon,
    Building03Icon, CreditCardIcon, Coins01Icon, DashboardSpeed02Icon,
    DatabaseIcon, DeliveryTruck01Icon, DiscountTag01Icon, File01Icon,
    File02Icon, Flag01Icon, FolderGitTwoIcon, FolderLibraryIcon,
    GridViewIcon, Globe02Icon, Invoice03Icon, LanguageSkillIcon,
    Layers01Icon, LegalDocument01Icon, MapsLocation01Icon, ProductLoadingIcon,
    PuzzleIcon, Settings02Icon, Settings05Icon, ShoppingBag01Icon,
    SlidersVerticalIcon, StarIcon, Store03Icon, TaxesIcon, UserLock01Icon,
    UserMultipleIcon, UserShield01Icon,
} from '@hugeicons/core-free-icons';
import NavGroupItem from './sidebar/nav-group-item';
import SettingsSidebar, { isSettingsPath } from '@/components/settings/settings-sidebar';
import { useEntitlements } from '@/hooks/use-entitlements';


interface NavGroup {
    title: string;
    icon: IconSvgElement;
    href?: LinkHref;
    onClick?: () => void;
    children?: NavItem[];
}

export function AppSidebar() {
    const page = usePage();

    const { currentTeam, standaloneModules = [] } = page.props as {
        currentTeam?: Team | null;
        standaloneModules?: Array<{
            id: number; title: string; slug: string; label: string; icon: string;
        }>;
    };

    const teamSlug = (currentTeam as Team)!.slug;
    const { auth } = page.props as any;
    const userRoles = auth?.user?.roles?.map((r: any) => (typeof r === 'string' ? r : r?.name)) || [];
    const userPermissions = auth?.user?.permissions || [];
    const isOwner = userRoles.includes('Owner');
    const hasPermission = (permission: string) => isOwner || userPermissions.includes(permission);
    const navPermissionMap: Record<string, string> = {
        Posts: 'view_any_post',
        Pages: 'view_any_page',
        'Field Groups': 'view_any_cpt',
        Legals: 'view_any_legal',
        Products: 'view_any_product',
        Orders: 'view_any_order',
        Discounts: 'view_any_discount',
        Reviews: 'view_any_review',
        Categories: 'view_any_category',
        Brands: 'view_any_brand',
        Suppliers: 'view_any_supplier',
        Collections: 'view_any_collection',
        Attributes: 'view_any_attribute',
        Carriers: 'view_any_carrier',
        Zones: 'view_any_zone',
        'Tax Zones': 'view_any_tax_zone',
        'Payment Methods': 'view_any_payment_method',
        Countries: 'view_any_country',
        Currencies: 'view_any_currency',
        Plugins: 'view_any_plugin',
        'AI Insights': 'view_any_ai_insight',
        Analytics: 'view_any_analytics',
        Settings: 'view_any_setting',
        Users: 'view_any_user',
        Roles: 'view_any_role',
        Permissions: 'view_any_permission',
    };

    const canSeeNavItem = (title: string): boolean => {
        if (title === 'Dashboard' || title === 'Preferences') return true;

        const requiredModule = navModuleMap[title];
        if (requiredModule && !hasModule(requiredModule)) return false;

        if (userRoles.length === 0) return import.meta.env.DEV;

        const permission = navPermissionMap[title];
        if (!permission) return true;
        return hasPermission(permission);
    };

    const currentPath = new URL(
        page.url,
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    ).pathname;
    const dashboardUrl = currentTeam
        ? dashboard(currentTeam.slug)
        : '/';

    const { hasModule } = useEntitlements();

    const navModuleMap: Record<string, string> = {
        // CMS
        Content: 'cms', Posts: 'cms', Pages: 'cms', 'Field Groups': 'cms', Legals: 'cms',
        Languages: 'multilanguage',
        // Ecommerce
        Commerce: 'ecommerce', Catalog: 'ecommerce', 'Store Setup': 'ecommerce',
        Products: 'ecommerce', Orders: 'ecommerce', Discounts: 'ecommerce', Reviews: 'ecommerce',
        Categories: 'ecommerce', Brands: 'ecommerce', Suppliers: 'ecommerce',
        Collections: 'ecommerce', Attributes: 'ecommerce', Carriers: 'ecommerce',
        Zones: 'ecommerce', 'Tax Zones': 'ecommerce', 'Payment Methods': 'ecommerce',
        Countries: 'ecommerce', Currencies: 'ecommerce',
        // Otros
        'AI Insights': 'ai_insights', Analytics: 'analytics',
    };

    if (isSettingsPath(currentPath, teamSlug)) {
        return <SettingsSidebar teamSlug={teamSlug} dashboardUrl={dashboardUrl} />;
    }

    const isActive = (href: LinkHref) => {
        const url = hrefToString(href);
        if (!url) return false;
        return currentPath === url || currentPath.startsWith(url + '/');
    };

    const isGroupActive = (group: NavGroup) => {
        if (group.href && isActive(group.href)) return true;
        return group.children?.some(child =>
            'href' in child && child.href ? isActive(child.href) : false
        ) ?? false;
    };

    const iconMap = {
        Layers: Layers01Icon, Globe: Globe02Icon, Database: DatabaseIcon,
        FileText: File01Icon, ShoppingBag: ShoppingBag01Icon,
    };

    const dynamicModules: NavGroup[] = hasModule('cms')
        ? standaloneModules.map((module) => ({
            title: module.label,
            icon: iconMap[module.icon as keyof typeof iconMap] ?? Layers01Icon,
            href: cptIndex([teamSlug, module.slug]),
        }))
        : [];

    const navGroups: NavGroup[] = [
        { title: 'Dashboard', icon: DashboardSpeed02Icon, href: dashboardUrl },
        {
            title: 'Content',
            icon: File02Icon,
            children: [
                { title: 'Posts', href: postsIndex(teamSlug), icon: BookOpen02Icon },
                { title: 'Pages', href: pagesIndex(teamSlug), icon: File01Icon },
                { title: 'Field Groups', href: acfIndex(teamSlug), icon: Layers01Icon },
                { title: 'Legals', href: legalsIndex(teamSlug), icon: LegalDocument01Icon },
                { title: 'Languages', href: languagesIndex(teamSlug), icon: LanguageSkillIcon },
            ],
        },
        ...dynamicModules,
        {
            title: 'Commerce',
            icon: Store03Icon,
            children: [
                { title: 'Products', href: productsIndex(teamSlug), icon: ProductLoadingIcon },
                { title: 'Orders', href: ordersIndex(teamSlug), icon: Invoice03Icon },
                { title: 'Discounts', href: discountsIndex(teamSlug), icon: DiscountTag01Icon },
                { title: 'Reviews', href: reviewsIndex(teamSlug), icon: StarIcon },
            ],
        },
        {
            title: 'Catalog',
            icon: GridViewIcon,
            children: [
                { title: 'Categories', href: categoriesIndex(teamSlug), icon: GridViewIcon },
                { title: 'Brands', href: brandsIndex(teamSlug), icon: Award01Icon },
                { title: 'Suppliers', href: suppliersIndex(teamSlug), icon: Building03Icon },
                { title: 'Collections', href: collectionsIndex(teamSlug), icon: FolderLibraryIcon },
                { title: 'Attributes', href: attributesIndex(teamSlug), icon: SlidersVerticalIcon },
            ],
        },
        {
            title: 'Store Setup',
            icon: DeliveryTruck01Icon,
            children: [
                { title: 'Carriers', href: carriersIndex(teamSlug), icon: DeliveryTruck01Icon },
                { title: 'Zones', href: zonesIndex(teamSlug), icon: MapsLocation01Icon },
                { title: 'Tax Zones', href: taxZonesIndex(teamSlug), icon: TaxesIcon },
                { title: 'Payment Methods', href: paymentMethodsIndex(teamSlug), icon: CreditCardIcon },
                { title: 'Countries', href: countriesIndex(teamSlug), icon: Flag01Icon },
                { title: 'Currencies', href: currenciesIndex(teamSlug), icon: Coins01Icon },
            ],
        },
        {
            title: 'Extensions',
            icon: PuzzleIcon,
            children: [
                { title: 'Plugins', href: pluginsIndex(teamSlug), icon: PuzzleIcon },
            ],
        },
        { title: 'AI Insights', icon: AiCloudIcon, href: aiInsightsIndex(teamSlug) },
        { title: 'Analytics', icon: Analytics02Icon, href: analyticsIndex(teamSlug) },
        {
            title: 'Settings',
            icon: Settings02Icon,
            href: settingsIndex(teamSlug),
        },
        {
            title: 'Users',
            icon: UserMultipleIcon,
            href: indexUsers(teamSlug),
        },
        {
            title: 'Roles',
            icon: UserShield01Icon,
            href: indexRoles(teamSlug),
        },
        {
            title: 'Permissions',
            icon: UserLock01Icon,
            href: indexPermissions(teamSlug),
        },
    ];

    const filteredNavGroups: NavGroup[] = navGroups
        .filter((group) => canSeeNavItem(group.title))
        .map((group) => {
            if (!group.children) return group;
            const filteredChildren = group.children.filter((child) =>
                'title' in child ? canSeeNavItem(child.title) : true
            );
            return { ...group, children: filteredChildren };
        })
        .filter((group) => {
            // Si un grupo padre solo existía para agrupar children y quedó vacío, lo ocultamos
            if (group.children) return group.children.length > 0;
            return true;
        });

    const userLang = typeof window !== 'undefined' && navigator.language.startsWith('es') ? 'es' : 'en';

    const footerNavItems: NavItem[] = [
        { title: 'Repository', href: 'https://github.com/laravel/react-starter-kit', icon: FolderGitTwoIcon },
        { title: 'REST Docs', href: `https://stuvvion.com/${userLang}/docs/rest`, icon: ApiIcon },
        { title: 'GraphQL Docs', href: `https://stuvvion.com/${userLang}/docs/graphql`, icon: DatabaseIcon },
    ];

    return (
        <>
            <Sidebar collapsible="icon" variant="sidebar">
                <SidebarHeader className='border-b border-sidebar-border/50 mb-2'>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <TeamSwitcher inHeader className="max-w-auto" />
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <div className="px-2 py-0">
                        <ul className="flex w-full min-w-0 flex-col gap-0.5">
                            {filteredNavGroups.map((group) => (
                                <NavGroupItem
                                    key={group.title}
                                    group={group as any}
                                    isActive={isActive}
                                    isGroupActive={isGroupActive(group)}
                                />
                            ))}
                        </ul>
                        <ThemeSwitcher />
                    </div>
                </SidebarContent>

                <SidebarFooter className='border-t border-sidebar-border/50 mt-2'>
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        </>
    );
}