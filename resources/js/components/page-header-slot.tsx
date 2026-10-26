import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Slot = {
    actionsEl: HTMLElement | null;
    setActionsEl: (el: HTMLElement | null) => void;
};

const SlotContext = createContext<Slot>({
    actionsEl: null,
    setActionsEl: () => undefined,
});

/** Lo monta el layout: expone el hueco derecho del header fijo. */
export function PageHeaderSlotProvider({ children }: { children: ReactNode }) {
    const [actionsEl, setActionsEl] = useState<HTMLElement | null>(null);
    const value = useMemo(() => ({ actionsEl, setActionsEl }), [actionsEl]);

    return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

export const usePageHeaderSlot = () => useContext(SlotContext);

/**
 * Lo usa una página para colocar sus acciones (selector de periodo, botones)
 * en la parte derecha del header fijo, sin que el layout conozca su estado.
 */
export function HeaderActions({ children }: { children: ReactNode }) {
    const { actionsEl } = usePageHeaderSlot();

    return actionsEl ? createPortal(children, actionsEl) : null;
}