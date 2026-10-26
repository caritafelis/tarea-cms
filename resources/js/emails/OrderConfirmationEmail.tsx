import * as React from 'react';
import { Html, Head, Preview, Body, Container, Heading, Text } from 'react-email';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderConfirmationEmailProps {
  name: string;
  orderId: string;
  items: OrderItem[];
  total: number;
}

export const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({ name, orderId, items = [], total }) => (
  <Html>
    <Head />
    <Preview>Order Confirmation - Order #{orderId}</Preview>
    <Body style={{ fontFamily: 'Helvetica, Arial, sans-serif', backgroundColor: '#fafafa', padding: '20px' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <Heading style={{ color: '#1a1a1a', fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Thank you for your order!</Heading>
        <Text style={{ color: '#666666', fontSize: '15px', marginBottom: '32px' }}>Order #{orderId} has been successfully completed.</Text>
        
        <Text style={{ color: '#1a1a1a', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Order Details:</Text>
        <div style={{ borderBottom: '1px solid #eaeaea', marginBottom: '24px' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #f2f2f2' }}>
              <span style={{ color: '#444444', fontSize: '14px' }}>{item.name} (x{item.quantity})</span>
              <span style={{ color: '#1a1a1a', fontSize: '14px', fontWeight: '500' }}>${item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginBottom: '32px' }}>
          <span style={{ color: '#1a1a1a', fontSize: '16px', fontWeight: '600' }}>Total</span>
          <span style={{ color: '#1a1a1a', fontSize: '18px', fontWeight: '700' }}>${total.toFixed(2)}</span>
        </div>

        <Text style={{ color: '#888888', fontSize: '13px', borderTop: '1px solid #eaeaea', paddingTop: '20px' }}>
          If you have any questions about your order, feel free to reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OrderConfirmationEmail;
