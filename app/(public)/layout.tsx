import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationJsonLd } from '@/lib/seo/jsonld';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import { FloatingCartSummary } from '@/components/storefront/FloatingCartSummary';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicStoreSettings().catch(() => null);

  return (
    <div className="flex min-h-screen flex-col bg-background md:pb-0">
      <JsonLd data={organizationJsonLd()} />
      <PublicHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <FloatingCartSummary />
      <PublicFooter settings={settings} />
    </div>
  );
}
