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
  const [mobileInput, setMobileInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((r) => {
        setUser(r.user);
        setNameInput(r.user.name ?? '');
        setMobileInput(r.user.mobile ?? '');
        setAddressInput(r.user.address ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const unchanged =
    (user?.name ?? '').trim() === nameInput.trim() &&
    (user?.mobile ?? '').trim() === mobileInput.trim() &&
    (user?.address ?? '').trim() === addressInput.trim();

  const handleSave = async () => {
    const trimmedName = nameInput.trim();
    const trimmedMobile = mobileInput.trim();
    const trimmedAddress = addressInput.trim();
    if (!trimmedName) {
      toast.error('Please enter a name');
      return;
    }
    if (!trimmedMobile) {
      toast.error('Please enter a mobile number');
      return;
    }
    if (!trimmedAddress) {
      toast.error('Please enter an address');
      return;
    }
    setSaving(true);
    try {
      const { user: updated } = await updateProfile({
        name: trimmedName,
        mobile: trimmedMobile,
        address: trimmedAddress,
      });
      setUser(updated);
      setNameInput(updated.name ?? '');
      setMobileInput(updated.mobile ?? '');
      setAddressInput(updated.address ?? '');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('profile:updated'));
      }
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update profile');
    } finally {
      setSaving(false);
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
            <Input
              id="profile-name"
              type="text"
              autoComplete="name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="profile-mobile" className="text-muted-foreground text-sm">
              Mobile number
            </label>
            <Input
              id="profile-mobile"
              type="tel"
              autoComplete="tel"
              value={mobileInput}
              onChange={(e) => setMobileInput(e.target.value)}
              maxLength={32}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="profile-address" className="text-muted-foreground text-sm">
              Address
            </label>
            <textarea
              id="profile-address"
              autoComplete="street-address"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              maxLength={1000}
              rows={3}
              className="flex min-h-[5.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="button" onClick={handleSave} disabled={saving || unchanged}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
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
