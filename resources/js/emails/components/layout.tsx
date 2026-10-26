import { Body, Column, Container, Head, Hr, Html, Preview, Row, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

type LayoutProps = { preview: string; appName: string; footer?: string; children: ReactNode };

export default function Layout({ preview, appName, footer = "If you didn't request this, you can safely ignore this email.", children }: LayoutProps) {
    return (
        <Html lang="en">
            <Head />
            <Preview>{preview}</Preview>
            <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0, padding: '32px 0' }}>
                <Container style={{ backgroundColor: '#ffffff', borderRadius: 12, maxWidth: 480, padding: 32, margin: '0 auto' }}>
                    <Text style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px' }}>{appName}</Text>
                    {children}
                    <Hr style={{ borderColor: '#e4e4e7', margin: '28px 0 16px' }} />
                    <Text style={{ color: '#a1a1aa', fontSize: 12, margin: 0 }}>{footer}</Text>
                </Container>
            </Body>
        </Html>
    );
}

export const styles = {
    h1: { fontSize: 22, margin: '8px 0' } as const,
    p: { color: '#52525b', fontSize: 15, lineHeight: '22px' } as const,
    button: { backgroundColor: '#18181b', borderRadius: 8, color: '#ffffff', fontSize: 15, padding: '12px 24px' } as const,
    codeBox: { backgroundColor: '#f4f4f5', borderRadius: 8, margin: '20px 0', padding: '16px 0', textAlign: 'center' } as const,
    code: { fontSize: 32, fontWeight: 700, letterSpacing: 8, margin: 0 } as const,
};

/** Filas "etiqueta … valor" (recibos, totales de pedido). */
export function KeyValue({ rows }: { rows: [string, string][] }) {
    return (
        <Section style={{ margin: '16px 0' }}>
            {rows.map(([k, v]) => (
                <Row key={k}>
                    <Column style={{ color: '#71717a', fontSize: 14, padding: '4px 0' }}>{k}</Column>
                    <Column align="right" style={{ fontSize: 14, fontWeight: 600 }}>{v}</Column>
                </Row>
            ))}
        </Section>
    );
}

/** Marcador: el build lo reemplaza por un @foreach de Blade con los productos. */
export function Items() {
    return (
        <Section>
            <Text>__ITEMS__</Text>
        </Section>
    );
}