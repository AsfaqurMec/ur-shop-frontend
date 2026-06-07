'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin';
import { Modal } from '@/components/admin/Modal';
import {
  changeAdminPassword,
  createAdminAccount,
  getAdminStoreSettings,
  updateAdminStoreSettings,
  uploadAdminStoreLogo,
} from '@/lib/api/admin';
import { getProfile, updateProfile } from '@/lib/api/auth';
import { clearAuthToken } from '@/lib/api/client';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ImageUploaderField,
  Input,
} from '@/components/ui';
import { toast } from 'sonner';
import type { SocialLink } from '@/lib/api/storeSettings';

const CURRENCIES = [
  { value: 'BDT', label: 'BDT — Bangladeshi Taka' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
] as const;

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America — New York (ET)' },
  { value: 'America/Chicago', label: 'America — Chicago (CT)' },
  { value: 'America/Denver', label: 'America — Denver (MT)' },
  { value: 'America/Los_Angeles', label: 'America — Los Angeles (PT)' },
  { value: 'Europe/London', label: 'Europe — London' },
  { value: 'Europe/Paris', label: 'Europe — Paris' },
  { value: 'Asia/Dubai', label: 'Asia — Dubai' },
  { value: 'Asia/Kolkata', label: 'Asia — Kolkata' },
  { value: 'Asia/Tokyo', label: 'Asia — Tokyo' },
  { value: 'Australia/Sydney', label: 'Australia — Sydney' },
] as const;

/* Email templates section — hidden for now; restore when backend mail templates are wired.
type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
};

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'order_confirmation',
    name: 'Order confirmation',
    description: 'Sent when checkout completes and payment is confirmed.',
    subject: 'Your order {{order_number}} is confirmed',
    body: 'Hi {{customer_name}},\n\nThanks for your order. You can download your items from your account.\n\n— {{store_name}}',
  },
  {
    id: 'password_reset',
    name: 'Password reset',
    description: 'Sent when a user requests a password reset link.',
    subject: 'Reset your password',
    body: 'Hi {{customer_name}},\n\nUse this link to reset your password: {{reset_link}}\n\nIf you did not request this, you can ignore this email.',
  },
  {
    id: 'digital_delivery',
    name: 'Digital delivery',
    description: 'Sent when new files or license keys are attached to an order.',
    subject: 'Your downloads are ready — order {{order_number}}',
    body: 'Hi {{customer_name}},\n\nYour digital products are ready. Open your order to access downloads.\n\n— {{store_name}}',
  },
  {
    id: 'support_reply',
    name: 'Support ticket reply',
    description: 'Sent when staff replies to a customer ticket.',
    body: 'Hi {{customer_name}},\n\nWe have an update on your support request:\n\n{{message}}\n\n— {{store_name}} support',
    subject: 'Re: your support request',
  },
];
*/

/* Tax section — hidden for now; restore when checkout/pricing supports tax rules.
type StoreSettingsTax = { pricesIncludeTax: boolean; taxRate: string };
*/

type StoreSettings = {
  siteTitle: string;
  siteLogo: string;
  emailHeaderLogo: string;
  emailHeaderSlogan: string;
  emailHeaderSubtitle: string;
  emailFooterSupportEmail: string;
  emailFooterSupportNumber: string;
  storeName: string;
  contactEmail: string;
  address: string;
  currency: string;
  timezone: string;
  socialLinks: SocialLink[];
};

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeHttpUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (isHttpUrl(trimmed)) return trimmed;
  const withProtocol = `https://${trimmed.replace(/^\/+/, '')}`;
  return isHttpUrl(withProtocol) ? withProtocol : '';
}

const defaultSettings = (): StoreSettings => ({
  siteTitle: 'My Digital Store',
  siteLogo: '',
  emailHeaderLogo: '',
  emailHeaderSlogan: '',
  emailHeaderSubtitle: '',
  emailFooterSupportEmail: '',
  emailFooterSupportNumber: '',
  storeName: 'My Digital Store',
  contactEmail: '',
  address: '',
  currency: 'BDT',
  timezone: 'UTC',
  socialLinks: [],
});

function normalizeStoreSettings(input: Partial<StoreSettings> | StoreSettings): StoreSettings {
  return {
    ...defaultSettings(),
    ...input,
    socialLinks: Array.isArray(input.socialLinks) ? input.socialLinks : [],
  };
}

/** Compare saved vs re-fetched rows (URLs normalized; accent optional). */
function canonicalSocialRow(s: SocialLink) {
  const ac = s.accentColor?.trim();
  const accentColor =
    ac && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(ac) ? ac.toLowerCase() : '';
  return {
    id: s.id,
    label: s.label.trim(),
    link: normalizeHttpUrl(s.link) || s.link.trim(),
    logo: normalizeHttpUrl(s.logo) || s.logo.trim(),
    accentColor,
  };
}

function socialLinksPersistedFully(sent: SocialLink[], fromServer: SocialLink[]): boolean {
  if (sent.length !== fromServer.length) return false;
  const serverById = new Map(fromServer.map((x) => [x.id, canonicalSocialRow(x)]));
  for (const item of sent) {
    const want = canonicalSocialRow(item);
    const got = serverById.get(item.id);
    if (!got) return false;
    if (
      got.label !== want.label ||
      got.link !== want.link ||
      got.logo !== want.logo ||
      got.accentColor !== want.accentColor
    ) {
      return false;
    }
  }
  return true;
}

const fieldLabel = 'text-sm font-medium text-foreground';
const selectClass =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const textareaClass =
  'flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  // const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileOriginalName, setProfileOriginalName] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialEditingId, setSocialEditingId] = useState<string | null>(null);
  const [slLabel, setSlLabel] = useState('');
  const [slLink, setSlLink] = useState('');
  const [slLogo, setSlLogo] = useState('');
  const [slAccent, setSlAccent] = useState('');
  const [socialFormError, setSocialFormError] = useState<string | null>(null);
  const [socialSubmitting, setSocialSubmitting] = useState(false);
  const [deleteSocialTarget, setDeleteSocialTarget] = useState<SocialLink | null>(null);
  const [deleteSocialSubmitting, setDeleteSocialSubmitting] = useState(false);
  const [deleteSocialError, setDeleteSocialError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminStoreSettings()
      .then((data) => {
        if (cancelled) return;
        setSettings(normalizeStoreSettings(data));
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Could not load store settings';
        setSaveState('error');
        setSaveMessage(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setSettingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((res) => {
        if (cancelled) return;
        const currentName = res.user.name ?? '';
        setProfileName(currentName);
        setProfileOriginalName(currentName);
      })
      .catch((err) => {
        if (cancelled) return;
        setProfileError(err instanceof Error ? err.message : 'Could not load profile');
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // const editingTemplate = settings.templates.find((t) => t.id === editingTemplateId) ?? null;

  const updateField = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaveState('idle');
    setSaveMessage(null);
  };

  /* const updateTemplate = (id: string, patch: Partial<Pick<EmailTemplate, 'subject' | 'body'>>) => {
    setSettings((s) => ({
      ...s,
      templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    setSaveState('idle');
    setSaveMessage(null);
  }; */

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState('saving');
    setSaveMessage(null);
    try {
      const next = await updateAdminStoreSettings(settings);
      setSettings(normalizeStoreSettings(next));
      setSaveState('saved');
      setSaveMessage('Store settings saved successfully.');
      toast.success('Store settings saved');
    } catch (err) {
      setSaveState('error');
      const msg = err instanceof Error ? err.message : 'Could not save settings';
      setSaveMessage(msg);
      toast.error(msg);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (pwNew !== pwConfirm) {
      setPwError('New password and confirmation do not match');
      return;
    }
    if (pwNew.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    try {
      const { message } = await changeAdminPassword(pwCurrent, pwNew);
      clearAuthToken();
      router.push('/login?message=' + encodeURIComponent(message));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not update password';
      setPwError(msg);
      toast.error(msg);
    } finally {
      setPwLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    const trimmed = profileName.trim();
    if (!trimmed) {
      const msg = 'Name is required';
      setProfileError(msg);
      toast.error(msg);
      return;
    }
    setProfileSaving(true);
    try {
      const { user } = await updateProfile(trimmed);
      const updatedName = user.name ?? '';
      setProfileName(updatedName);
      setProfileOriginalName(updatedName);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('profile:updated'));
      }
      toast.success('Profile name updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not update profile name';
      setProfileError(msg);
      toast.error(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    if (!newAdminEmail.trim() || newAdminPassword.length < 8) {
      setCreateError('Email and a password of at least 8 characters are required');
      return;
    }
    setCreateLoading(true);
    try {
      await createAdminAccount({
        email: newAdminEmail.trim(),
        password: newAdminPassword,
        name: newAdminName.trim() || undefined,
      });
      setCreateSuccess('Admin created. They can sign in with the email and password you set.');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminName('');
      toast.success('Admin account created');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create admin';
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const resetSocialForm = () => {
    setSocialEditingId(null);
    setSlLabel('');
    setSlLink('');
    setSlLogo('');
    setSlAccent('');
    setSocialFormError(null);
  };

  const openSocialCreate = () => {
    resetSocialForm();
    setSocialModalOpen(true);
  };

  const openSocialEdit = (row: SocialLink) => {
    setSocialEditingId(row.id);
    setSlLabel(row.label);
    setSlLink(row.link);
    setSlLogo(row.logo);
    setSlAccent(row.accentColor?.trim() ?? '');
    setSocialFormError(null);
    setSocialModalOpen(true);
  };

  const closeSocialModal = () => {
    setSocialModalOpen(false);
    resetSocialForm();
  };

  const persistSocialLinks = async (socialLinks: SocialLink[]) => {
    await updateAdminStoreSettings({ socialLinks });
    const fresh = normalizeStoreSettings(await getAdminStoreSettings());
    if (!socialLinksPersistedFully(socialLinks, fresh.socialLinks)) {
      throw new Error(
        'Social links did not persist. Restart the backend after pulling the latest code, set PUBLIC_API_URL in .env.local to your API (e.g. http://localhost:5001/api), restart Next.js (npm run dev), and try again.'
      );
    }
    setSettings(fresh);
  };

  const handleSocialSave = async () => {
    setSocialFormError(null);
    const label = slLabel.trim();
    const link = normalizeHttpUrl(slLink);
    const logo = normalizeHttpUrl(slLogo);
    if (!label || !link || !logo) {
      setSocialFormError('Label, link, and logo are required.');
      return;
    }
    if (!isHttpUrl(link)) {
      setSocialFormError('Link must be a valid URL (example: https://wa.me/...).');
      return;
    }
    if (!isHttpUrl(logo)) {
      setSocialFormError('Logo must be a valid URL (upload an image to get a URL).');
      return;
    }
    const accentTrim = slAccent.trim();
    const accentColor =
      accentTrim && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(accentTrim) ? accentTrim : undefined;

    const id =
      socialEditingId ??
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `soc_${Date.now()}`);
    const entry: SocialLink = { id, label, link, logo, ...(accentColor ? { accentColor } : {}) };

    setSocialSubmitting(true);
    try {
      let socialLinks: SocialLink[];
      if (socialEditingId != null) {
        socialLinks = settings.socialLinks.map((s) => (s.id === socialEditingId ? entry : s));
      } else {
        socialLinks = [...settings.socialLinks, entry];
      }
      await persistSocialLinks(socialLinks);
      closeSocialModal();
      toast.success(socialEditingId != null ? 'Social link updated' : 'Social link added');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save';
      setSocialFormError(msg);
      toast.error(msg);
    } finally {
      setSocialSubmitting(false);
    }
  };

  const closeDeleteSocial = () => {
    setDeleteSocialTarget(null);
    setDeleteSocialError(null);
  };

  const confirmDeleteSocial = async () => {
    if (!deleteSocialTarget) return;
    setDeleteSocialError(null);
    setDeleteSocialSubmitting(true);
    try {
      const socialLinks = settings.socialLinks.filter((s) => s.id !== deleteSocialTarget.id);
      await persistSocialLinks(socialLinks);
      closeDeleteSocial();
      toast.success('Social link removed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not delete';
      setDeleteSocialError(msg);
      toast.error(msg);
    } finally {
      setDeleteSocialSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Settings" description="Admin and store settings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your profile name and admin sign-in password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileError && (
                <Alert variant="destructive">
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <label htmlFor="admin-name" className={fieldLabel}>
                  Name
                </label>
                <Input
                  id="admin-name"
                  type="text"
                  autoComplete="name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  maxLength={255}
                  disabled={profileLoading}
                />
              </div>
              <Button
                type="submit"
                isLoading={profileSaving}
                disabled={profileLoading || profileSaving || profileName.trim() === profileOriginalName.trim()}
              >
                Save name
              </Button>
            </form>

            <div className="border-t border-border pt-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {pwError && (
                  <Alert variant="destructive">
                    <AlertDescription>{pwError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <label htmlFor="pw-current" className={fieldLabel}>
                    Current password
                  </label>
                  <Input
                    id="pw-current"
                    type="password"
                    autoComplete="current-password"
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="pw-new" className={fieldLabel}>
                    New password
                  </label>
                  <Input
                    id="pw-new"
                    type="password"
                    autoComplete="new-password"
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="pw-confirm" className={fieldLabel}>
                    Confirm new password
                  </label>
                  <Input
                    id="pw-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" isLoading={pwLoading} disabled={pwLoading}>
                  Update password
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create admin</CardTitle>
            <CardDescription>Add another administrator with the same access. Share credentials securely.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              {createSuccess && (
                <Alert variant="success">
                  <AlertDescription>{createSuccess}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <label htmlFor="new-admin-email" className={fieldLabel}>
                  Email
                </label>
                <Input
                  id="new-admin-email"
                  type="email"
                  autoComplete="off"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="new-admin-name" className={fieldLabel}>
                  Name (optional)
                </label>
                <Input
                  id="new-admin-name"
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Display name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="new-admin-password" className={fieldLabel}>
                  Initial password
                </label>
                <Input
                  id="new-admin-password"
                  type="password"
                  autoComplete="new-password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">At least 8 characters. They can change it after signing in.</p>
              </div>
              <Button type="submit" variant="secondary" isLoading={createLoading} disabled={createLoading}>
                Create admin
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {saveMessage && (
          <Alert variant={saveState === 'error' ? 'destructive' : 'success'}>
            <AlertDescription>{saveMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Site setting</CardTitle>
              <CardDescription>Primary branding details used across the admin and customer-facing pages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="site-title" className={fieldLabel}>
                  Site title
                </label>
                <Input
                  id="site-title"
                  value={settings.siteTitle}
                  onChange={(e) => updateField('siteTitle', e.target.value)}
                  placeholder="Acme Digital"
                />
              </div>
              <ImageUploaderField
                id="site-logo"
                label="Site logo"
                value={settings.siteLogo}
                onChange={(value) => updateField('siteLogo', value)}
                onUploadFile={async (file) => {
                  const uploaded = await uploadAdminStoreLogo(file);
                  return uploaded.logo_url;
                }}
                helpText="Upload PNG, JPG, WEBP, or GIF. Stores a URL for storefront and email use."
              />
              <div className="space-y-2">
                <label htmlFor="contact-email" className={fieldLabel}>
                  Contact email
                </label>
                <Input
                  id="contact-email"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="support@example.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="address" className={fieldLabel}>
                  Business address
                </label>
                <textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className={textareaClass}
                  placeholder="Street, city, region, postal code, country"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email template setting</CardTitle>
              <CardDescription>Manage common header/footer content for outgoing emails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-lg border border-border/80 bg-muted/15 p-4">
                <p className="text-sm font-medium">Header</p>
                <ImageUploaderField
                  id="email-header-logo"
                  label="Site logo"
                  value={settings.emailHeaderLogo}
                  onChange={(value) => updateField('emailHeaderLogo', value)}
                  onUploadFile={async (file) => {
                    const uploaded = await uploadAdminStoreLogo(file);
                    return uploaded.logo_url;
                  }}
                  helpText="Shown at the top of email templates."
                />
                <div className="space-y-2">
                  <label htmlFor="email-header-slogan" className={fieldLabel}>
                    Site slogan
                  </label>
                  <Input
                    id="email-header-slogan"
                    value={settings.emailHeaderSlogan}
                    onChange={(e) => updateField('emailHeaderSlogan', e.target.value)}
                    placeholder="Your trusted digital marketplace"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email-header-subtitle" className={fieldLabel}>
                    Sub title (optional)
                  </label>
                  <Input
                    id="email-header-subtitle"
                    value={settings.emailHeaderSubtitle}
                    onChange={(e) => updateField('emailHeaderSubtitle', e.target.value)}
                    placeholder="Optional secondary line"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border/80 bg-muted/15 p-4">
                <p className="text-sm font-medium">Footer</p>
                <div className="space-y-2">
                  <label htmlFor="email-footer-support-email" className={fieldLabel}>
                    Support email
                  </label>
                  <Input
                    id="email-footer-support-email"
                    type="email"
                    value={settings.emailFooterSupportEmail}
                    onChange={(e) => updateField('emailFooterSupportEmail', e.target.value)}
                    placeholder="support@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email-footer-support-number" className={fieldLabel}>
                    Support number
                  </label>
                  <Input
                    id="email-footer-support-number"
                    value={settings.emailFooterSupportNumber}
                    onChange={(e) => updateField('emailFooterSupportNumber', e.target.value)}
                    placeholder="+880 1XXXXXXXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localization</CardTitle>
              <CardDescription>Display currency and scheduling context for the admin area.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currency" className={fieldLabel}>
                  Currency
                </label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className={selectClass}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="timezone" className={fieldLabel}>
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  className={selectClass}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Home — floating social buttons</CardTitle>
              <CardDescription>
                Shown on the home page as a floating chat button. Each entry needs a label, link, and logo image URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {settings.socialLinks.length === 0
                    ? 'No links yet — add one to show the button on the storefront.'
                    : `${settings.socialLinks.length} link(s) configured.`}
                </p>
                <Button type="button" onClick={openSocialCreate} variant="secondary" size="sm">
                  Add social link
                </Button>
              </div>
              {settings.socialLinks.length > 0 && (
                <ul className="divide-y divide-border rounded-lg border border-border/80">
                  {settings.socialLinks.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview; arbitrary URLs */}
                          <img src={s.logo} alt="" className="h-full w-full object-cover" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{s.label}</p>
                          <p className="truncate text-sm text-muted-foreground">{s.link}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openSocialEdit(s)}>
                          Edit
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteSocialTarget(s)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Modal
            open={socialModalOpen}
            onClose={closeSocialModal}
            title={socialEditingId != null ? 'Edit social link' : 'Add social link'}
            wide
          >
            <div className="space-y-4">
              {socialFormError && (
                <Alert variant="destructive">
                  <AlertDescription>{socialFormError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <label htmlFor="sl-label" className={fieldLabel}>
                  Label
                </label>
                <Input
                  id="sl-label"
                  value={slLabel}
                  onChange={(e) => setSlLabel(e.target.value)}
                  placeholder="WhatsApp"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="sl-link" className={fieldLabel}>
                  Link URL
                </label>
                <Input
                  id="sl-link"
                  type="url"
                  value={slLink}
                  onChange={(e) => setSlLink(e.target.value)}
                  placeholder="https://wa.me/15551234567"
                />
              </div>
              <ImageUploaderField
                id="sl-logo"
                label="Logo"
                value={slLogo}
                onChange={(value) => setSlLogo(value)}
                onUploadFile={async (file) => {
                  const uploaded = await uploadAdminStoreLogo(file);
                  return uploaded.logo_url;
                }}
                helpText="Square icons work best. Same upload as site logo (PNG, JPG, WEBP, GIF)."
              />
              <div className="space-y-2">
                <label htmlFor="sl-accent" className={fieldLabel}>
                  Accent color (optional)
                </label>
                <Input
                  id="sl-accent"
                  value={slAccent}
                  onChange={(e) => setSlAccent(e.target.value)}
                  placeholder="#25D366"
                  maxLength={7}
                />
                <p className="text-xs text-muted-foreground">Hex color for the label pill and icon ring.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" isLoading={socialSubmitting} onClick={() => void handleSocialSave()}>
                  {socialEditingId != null ? 'Save changes' : 'Add link'}
                </Button>
                <Button type="button" variant="outline" onClick={closeSocialModal}>
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>

          <Modal open={deleteSocialTarget != null} onClose={closeDeleteSocial} title="Remove social link">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Remove <span className="font-semibold text-foreground">{deleteSocialTarget?.label}</span> from the
                floating menu on the home page?
              </p>
              {deleteSocialError && (
                <Alert variant="destructive">
                  <AlertDescription>{deleteSocialError}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                <Button type="button" variant="outline" onClick={closeDeleteSocial} disabled={deleteSocialSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void confirmDeleteSocial()}
                  isLoading={deleteSocialSubmitting}
                >
                  Remove link
                </Button>
              </div>
            </div>
          </Modal>

          {/* Tax — hidden for now (see comment block above StoreSettings).
          <Card>
            <CardHeader>
              <CardTitle>Tax</CardTitle>
              <CardDescription>How prices and invoices should treat tax. Fine-tune when your billing rules are final.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/80 bg-muted/20 p-4">
                <input
                  type="checkbox"
                  checked={settings.pricesIncludeTax}
                  onChange={(e) => updateField('pricesIncludeTax', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span>
                  <span className="block text-sm font-medium">Prices include tax</span>
                  <span className="text-sm text-muted-foreground">
                    When enabled, listed product prices are gross; otherwise tax is added at checkout.
                  </span>
                </span>
              </label>
              <div className="space-y-2">
                <label htmlFor="tax-rate" className={fieldLabel}>
                  Default tax rate (%)
                </label>
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  step={0.01}
                  value={settings.taxRate}
                  onChange={(e) => updateField('taxRate', e.target.value)}
                  placeholder="0"
                  disabled={settings.pricesIncludeTax}
                />
                <p className="text-xs text-muted-foreground">
                  Used as a default where region-specific rules are not configured.
                </p>
              </div>
            </CardContent>
          </Card>
          */}

          {/* Email templates — hidden for now (see commented types/DEFAULT_TEMPLATES at top).
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Email templates</CardTitle>
              <CardDescription>
                System messages sent to customers. Placeholders like{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">{'{{customer_name}}'}</code> are replaced when
                mail is sent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="divide-y divide-border rounded-lg border border-border/80">
                {settings.templates.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    </div>
                    <Button
                      type="button"
                      variant={editingTemplateId === t.id ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setEditingTemplateId(editingTemplateId === t.id ? null : t.id)}
                    >
                      {editingTemplateId === t.id ? 'Close editor' : 'Edit'}
                    </Button>
                  </li>
                ))}
              </ul>

              {editingTemplate && (
                <div className="space-y-4 rounded-lg border border-border/80 bg-muted/15 p-4">
                  <p className="text-sm font-medium">Editing: {editingTemplate.name}</p>
                  <div className="space-y-2">
                    <label htmlFor="tpl-subject" className={fieldLabel}>
                      Subject
                    </label>
                    <Input
                      id="tpl-subject"
                      value={editingTemplate.subject}
                      onChange={(e) => updateTemplate(editingTemplate.id, { subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="tpl-body" className={fieldLabel}>
                      Body
                    </label>
                    <textarea
                      id="tpl-body"
                      value={editingTemplate.body}
                      onChange={(e) => updateTemplate(editingTemplate.id, { body: e.target.value })}
                      className={textareaClass}
                      rows={8}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          */}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
          <Button
            type="submit"
            isLoading={saveState === 'saving'}
            disabled={saveState === 'saving' || settingsLoading}
          >
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}
