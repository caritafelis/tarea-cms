import { Button, Heading, Text } from '@react-email/components';
import Layout, { KeyValue, styles } from './components/layout';

export default function OrderShipped({ name = 'there', orderNumber = '1001', carrier = 'Servientrega', tracking = 'ABC123', url = 'https://example.com', appName = 'My Store' }) {
    return (
        <Layout preview={`Order #${orderNumber} is on its way`} appName={appName}>
            <Heading as="h1" style={styles.h1}>Your order is on its way</Heading>
            <Text style={styles.p}>Hi {name}, order #{orderNumber} has shipped.</Text>
            <KeyValue rows={[['Carrier', carrier], ['Tracking number', tracking]]} />
            <Button href={url} style={styles.button}>Track package</Button>
        </Layout>
    );
}