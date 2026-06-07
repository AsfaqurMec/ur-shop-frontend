'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api/auth';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth';
import { AuthCard, FormField } from '@/components/auth';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

function getResetBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/reset-password`;
}

export default function ForgotPasswordPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      const resetBaseUrl = getResetBaseUrl();
      const result = await forgotPassword(
        data.email,
        resetBaseUrl || undefined
      );
      setSuccessMessage(result.message);
      toast.success('Check your email', { description: result.message });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  return (
    <AuthCard
      title="Forgot password"
      description="Enter your email and we'll send you a link to reset your password."
      backHref="/login"
      backLabel="Back to sign in"
      footer={
        <p>
          <Link href="/login" className="font-medium text-primary hover:underline">
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
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
