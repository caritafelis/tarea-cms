import { Heading, Text } from '@react-email/components';
import Layout, { styles } from './components/layout';

export default function OrderCancelled({ name = 'there', orderNumber = '1001', total = '$95.85', appName = 'My Store' }) {
    return (
        <Layout preview={`Order #${orderNumber} canceled`} appName={appName} footer="Questions? Reply to this email.">
            <Heading as="h1" style={styles.h1}>Order canceled</Heading>
            <Text style={styles.p}>Hi {name}, order #{orderNumber} ({total}) was canceled. If you paid, the refund will be processed shortly.</Text>
        </Layout>
    );
}