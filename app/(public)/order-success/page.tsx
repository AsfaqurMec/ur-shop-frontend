'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { downloadOrderInvoice } from '@/lib/api/invoices';
import { toast } from 'sonner';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paidOk = searchParams.get('paid') === '1';
  const [downloading, setDownloading] = useState(false);

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

  const handleInvoiceDownload = async () => {
    setDownloading(true);
    try {
      await downloadOrderInvoice(orderIdNum);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not download the invoice.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Container className="py-12">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="text-xl">{paidOk ? 'Payment successful' : 'Order placed successfully'}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {paidOk
              ? 'Your payment was confirmed. We are preparing your digital products.'
              : 'Thank you. Your order has been created and is pending admin review.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            Order reference: <strong>#{orderId}</strong>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row w-full">
            <Link href="/dashboard/orders" className="w-full sm:w-1/2">
              <Button variant="outline" fullWidth className='bg-primary text-white hover:bg-red-700'>
                View my orders
              </Button>
            </Link>
            <Button variant="secondary" fullWidth className="w-full sm:w-1/2 bg-stone-800 text-white hover:bg-stone-700" onClick={handleInvoiceDownload} isLoading={downloading}>
              Download invoice PDF
            </Button>
          </div>
          <Link href="/shop" className="block text-center text-sm text-muted-foreground hover:text-foreground">
            Continue shopping
          </Link>
        </CardContent>
      </Card>
    </Container>
  );
}
