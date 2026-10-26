import { Head } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { SettingsPageProps } from '@/types/settings';
import SettingsLayout, { type SettingsTabKey } from '@/layouts/settings/layout';
import { useSettingsTab } from '@/hooks/use-settings-tab';

// import GeneralTab from './general';
// import LocalizationTab from './localization';
// import SeoTab from './seo';
// import ApiTab from './api';
// import EmailTab from './email';
// import StorageTab from './storage';
// import WebhooksTab from './webhooks';
// import IntegrationsTab from './integrations';
// import PluginsTab from './plugins';
// import SecurityTab from './security';
// import BackupsTab from './backups';
// import AdvancedTab from './advanced';
// import BillingTab from './billing';
// import PlanTab from './plan';

const GeneralTab = lazy(() => import('./general'));
const LocalizationTab = lazy(() => import('./localization'));
const SeoTab = lazy(() => import('./seo'));
const ApiTab = lazy(() => import('./api'));
const EmailTab = lazy(() => import('./email'));
const StorageTab = lazy(() => import('./storage'));
const WebhooksTab = lazy(() => import('./webhooks'));
const IntegrationsTab = lazy(() => import('./integrations'));
const PluginsTab = lazy(() => import('./plugins'));
const SecurityTab = lazy(() => import('./security'));
const BackupsTab = lazy(() => import('./backups'));
const AdvancedTab = lazy(() => import('./advanced'));
const BillingTab = lazy(() => import('./billing'));
const PlanTab = lazy(() => import('./plan'));

const TAB_TITLES: Record<SettingsTabKey, string> = {
  general: 'General',
  localization: 'Localization',
  seo: 'SEO',
  api: 'API',
  email: 'Email',
  storage: 'Storage',
  webhooks: 'Webhooks',
  integrations: 'Integrations',
  plugins: 'Plugins',
  security: 'Security',
  backups: 'Backups',
  advanced: 'Advanced',
  billing: 'Billing',
  plan: 'Plan',
};

export default function Index(props: SettingsPageProps) {
  const [tab, setTab] = useSettingsTab();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head title="Settings" />
      <SettingsLayout active={tab} onChange={setTab}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {mounted ? (
              <Suspense fallback={<TabSkeleton />}>
                {tab === 'general' && <GeneralTab data={props.general} />}
                {tab === 'localization' && <LocalizationTab data={props.localization} />}
                {tab === 'seo' && <SeoTab data={props.seo} />}
                {tab === 'api' && <ApiTab data={props.api} />}
                {tab === 'email' && <EmailTab data={props.email} />}
                {tab === 'storage' && <StorageTab data={props.storage} />}
                {tab === 'webhooks' && <WebhooksTab data={props.webhooks} />}
                {tab === 'integrations' && <IntegrationsTab data={props.integrations} />}
                {tab === 'plugins' && <PluginsTab data={props.plugins} />}
                {tab === 'security' && <SecurityTab data={props.security} />}
                {tab === 'backups' && <BackupsTab data={props.backups} />}
                {tab === 'advanced' && <AdvancedTab data={props.advanced} />}
                {tab === 'billing' && <BillingTab data={props.billing} />}
                {tab === 'plan' && <PlanTab data={props.billing} />}
              </Suspense>
            ) : (
              <TabSkeleton />
            )}
          </motion.div>
        </AnimatePresence>
      </SettingsLayout>
    </>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}