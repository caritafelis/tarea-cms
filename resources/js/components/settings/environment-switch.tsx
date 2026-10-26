import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setApiEnvironment, type ApiEnvironment } from '@/hooks/use-api-environment';

const OPTIONS: { value: ApiEnvironment; label: string; dot: string }[] = [
  { value: 'test', label: 'Test', dot: 'bg-amber-500' },
  { value: 'live', label: 'Production', dot: 'bg-emerald-500' },
];

export function EnvironmentSwitch({
  value,
  counts,
}: {
  value: ApiEnvironment;
  counts?: Record<ApiEnvironment, number>;
}) {
  return (
    <div role="radiogroup" aria-label="Environment" className="inline-flex rounded-lg border bg-muted p-0.5">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setApiEnvironment(opt.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', opt.dot)} />
            {opt.label}
            {counts && <span className="text-xs text-muted-foreground">{counts[opt.value]}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Shown only in Test: explains what "test" really means in this CMS. */
export function SandboxNotice({ canWrite }: { canWrite: boolean }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p>
        {canWrite
          ? 'Test keys use your production content. Anything they write changes real data.'
          : 'Test keys use your production content, so they can only read it. Use them on staging and preview sites.'}
      </p>
    </div>
  );
}
