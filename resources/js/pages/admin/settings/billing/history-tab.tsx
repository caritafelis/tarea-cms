import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BillingInvoice } from '@/types';
import { Download, FileText, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState, InvoiceStatusBadge, invoiceStatusOptions } from './billing-ui';
import { useBillingBase } from './use-billing-base';

/**
 * Reemplaza a HistoryTab + InvoicesSection (eran casi iguales).
 * Puedes borrar invoices-section.tsx.
 */
export default function HistoryTab({ invoices, title = 'Billing history' }: { invoices: BillingInvoice[]; title?: string }) {
    const base = useBillingBase();
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<string>('all');
    const [selected, setSelected] = useState<number[]>([]);

    const filtered = useMemo(
        () =>
            invoices.filter(
                (i) =>
                    (status === 'all' || i.status === status) &&
                    i.number.toLowerCase().includes(query.trim().toLowerCase()),
            ),
        [invoices, query, status],
    );

    const visibleIds = filtered.map((i) => i.id);
    const selectedVisible = selected.filter((id) => visibleIds.includes(id));
    const allSelected = filtered.length > 0 && selectedVisible.length === filtered.length;
    const someSelected = selectedVisible.length > 0 && !allSelected;

    const openPdf = (id: number) => window.open(`${base}/invoices/${id}/download`, '_blank');

    function toggle(id: number) {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    function toggleAll() {
        setSelected(allSelected ? selected.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...selected, ...visibleIds])));
    }

    function downloadMany() {
        const pool = selectedVisible.length ? filtered.filter((i) => selectedVisible.includes(i.id)) : filtered;
        const ids = pool.filter((i) => i.pdf_url).map((i) => i.id);
        if (ids.length === 0) return;
        if (ids.length > 1) toast.info('Your browser may ask you to allow pop-ups to download several invoices.');
        ids.forEach((id, index) => setTimeout(() => openPdf(id), index * 350));
    }

    const downloadableCount = (selectedVisible.length ? filtered.filter((i) => selectedVisible.includes(i.id)) : filtered).filter((i) => i.pdf_url).length;
    const hasFilters = query !== '' || status !== 'all';

    return (
        <Card className="border-border/60">
            <CardContent className="p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium">
                            {title} <span className="ml-1 font-normal text-muted-foreground">{invoices.length}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Search, filter and download your invoices.</p>
                    </div>
                    <Button size="sm" onClick={downloadMany} disabled={downloadableCount === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        {selectedVisible.length ? `Download ${downloadableCount}` : 'Download all'}
                    </Button>
                </div>

                {invoices.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-8" placeholder="Search by invoice number" aria-label="Search invoices" value={query} onChange={(e) => setQuery(e.target.value)} />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="sm:w-44" aria-label="Filter by status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {invoiceStatusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {hasFilters && (
                            <Button variant="ghost" onClick={() => { setQuery(''); setStatus('all'); }}>
                                <X className="mr-1.5 h-4 w-4" /> Clear
                            </Button>
                        )}
                    </div>
                )}

                {invoices.length === 0 ? (
                    <EmptyState icon={FileText} title="No invoices yet" description="Invoices appear here after your first payment." />
                ) : filtered.length === 0 ? (
                    <EmptyState icon={Search} title="No invoices match your filters" action={<Button size="sm" variant="outline" onClick={() => { setQuery(''); setStatus('all'); }}>Clear filters</Button>} />
                ) : (
                    <>
                        {/* Desktop / tablet */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                                        <th className="w-10 py-3">
                                            <Checkbox
                                                aria-label="Select all invoices"
                                                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                                onCheckedChange={toggleAll}
                                            />
                                        </th>
                                        <th className="py-3 font-medium">Invoice</th>
                                        <th className="py-3 font-medium">Date</th>
                                        <th className="py-3 font-medium">Amount</th>
                                        <th className="py-3 font-medium">Status</th>
                                        <th className="py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((inv) => (
                                        <tr key={inv.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                                            <td className="py-3">
                                                <Checkbox aria-label={`Select invoice ${inv.number}`} checked={selected.includes(inv.id)} onCheckedChange={() => toggle(inv.id)} />
                                            </td>
                                            <td className="py-3">
                                                <span className="flex items-center gap-2 font-medium">
                                                    <FileText className="h-4 w-4 text-muted-foreground" /> #{inv.number}
                                                </span>
                                            </td>
                                            <td className="py-3 text-muted-foreground">{inv.paid_at ?? 'Pending'}</td>
                                            <td className="py-3 tabular-nums">{inv.amount}</td>
                                            <td className="py-3"><InvoiceStatusBadge status={inv.status} /></td>
                                            <td className="py-3 text-right">
                                                <Button size="sm" variant="ghost" disabled={!inv.pdf_url} onClick={() => openPdf(inv.id)}>
                                                    <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <ul className="divide-y divide-border/60 md:hidden">
                            {filtered.map((inv) => (
                                <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">#{inv.number}</p>
                                            <p className="text-xs text-muted-foreground">{inv.paid_at ?? 'Pending'} · {inv.amount}</p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <InvoiceStatusBadge status={inv.status} />
                                        <Button size="icon" variant="ghost" aria-label="Download invoice" disabled={!inv.pdf_url} onClick={() => openPdf(inv.id)}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <p className="mt-3 text-xs text-muted-foreground">
                            Showing {filtered.length} of {invoices.length}
                            {selectedVisible.length > 0 && ` · ${selectedVisible.length} selected`}
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}