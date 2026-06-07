'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { register as registerApi } from '@/lib/api/auth';
import { sanitizeRedirectParam } from '@/lib/auth/returnPath';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { AuthCard, FormField } from '@/components/auth';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

function getVerificationBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/verify-email`;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const sanitizedRedirect =
    rawRedirect === null ? null : sanitizeRedirectParam(rawRedirect, '/dashboard');
  const loginHref =
    sanitizedRedirect !== null
      ? `/login?redirect=${encodeURIComponent(sanitizedRedirect)}`
      : '/login';
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  const onSubmit = async (data: RegisterInput) => {
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      const verificationBaseUrl = getVerificationBaseUrl();
      const result = await registerApi(
        data.email,
        data.password,
        data.name ?? '',
        verificationBaseUrl || undefined
      );
      setSuccessMessage(result.message);
      toast.success('Account created', { description: result.message });
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  return (
    <AuthCard
      title="Create account"
      description="Register to purchase and manage your digital products."
      footer={
        <p>
          Already have an account?{' '}
          <Link href={loginHref} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success">
            <AlertDescription>{successMessage}</AlertDescription>
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
          label="Name"
          type="text"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Your name (optional)"
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="At least 8 characters"
        />
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
