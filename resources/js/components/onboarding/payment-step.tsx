import { router, usePage } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { BiSolidCreditCardAlt } from 'react-icons/bi';
import FieldHeading from './field-heading';
import MethodCard from './method-card';
import StepShell from './step-shell';
import { inputCls } from './constants';
import { getPaymentez, usePaymentez } from '@/hooks/use-paymentez';
import type { AuthProps, CardPayload, Nuvei, Plan } from '@/types';

const formatNumber = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

type Props = { plan: Plan; vat: number; nuvei: Nuvei; onBack: () => void };

export default function PaymentStep({ plan, vat, nuvei, onBack }: Props) {
    const { auth } = usePage<AuthProps>().props;
    const { ready: sdkReady, error: sdkError } = usePaymentez(nuvei);

    const [method, setMethod] = useState<'nuvei' | 'paypal'>('nuvei');
    const [f, setF] = useState({ holder: '', number: '', expiry: '', cvc: '' });
    const [card, setCard] = useState<CardPayload | null>(null); // token + metadatos, nunca el número
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const base = plan.price_cents / 100;
    const iva = base * (vat / 100);

    const setField = (k: keyof typeof f, v: string) => {
        setF((p) => ({ ...p, [k]: v }));
        setCard(null); // si edita, hay que volver a tokenizar
    };

    const cardComplete =
        f.holder.trim().length > 2 && f.number.replace(/\s/g, '').length >= 13 && /^\d{2}\/\d{2}$/.test(f.expiry) && f.cvc.length >= 3;
    const canPay = method === 'paypal' ? plan.paypal_available : cardComplete && sdkReady;

    // El SDK falló al cargar/configurarse: solo importa cuando se paga con tarjeta.
    const shownError = error ?? (method === 'nuvei' ? sdkError : null);

    /** ⚠️ Confirma nombres exactos del SDK en https://developers.paymentez.com/docs/payments/#javascript */
    const tokenize = () =>
        new Promise<CardPayload>((resolve, reject) => {
            const sdk = getPaymentez();
            if (!sdk) return reject(new Error('The card payment form is not ready yet. Please try again in a moment.'));

            const [mm, yy] = f.expiry.split('/').map(Number);
            if (mm < 1 || mm > 12) return reject(new Error('The expiry month is not valid.'));
            const year = 2000 + yy;

            // El API de Paymentez exige la propiedad "card": el objeto va envuelto en { card: {...} }.
            sdk.addCard(
                String(auth.user.id),
                auth.user.email,
                {
                    card: {
                        number: f.number.replace(/\s/g, ''),
                        holder_name: f.holder,
                        expiry_month: mm,
                        expiry_year: year,
                        cvc: f.cvc,
                    },
                },
                (res: any) => {
                    const c = res?.card;

                    // Solo tarjetas "valid": las "review" (Diners / 3DS) requieren el paso "verify", aún no soportado.
                    if (!c || c.status !== 'valid' || !c.token) {
                        reject(
                            new Error(
                                c?.status === 'review'
                                    ? 'This card needs additional verification. Please use another card or PayPal.'
                                    : (c?.message ?? 'Card tokenization failed.'),
                            ),
                        );
                        return;
                    }

                    resolve({
                        token: c.token,
                        brand: c.type,
                        holder_name: f.holder,
                        last_four: String(c.number ?? f.number).slice(-4),
                        exp_month: mm,
                        exp_year: year,
                    });
                },
                (e: any) => {
                    reject(new Error(e?.error?.description ?? e?.error?.type ?? 'Could not tokenize the card.'));
                },
            );
        });

    const pay = async () => {
        setBusy(true);
        setError(null);
        try {
            let payload: CardPayload | null = null;
            if (method === 'nuvei') {
                payload = card ?? (await tokenize());
                setCard(payload);
            }
            router.post(
                '/onboarding/checkout',
                { plan: plan.slug, gateway: method, ...(payload ? { card: payload } : {}) },
                {
                    // El servidor responde con errores bajo "card" (tarjeta rechazada / sin procesador) o "gateway".
                    onError: (errs) =>
                        setError(
                            (errs.payment as string) ??
                            (errs.card as string) ??
                            (errs.gateway as string) ??
                            (Object.values(errs)[0] as string) ??
                            'Payment failed',
                        ),
                    onFinish: () => setBusy(false),
                },
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Payment failed');
            setBusy(false);
        }
    };

    return (
        <StepShell
            index={3}
            title="Payment"
            description="Choose how you want to pay. Your subscription activates as soon as the payment is confirmed."
            onBack={onBack}
            nextLabel={busy ? 'Processing…' : method === 'paypal' ? 'Continue with PayPal' : 'Pay and activate'}
            nextIcon={method === 'nuvei' && !busy ? <Lock className="size-4" /> : undefined}
            disabled={!canPay}
            loading={busy}
            onSubmit={pay}
        >
            <div className="space-y-8">
                <section>
                    <FieldHeading title="Payment method" />
                    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                        <MethodCard
                            active={method === 'nuvei'}
                            onClick={() => setMethod('nuvei')}
                            title="Credit / debit card"
                            icon={<BiSolidCreditCardAlt className="size-5" strokeWidth={1.5} />}
                        />
                        <MethodCard
                            active={method === 'paypal'}
                            disabled={!plan.paypal_available}
                            onClick={() => setMethod('paypal')}
                            title="PayPal"
                            icon={
                                <span className="text-sm font-bold italic text-[#003087]">
                                    Pay<span className="text-[#009cde]">Pal</span>
                                </span>
                            }
                        />
                    </div>
                </section>

                {method === 'nuvei' ? (
                    <section className="space-y-3">
                        <input className={inputCls} placeholder="Name on card" value={f.holder} onChange={(e) => setField('holder', e.target.value)} autoComplete="cc-name" />
                        <input
                            className={inputCls}
                            placeholder="Card number"
                            inputMode="numeric"
                            value={f.number}
                            onChange={(e) => setField('number', formatNumber(e.target.value))}
                            autoComplete="cc-number"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                className={inputCls}
                                placeholder="MM/YY"
                                inputMode="numeric"
                                value={f.expiry}
                                onChange={(e) => setField('expiry', formatExpiry(e.target.value))}
                                autoComplete="cc-exp"
                            />
                            <input
                                className={inputCls}
                                placeholder="CVV"
                                inputMode="numeric"
                                value={f.cvc}
                                onChange={(e) => setField('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                autoComplete="cc-csc"
                            />
                        </div>
                        <p className="flex items-center gap-2 text-sm text-neutral-500">
                            <Lock className="size-4" /> Your card details are sent securely to the payment provider and never stored on our servers.
                        </p>
                    </section>
                ) : (
                    <p className="rounded-lg bg-neutral-100 px-5 py-4 text-[15px] text-neutral-700">
                        You'll be redirected to PayPal to approve the subscription, then brought back here.
                    </p>
                )}

                <section className="rounded-lg bg-neutral-100 px-5 py-4">
                    <div className="flex justify-between text-[15px] text-neutral-700">
                        <span>{plan.name}</span>
                        <span>${base.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-[15px] text-neutral-700">
                        <span>VAT ({vat}%)</span>
                        <span>${iva.toFixed(2)}</span>
                    </div>
                    <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 font-semibold text-neutral-900">
                        <span>Total / {plan.interval}</span>
                        <span>${(base + iva).toFixed(2)}</span>
                    </div>
                </section>

                {shownError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {shownError}
                    </p>
                )}
            </div>
        </StepShell>
    );
}