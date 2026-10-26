import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import BillingIntervalToggle from './billing-interval-toggle';
import EcommerceToggle from './ecommerce-toggle';
import PlanCard from './plan-card';
import StepShell from './step-shell';
import type { BillingInterval, Plan } from '@/types';

type Props = {
    plans: Plan[];
    ecommerce: boolean;
    storeLocked: boolean;
    onToggle: (v: boolean) => void;
    interval: BillingInterval;
    onIntervalChange: (v: BillingInterval) => void;
    selected: Plan | null;
    onSelect: (tier: string) => void;
    onBack: () => void;
    onNext: () => void;
};

/** % de ahorro del plan anual frente a 12 meses del mensual equivalente */
function savingsFor(plan: Plan, all: Plan[]): number {
    if (plan.interval !== 'year' || plan.price_cents === 0) return 0;
    const monthly = all.find((o) => o.tier === plan.tier && o.has_ecommerce === plan.has_ecommerce && o.interval === 'month');
    if (!monthly || monthly.price_cents === 0) return 0;
    const pct = Math.round((1 - plan.price_cents / (monthly.price_cents * 12)) * 100);
    return pct > 0 ? pct : 0;
}

export default function PlanStep({
    plans,
    ecommerce,
    storeLocked,
    onToggle,
    interval,
    onIntervalChange,
    selected,
    onSelect,
    onBack,
    onNext,
}: Props) {
    // Planes de la variante actual (con / sin tienda)
    const inScope = plans.filter((p) => p.has_ecommerce === ecommerce);
    const hasYearly = inScope.some((p) => p.interval === 'year');

    // Solo el intervalo elegido. Los "Contact sales" (precio 0) se muestran siempre,
    // usando su versión del intervalo si existe y, si no, la mensual.
    const visible = inScope.filter(
        (p) =>
            p.interval === interval ||
            (p.price_cents === 0 && !inScope.some((o) => o.tier === p.tier && o.interval === interval)),
    );

    const bestSaving = Math.max(0, ...inScope.map((p) => savingsFor(p, plans)));

    // Si la variante no tiene planes anuales, vuelve a mensual
    useEffect(() => {
        if (!hasYearly && interval === 'year') onIntervalChange('month');
    }, [hasYearly, interval, onIntervalChange]);

    /* ── Carrusel ── */
    const carouselRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateArrows = useCallback(() => {
        const el = carouselRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        const el = carouselRef.current;
        if (!el) return;
        el.scrollBy({ left: direction === 'right' ? el.clientWidth * 0.85 : -el.clientWidth * 0.85, behavior: 'smooth' });
    };

    // Al cambiar de variante o intervalo, vuelve al primer plan
    useEffect(() => {
        carouselRef.current?.scrollTo({ left: 0 });
    }, [ecommerce, interval]);

    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;
        updateArrows();
        const observer = new ResizeObserver(updateArrows);
        observer.observe(el);
        return () => observer.disconnect();
    }, [updateArrows, visible.length, ecommerce, interval]);

    return (
        <StepShell
            index={2}
            title="Choose your plan"
            description={`Billed ${interval === 'year' ? 'yearly' : 'monthly'}. Cancel or change your plan at any time.`}
            onBack={onBack}
            nextLabel="Continue to payment"
            nextIcon={<ArrowRight className="size-5" />}
            disabled={!selected || selected.price_cents === 0}
            onSubmit={onNext}
        >
            <div className="space-y-3">
                <EcommerceToggle checked={ecommerce} locked={storeLocked} onChange={onToggle} />

                <div className="flex items-center justify-between gap-2">
                    {hasYearly ? (
                        <BillingIntervalToggle value={interval} onChange={onIntervalChange} bestSaving={bestSaving} />
                    ) : (
                        <span />
                    )}

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            aria-label="Previous plans"
                            className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            aria-label="Next plans"
                            className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ArrowRight className="size-5" />
                        </button>
                    </div>
                </div>

                <div
                    ref={carouselRef}
                    onScroll={updateArrows}
                    className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto [scrollbar-width:thin]"
                    role="radiogroup"
                    aria-label="Available plans"
                >
                    {visible.map((p) => (
                        <div
                            key={p.slug}
                            className="h-[290px] w-[85%] min-w-[85%] shrink-0 snap-start sm:w-[48%] sm:min-w-[48%] lg:w-[48%] lg:min-w-[48%]"
                        >
                            <PlanCard
                                plan={p}
                                active={selected?.slug === p.slug}
                                savings={savingsFor(p, plans)}
                                onSelect={() => onSelect(p.tier)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </StepShell>
    );
}