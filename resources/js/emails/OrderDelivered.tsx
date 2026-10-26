import { Button, Heading, Text } from '@react-email/components';
import Layout, { styles } from './components/layout';

export default function OrderDelivered({ name = 'there', orderNumber = '1001', url = 'https://example.com', appName = 'My Store' }) {
    return (
        <Layout preview={`Order #${orderNumber} delivered`} appName={appName}>
            <Heading as="h1" style={styles.h1}>Your order was delivered</Heading>
            <Text style={styles.p}>Hi {name}, order #{orderNumber} has arrived. We hope you love it!</Text>
            <Button href={url} style={styles.button}>View order</Button>
        </Layout>
    );
}