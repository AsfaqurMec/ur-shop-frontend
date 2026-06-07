'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getProfile, updateProfile } from '@/lib/api/auth';
import type { SafeUser } from '@/types/auth';
import { PageHeader } from '@/components/dashboard';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((r) => {
        setUser(r.user);
        setNameInput(r.user.name ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const nameUnchanged = (user?.name ?? '').trim() === nameInput.trim();

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast.error('Please enter a name');
      return;
    }
    setSavingName(true);
    try {
      const { user: updated } = await updateProfile(trimmed);
      setUser(updated);
      setNameInput(updated.name ?? '');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('profile:updated'));
      }
      toast.success('Name updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update name');
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div>
        <PageHeader title="Profile" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error ?? 'Failed to load profile'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Profile settings" description="View and manage your account" />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Account information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-muted-foreground text-sm">Email</label>
            <p className="font-medium">{user.email}</p>
            {user.email_verified_at ? (
              <p className="text-green-600 dark:text-green-400 text-xs mt-1">Verified</p>
            ) : (
              <Link href="/verify-email" className="text-primary text-xs hover:underline mt-1 inline-block">
                Verify email
              </Link>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="profile-name" className="text-muted-foreground text-sm">
              Name
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="profile-name"
                type="text"
                autoComplete="name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={255}
                className="sm:max-w-xs"
              />
              <Button
                type="button"
                onClick={handleSaveName}
                disabled={savingName || nameUnchanged}
              >
                {savingName ? 'Saving…' : 'Save name'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/forgot-password">
          <Button variant="outline">Change password</Button>
        </Link>
      </div>
    </div>
  );
}
