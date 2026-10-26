import { Heading, Section, Text } from '@react-email/components';
import Layout, { styles } from './components/layout';

export default function PasswordChangeCode({ name = 'there', code = '123456', minutes = '10', appName = 'ZX Hub' }) {
    return (
        <Layout preview={`Your code is ${code}`} appName={appName} footer="If you didn't try to change your password, secure your account.">
            <Heading as="h1" style={styles.h1}>Confirm your password change</Heading>
            <Text style={styles.p}>Hi {name}, enter this code to continue. It expires in {minutes} minutes.</Text>
            <Section style={styles.codeBox}><Text style={styles.code}>{code}</Text></Section>
        </Layout>
    );
}