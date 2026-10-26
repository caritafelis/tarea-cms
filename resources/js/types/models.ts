import { User } from "./auth";

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    first_page_url: string | null;
};

export type Role = {
    id: number;
    name: string;
    permissions: string[];
    created_at: string;
    updated_at: string;
};

export type Permission = {
    id: number;
    name: string;
    role_id: number;
    created_at: string;
    updated_at: string;
};

export type Client = {
    id: number;
    name: string;
    company: string | null;
    email: string;
    phone: string | null;
    country: string | null;
    city: string | null;
    type: 'direct' | 'referred';
    referred_by: string | null;
    notes: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    projects?: Project[];
    support_tickets?: SupportTicket[];
    invoices?: Invoice[];
};

export type Project = {
    id: number;
    client_id: number;
    user_id: number | null;
    name: string;
    slug: string;
    type: string;
    stack: string;
    status: string;
    price: string;
    includes_license: boolean;
    includes_hosting: boolean;
    includes_domain: boolean;
    includes_support: boolean;
    delivery_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    client?: Client;
    staff?: any;
    license?: License;
    domain?: Domain;
    hosting?: Hosting;
    support_tickets?: SupportTicket[];
};

export type Domain = {
    id: number;
    project_id: number;
    domain: string;
    name: string;
    registrar: string;
    provider: string;
    purchased_by_us: boolean;
    cost: string | null;
    price: string | null;
    renewal_date: string | null;
    expiry_date: string | null;
    auto_renew: boolean;
    status: string;
    created_at: string;
    updated_at: string;
    project?: Project;
};

export type Hosting = {
    id: number;
    project_id: number;
    provider: string;
    server: string | null;
    plan: string | null;
    disk: string | null;
    bandwidth: string | null;
    monthly_price: string | null;
    annual_price: string | null;
    renewal_date: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    project?: Project;
};

export type License = {
    id: number;
    project_id: number;
    license_key: string;
    domain: string;
    type: string;
    status: string;
    activated_at: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    project?: Project;
};

export type SupportTicket = {
    id: number;
    client_id: number;
    project_id: number | null;
    subject: string;
    message: string;
    priority: string;
    status: string;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
    client?: Client;
    project?: Project;
};

export type Invoice = {
    id: number;
    client_id: number;
    project_id: number | null;
    invoice_number: string;
    subtotal: string;
    tax: string;
    total: string;
    status: string;
    issue_date: string;
    due_date: string;
    paid_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    client?: Client;
    project?: Project;
};

export type ChecklistItem = {
    id: number;
    title: string;
    status: boolean;
    sort_order: number;
};

export type TaskComment = {
    id: number;
    task_id: number;
    user_id: number;
    comment: string;
    created_at: string;
    updated_at: string;
    user: User;
};

export type TaskStatus =
    | 'todo'
    | 'in_progress'
    | 'review'
    | 'done';

export type TaskPriority =
    | 'low'
    | 'medium'
    | 'high'
    | 'urgent';

export type TaskState =
    | 'pending'
    | 'analysis'
    | 'design'
    | 'development'
    | 'testing'
    | 'review'
    | 'blocked'
    | 'completed'
    | 'cancelled';

export type Task = {
    id: number;
    project_id: number;
    title: string;
    description?: string | null;
    status: TaskStatus;
    state: TaskState;
    priority: TaskPriority;
    due_date?: string | null;
    tags?: string[];
    checklist?: ChecklistItem[];
    comments?: TaskComment[];
    user?: User | null;
    users?: User[] | null;
    project?: Project | null;
};

export type Column = {
    id: TaskStatus;
    title: string;
    tasks: Task[];
};