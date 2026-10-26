import { router } from '@inertiajs/react';
import { Globe, Laptop, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FaAndroid, FaApple, FaLinux, FaWindows } from 'react-icons/fa6';
import { SecuritySection } from '@/components/settings/security-ui';
import { Button } from '@/components/ui/button';
import { useSecurityBase } from '@/hooks/use-security-base';

export interface BrowserSession {
    id: string | number;
    ip_address?: string | null;
    user_agent?: string | null;
    browser?: string | null;
    platform?: string | null;
    device?: string | null;
    is_current?: boolean;
    is_current_device?: boolean;
    last_active?: string | null;
    last_active_at?: string | null;
    last_activity?: string | null;
}

function parseAgent(ua = '') {
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
        : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    const platform = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'Mac OS X'
        : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : '';
    return { browser, platform };
}

function PlatformIcon({ platform }: { platform: string }) {
    const cls = 'h-[18px] w-[18px]';
    if (/Mac|iOS|iPhone|iPad/.test(platform)) return <FaApple className={cls} />;
    if (/Windows/.test(platform)) return <FaWindows className={cls} />;
    if (/Android/.test(platform)) return <FaAndroid className={cls} />;
    if (/Linux/.test(platform)) return <FaLinux className={cls} />;
    return <Laptop className={cls} />;
}

export default function BrowserSessions({ sessions = [] }: { sessions?: BrowserSession[] }) {
    const base = useSecurityBase();
    const [revoking, setRevoking] = useState<string | number | null>(null);

    if (sessions.length === 0) return null;

    function revoke(id: string | number) {
        setRevoking(id);
        router.delete(`${base}/devices/${id}`, { preserveScroll: true, onFinish: () => setRevoking(null) });
    }

    return (
        <SecuritySection
            title="Browsers and devices"
            description="These browsers and devices are currently signed in to your account. Remove any unauthorized devices."
        >
            <ul className="border-t border-border">
                {sessions.map((s) => {
                    const parsed = parseAgent(s.user_agent ?? '');
                    const browser = s.browser ?? parsed.browser;
                    const platform = s.platform ?? s.device ?? parsed.platform;
                    const current = s.is_current ?? s.is_current_device ?? false;
                    const when = s.last_active ?? s.last_active_at ?? s.last_activity;

                    return (
                        <li
                            key={s.id}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-border py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_2rem]"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background shadow-xs">
                                    <PlatformIcon platform={platform ?? ''} />
                                </span>
                                <span className="truncate text-sm font-semibold">{[browser, platform].filter(Boolean).join(' on ')}</span>
                            </div>

                            <span className="order-3 flex items-center gap-2 truncate text-sm text-muted-foreground md:order-none">
                                <Globe className="h-4 w-4 shrink-0" />
                                {s.ip_address ?? '—'}
                            </span>

                            <span className="order-4 text-sm text-muted-foreground md:order-none">{current ? 'Current session' : (when ?? '')}</span>

                            <div className="order-2 flex justify-end md:order-none">
                                {current ? (
                                    <span className="size-8" aria-hidden />
                                ) : (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="size-8 text-muted-foreground"
                                        aria-label="Sign out of this device"
                                        disabled={revoking === s.id}
                                        onClick={() => revoke(s.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </SecuritySection>
    );
}