import { Button, Heading, Text } from '@react-email/components';
import Layout, { styles } from './components/layout';

export default function Welcome({ name = 'there', plan = 'Professional', url = 'https://example.com', appName = 'ZX Hub' }) {
  return (
    <Layout preview={`Welcome to ${appName}`} appName={appName}>
      <Heading as="h1" style={styles.h1}>Welcome, {name}!</Heading>
      <Text style={styles.p}>Your {plan} plan is active and your workspace is ready.</Text>
      <Button href={url} style={styles.button}>Go to dashboard</Button>
    </Layout>
  );
}