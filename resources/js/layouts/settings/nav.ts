import {
    Archive, Boxes, CreditCard, Database, Globe, Languages, Layers, Mail,
    Plug, Puzzle, Search, Settings2, ShieldCheck, Webhook as WebhookIcon, type LucideIcon,
} from 'lucide-react';

export const settingsTabKeys = [
    'general', 'localization', 'seo', 'api', 'email', 'storage',
    'webhooks', 'integrations', 'plugins', 'security', 'backups',
    'advanced', 'billing', 'plan',
] as const;

export type SettingsTabKey = (typeof settingsTabKeys)[number];

export interface SettingsTabMeta {
    key: SettingsTabKey;
    label: string;
    description: string;
    icon: LucideIcon;
}

/** Orden = orden en el sidebar de settings. */
export const settingsTabs: SettingsTabMeta[] = [
    { key: 'general', label: 'General', description: 'Site identity and basic information.', icon: Globe },
    { key: 'localization', label: 'Localization', description: 'Language, timezone and regional formats.', icon: Languages },
    { key: 'seo', label: 'SEO', description: 'Metadata and files search engines read.', icon: Search },
    { key: 'email', label: 'Email', description: 'How your workspace sends email.', icon: Mail },
    { key: 'storage', label: 'Storage', description: 'Where files are stored and how much you use.', icon: Database },
    { key: 'integrations', label: 'Integrations', description: 'Connect third-party services.', icon: Boxes },
    { key: 'api', label: 'API', description: 'Keys and endpoints for programmatic access.', icon: Plug },
    { key: 'webhooks', label: 'Webhooks', description: 'Send events to other systems.', icon: WebhookIcon },
    { key: 'plugins', label: 'Plugins', description: 'Turn extensions on or off.', icon: Puzzle },
    { key: 'plan', label: 'Plan', description: 'Compare plans and manage what customers can buy.', icon: Layers },
    { key: 'billing', label: 'Billing', description: 'Manage your organization’s billing and usage.', icon: CreditCard },
    { key: 'security', label: 'Security policy', description: 'Workspace-wide security rules and access policy.', icon: ShieldCheck },
    { key: 'backups', label: 'Backups', description: 'Schedule, run and download backups.', icon: Archive },
    { key: 'advanced', label: 'Advanced', description: 'System actions and low-level options.', icon: Settings2 },
];