import type { PropsWithChildren } from 'react';
import { SettingsShell } from '@/components/settings/settings-ui';
import { useSettingsTab } from '@/hooks/use-settings-tab';
import { settingsTabs, type SettingsTabKey } from '@/layouts/settings/nav';

// Compatibilidad: otros archivos (ej. billing-tab) importan el tipo desde aquí.
export type { SettingsTabKey } from '@/layouts/settings/nav';

/** Tabs con tablas/listas anchas: usan más ancho de contenido. */
const WIDE: SettingsTabKey[] = ['api', 'webhooks', 'billing', 'plan', 'plugins', 'integrations', 'backups'];

interface SettingsLayoutProps extends PropsWithChildren {
    /** Opcionales: la navegación ahora vive en el sidebar y la pestaña activa en la URL (?tab=). */
    active?: SettingsTabKey;
    onChange?: (key: SettingsTabKey) => void;
}

/**
 * Ya no dibuja pills horizontales. El sidebar principal cambia a "modo settings"
 * (como Nightwatch) y este layout solo pone el título y el contenedor centrado.
 */
export default function SettingsLayout({ children, active }: SettingsLayoutProps) {
    const [current] = useSettingsTab();
    const key = active ?? current;
    const meta = settingsTabs.find((t) => t.key === key);

    return (
        <SettingsShell title={meta?.label ?? 'Settings'} description={meta?.description} wide={WIDE.includes(key)}>
            {children}
        </SettingsShell>
    );
}
