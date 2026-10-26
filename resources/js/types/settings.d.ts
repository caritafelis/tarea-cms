export type ApiEnvironment = 'live' | 'test';

export interface GeneralSettings {
  name: string;
  description: string | null;
  logo: string | null;
  favicon: string | null;
  default_language: string;
  default_timezone: string;
  date_format: string;
  time_format: string;
  homepage: string | null;
  maintenance_mode: boolean;
}

export interface LocalizationSettings {
  default_locale: string;
  active_locales: string[];
  timezone: string;
  first_day_of_week: number;
  rtl_support: boolean;
}

export interface SeoFile {
  label: string;
  path: string;
  exists: boolean;
  generated_at: string | null;
}

export interface SeoSettings {
  meta: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string;
    robots?: string;
    canonical_url?: string;
    og_image?: string;
    twitter_card_type?: string;
    json_ld?: string;
  };
  files: SeoFile[];
}

export interface ApiKey {
  id: number;
  name: string;
  environment: ApiEnvironment;
  key_prefix: string;
  abilities: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface RestEndpoint {
  methods: string[];
  uri: string;
  name: string | null;
  middleware: string[];
}

export interface ApiPermissionResource {
  key: string;
  label: string;
  actions: ('read' | 'create' | 'update' | 'delete')[];
  sensitive: boolean;
}
export interface ApiPermissionGroup {
  key: string;
  label: string;
  description: string;
  resources: ApiPermissionResource[];
}
export interface ApiPermissionPreset {
  id: string;
  label: string;
  description: string;
  abilities: string[];
  test: boolean;
}
export interface ApiPermissions {
  groups: ApiPermissionGroup[];
  presets: ApiPermissionPreset[];
  drafts: string;
}

export interface ApiSettings {
  summary: {
    base_url: string;
    version: string;
    rate_limit: string;
    openapi_url: string;
    test_keys_can_write: boolean;
    graphql: { endpoint: string; playground: string; enabled: boolean };
  };
  permissions: ApiPermissions;
  plain_text_key?: string | null;
  endpoints: RestEndpoint[];
  keys: ApiKey[];
}

// ---------------------------------------------------------------------
// Email — ya NO asume SMTP: el proveedor define sus propios campos.
// "credentials" trae solo las keys que ese proveedor necesita, y
// "providers" es el catálogo completo que manda el backend
// (MailProviderRegistry) para que el frontend renderice el form
// correcto según el "mailer" elegido.
// ---------------------------------------------------------------------

export interface MailProviderField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface MailProvider {
  label: string;
  description: string;
  fields: MailProviderField[];
}

export interface EmailSettings {
  mailer: string;
  from_name: string | null;
  from_address: string | null;
  credentials: Record<string, string>;
  providers: Record<string, MailProvider>;
}

export interface StorageSettings {
  settings: {
    driver?: string;
    key?: string;
    secret?: string;
    region?: string;
    bucket?: string;
    endpoint?: string;
    url?: string;
    use_path_style_endpoint?: boolean;
  };
  usage: { used_bytes: number; used_human: string };
}

export interface Webhook {
  id: number;
  name: string;
  environment: ApiEnvironment;
  url: string;
  events: string[];
  is_active: boolean;
  logs_count: number;
  created_at: string;
}

export interface WebhooksSettings {
  items: Webhook[];
  events: string[];
}

export interface Plugin {
  id: number;
  name: string;
  slug: string;
  version: string | null;
  author: string | null;
  description: string | null;
  is_active: boolean;
}

// ---------------------------------------------------------------------
// Security — se agrega "sessions" (Browsers and devices), alimentado
// por la tabla real "sessions" (driver de sesión database).
// ---------------------------------------------------------------------

export interface SecuritySessionRow {
  id: string;
  ip_address: string;
  is_current_device: boolean;
  last_active: string;
  browser: string;
  platform: string;
}

export interface SecuritySettings {
  cors_allowed_origins?: string[];
  password_min_length?: number;
  password_require_uppercase?: boolean;
  password_require_number?: boolean;
  password_require_symbol?: boolean;
  two_factor_enabled?: boolean;
  session_lifetime_minutes?: number;
  trusted_proxies?: string;
  rate_limit_per_minute?: number;
  sessions: SecuritySessionRow[];
}

export interface Backup {
  id: number;
  disk: string;
  path: string;
  size_bytes: number;
  status: string;
  type: string;
  created_at: string;
}

export interface BackupsSettings {
  settings: { destination?: string; schedule?: string; retention_days?: number };
  items: Backup[];
}

export interface AdvancedSettings {
  app_name?: string;
  app_url?: string;
  app_env?: string;
  cache_driver?: string;
  queue_connection?: string;
  log_channel?: string;
  debug?: boolean;
  maintenance_mode?: boolean;
}

export interface SettingsPageProps {
  general: GeneralSettings;
  localization: LocalizationSettings;
  seo: SeoSettings;
  api: ApiSettings;
  email: EmailSettings;
  storage: StorageSettings;
  webhooks: WebhooksSettings;
  integrations: Record<string, unknown>;
  plugins: Plugin[];
  security: SecuritySettings;
  backups: BackupsSettings;
  advanced: AdvancedSettings;
  billing: BillingSettings;
}