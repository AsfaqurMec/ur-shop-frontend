'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { executeBkashPayment } from '@/lib/api/payments';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';

function BkashCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    const status = searchParams.get('status');
    const paymentID =
      searchParams.get('paymentID') ||
      searchParams.get('payment_id') ||
      searchParams.get('paymentId') ||
      searchParams.get('PaymentId');

    if (status && status !== 'success') {
      const label =
        status === 'failure' ? 'Payment failed or was declined.' : status === 'cancel' ? 'Payment was cancelled.' : `Payment status: ${status}`;
      setError(label);
      return;
    }

    if (!paymentID?.trim()) {
      setError('Missing payment reference from bKash. Return to checkout and try again.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await executeBkashPayment({ payment_id: paymentID.trim() }, { skip401Redirect: true });
        if (cancelled) return;
        router.replace(`/order-success?orderId=${result.order_id}&paid=1`);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Could not confirm payment.';
          if (msg === 'Unauthorized' || msg.toLowerCase().includes('unauthorized')) {
            setNeedsLogin(true);
            setError('Your session expired while you were paying. Sign in again — you will return to this page to confirm your payment.');
          } else {
            setError(msg);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    const resumePath =
      typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/checkout/bkash-callback';
    return (
      <Container className="py-12 max-w-lg mx-auto">
        <Alert variant={needsLogin ? 'default' : 'destructive'}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-6 flex flex-wrap gap-3">
          {needsLogin ? (
            <Link href={`/login?redirect=${encodeURIComponent(resumePath)}`}>
              <Button>Sign in to continue</Button>
            </Link>
          ) : null}
          <Link href="/checkout">
            <Button variant={needsLogin ? 'outline' : 'primary'}>Back to checkout</Button>
          </Link>
          <Link href="/dashboard/orders">
            <Button variant="outline">My orders</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="flex flex-col items-center gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground text-center">Confirming your bKash payment…</p>
      </div>
    </Container>
  );
}

export default function BkashCallbackPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12 flex justify-center">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </Container>
      }
    >
      <BkashCallbackInner />
    </Suspense>
  );
}
