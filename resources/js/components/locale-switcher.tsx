import React from 'react';

interface LocaleSwitcherProps {
    locales: string[];
    active: string;
    onChange: (locale: string) => void;
    labels?: Record<string, string>;
}

const defaultLabels: Record<string, string> = {
    en: 'EN', es: 'ES', fr: 'FR', de: 'DE', it: 'IT',
    pt: 'PT', nl: 'NL', ru: 'RU', zh: 'ZH', ja: 'JA',
    ko: 'KO', ar: 'AR',
};

export default function LocaleSwitcher({ locales, active, onChange, labels }: LocaleSwitcherProps) {
    if (locales.length <= 1) return null;

    return (
        <div className="flex items-center gap-1 rounded-lg border border-sidebar-border/70 p-0.5 bg-neutral-50 dark:bg-neutral-800/50">
            {locales.map(code => (
                <button
                    key={code}
                    type="button"
                    onClick={() => onChange(code)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold uppercase transition-colors ${active === code
                        ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                >
                    {(labels ?? defaultLabels)[code] ?? code.toUpperCase()}
                </button>
            ))}
        </div>
    );
}