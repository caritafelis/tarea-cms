import { Button, Heading, Text } from '@react-email/components';
import Layout, { styles } from './components/layout';

export default function SubscriptionCanceled({ name = 'there', plan = 'Professional', endsAt = 'Nov 8, 2026', url = 'https://example.com', appName = 'ZX Hub' }) {
    return (
        <Layout preview="Your subscription was canceled" appName={appName}>
            <Heading as="h1" style={styles.h1}>Subscription canceled</Heading>
            <Text style={styles.p}>Hi {name}, your {plan} plan stays active until {endsAt}. You can resume it any time before then.</Text>
            <Button href={url} style={styles.button}>Resume subscription</Button>
        </Layout>
    );
}