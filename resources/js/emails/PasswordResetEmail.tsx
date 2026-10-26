import * as React from 'react';
import { Html, Head, Preview, Body, Container, Heading, Text, Button } from 'react-email';

interface PasswordResetEmailProps {
  name: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({ name }) => (
  <Html>
    <Head />
    <Preview>Reset your CMS account password</Preview>
    <Body style={{ fontFamily: 'Helvetica, Arial, sans-serif', backgroundColor: '#fafafa', padding: '20px' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <Heading style={{ color: '#1a1a1a', fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Password Reset Request</Heading>
        <Text style={{ color: '#444444', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
          Hello {name},<br />
          We received a request to reset your password. If you didn't make this request, you can ignore this email.
        </Text>
        <Button
          href="{{{appUrl}}}/password/reset"
          style={{
            backgroundColor: '#000000',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '500',
            textDecoration: 'none',
            display: 'inline-block',
            textAlign: 'center',
          }}
        >
          Reset Password
        </Button>
        <Text style={{ color: '#888888', fontSize: '13px', marginTop: '32px', borderTop: '1px solid #eaeaea', paddingTop: '20px' }}>
          For security, this link will expire in 60 minutes.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;
