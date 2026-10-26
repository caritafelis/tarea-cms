import { Heading, Hr, Row, Column, Section, Text } from '@react-email/components';
import Layout, { styles } from './components/layout';

type Props = {
    name?: string;
    planName?: string;
    interval?: string;
    amount?: string;
    transactionId?: string;
    authorizationCode?: string;
    date?: string;
    appName?: string;
};

const row = { padding: '10px 0' } as const;
const label = { ...styles.p, margin: 0, color: '#6b7280' } as const;
const value = { ...styles.p, margin: 0, textAlign: 'right', fontWeight: 600, wordBreak: 'break-all' } as const;

export default function PaymentConfirmed({
    name = 'there',
    planName = 'Professional',
    interval = 'month',
    amount = 'USD 11.50',
    transactionId = 'CB-123456',
    authorizationCode = '123456',
    date = 'Oct 12, 2026 10:30',
    appName = 'ZX Hub',
}: Props) {
    const details: [string, string][] = [
        ['Plan', `${planName} (${interval})`],
        ['Amount charged (VAT included)', amount],
        ['Transaction ID', transactionId],
        ['Authorization code', authorizationCode],
        ['Date', date],
    ];

    return (
        <Layout preview={`Payment confirmed – ${planName}`} appName={appName}>
            <Heading as="h1" style={styles.h1}>Payment confirmed</Heading>
            <Text style={styles.p}>Hi {name}, we received your payment. Here are the details of your purchase:</Text>
            <Section>
                {details.map(([k, v], i) => (
                    <div key={k}>
                        {i > 0 && <Hr style={{ borderColor: '#e5e7eb', margin: 0 }} />}
                        <Row style={row}>
                            <Column><Text style={label}>{k}</Text></Column>
                            <Column><Text style={value}>{v}</Text></Column>
                        </Row>
                    </div>
                ))}
            </Section>
            <Text style={styles.p}>Keep this email as your receipt. If you have any questions, just reply to this message.</Text>
        </Layout>
    );
}