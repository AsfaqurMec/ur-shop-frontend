/** Public blog post — align backend `GET /blog-posts/public/s/:slug` response with this shape. */
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_image: string | null;
  published_at: string | null;
  updated_at: string;
}

export interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  updated_at: string;
}
