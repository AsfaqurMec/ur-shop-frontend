import Link from 'next/link';
import { fetchBlogPostSummaries } from '@/lib/api/blogPosts';
import { createPageMetadata } from '@/lib/seo/metadata';
import { Container } from '@/components/ui';

export const metadata = createPageMetadata({
  path: '/blogs',
  title: 'Blog & updates',
  description:
    'Parves BD blog: articles in English about digital products, licenses, storefront updates, and how to get the most from your purchases.',
  keywords: ['Parves BD blog', 'digital products', 'licenses', 'guides'],
});

export default async function BlogsIndexPage() {
  const posts = await fetchBlogPostSummaries();

  return (
    <Container className="py-10 md:py-14">
      <header className="border-b border-border/80 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Blog</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Articles and announcements. When your backend exposes the public blog API, posts appear here automatically.
        </p>
      </header>
      <ul className="mt-10 space-y-6">
        {posts.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
            No posts yet. Connect the <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">blog-posts/public</code> API to
            list articles.
          </li>
        ) : (
          posts.map((p) => (
            <li key={p.slug}>
              <article className="rounded-xl border border-border/80 bg-card p-6 shadow-sm transition hover:border-primary/30">
                <h2 className="text-xl font-semibold text-foreground">
                  <Link href={`/blogs/${encodeURIComponent(p.slug)}`} className="hover:text-primary">
                    {p.title}
                  </Link>
                </h2>
                {p.excerpt ? <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p> : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  Updated {new Date(p.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
              </article>
            </li>
          ))
        )}
      </ul>
    </Container>
  );
}
