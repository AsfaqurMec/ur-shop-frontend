/**
 * SEO-safe text helpers (meta descriptions, excerpts).
 */

const HTML_TAG = /<[^>]+>/g;

export function stripHtml(input: string): string {
  return input.replace(HTML_TAG, ' ').replace(/\s+/g, ' ').trim();
}

/** Keeps descriptions within a safe length for meta tags and social snippets. */
export function truncateForMeta(text: string | null | undefined, maxLen = 160): string {
  if (!text?.trim()) return '';
  const t = text.trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}
