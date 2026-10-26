import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { CreditCard, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FaApple, FaPaypal } from 'react-icons/fa6'; // npm i react-icons
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'sonner';
import { useBillingBase } from './use-billing-base';

type Method = 'card' | 'paypal';
type CardGateway = 'stripe' | 'nuvei';
type Wallet = 'apple_pay' | 'google_pay';

/**
 * El usuario NUNCA elige el gateway. Lo decide el backend (config/país/A-B)
 * y llega por props: `cardGateway`. El usuario solo elige el método:
 * Tarjeta, Apple Pay, Google Pay o PayPal.
 *
 * NOTA PARA DESARROLLO (no lo ve el usuario):
 * - Número / expiración / CVV deben montarse como campos embebidos del gateway
 *   (Stripe Elements o Nuvei Simply Connect). Así el PAN y el CVV nunca tocan
 *   tu backend ni el estado de React (PCI-DSS). Los inputs de abajo son para
 *   calzar el diseño y el preview de la tarjeta.
 * - Apple Pay / Google Pay:
 *     Stripe -> stripe.paymentRequest() + <PaymentRequestButtonElement/>
 *     Nuvei  -> Simply Connect (digital wallets) / sus botones nativos
 *   Muestra cada botón solo si el navegador/dispositivo lo soporta
 *   (`canMakePayment()`), y pásalo por `wallets`.
 */

const BRANDS = [
    { id: 'visa', label: 'Visa', test: /^4/ },
    { id: 'mastercard', label: 'Mastercard', test: /^(5[1-5]|2[2-7])/ },
    { id: 'amex', label: 'Amex', test: /^3[47]/ },
] as const;

function detectBrand(digits: string) {
    return BRANDS.find((b) => b.test.test(digits))?.label ?? null;
}

function formatCardNumber(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function CardPreview({ number, name, expiry, brand }: { number: string; name: string; expiry: string; brand: string | null }) {
    const padded = (number.replace(/\s/g, '') + '•'.repeat(16)).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    return (
        <div className="relative aspect-[1.7/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/50 p-5 text-primary-foreground shadow-lg">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex items-start justify-between">
                <div className="h-8 w-11 rounded-md bg-white/30" />
                <span className="text-sm font-semibold tracking-wide">{brand ?? ''}</span>
            </div>
            <div className="relative mt-auto flex h-[calc(100%-2rem)] flex-col justify-end gap-3">
                <p className="font-mono text-lg tracking-widest tabular-nums">{padded}</p>
                <div className="flex items-end justify-between text-xs">
                    <span className="max-w-[70%] truncate font-medium uppercase tracking-wide">{name || 'Your name'}</span>
                    <span className="font-mono tabular-nums">{expiry || 'MM/YY'}</span>
                </div>
            </div>
        </div>
    );
}

function MethodTab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {icon}
            {children}
        </button>
    );
}

export function AddPaymentMethodDrawer({
    open,
    onOpenChange,
    cardGateway = 'stripe',
    wallets = ['apple_pay', 'google_pay'],
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    /** Gateway que procesa tarjetas y wallets. Lo define el backend, no el usuario. */
    cardGateway?: CardGateway;
    /** Wallets soportadas en este dispositivo (resultado de canMakePayment()). */
    wallets?: Wallet[];
}) {
    const base = useBillingBase();
    const isMobile = useIsMobile();

    const [method, setMethod] = useState<Method>('card');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const [makeDefault, setMakeDefault] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const brand = useMemo(() => detectBrand(cardNumber.replace(/\s/g, '')), [cardNumber]);
    const cvvLength = brand === 'Amex' ? 4 : 3;

    function reset() {
        setCardNumber(''); setExpiry(''); setCvv(''); setName('');
    }

    function post(payload: Record<string, unknown>) {
        setSubmitting(true);
        router.post(`${base}/payment-methods`, { ...payload, make_default: makeDefault }, {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
            onSuccess: () => {
                onOpenChange(false);
                reset();
                toast.success('Payment method added.');
            },
            onError: () => toast.error('We couldn’t add this payment method. Check the details and try again.'),
        });
    }

    function submitCard(e: React.FormEvent) {
        e.preventDefault();
        // TODO producción: token del SDK (stripe.createPaymentMethod / Nuvei),
        // nunca construido desde cardNumber/cvv.
        const token = `demo_${cardGateway}_${cardNumber.replace(/\s/g, '').slice(-4)}`;
        post({ gateway: cardGateway, token, name });
    }

    function payWithWallet(wallet: Wallet) {
        // TODO producción: dispara el paymentRequest del gateway y envía el token resultante.
        post({ gateway: cardGateway, wallet, token: `demo_${cardGateway}_${wallet}` });
    }

    function connectPaypal() {
        // TODO producción: abre el flujo de PayPal (vault / billing agreement) y envía el token.
        post({ gateway: 'paypal', token: 'demo_paypal' });
    }

    const cardReady =
        name.trim().length > 1 &&
        cardNumber.replace(/\s/g, '').length >= 15 &&
        /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) &&
        cvv.length === cvvLength;

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? 'bottom' : 'right'}>
            <DrawerContent>
                <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto">
                    <DrawerHeader className="text-left">
                        <DrawerTitle>Add payment method</DrawerTitle>
                        <DrawerDescription>Used to pay for your subscription. Only you can see it.</DrawerDescription>
                    </DrawerHeader>

                    <div className="space-y-5 px-4 pb-4">
                        {method === 'card' && (
                            <CardPreview number={cardNumber} name={name} expiry={expiry} brand={brand} />
                        )}

                        <div role="tablist" aria-label="Payment method" className="flex gap-1 rounded-lg bg-muted p-1">
                            <MethodTab active={method === 'card'} onClick={() => setMethod('card')} icon={<CreditCard className="h-4 w-4" />}>
                                Card
                            </MethodTab>
                            <MethodTab active={method === 'paypal'} onClick={() => setMethod('paypal')} icon={<FaPaypal className="h-4 w-4 text-[#003087]" />}>
                                PayPal
                            </MethodTab>
                        </div>

                        {method === 'card' ? (
                            <form onSubmit={submitCard} className="space-y-4">
                                {wallets.length > 0 && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            {wallets.includes('apple_pay') && (
                                                <Button type="button" variant="outline" className="h-11 gap-2" disabled={submitting} onClick={() => payWithWallet('apple_pay')}>
                                                    <FaApple className="h-5 w-5" /> Apple Pay
                                                </Button>
                                            )}
                                            {wallets.includes('google_pay') && (
                                                <Button type="button" variant="outline" className="h-11 gap-2" disabled={submitting} onClick={() => payWithWallet('google_pay')}>
                                                    <FcGoogle className="h-5 w-5" /> Google Pay
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="h-px flex-1 bg-border" />
                                            or pay with card
                                            <span className="h-px flex-1 bg-border" />
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="card-name">Name on card</Label>
                                    <Input id="card-name" autoComplete="cc-name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="card-number">Card number</Label>
                                    <div className="relative">
                                        <Input
                                            id="card-number"
                                            inputMode="numeric"
                                            autoComplete="cc-number"
                                            placeholder="0000 0000 0000 0000"
                                            className="pr-16 tabular-nums"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                            required
                                        />
                                        {brand && (
                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                {brand}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="card-expiry">Expiry date</Label>
                                        <Input id="card-expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" className="tabular-nums" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="card-cvv">CVV</Label>
                                        <Input id="card-cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder={'•'.repeat(cvvLength)} maxLength={cvvLength} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))} required />
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Checkbox checked={makeDefault} onCheckedChange={(v) => setMakeDefault(Boolean(v))} />
                                    Use as my default payment method
                                </label>

                                <DrawerFooter className="px-0 pb-0">
                                    <Button type="submit" disabled={submitting || !cardReady}>
                                        {submitting ? 'Saving…' : 'Save card'}
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                                    <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
                                        <Lock className="h-3 w-3" /> Encrypted and processed securely
                                    </p>
                                </DrawerFooter>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                                    You’ll sign in to PayPal to approve future payments. We never see your PayPal password.
                                </div>

                                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Checkbox checked={makeDefault} onCheckedChange={(v) => setMakeDefault(Boolean(v))} />
                                    Use as my default payment method
                                </label>

                                <DrawerFooter className="px-0 pb-0">
                                    <Button
                                        type="button"
                                        disabled={submitting}
                                        onClick={connectPaypal}
                                        className="h-11 bg-[#FFC439] text-[#003087] hover:bg-[#f2ba36]"
                                    >
                                        {submitting ? 'Connecting…' : 'Continue with PayPal'}
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                                </DrawerFooter>
                            </div>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}