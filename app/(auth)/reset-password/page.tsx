'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { resetPassword } from '@/lib/api/auth';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth';
import { AuthCard, FormField } from '@/components/auth';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (tokenFromUrl) setValue('token', tokenFromUrl);
  }, [tokenFromUrl, setValue]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setSubmitError(null);
    try {
      await resetPassword(data.token, data.password);
      setSuccess(true);
      toast.success('Password updated');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Reset failed. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  if (success) {
    return (
      <AuthCard title="Password reset" description="Your password has been reset. Redirecting to sign in…">
        <Link href="/login">
          <Button fullWidth>Go to sign in</Button>
        </Link>
      </AuthCard>
    );
  }

  if (!tokenFromUrl) {
    return (
      <AuthCard
        title="Reset password"
        description="Use the link from your email to reset your password. If the link expired, request a new one."
        backHref="/forgot-password"
        backLabel="Request new link"
      >
        <Link href="/forgot-password">
          <Button fullWidth>Request reset link</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set new password"
      description="Enter your new password below."
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
        <input type="hidden" {...register('token')} />
        <FormField
          label="New password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <FormField
          label="Confirm password"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </AuthCard>
  );
}
