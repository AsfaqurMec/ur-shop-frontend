'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { verifyEmail, verifyEmailGet } from '@/lib/api/auth';
import { verifyEmailSchema, type VerifyEmailInput } from '@/lib/validations/auth';
import { AuthCard, FormField } from '@/components/auth';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

type Status = 'idle' | 'verifying' | 'success' | 'error' | 'form';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const [status, setStatus] = useState<Status>(tokenFromUrl ? 'verifying' : 'form');
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { token: tokenFromUrl ?? '' },
  });

  useEffect(() => {
    if (!tokenFromUrl) return;
    let cancelled = false;
    (async () => {
      try {
        await verifyEmailGet(tokenFromUrl);
        if (!cancelled) {
          setStatus('success');
          setMessage('Your email has been verified. You can sign in now.');
          toast.success('Email verified');
        }
      } catch {
        if (!cancelled) {
          setStatus('form');
          setMessage(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenFromUrl]);

  const onSubmit = async (data: VerifyEmailInput) => {
    setMessage(null);
    try {
      await verifyEmail(data.token);
      setStatus('success');
      setMessage('Your email has been verified. You can sign in now.');
      toast.success('Email verified');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      setMessage(msg);
      toast.error(msg);
    }
  };

  if (status === 'verifying') {
    return (
      <AuthCard title="Verify email" description="Verifying your email…">
        <div className="flex justify-center py-6">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthCard>
    );
  }

  if (status === 'success') {
    return (
      <AuthCard title="Email verified" description={message ?? undefined}>
        <Link href="/login">
          <Button fullWidth>Go to sign in</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify email"
      description="Enter the verification token from your email, or use the link we sent you."
      footer={
        <p>
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {message && (
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <FormField
          label="Verification token"
          {...register('token')}
          error={errors.token?.message}
          placeholder="Paste token from email"
        />
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Verify email
        </Button>
      </form>
    </AuthCard>
  );
}
