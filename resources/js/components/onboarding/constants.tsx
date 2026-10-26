
import { BiSolidCreditCardAlt } from 'react-icons/bi';
import { FaLayerGroup } from 'react-icons/fa';
import { GrGraphQl } from 'react-icons/gr';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { IoBusiness } from 'react-icons/io5';
import { TbApi, TbWebhook } from 'react-icons/tb';

export const BRAND = 'Plinth';
export const SUPPORT_EMAIL = 'support@plinth.dev'; // TODO: reemplazar por tu correo real
export const SALES_EMAIL = 'sales@plinth.dev'; // TODO: reemplazar por tu correo real
export const DOCS_URL = 'https://docs.plinth.dev'; // TODO: reemplazar por tu dominio de documentación

/**
 * ⚠️ Valores de `project_type` que ya implican e-commerce.
 * Cámbialo por el `value` real que envía tu backend para "Sales / Services (e-commerce)".
 */
export const ECOMMERCE_PROJECT_TYPES = ['sales_services'];
export const isEcommerceProject = (value: string | null) => !!value && ECOMMERCE_PROJECT_TYPES.includes(value);

export const DOCS = [
    { label: 'REST API', href: `${DOCS_URL}/api/rest`, icon: TbApi, size: 'size-6' },
    { label: 'GraphQL API', href: `${DOCS_URL}/api/graphql`, icon: GrGraphQl, size: 'size-4' },
    { label: 'Webhooks', href: `${DOCS_URL}/api/webhooks`, icon: TbWebhook, size: 'size-5' },
];

export const PINK = 'bg-[#c4229f] hover:bg-[#ab1b8a] focus-visible:outline-[#c4229f]';
export const PINK_TEXT = 'text-[#c4229f]';

export const STEPS = [
    { key: 'workspace', title: 'Workspace', desc: 'Give your workspace a name so your team and customers recognize it.', icon: HiOutlineUserGroup },
    { key: 'business', title: 'Your business', desc: 'Tell us what kind of business and project you run so we can tailor your setup.', icon: IoBusiness },
    { key: 'plan', title: 'Choose plan', desc: 'Pick the plan that fits you today. You can add an online store whenever you need it.', icon: FaLayerGroup },
    { key: 'payment', title: 'Payment', desc: 'Pay securely and activate your workspace right away.', icon: BiSolidCreditCardAlt },
] as const;

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const inputCls =
    'h-14 w-full rounded-lg border border-neutral-200 bg-white px-5 text-base text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-[#c4229f] focus:outline-none focus:ring-4 focus:ring-[#c4229f]/10';