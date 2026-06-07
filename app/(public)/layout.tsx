import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationJsonLd } from '@/lib/seo/jsonld';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';

/** Storefront loads catalog from the backend; force request-time rendering so build/CI without a running API does not bake empty lists into static HTML. */
export const dynamic = 'force-dynamic';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicStoreSettings().catch(() => null);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <JsonLd data={organizationJsonLd()} />
      <PublicHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <PublicFooter settings={settings} />
    </div>
  );
}
