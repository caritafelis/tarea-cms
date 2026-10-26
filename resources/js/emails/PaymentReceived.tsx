import { Button, Heading, Text } from '@react-email/components';
import Layout, { KeyValue, styles } from './components/layout';

export default function PaymentReceived({
    name = 'there', plan = 'Professional', amount = '$90.85', date = 'Oct 8, 2026',
    transactionId = 'TX-123', authCode = '123456', nextBilling = 'Nov 8, 2026',
    url = 'https://example.com', appName = 'ZX Hub',
}) {
    return (
        <Layout preview={`Payment received: ${amount}`} appName={appName} footer="Keep this email as your receipt.">
            <Heading as="h1" style={styles.h1}>Payment received</Heading>
            <Text style={styles.p}>Hi {name}, thanks! Your {plan} subscription is active.</Text>
            <KeyValue rows={[['Amount', amount], ['Date', date], ['Transaction ID', transactionId], ['Authorization code', authCode], ['Next billing', nextBilling]]} />
            <Button href={url} style={styles.button}>View billing</Button>
        </Layout>
    );
}