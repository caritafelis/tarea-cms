import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

interface LanguagesProps {
    activeLocales: string[];
    defaultLocale: string;
    supportedLanguages: Record<string, string>;
}

export default function Languages({ activeLocales, defaultLocale, supportedLanguages }: LanguagesProps) {
    const [locales, setLocales] = useState<string[]>(activeLocales);
    const [defaultLoc, setDefaultLoc] = useState(defaultLocale);

    const toggle = (code: string) => {
        if (code === defaultLoc) return; // Can't remove default
        setLocales(prev =>
            prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/languages', { locales, default_locale: defaultLoc });
    };

    return (
        <>
            <Head title="Language Settings" />
            <div className="p-6 max-w-2xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Languages</h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Configure active languages. The API exposes content at{' '}
                        <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded text-xs">/api/{'{locale}'}/posts</code>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-xl border border-sidebar-border/70 overflow-hidden">
                        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-sidebar-border/70">
                            <p className="text-xs font-semibold uppercase text-neutral-500">Active Languages</p>
                        </div>
                        <div className="divide-y divide-sidebar-border/50">
                            {Object.entries(supportedLanguages).map(([code, label]) => {
                                const isActive = locales.includes(code);
                                const isDefault = code === defaultLoc;
                                return (
                                    <label key={code} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isActive}
                                                onChange={() => toggle(code)}
                                                disabled={isDefault}
                                                className="rounded border-neutral-300"
                                            />
                                            <span className="text-sm font-medium">{label}</span>
                                            <span className="text-xs text-neutral-400 font-mono">{code}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isDefault && (
                                                <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                                                    Default
                                                </span>
                                            )}
                                            {isActive && !isDefault && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDefaultLoc(code)}
                                                    className="text-xs text-neutral-400 hover:text-blue-600 transition-colors"
                                                >
                                                    Set as default
                                                </button>
                                            )}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 p-4 bg-neutral-50 dark:bg-neutral-800/30 space-y-2">
                        <p className="text-xs font-semibold uppercase text-neutral-500">API Usage</p>
                        <div className="space-y-1">
                            {locales.map(code => (
                                <div key={code} className="flex items-center gap-2">
                                    <code className="text-xs bg-white dark:bg-neutral-900 border border-sidebar-border/50 px-2 py-1 rounded font-mono text-neutral-600 dark:text-neutral-300">
                                        GET /api/{code}/posts
                                    </code>
                                    {code === defaultLoc && (
                                        <code className="text-xs bg-white dark:bg-neutral-900 border border-sidebar-border/50 px-2 py-1 rounded font-mono text-neutral-600 dark:text-neutral-300">
                                            GET /api/posts (fallback)
                                        </code>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                        Save Languages
                    </button>
                </form>
            </div>
        </>
    );
}

Languages.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Languages', href: '/admin/languages' }]}>{page}</AppLayout>
);