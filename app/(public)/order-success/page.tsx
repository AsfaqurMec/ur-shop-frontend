'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paidOk = searchParams.get('paid') === '1';

  useEffect(() => {
    if (!orderId) return;
  
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        order_id: orderId,
        currency: 'BDT',
      });
    }
  }, [orderId]);


  if (!orderId) {
    return (
      <Container className="py-12">
        <Alert variant="destructive">
          <AlertDescription>Missing order reference. Go to your orders or home.</AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-4">
          <Link href="/dashboard/orders">
            <Button>My orders</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </Container>
    );
  }

  const orderIdNum = Number(orderId);
  if (Number.isNaN(orderIdNum) || orderIdNum < 1) {
    return (
      <Container className="py-12">
        <Alert variant="destructive">
          <AlertDescription>Invalid order reference.</AlertDescription>
        </Alert>
        <Link href="/" className="mt-4 inline-block">
          <Button variant="outline">Home</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">{paidOk ? 'Payment successful' : 'Order placed'}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {paidOk
              ? 'Your payment was confirmed. We are preparing your digital products.'
              : 'Thank you. Your order has been created and is pending admin review.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Order reference: <strong>#{orderId}</strong>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/orders" className="flex-1 sm:flex-initial">
              <Button variant="outline" fullWidth>
                View my orders
              </Button>
            </Link>
          </div>
          <Link href="/shop" className="block text-center text-sm text-muted-foreground hover:text-foreground">
            Continue shopping
          </Link>
        </CardContent>
      </Card>
    </Container>
  );
}
