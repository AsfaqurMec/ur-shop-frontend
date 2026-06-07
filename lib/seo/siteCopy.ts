/**
 * Authoritative public copy for SEO + on-page text.
 *
 * Use these strings for `<meta name="description">`, the homepage hero, and the footer so Google
 * does not mix conflicting snippets (it often picks visible body text if meta is weak or stale).
 *
 * Stale results in Search (old WordPress “Archives”, Bengali boilerplate) are from Google’s index,
 * not this app — fix with redirects + recrawl; see `legacyRedirects` in `next.config.js`.
 */

/** Primary meta description for the homepage (~150–160 chars). */
export const SITE_META_HOME_DESCRIPTION =
  'Trusted for Premium Panjabi Collection 👔 Men’s Fashion | Lifestyle Accessories';

/** Visible hero supporting line (should reinforce the meta description). */
export const SITE_HERO_SUBTITLE =
  'Trusted for Premium Panjabi Collection 👔 Men’s Fashion | Lifestyle Accessories';

/** Footer blurb — aligned with brand positioning; avoids a random paragraph becoming the SERP snippet. */
export const SITE_FOOTER_BLURB =
'Trusted for Premium Panjabi Collection 👔 Men’s Fashion | Lifestyle Accessories';

/** Default site-wide description when a page does not override metadata (layout fallback). */
export const SITE_DEFAULT_DESCRIPTION = SITE_META_HOME_DESCRIPTION;
