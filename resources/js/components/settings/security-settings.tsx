import { useState } from 'react';

import PasswordSection from './password-section';
import PasskeysSection from './passkeys-section';
import TwoFactorSection from './two-factor-section';
import SessionsSection from './sessions-section';
import UpdatePasswordStep from './update-password-step';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';

type View =
    | 'home'
    | 'password'
    | 'passkeys'
    | 'sessions'
    | 'two-factor';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function SecuritySettings(props: Props) {
    const [view, setView] = useState<View>('home');

    switch (view) {
        case 'password':
            return (
                <UpdatePasswordStep
                    passwordRules={props.passwordRules}
                    onSuccess={() => setView('home')}
                    onBack={() => setView('home')}
                />
            );

        case 'passkeys':
            return (
                <PasskeysSection
                    {...props}
                    standalone
                    onBack={() => setView('home')}
                />
            );

        default:
            return (
                <div className="space-y-3">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Security & sign in
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Manage your account security and authentication
                            methods.
                        </p>
                    </div>

                    <PasswordSection
                        passwordRules={props.passwordRules}
                        onVerified={() => setView('password')}
                    />

                    <PasskeysSection
                        {...props}
                        compact
                        onOpen={() => setView('passkeys')}
                    />

                    <TwoFactorSection
                        canManageTwoFactor={
                            props.canManageTwoFactor
                        }
                        requiresConfirmation={
                            props.requiresConfirmation
                        }
                        twoFactorEnabled={
                            props.twoFactorEnabled
                        }
                    />

                    <SessionsSection />
                </div>
            );
    }
}