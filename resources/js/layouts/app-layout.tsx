import { ChatAdapter, ContactWidgetProvider } from '@/components/widget/contact-widget';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    headerTitle = false,
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    headerTitle?: boolean;
    children: React.ReactNode;
}) {
    const chat: ChatAdapter = {
        async send(text, history) {
            // aquí llamas a tu módulo de soporte (crear ticket, responder, etc.)
            return 'Respuesta del soporte';
        },
    };
    return (
        <ContactWidgetProvider>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} headerTitle={headerTitle}>
                {children}
            </AppLayoutTemplate>
        </ContactWidgetProvider>
    );
}