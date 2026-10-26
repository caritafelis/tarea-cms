import { useState } from 'react';
import Frame from '@/components/onboarding/frame';
import { isEcommerceProject } from '@/components/onboarding/constants';
import PlanConfirmStep from '@/components/onboarding/plan-confirm-step';
import BusinessStep from '@/components/onboarding/business-step';
import PaymentStep from '@/components/onboarding/payment-step';
import PlanStep from '@/components/onboarding/plan-step';
import WorkspaceStep from '@/components/onboarding/workspace-step';
import type { BillingInterval, Props } from '@/types';

export default function Onboarding({ team, plans, businessTypes, projectTypes, templates, selectedPlan, marketingUrl, vat, nuvei }: Props) {
    // 'business' (servidor) = pasos 0-1 · 'plan'/'payment' = paso 2 (el pago se reinicia al recargar)
    const [step, setStep] = useState(team.step === 'business' ? 0 : 2);
    const [maxStep, setMaxStep] = useState(step);

    const [name, setName] = useState(team.name ?? '');
    const [projectType, setProjectType] = useState<string | null>(team.project_type);
    const [wantsStore, setWantsStore] = useState(selectedPlan?.has_ecommerce ?? false);
    const [tier, setTier] = useState<string | null>(selectedPlan?.tier ?? null);
    const [billing, setBilling] = useState<BillingInterval>((selectedPlan?.interval as BillingInterval) ?? 'month');

    // Si el proyecto ya es e-commerce, la tienda queda incluida y bloqueada
    const storeLocked = isEcommerceProject(projectType);
    const ecommerce = storeLocked || wantsStore;

    // Derivado: el plan seleccionado siempre coincide con la variante visible
    const selected = selectedPlan
        ? (plans.find((p) => p.slug === selectedPlan.slug) ?? selectedPlan)
        : (plans.find((p) => p.tier === tier && p.has_ecommerce === ecommerce && p.interval === billing) ?? null);


    const go = (n: number) => {
        setStep(n);
        setMaxStep((m) => Math.max(m, n));
        document.getElementById('onboarding-main')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Frame step={step} maxStep={maxStep} onJump={(i) => i <= maxStep && go(i)}>
            {step === 0 && <WorkspaceStep name={name} setName={setName} onNext={() => go(1)} />}

            {step === 1 && (
                <BusinessStep
                    team={team}
                    name={name}
                    templates={templates}
                    businessTypes={businessTypes}
                    projectTypes={projectTypes}
                    onBack={() => go(0)}
                    onDone={(type) => {
                        setProjectType(type);
                        go(2);
                    }}
                />
            )}
            {step === 2 && selectedPlan && selected && (
                <PlanConfirmStep plan={selected} marketingUrl={marketingUrl} onBack={() => go(1)} onNext={() => go(3)} />
            )}

            {step === 2 && !selectedPlan && (
                <PlanStep
                    plans={plans}
                    ecommerce={ecommerce}
                    storeLocked={storeLocked}
                    onToggle={setWantsStore}
                    interval={billing}
                    onIntervalChange={setBilling}
                    selected={selected}
                    onSelect={setTier}
                    onBack={() => go(1)}
                    onNext={() => go(3)}
                />
            )}

            {step === 3 && selected && <PaymentStep plan={selected} vat={vat} nuvei={nuvei} onBack={() => go(2)} />}
        </Frame>
    );
}