import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    We sent a new link and code to your email.
                </div>
            )}

            <Form action="/email/verify-code" method="post" className="space-y-3">
                {({ processing, errors }) => (
                    <>
                        <Input
                            name="code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="123456"
                            className="text-center text-lg tracking-[0.5em]"
                            autoFocus
                        />
                        <InputError message={errors.code} />
                        <Button disabled={processing} className="w-full">
                            {processing && <Spinner />}
                            Verify code
                        </Button>
                    </>
                )}
            </Form>

            <Form {...send.form()} className="mt-6 space-y-4 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            Resend email
                        </Button>
                        <TextLink href={logout()} className="mx-auto block text-sm">
                            Log out
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verify your email',
    description: 'Enter the 6-digit code we emailed you, or click the link in the email.',
};