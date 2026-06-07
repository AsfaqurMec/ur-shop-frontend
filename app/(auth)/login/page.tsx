'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { login } from '@/lib/api/auth';
import { addToCart } from '@/lib/api/cart';
import { sanitizeRedirectParam } from '@/lib/auth/returnPath';
import { consumePendingBuyNowIntent } from '@/lib/storefront/pendingBuyNowIntent';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { AuthCard, FormField } from '@/components/auth';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirect =
    rawRedirect === null ? '/dashboard' : sanitizeRedirectParam(rawRedirect, '/dashboard');
  const infoMessage = searchParams.get('message');
  const registerHref =
    rawRedirect !== null
      ? `/register?redirect=${encodeURIComponent(redirect)}`
      : '/register';
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setSubmitError(null);
    try {
      const result = await login(data.email, data.password);
      if (result.user.role !== 'admin') {
        const pendingBuyNow = consumePendingBuyNowIntent();
        if (pendingBuyNow) {
          try {
            await addToCart(
              pendingBuyNow.productId,
              pendingBuyNow.quantity,
              pendingBuyNow.selections,
              pendingBuyNow.variationId
            );
            window.dispatchEvent(new Event('cart:changed'));
            const resumePath = sanitizeRedirectParam(pendingBuyNow.redirectTo, redirect);
            router.push(resumePath.startsWith('/admin') ? '/dashboard' : resumePath);
            router.refresh();
            return;
          } catch (resumeErr) {
            const resumeMsg =
              resumeErr instanceof Error
                ? resumeErr.message
                : 'Signed in, but we could not continue your Buy now action. Please try again.';
            toast.error(resumeMsg);
          }
        }
      }
      const target =
        result.user.role === 'admin'
          ? '/admin'
          : redirect.startsWith('/admin')
            ? '/dashboard'
            : redirect;
      router.push(target);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  return (
    <AuthCard
      title="Sign in"
      description="Sign in to your account to access orders and downloads."
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link href={registerHref} className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {infoMessage && (
          <Alert variant="success">
            <AlertDescription>{infoMessage}</AlertDescription>
          </Alert>
        )}
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        <FormField
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="you@example.com"
        />
        <FormField
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="••••••••"
        />
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
