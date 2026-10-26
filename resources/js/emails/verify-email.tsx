import { Button, Heading, Section, Text } from '@react-email/components';
import Layout, { styles } from './components/layout';

type Props = { name?: string; code?: string; url?: string; appName?: string };

export default function VerifyEmail({ name = 'there', code = '123456', url = 'https://example.com/verify', appName = 'ZX Hub' }: Props) {
    return (
        <Layout preview={`Your verification code is ${code}`} appName={appName}>
            <Heading as="h1" style={styles.h1}>Verify your email</Heading>
            <Text style={styles.p}>Hi {name}, use this code to finish creating your account. It expires in 15 minutes.</Text>
            <Section style={styles.codeBox}>
                <Text style={styles.code}>{code}</Text>
            </Section>
            <Text style={styles.p}>Or verify with one click:</Text>
            <Button href={url} style={styles.button}>Verify email</Button>
        </Layout>
    );
}