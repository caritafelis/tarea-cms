import StepShell from './step-shell';
import { DOCS, inputCls } from './constants';

type Props = { name: string; setName: (v: string) => void; onNext: () => void };

export default function WorkspaceStep({ name, setName, onNext }: Props) {
    return (
        <StepShell
            index={0}
            title="Create your workspace"
            description="Your workspace holds your content, products, team and API keys. Everything you publish is delivered through REST and GraphQL to any channel. Start by giving it a name."
            nextLabel="Save and continue"
            disabled={name.trim().length < 2}
            onSubmit={onNext}
        >
            <input
                autoFocus
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Store"
                maxLength={255}
                aria-label="Workspace name"
            />
            <p className="mt-3 text-[15px] text-neutral-500">You can change this name later in your workspace settings.</p>

            <div className="mt-10 border-t border-neutral-200 pt-8">
                <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Documentation</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                    {DOCS.map((d) => {
                        const Icon = d.icon;
                        return (
                            <a
                                key={d.label}
                                href={d.href}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-[15px] font-medium text-neutral-900 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                            >
                                <Icon className={`${d.size} text-neutral-500`} />
                                {d.label}
                            </a>
                        );
                    })}
                </div>
            </div>
        </StepShell>
    );
}