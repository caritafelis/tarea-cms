import { Form } from '@inertiajs/react';
import { useRef } from 'react';

import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';

import PasswordInput from '@/components/password-input';
import InputError from '@/components/input-error';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Props {
    passwordRules: string;
}

export default function PasswordForm({
    passwordRules,
}: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);

    const currentPasswordInput =
        useRef<HTMLInputElement>(null);

    return (
        <section className="space-y-6 rounded-xl border p-6">
            <div>
                <h3 className="font-medium">
                    Contraseña
                </h3>

                <p className="text-sm text-muted-foreground">
                    Actualiza tu contraseña para mantener tu cuenta segura.
                </p>
            </div>

            <Form
                {...SecurityController.update.form()}
                options={{ preserveScroll: true }}
                resetOnError={[
                    'password',
                    'password_confirmation',
                    'current_password',
                ]}
                resetOnSuccess
                onError={(errors) => {
                    if (errors.password) {
                        passwordInput.current?.focus();
                    }

                    if (errors.current_password) {
                        currentPasswordInput.current?.focus();
                    }
                }}
                className="space-y-5"
            >
                {({ errors, processing }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">
                                Contraseña actual
                            </Label>

                            <PasswordInput
                                ref={currentPasswordInput}
                                id="current_password"
                                name="current_password"
                                autoComplete="current-password"
                            />

                            <InputError
                                message={errors.current_password}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                Nueva contraseña
                            </Label>

                            <PasswordInput
                                ref={passwordInput}
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                passwordrules={passwordRules}
                            />

                            <InputError
                                message={errors.password}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirmar contraseña
                            </Label>

                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                passwordrules={passwordRules}
                            />

                            <InputError
                                message={
                                    errors.password_confirmation
                                }
                            />
                        </div>

                        <Button disabled={processing}>
                            Guardar contraseña
                        </Button>
                    </>
                )}
            </Form>
        </section>
    );
}