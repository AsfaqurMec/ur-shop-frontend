import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchBlogPostBySlug } from '@/lib/api/blogPosts';
import { getSiteUrl } from '@/lib/seo/site';
import { toAbsoluteUrl } from '@/lib/seo/resolveOgImage';
import { truncateForMeta } from '@/lib/seo/text';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { JsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/ui';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);
  const canonicalPath = `/blogs/${slug}`;
  const canonical = `${getSiteUrl()}${canonicalPath}`;

  if (!post) {
    return {
      title: 'Article',
      robots: { index: false, follow: false },
    };
  }

  const description = truncateForMeta(post.excerpt ?? post.title, 160);
  const ogImage = toAbsoluteUrl(post.cover_image) ?? `${getSiteUrl()}/icon.png`;

  return {
    title: post.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: post.title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [ogImage],
    },
  };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);
  if (!post) notFound();

  const canonicalPath = `/blogs/${slug}`;
  const crumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: post.title, path: canonicalPath },
  ]);

  return (
    <>
      <JsonLd data={crumbs} />
      <JsonLd data={articleJsonLd(post, canonicalPath)} />
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2 text-sm">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-foreground font-medium line-clamp-1">{post.title}</li>
            </ol>
          </nav>
        </div>
      </div>
      <Container className="py-10 md:py-14">
        <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl">
          <header>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{post.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {post.published_at
                ? `Published ${new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'long' })}`
                : `Updated ${new Date(post.updated_at).toLocaleDateString(undefined, { dateStyle: 'long' })}`}
            </p>
          </header>
          {post.body ? (
            <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-foreground">{post.body}</div>
          ) : (
            <p className="mt-8 text-muted-foreground">No body content.</p>
          )}
        </article>
      </Container>
    </>
  );
}
