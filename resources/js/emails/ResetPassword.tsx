import { Button, Heading, Text } from '@react-email/components';
import Layout, { styles } from './components/layout';

type Props = { name?: string; url?: string; minutes?: string; appName?: string };

export default function ResetPassword({ name = 'there', url = 'https://example.com/reset', minutes = '60', appName = 'ZX Hub' }: Props) {
    return (
        <Layout preview="Reset your password" appName={appName}>
            <Heading as="h1" style={styles.h1}>Reset your password</Heading>
            <Text style={styles.p}>
                Hi {name}, we received a request to reset your password. This link expires in {minutes} minutes.
            </Text>
            <Button href={url} style={styles.button}>Choose a new password</Button>
        </Layout>
    );
}