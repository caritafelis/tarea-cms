import { Team } from "./teams";

export type Option = { value: string; label: string };
export type BillingInterval = 'month' | 'year';
export type Template = {
    id: string;
    label: string;
    description: string;
    pages: string[];
    recommended: boolean
};

export type Plan = {
    slug: string;
    name: string;
    tier: string;
    interval: BillingInterval;
    has_ecommerce: boolean;
    price_cents: number;
    features: {
        label: string;
        included: boolean
    }[];
    paypal_available: boolean;
};

export type Nuvei = { env: string; code: string; key: string };

export type Props = {
    team: Team;
    plans: Plan[];
    businessTypes: Option[];
    projectTypes: Option[];
    vat: number;
    nuvei: Nuvei;
    selectedPlan: Plan | null;
    templates: Template[];
    marketingUrl: string;
};

export type CardPayload = {
    token: string;
    brand?: string;
    holder_name: string;
    last_four: string;
    exp_month: number;
    exp_year: number;
};

export type AuthProps = { auth: { user: { id: number; email: string } } };

declare global {
    interface Window {
        Paymentez?: any;
    }
}