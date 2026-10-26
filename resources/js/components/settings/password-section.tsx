import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import ChangePasswordDialog from './change-password-dialog';
import UpdatePasswordStep from './update-password-step';

interface Props {
    passwordRules: string;
    onVerified: () => void;
}

export default function PasswordSection({
    passwordRules,
    onVerified,
}: Props) {

    const [openVerify, setOpenVerify] =
        useState(false);

    return (
        <>
            <section className="border-b py-3">
                <button
                    type="button"
                    onClick={() => setOpenVerify(true)}
                    className="flex w-full items-center justify-between text-left"
                >
                    <h3 className="font-medium">
                        Password
                    </h3>
                    <div className='flex items-center gap-3'>
                        <p className="mt-1 text-md text-muted-foreground">
                            ******
                        </p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>


                </button>
            </section>

            <ChangePasswordDialog
                open={openVerify}
                onOpenChange={setOpenVerify}
                onVerified={() => {
                    setOpenVerify(false);
                    onVerified();
                }}
            />
        </>
    );
}