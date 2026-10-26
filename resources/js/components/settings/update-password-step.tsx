import { Form } from '@inertiajs/react';
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';
import { Check, Circle } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSecurityBase } from '@/hooks/use-security-base';
import { cn } from '@/lib/utils';

const zxcvbn = new ZxcvbnFactory({
    dictionary: { ...zxcvbnCommonPackage.dictionary, ...zxcvbnEnPackage.dictionary },
    graphs: zxcvbnCommonPackage.adjacencyGraphs,
    translations: zxcvbnEnPackage.translations,
});

const LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['bg-destructive', 'bg-destructive', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];

/** Contraseña aleatoria con crypto (Math.random no es seguro para esto). */
function generatePassword(length = 20) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(values, (v) => chars[v % chars.length]).join('');
}

export default function UpdatePasswordStep({ passwordRules, onSuccess }: { passwordRules: string; onSuccess: () => void }) {
    const base = useSecurityBase();
    const [password, setPassword] = useState('');
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const score = useMemo(() => (password ? zxcvbn.check(password).score : 0), [password]);

    const rules = [
        { label: 'At least 12 characters', valid: password.length >= 12 },
        { label: 'Uppercase and lowercase letters', valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
        { label: 'A number', valid: /\d/.test(password) },
        { label: 'A special character', valid: /[^A-Za-z0-9]/.test(password) },
    ];

    return (
        <section className="space-y-5">
            <div>
                <h2 className="text-lg font-semibold">Change password</h2>
                <p className="text-sm text-muted-foreground">Identity verified. Choose a new password.</p>
            </div>

            <Form
                action={`${base}/password`}
                method="put"
                options={{ preserveScroll: true }}
                resetOnError={['password', 'password_confirmation', 'current_password']}
                resetOnSuccess
                onSuccess={onSuccess}
                onError={(errors) => {
                    if (errors.password) passwordInput.current?.focus();
                    if (errors.current_password) currentPasswordInput.current?.focus();
                }}
                className="space-y-5"
            >
                {({ errors, processing }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">Current password</Label>
                            <PasswordInput ref={currentPasswordInput} id="current_password" name="current_password" placeholder="Enter your current password" autoComplete="current-password" />
                            <InputError message={errors.current_password} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">New password</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => setPassword(generatePassword())}>
                                    Generate secure password
                                </Button>
                            </div>
                            <PasswordInput
                                ref={passwordInput}
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                placeholder="Enter a secure password"
                                passwordrules={passwordRules}
                            />

                            <div className="space-y-2 rounded-lg border border-border/60 p-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Password strength</span>
                                    <span className="font-medium">{password ? LABELS[score] : '—'}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted">
                                    <div
                                        className={cn('h-1.5 rounded-full transition-all', COLORS[score])}
                                        style={{ width: password ? `${(score + 1) * 20}%` : '0%' }}
                                    />
                                </div>
                                <ul className="grid gap-1 pt-1 text-sm sm:grid-cols-2">
                                    {rules.map((r) => (
                                        <li key={r.label} className={cn('flex items-center gap-2', r.valid ? 'text-foreground' : 'text-muted-foreground')}>
                                            {r.valid ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Circle className="h-3 w-3" />}
                                            {r.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm password</Label>
                            <PasswordInput id="password_confirmation" name="password_confirmation" autoComplete="new-password" placeholder="Confirm your new password" passwordrules={passwordRules} />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                            {processing ? 'Saving…' : 'Save password'}
                        </Button>
                    </>
                )}
            </Form>
        </section>
    );
}
