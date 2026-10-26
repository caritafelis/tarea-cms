import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';

interface Props extends ManagePasskeysProps {
    compact?: boolean;
    standalone?: boolean;

    onOpen?: () => void;
    onBack?: () => void;
}

export default function PasskeysSection({
    compact = false,
    standalone = false,
    onOpen,
    onBack,
    ...props
}: Props) {
    /**
     * Home screen
     */
    if (compact) {
        return (
            <section className="border-b py-3">
                <button
                    type="button"
                    onClick={onOpen}
                    className="flex w-full items-center justify-between text-left"
                >
                    <div>
                        <h3 className="font-medium">
                            Security keys & passkeys
                        </h3>

                        <p className="text-sm text-muted-foreground">
                            Use security keys or passkeys to sign in.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm">
                            Add
                        </span>

                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                </button>
            </section>
        );
    }

    /**
     * Standalone page
     */

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <div>
                    <h2 className="text-xl font-semibold">
                        Security keys & passkeys
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        View and manage all of your active security keys
                        and passkeys.
                    </p>
                </div>
            </div>

            <ManagePasskeys {...props} />

            <section className="rounded-xl border bg-muted/30 p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-medium">
                            Get a YubiKey
                        </h3>

                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                            Physical security keys provide the highest
                            level of protection against phishing attacks.
                        </p>
                    </div>

                    <Badge variant="secondary">
                        Coming soon
                    </Badge>
                </div>

                <Button
                    className="mt-6"
                    variant="outline"
                    disabled
                >
                    Request a YubiKey
                </Button>
            </section>
        </div>
    );
}