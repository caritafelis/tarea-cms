import { Button, Heading, Text } from '@react-email/components';
import Layout, { styles } from './components/layout';

export default function PaymentFailed({ name = 'there', plan = 'Professional', amount = '$90.85', retryDate = 'Oct 9, 2026', url = 'https://example.com', appName = 'ZX Hub' }) {
    return (
        <Layout preview="We couldn't process your payment" appName={appName}>
            <Heading as="h1" style={styles.h1}>Payment failed</Heading>
            <Text style={styles.p}>
                Hi {name}, we couldn't charge {amount} for your {plan} plan. We'll try again on {retryDate}. Update your card to avoid losing access.
            </Text>
            <Button href={url} style={styles.button}>Update payment method</Button>
        </Layout>
    );
}