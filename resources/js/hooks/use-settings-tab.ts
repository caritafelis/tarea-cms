import { router } from '@inertiajs/react';
import { useCallback, useSyncExternalStore } from 'react';
import { settingsTabKeys, type SettingsTabKey } from '@/layouts/settings/nav';

/**
 * La pestaña activa de Settings vive en la URL (?tab=billing).
 * Así el sidebar de settings y la página comparten estado sin ir al servidor,
 * y los enlaces directos funcionan.
 */
const EVENT = 'settings-tab-change';
const DEFAULT_TAB: SettingsTabKey = 'general';

function read(): SettingsTabKey {
    if (typeof window === 'undefined') return DEFAULT_TAB;
    const tab = new URLSearchParams(window.location.search).get('tab') ?? '';
    return (settingsTabKeys as readonly string[]).includes(tab) ? (tab as SettingsTabKey) : DEFAULT_TAB;
}

function subscribe(callback: () => void) {
    window.addEventListener(EVENT, callback);
    window.addEventListener('popstate', callback);
    const off = router.on('navigate', callback);

    return () => {
        window.removeEventListener(EVENT, callback);
        window.removeEventListener('popstate', callback);
        off();
    };
}

export function useSettingsTab() {
    const tab = useSyncExternalStore(subscribe, read, () => DEFAULT_TAB);

    const setTab = useCallback((next: SettingsTabKey) => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', next);
        // replaceState conservando history.state para no romper el historial de Inertia.
        window.history.replaceState(window.history.state, '', url);
        window.dispatchEvent(new Event(EVENT));
        window.scrollTo({ top: 0 });
    }, []);

    return [tab, setTab] as const;
}
