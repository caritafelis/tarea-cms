import { useEffect, useState } from 'react';
import type { Nuvei } from '../types';

declare global {
    interface Window {
        Payment?: {
            init: (env: string, code: string, key: string) => void;
            addCard: (...args: any[]) => void;
        };
        jQuery?: unknown;
    }
}

// Por si el SDK declara `const Payment` en vez de colgarlo de window.
declare const Payment: any;

// payment_stable.min.js depende de jQuery y debe cargarse DESPUÉS de él.
const JQUERY_URL = 'https://code.jquery.com/jquery-3.7.1.min.js';
const SDK_URL = 'https://cdn.paymentez.com/ccapi/sdk/payment_stable.min.js';

export function getPaymentez(): any {
    if (typeof window === 'undefined') return undefined;
    if (typeof Payment !== 'undefined') return Payment;

    return window.Payment;
}

// Un solo script por URL, aunque React StrictMode ejecute el efecto dos veces.
const inflight = new Map<string, Promise<void>>();

function loadScript(src: string, isReady: () => boolean): Promise<void> {
    if (isReady()) return Promise.resolve();

    const pending = inflight.get(src);
    if (pending) return pending;

    const promise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.charset = 'UTF-8';

        script.onload = () => {
            if (isReady()) return resolve();
            inflight.delete(src);
            reject(new Error(`Script loaded but its global is unavailable: ${src}`));
        };
        script.onerror = () => {
            inflight.delete(src); // permite reintentar
            reject(new Error(`Could not load ${src}`));
        };

        document.head.appendChild(script);
    });

    inflight.set(src, promise);

    return promise;
}

function loadSdk(): Promise<any> {
    return loadScript(JQUERY_URL, () => !!window.jQuery)
        .then(() => loadScript(SDK_URL, () => !!getPaymentez()))
        .then(() => getPaymentez());
}

let initializedWith: string | null = null;

export function usePaymentez(nuvei: Nuvei) {
    const [state, setState] = useState<{ ready: boolean; error: string | null }>({ ready: false, error: null });

    useEffect(() => {
        let cancelled = false;

        if (!nuvei.env || !nuvei.code || !nuvei.key) {
            setState({ ready: false, error: 'Card payments are not configured.' });
            return;
        }

        setState({ ready: false, error: null });

        loadSdk()
            .then((sdk) => {
                const id = `${nuvei.env}:${nuvei.code}:${nuvei.key}`;

                if (initializedWith !== id) {
                    sdk.init(nuvei.env, nuvei.code, nuvei.key);
                    initializedWith = id;
                }

                if (!cancelled) setState({ ready: true, error: null });
            })
            .catch((e: Error) => {
                if (!cancelled) setState({ ready: false, error: e.message });
            });

        return () => {
            cancelled = true;
        };
    }, [nuvei.env, nuvei.code, nuvei.key]);

    return state;
}