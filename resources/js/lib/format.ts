const fractionDigits = (currency: string): number => {
    try {
        return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
    } catch {
        return 2;
    }
};

export function formatMoney(minor: number | string | null | undefined, currency = 'USD'): string {
    const value = Number(minor ?? 0) / 10 ** fractionDigits(currency);
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
    } catch {
        return `${value.toFixed(2)} ${currency}`;
    }
}

export const formatDate = (v?: string | null, withTime = false): string =>
    v ? new Date(v).toLocaleString(undefined, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }) : '—';

export const toDateTimeLocal = (v?: string | null): string => {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const humanize = (s?: string | null): string => (s ? s.replace(/_/g, ' ') : '—');

export const slugify = (s: string): string =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const toMinor = (v: string | number | null | undefined, currency = 'USD'): number | null =>
    v === '' || v == null ? null : Math.round(Number(v) * 10 ** fractionDigits(currency));

export const fromMinor = (v: number | null | undefined, currency = 'USD'): string =>
    v == null ? '' : String(v / 10 ** fractionDigits(currency));