import { ExternalLink, Megaphone, Sparkles, Tag, Users } from 'lucide-react';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import type { SocialLink } from '@/lib/api/storeSettings';
import { FacebookIcon } from './FacebookIcon';
import { SectionHeading } from './SectionHeading';
import { findFacebookLink } from './utils';

interface FacebookFeedSectionProps {
  socialLinks: SocialLink[];
}

const FACEBOOK_PAGE_IMAGE = '/facebook-page.png';

const communityHighlights = [
  {
    icon: Megaphone,
    title: 'Latest drops',
    description: 'Be first to know when new products launch',
  },
  {
    icon: Tag,
    title: 'Member deals',
    description: 'Exclusive discounts for our community',
  },
  {
    icon: Users,
    title: 'Direct support',
    description: 'Quick answers and updates from our team',
  },
];

export function FacebookFeedSection({ socialLinks }: FacebookFeedSectionProps) {
  const facebookLink = findFacebookLink(socialLinks);
  const facebookHref = facebookLink?.link?.trim();
  const pageLabel = facebookLink?.label ?? 'UR SHOP';

  const pagePreview = (
    <img
      src={FACEBOOK_PAGE_IMAGE}
      alt={`${pageLabel} Facebook page`}
      className="w-full object-cover object-top"
    />
  );

  return (
    <section className="border-y border-border/50 bg-muted/20 py-16 md:py-20">
      <Container size="lg">
        <SectionHeading
          eyebrow="Social"
          title="Follow Us on Facebook"
          description="Get product updates, community-only offers, and news straight from our page"
        />

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
            <div className="relative flex flex-col justify-between gap-8 border-b border-border p-8 md:p-10 lg:border-b-0 lg:border-r">
              <div
                className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
                aria-hidden
              />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Community
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 blur-sm" aria-hidden />
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                      {facebookLink?.logo ? (
                        <img src={facebookLink.logo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <FacebookIcon className="h-8 w-8 text-[#1877F2]" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{pageLabel}</p>
                    <p className="text-sm text-muted-foreground">14K followers · Official page</p>
                  </div>
                </div>

                <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Trusted for premium Panjabi collections, men&apos;s fashion, and lifestyle accessories. Follow us for
                  new arrivals, exclusive offers, and order updates.
                </p>

                <div className="mt-8 space-y-3">
                  {communityHighlights.map(({ icon: Icon, title, description }) => (
                    <div
                      key={title}
                      className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 transition-colors hover:border-primary/20 hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {facebookHref ? (
                <a href={facebookHref} target="_blank" rel="noopener noreferrer" className="relative inline-flex">
                  <Button size="lg" className="w-full shadow-md shadow-primary/20 sm:w-auto">
                    <FacebookIcon className="mr-2 h-4 w-4" />
                    Visit Facebook Page
                    <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-80" />
                  </Button>
                </a>
              ) : (
                <p className="relative text-sm text-muted-foreground">
                  Add a Facebook link in admin settings to enable the visit button.
                </p>
              )}
            </div>

            <div className="relative bg-background p-4 md:p-5">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1877F2]/10 via-transparent to-primary/5" aria-hidden />
              {facebookHref ? (
                <a
                  href={facebookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block overflow-hidden rounded-xl ring-1 ring-white/10 shadow-2xl transition-all hover:ring-[#1877F2]/40 hover:shadow-[#1877F2]/20 hover:blur-xs"
                  aria-label={`Open ${pageLabel} on Facebook`}
                >
                  {pagePreview}
                  <div className="absolute z-50 inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-4 py-2 text-lg font-semibold text-white shadow-lg">
                      Open on Facebook
                      <ExternalLink className="h-4 w-4" />
                    </span>
                  </div>
                </a>
              ) : (
                <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10 shadow-2xl">{pagePreview}</div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
