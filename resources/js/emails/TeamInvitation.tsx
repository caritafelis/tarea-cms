import { Button, Heading, Text } from '@react-email/components';
import Layout, { styles } from './components/layout';

export default function TeamInvitation({ inviter = 'Alex', teamName = 'Acme', url = 'https://example.com', appName = 'ZX Hub' }) {
    return (
        <Layout preview={`${inviter} invited you to ${teamName}`} appName={appName}>
            <Heading as="h1" style={styles.h1}>You've been invited</Heading>
            <Text style={styles.p}>{inviter} invited you to join the {teamName} team.</Text>
            <Button href={url} style={styles.button}>Accept invitation</Button>
        </Layout>
    );
}