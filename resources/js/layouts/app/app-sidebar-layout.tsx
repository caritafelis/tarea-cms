import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { PageHeaderSlotProvider } from '@/components/page-header-slot';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    headerTitle = false,
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            {/* overflow-x-clip (no hidden): hidden crea un scroll container y rompe el header sticky */}
            <AppContent variant="sidebar" className="overflow-x-clip no-scrollbar">
                <PageHeaderSlotProvider>
                    <AppSidebarHeader breadcrumbs={breadcrumbs} title={headerTitle} />
                    {children}
                </PageHeaderSlotProvider>
            </AppContent>
        </AppShell>
    );
}