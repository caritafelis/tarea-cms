import { cn } from '@/lib/utils';
import { FileText, Mail, Server, Terminal, type LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { SiBrevo, SiGmail, SiMailchimp, SiMailgun, SiMailtrap, SiResend, SiSparkpost, SiZoho } from 'react-icons/si';

type BrandIcon = (props: { className?: string; style?: CSSProperties }) => ReactNode;

/* ------------------------------------------------------------------ */
/*  Logos que ya no trae react-icons: path oficial de Simple Icons     */
/*  (CC0), incrustado para no depender de archivos ni de versiones.    */
/* ------------------------------------------------------------------ */

const SES_PATH =
    'M11.9996 0C5.3833 0 0 5.3834 0 11.9998c0 2.5316.7813 4.9544 2.2599 7.0051l.6955-.5014C1.5827 16.5993.8571 14.3505.8571 11.9998.8571 5.856 5.856.8572 12.0004.8572c6.144 0 11.1425 4.999 11.1425 11.1426 0 2.3508-.7256 4.5995-2.0983 6.5037l.6955.5014C23.2187 16.9542 24 14.5314 24 11.9998 24 5.3834 18.6163 0 11.9996 0zM6 16.7142a.4285.4285 0 0 0-.4286.4285v1.7598c-.9643.2048-1.7143 1.0822-1.7143 2.0974 0 1.1615.9815 2.143 2.1429 2.143s2.1429-.9815 2.1429-2.143c0-1.0152-.75-1.8926-1.7143-2.0974v-1.3312h5.1428v2.1883c-.9643.2049-1.7143 1.0822-1.7143 2.0975C9.8571 23.0186 10.8386 24 12 24s2.1429-.9814 2.1429-2.1429c0-1.0153-.75-1.8926-1.7143-2.0975v-2.1883h5.1428v1.3312c-.9643.2048-1.7143 1.0822-1.7143 2.0974 0 1.1615.9815 2.143 2.1429 2.143s2.1429-.9815 2.1429-2.143c0-1.0152-.75-1.8926-1.7143-2.0974v-1.7598A.4285.4285 0 0 0 18 16.7142h-5.5714v-2.5715H18c.237 0 .4286-.192.4286-.4286V5.9997A.4285.4285 0 0 0 18 5.571H6a.4285.4285 0 0 0-.4286.4286v7.7144c0 .2366.1916.4286.4286.4286h5.5714v2.5715H6zm1.2857 4.2857c0 .697-.5889 1.2858-1.2857 1.2858s-1.2857-.5889-1.2857-1.2858c0-.6968.5889-1.2857 1.2857-1.2857S7.2857 20.3031 7.2857 21zm12 0c0 .697-.5889 1.2858-1.2857 1.2858s-1.2857-.5889-1.2857-1.2858c0-.6968.5889-1.2857 1.2857-1.2857s1.2857.5889 1.2857 1.2857zm-1.7143-8.248L14.259 9.7703l3.3124-2.8389v5.8205zm-.7298-6.3236-4.842 4.1499-4.8412-4.15h9.6832zm-10.413.5031L9.741 9.7707 6.4286 12.752V6.9314zm.6878 6.3541 3.2807-2.9525 1.3239 1.135a.4253.4253 0 0 0 .2786.1032.4253.4253 0 0 0 .2785-.1033l1.3243-1.1349 3.2812 2.9525H7.1164zM12 20.5714c.6968 0 1.2857.5888 1.2857 1.2857 0 .6969-.5889 1.2857-1.2857 1.2857s-1.2857-.5888-1.2857-1.2857c0-.6969.5889-1.2857 1.2857-1.2857z';

const OUTLOOK_PATH =
    'M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V10.85l1.24.72h.01q.1.07.18.18.07.12.07.25zm-6-8.25v3h3v-3zm0 4.5v3h3v-3zm0 4.5v1.83l3.05-1.83zm-5.25-9v3h3.75v-3zm0 4.5v3h3.75v-3zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73zM9 3.75V6h2l.13.01.12.04v-2.3zM5.98 15.98q.9 0 1.6-.3.7-.32 1.19-.86.48-.55.73-1.28.25-.74.25-1.61 0-.83-.25-1.55-.24-.71-.71-1.24t-1.15-.83q-.68-.3-1.55-.3-.92 0-1.64.3-.71.3-1.2.85-.5.54-.75 1.3-.25.74-.25 1.63 0 .85.26 1.56.26.72.74 1.23.48.52 1.17.81.69.3 1.56.3zM7.5 21h12.39L12 16.08V17q0 .41-.3.7-.29.3-.7.3H7.5zm15-.13v-7.24l-5.9 3.54Z';

const pathIcon =
    (d: string): BrandIcon =>
        ({ className, style }) => (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className} style={style}>
                <path d={d} />
            </svg>
        );

/* ------------------------------------------------------------------ */
/*  Marcas con logo y su color oficial                                 */
/* ------------------------------------------------------------------ */

const BRAND: Record<string, { icon: BrandIcon; color: string }> = {
    mailgun: { icon: SiMailgun, color: '#F06B66' },
    resend: { icon: SiResend, color: '#000000' },
    brevo: { icon: SiBrevo, color: '#0B996E' },
    mailchimp: { icon: SiMailchimp, color: '#FFE01B' },
    mailtrap: { icon: SiMailtrap, color: '#22D172' },
    gmail: { icon: SiGmail, color: '#EA4335' },
    sparkpost: { icon: SiSparkpost, color: '#FA6423' },
    zoho: { icon: SiZoho, color: '#E42527' },
    ses: { icon: pathIcon(SES_PATH), color: '#DD344C' },
    outlook: { icon: pathIcon(OUTLOOK_PATH), color: '#0078D4' },
};

/** Sin logo disponible en ningún paquete: inicial sobre el color de la marca. */
const MONOGRAM: Record<string, { letter: string; bg: string; fg: string }> = {
    postmark: { letter: 'P', bg: '#FFDE00', fg: '#000000' },
    sendgrid: { letter: 'S', bg: '#1A82E2', fg: '#FFFFFF' },
};

/** Claves de Laravel que comparten logo. */
const ALIAS: Record<string, string> = {
    'ses-v2': 'ses',
    mandrill: 'mailchimp',
    sendinblue: 'brevo',
    office365: 'outlook',
    microsoft: 'outlook',
};

/** Transportes sin marca (no son un servicio): ícono genérico. */
const GENERIC: Record<string, LucideIcon> = {
    smtp: Server,
    sendmail: Terminal,
    log: FileText,
    array: FileText,
};

export function ProviderLogo({ provider, className }: { provider: string; className?: string }) {
    const key = ALIAS[provider] ?? provider;
    const tile = 'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl';

    const brand = BRAND[key];
    if (brand) {
        const Icon = brand.icon;
        return (
            <span className={cn(tile, 'border border-border bg-white', className)}>
                <Icon className="size-5" style={{ color: brand.color }} />
            </span>
        );
    }

    const mono = MONOGRAM[key];
    if (mono) {
        return (
            <span
                aria-hidden
                className={cn(tile, 'text-lg font-bold leading-none', className)}
                style={{ backgroundColor: mono.bg, color: mono.fg }}
            >
                {mono.letter}
            </span>
        );
    }

    const Generic = GENERIC[key] ?? Mail;
    return (
        <span className={cn(tile, 'bg-muted text-muted-foreground', className)}>
            <Generic className="size-5" aria-hidden />
        </span>
    );
}