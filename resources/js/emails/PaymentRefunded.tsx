import { Heading, Text } from '@react-email/components';
import Layout, { KeyValue, styles } from './components/layout';

export default function PaymentRefunded({ name = 'there', amount = '$90.85', transactionId = 'TX-123', appName = 'ZX Hub' }) {
    return (
        <Layout preview={`Refund of ${amount}`} appName={appName}>
            <Heading as="h1" style={styles.h1}>Refund processed</Heading>
            <Text style={styles.p}>Hi {name}, we refunded your payment. It may take a few business days to appear on your statement.</Text>
            <KeyValue rows={[['Refund', amount], ['Transaction ID', transactionId]]} />
        </Layout>
    );
}