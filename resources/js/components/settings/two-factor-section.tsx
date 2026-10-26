import { Badge } from '@/components/ui/badge';
import ManageTwoFactor from '@/components/manage-two-factor';
import type { Props } from '@/components/manage-two-factor';

export default function TwoFactorSection(props: Props) {
    const enabled = props.twoFactorEnabled ?? false;

    return (
        <section className='space-y-3'>
            <div>
                <h2 className="text-xl font-semibold">
                    Multi-Factor Authentication (MFA)
                </h2>

                <p className="text-sm text-muted-foreground">
                    Use security keys or passkeys to sign in.
                </p>
            </div>
            <div>
                <ManageTwoFactor {...props} />
            </div>
        </section>
    );
}