import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export type ConfirmOptions = {
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
};

type Ask = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Ask | null>(null);

/** const confirm = useConfirm();  if (!(await confirm({ title: '…' }))) return; */
export function useConfirm(): Ask {
    const ask = useContext(ConfirmContext);

    if (!ask) throw new Error('useConfirm must be used inside <ConfirmProvider>.');

    return ask;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const ask = useCallback<Ask>(
        (opts) =>
            new Promise<boolean>((resolve) => {
                resolver.current?.(false);
                resolver.current = resolve;
                setOptions(opts);
            }),
        [],
    );

    const settle = (value: boolean) => {
        resolver.current?.(value);
        resolver.current = null;
        setOptions(null);
    };

    return (
        <ConfirmContext.Provider value={ask}>
            {children}

            <AlertDialog open={options !== null} onOpenChange={(open) => !open && settle(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options?.title}</AlertDialogTitle>
                        {options?.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{options?.cancelLabel ?? 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(options?.destructive && buttonVariants({ variant: 'destructive' }))}
                            onClick={() => settle(true)}
                        >
                            {options?.confirmLabel ?? 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
}