'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listPaymentMethods, submitPaymentProof, getProofsForOrder } from '@/lib/api/payments';
import { getOrderDetails, type DashboardOrderDetail } from '@/lib/api/dashboard';
import type { BankTransferDetails, PaymentMethod } from '@/types/payment';
import { paymentProofSchema, type PaymentProofInput } from '@/lib/validations/checkout';
import { OrderLineItemsSummary } from '@/components/orders/OrderLineItemsSummary';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { FormField } from '@/components/auth';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_FILE_MB = 10;

function isManualMfsGateway(methods: PaymentMethod[], g: string | null): boolean {
  if (g == null) return false;
  const m = methods.find((x) => x.gateway === g);
  return m?.manual_flow === 'mfs_reference';
}

function manualMfsTitle(methods: PaymentMethod[], g: string): string {
  const m = methods.find((x) => x.gateway === g);
  return m?.name ?? 'Wallet payment';
}

type TimelineVariant = 'manual_mfs_submitted' | 'awaiting_bank_proof' | 'proof_uploaded';

function OrderPaymentTimeline({ variant }: { variant: TimelineVariant }) {
  const steps = [
    {
      key: 'placed',
      title: 'Order placed',
      desc: 'Your items are reserved.',
      state: 'done' as const,
    },
    {
      key: 'payment',
      title:
        variant === 'awaiting_bank_proof'
          ? 'Complete payment'
          : variant === 'manual_mfs_submitted'
            ? 'Payment details received'
            : 'Proof received',
      desc:
        variant === 'awaiting_bank_proof'
          ? 'Transfer the amount and upload proof if required.'
          : variant === 'manual_mfs_submitted'
            ? 'We are verifying your wallet payment.'
            : 'We will verify your transfer shortly.',
      state:
        variant === 'awaiting_bank_proof'
          ? ('current' as const)
          : ('done' as const),
    },
    {
      key: 'fulfill',
      title: 'Verification & delivery',
      desc: 'After approval, downloads and keys appear in your dashboard.',
      state: variant === 'awaiting_bank_proof' ? ('upcoming' as const) : ('current' as const),
    },
  ];

  return (
    <ol className="space-y-0">
      {steps.map((step, i) => (
        <li key={step.key} className="flex gap-4 pb-8 last:pb-0">
          <div className="flex w-8 shrink-0 flex-col items-center">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                step.state === 'done'
                  ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_20px_-4px_hsl(var(--primary))]'
                  : step.state === 'current'
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              {step.state === 'done' ? '✓' : i + 1}
            </span>
            {i < steps.length - 1 ? (
              <div className="mt-2 min-h-[2.25rem] w-px flex-1 bg-border" aria-hidden />
            ) : null}
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="font-semibold text-foreground">{step.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{step.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function BankTransferDetailsSection({ details }: { details: BankTransferDetails }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Bank name', value: details.bank_name },
    { label: 'Account holder', value: details.account_holder_name },
    { label: 'Account number', value: details.account_number },
  ];
  if (details.routing_number) {
    rows.push({ label: 'Routing / sort code', value: details.routing_number });
  }
  if (details.iban) {
    rows.push({ label: 'IBAN', value: details.iban });
  }
  if (details.swift_bic) {
    rows.push({ label: 'SWIFT / BIC', value: details.swift_bic });
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <h3 className="text-sm font-semibold text-foreground mb-3">Bank account</h3>
      <dl className="space-y-2 text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="grid gap-0.5 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-mono tabular-nums text-foreground break-all">{value}</dd>
          </div>
        ))}
      </dl>
      {details.payment_reference_hint ? (
        <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
          {details.payment_reference_hint}
        </p>
      ) : null}
    </div>
  );
}

function PayPageLayout({
  order,
  children,
}: {
  order: DashboardOrderDetail;
  children: ReactNode;
}) {
  const placed = new Date(order.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card p-6 shadow-lg ring-1 ring-border/60 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">Order confirmation</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            #{order.order_number}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Placed on {placed} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <OrderLineItemsSummary
              items={order.items}
              subtotal={order.subtotal}
              discount={order.discount}
              tax={order.tax}
              total={order.total}
              currency={order.currency}
            />
          </div>
          <div className="lg:col-span-5">{children}</div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t border-border/60 pt-8">
          <Link href="/dashboard/orders">
            <Button variant="outline">All my orders</Button>
          </Link>
          <Link href="/shop">
            <Button variant="ghost" className="text-muted-foreground">
              Continue shopping
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}

export default function OrderPayPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const orderId = id ? Number(id) : NaN;

  const [orderDetail, setOrderDetail] = useState<DashboardOrderDetail | null>(null);
  const [manualMfsProofs, setManualMfsProofs] = useState<
    { id: number; transaction_id: string | null; sender_number: string | null; status: string }[]
  >([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentProofInput>({
    resolver: zodResolver(paymentProofSchema),
    defaultValues: {
      sender_number: '',
      transaction_id: '',
      paid_amount: undefined,
    },
  });

  useEffect(() => {
    if (!orderId || Number.isNaN(orderId) || orderId < 1) {
      setLoading(false);
      setLoadError('Invalid order');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [orderRes, methodsRes] = await Promise.all([
          getOrderDetails(orderId),
          listPaymentMethods(),
        ]);
        if (!cancelled) {
          const gw = orderRes.payment?.gateway ?? null;
          setOrderDetail(orderRes);
          setMethods(methodsRes);
          if (isManualMfsGateway(methodsRes, gw)) {
            const proofs = await getProofsForOrder(orderId);
            if (!cancelled) {
              setManualMfsProofs(
                proofs.map((p) => ({
                  id: p.id,
                  transaction_id: p.transaction_id,
                  sender_number: p.sender_number,
                  status: p.status,
                }))
              );
            }
          } else {
            setManualMfsProofs([]);
          }
        }
      } catch (err) {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const onSubmit = async (data: PaymentProofInput) => {
    setSubmitError(null);
    setFileError(null);
    const file = data.proof?.[0];
    if (!file) {
      setFileError('Please select an image (screenshot or receipt).');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`File must be under ${MAX_FILE_MB} MB.`);
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setFileError('File must be a JPEG, PNG, GIF, or WebP image.');
      return;
    }
    try {
      await submitPaymentProof(orderId, file, {
        sender_number: data.sender_number || undefined,
        transaction_id: data.transaction_id || undefined,
        paid_amount: data.paid_amount,
      });
      setSuccess(true);
      toast.success('Payment proof submitted');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit proof.';
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <Container className="py-12">
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Container>
    );
  }

  if (loadError || !orderDetail) {
    return (
      <Container className="py-12">
        <Alert variant="destructive">
          <AlertDescription>{loadError ?? 'Order not found.'}</AlertDescription>
        </Alert>
        <Link href="/dashboard/orders" className="mt-4 inline-block">
          <Button variant="outline">My orders</Button>
        </Link>
      </Container>
    );
  }

  const order = orderDetail;

  if (order.status !== 'pending') {
    return (
      <Container className="py-12">
        <Alert variant="default">
          <AlertDescription>
            This order is not pending payment. Status: {order.status}.
          </AlertDescription>
        </Alert>
        <Link href="/dashboard/orders" className="mt-4 inline-block">
          <Button variant="outline">My orders</Button>
        </Link>
      </Container>
    );
  }

  if (success) {
    return (
      <PayPageLayout order={order}>
        <div className="space-y-6">
          <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/15">
            <CardHeader className="border-b border-border/60 bg-primary/5">
              <CardTitle className="text-lg">Payment proof submitted</CardTitle>
              <p className="text-muted-foreground text-sm">
                We will verify your transfer and update your order. You will see downloads and license keys in your
                dashboard once payment is approved.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <OrderPaymentTimeline variant="proof_uploaded" />
            </CardContent>
          </Card>
          <Link href="/dashboard/orders" className="block">
            <Button fullWidth size="lg">
              View my orders
            </Button>
          </Link>
        </div>
      </PayPageLayout>
    );
  }

  const bankGateway = order.payment?.gateway ?? null;
  const manualMethod =
    bankGateway != null ? methods.find((m) => m.gateway === bankGateway && m.manual_flow === 'bank_proof') : undefined;
  const proofField = register('proof');

  if (order.payment?.gateway && isManualMfsGateway(methods, order.payment.gateway)) {
    const pending = manualMfsProofs.find((p) => p.status === 'pending');
    const label = manualMfsTitle(methods, order.payment.gateway);
    return (
      <PayPageLayout order={order}>
        <div className="space-y-6">
          <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/20">
            <CardHeader className="border-b border-border/60 bg-primary/5">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  {label}
                </span>
                <CardTitle className="text-lg">Payment submitted</CardTitle>
              </div>
              <p className="text-muted-foreground text-sm">
                We received your wallet number and transaction ID and will verify your payment shortly. You do not need
                to upload a screenshot unless support asks you to.
              </p>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <OrderPaymentTimeline variant="manual_mfs_submitted" />
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount due</p>
                <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                  {formatCurrency(order.total, order.currency)}
                </p>
                {pending?.sender_number ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    From{' '}
                    <span className="font-mono font-medium text-foreground">{pending.sender_number}</span>
                  </p>
                ) : null}
                {pending?.transaction_id ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    TrxID{' '}
                    <span className="break-all font-mono font-medium text-foreground">{pending.transaction_id}</span>
                  </p>
                ) : null}
              </div>
              <Link href="/dashboard/orders" className="block">
                <Button fullWidth size="lg">
                  View my orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PayPageLayout>
    );
  }

  if (order.payment?.gateway === 'bkash') {
    return (
      <PayPageLayout order={order}>
        <Alert variant="destructive" className="shadow-sm">
          <AlertDescription>
            This order used bKash Pay Now. If you did not finish paying in time, the order may have been cancelled.
            Check your orders list or place a new order from checkout.
          </AlertDescription>
        </Alert>
        <Link href="/dashboard/orders" className="mt-4 block">
          <Button variant="outline" fullWidth>
            My orders
          </Button>
        </Link>
      </PayPageLayout>
    );
  }

  return (
    <PayPageLayout order={order}>
      <div className="space-y-6">
        <Card className="border-border/80 shadow-sm ring-1 ring-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Amount due</CardTitle>
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {formatCurrency(order.total, order.currency)}
            </p>
          </CardHeader>
          <CardContent>
            <OrderPaymentTimeline variant="awaiting_bank_proof" />
          </CardContent>
        </Card>

        {manualMethod ? (
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{manualMethod.name}</CardTitle>
              <p className="text-muted-foreground text-sm whitespace-pre-line">{manualMethod.description}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {manualMethod.bank_details ? <BankTransferDetailsSection details={manualMethod.bank_details} /> : null}
              <p className="text-sm text-muted-foreground pt-1">
                After you transfer the amount, upload a screenshot or receipt below.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/80 shadow-md ring-1 ring-primary/10">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <CardTitle className="text-base">Upload payment proof</CardTitle>
            <p className="text-muted-foreground text-sm">
              JPEG, PNG, GIF, or WebP — max {MAX_FILE_MB} MB.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <label htmlFor="proof" className="text-sm font-medium leading-none">
                  Proof image (required)
                </label>
                <input
                  id="proof"
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  {...proofField}
                  onChange={(e) => {
                    proofField.onChange(e);
                    setFileError(null);
                  }}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:cursor-pointer hover:file:bg-primary/90"
                />
                {fileError && (
                  <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {fileError}
                  </p>
                )}
              </div>
              <FormField
                label="Sender / reference number (optional)"
                {...register('sender_number')}
                error={errors.sender_number?.message}
                placeholder="e.g. last 4 digits"
              />
              <FormField
                label="Transaction ID (optional)"
                {...register('transaction_id')}
                error={errors.transaction_id?.message}
                placeholder="Bank reference"
              />
              <FormField
                label="Amount paid (optional)"
                type="number"
                step="0.01"
                min="0"
                {...register('paid_amount')}
                error={errors.paid_amount?.message}
                placeholder="0.00"
              />
              <Button type="submit" fullWidth size="lg">
                Submit proof
              </Button>
            </form>
          </CardContent>
        </Card>

        <Link href="/dashboard/orders" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          ← Back to my orders
        </Link>
      </div>
    </PayPageLayout>
  );
}
