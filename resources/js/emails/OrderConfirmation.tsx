import { Button, Heading, Hr, Text } from '@react-email/components';
import Layout, { Items, KeyValue, styles } from './components/layout';

export default function OrderConfirmation({
    name = 'there', orderNumber = '1001', subtotal = '$80.00', shipping = '$5.00', tax = '$10.85',
    total = '$95.85', address = '123 Main St, Guayaquil', url = 'https://example.com', appName = 'My Store',
}) {
    return (
        <Layout preview={`Order #${orderNumber} confirmed`} appName={appName} footer="Questions about your order? Just reply to this email.">
            <Heading as="h1" style={styles.h1}>Thank you for your order!</Heading>
            <Text style={styles.p}>Hi {name}, order #{orderNumber} is confirmed.</Text>
            <Items />
            <Hr style={{ borderColor: '#e4e4e7' }} />
            <KeyValue rows={[['Subtotal', subtotal], ['Shipping', shipping], ['Tax', tax], ['Total', total]]} />
            <Text style={styles.p}>Shipping to: {address}</Text>
            <Button href={url} style={styles.button}>View order</Button>
        </Layout>
    );
}