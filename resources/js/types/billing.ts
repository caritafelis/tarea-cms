export type BillingTabKey =
    | 'overview'
    | 'manage'
    | 'payment-methods'
    | 'invoices'
    | 'details';

export interface BillingPlan {
    id: number;
    name: string;
    slug: string;
    price: string;
    interval: string;
    features: PlanFeature[];
    is_current: boolean;
}

export interface PlanFeature {
    label: string;
    included: boolean;
}

export interface ManageablePlan {
    id: number;
    name: string;
    tier: string;
    slug: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    has_ecommerce: boolean;
    gateway: 'stripe' | 'paypal' | 'nuvei';
    gateway_price_id: string | null;
    features: PlanFeature[];
    is_active: boolean;
    sort_order: number;
    subscribers_count: number;
}

export interface BillingPaymentMethod {
    id: number;
    gateway: 'stripe' | 'paypal' | 'nuvei';
    type: string;
    brand: string | null;
    last_four: string | null;
    exp_month: number | null;
    exp_year: number | null;
    is_primary: boolean;
    label: string;
    is_expired: boolean;
}

export interface BillingInvoice {
    id: number;
    number: string;
    amount: string;
    status: 'paid' | 'open' | 'void' | 'uncollectible';
    paid_at: string | null;
    pdf_url: string | null;
}

export interface BillingSettings {
    contact: {
        name: string;
        email: string;
        alternative_email: string | null;
        locations: string[];
        status: 'active' | 'inactive';
    };
    current_plan: { id: number; name: string; price: string; interval: string; features: PlanFeature[] } | null;
    plans: BillingPlan[];
    manageable_plans: ManageablePlan[];
    payment_methods: BillingPaymentMethod[];
    invoices: BillingInvoice[];
    card_gateway?: 'stripe' | 'nuvei';
    subscription: {
        id: number;
        gateway: 'stripe' | 'paypal' | 'nuvei';
        status: string;
        auto_renew: boolean;
        ends_at: string | null;
        on_grace_period: boolean;
    } | null;
    alerts: {
        plan_expiring: string | null;
        incomplete_billing_details: boolean;
    };
}