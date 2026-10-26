import { useState } from 'react';
import { SettingsCard } from '@/components/settings/settings-ui';

export function WebhookDocs({ docs }: { docs: any }) {
    const names = Object.keys(docs.events);
    const [event, setEvent] = useState(names[0]);

    return (
        <SettingsCard title="Documentation" description="Payloads and signature verification for your endpoints.">
            <div className="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
                <ul className="max-h-80 space-y-1 overflow-auto text-sm">
                    {names.map((n) => (
                        <li key={n}>
                            <button
                                onClick={() => setEvent(n)}
                                className={`w-full rounded-md px-2 py-1 text-left font-mono text-xs ${n === event ? 'bg-muted' : 'hover:bg-muted/50'}`}
                            >
                                {n}
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="min-w-0 space-y-3">
                    <p className="text-sm text-muted-foreground">{docs.events[event].description}</p>
                    <pre className="overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">{JSON.stringify(docs.events[event].example, null, 2)}</pre>
                    <p className="text-sm font-medium">Verify the signature</p>
                    <pre className="overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">{docs.verification.node}</pre>
                </div>
            </div>
        </SettingsCard>
    );
}