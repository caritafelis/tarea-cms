import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BillingSettings } from '@/types';
import { useForm } from '@inertiajs/react';
import { MapPin, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Field } from './billing-ui';
import { useBillingBase } from './use-billing-base';

export function ContactDetailsCard({ data }: { data: BillingSettings }) {
    const base = useBillingBase();
    const { contact } = data;
    const [open, setOpen] = useState(false);
    const form = useForm({ billing_email: contact.alternative_email ?? '' });

    const initials = contact.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');

    function handleOpen(v: boolean) {
        if (v) { form.setData('billing_email', contact.alternative_email ?? ''); form.clearErrors(); }
        setOpen(v);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        // Ruta esperada: PATCH {base}/contact -> BillingController@updateContact
        form.patch(`${base}/contact`, {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); toast.success('Billing email updated.'); },
        });
    }

    return (
        <Card className="border-border/60">
            <CardContent className="p-4 sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium">Contact details</p>
                        <p className="text-xs text-muted-foreground">Where we send invoices and billing notices.</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleOpen(true)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-border/60 p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {initials || '?'}
                    </span>
                    <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                        <div className="min-w-0">
                            <p className="text-sm font-medium">{contact.name}</p>
                            <p className="break-all text-sm text-muted-foreground">{contact.email}</p>
                            <Badge variant={contact.status === 'active' ? 'default' : 'outline'} className="mt-2">
                                {contact.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Billing email</p>
                            {contact.alternative_email ? (
                                <p className="break-all text-sm">{contact.alternative_email}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">Not set. We’ll use your account email.</p>
                            )}
                        </div>
                    </div>
                </div>

                {contact.locations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {contact.locations.map((l) => (
                            <span key={l} className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" /> {l}
                            </span>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog open={open} onOpenChange={handleOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Billing email</DialogTitle>
                        <DialogDescription>Invoices and payment notices will be sent here. Leave it empty to use your account email.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <Field label="Email" htmlFor="billing-email" error={form.errors.billing_email}>
                            <Input
                                id="billing-email"
                                type="email"
                                autoComplete="email"
                                placeholder="billing@company.com"
                                value={form.data.billing_email}
                                onChange={(e) => form.setData('billing_email', e.target.value)}
                            />
                        </Field>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>{form.processing ? 'Saving…' : 'Save changes'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}