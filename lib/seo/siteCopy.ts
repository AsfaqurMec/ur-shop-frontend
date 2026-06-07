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
  'Parves BD — official digital store for software, apps, courses, licenses, and downloads. Secure checkout, instant delivery, and dashboard access for keys and files.';

/** Visible hero supporting line (should reinforce the meta description). */
export const SITE_HERO_SUBTITLE =
  'Parves BD brings you premium digital products and licenses. Shop with secure checkout, then access downloads and license keys from your account whenever you need them.';

/** Footer blurb — aligned with brand positioning; avoids a random paragraph becoming the SERP snippet. */
export const SITE_FOOTER_BLURB =
  'Parves BD — digital products with instant delivery, secure checkout, and a clear account area for downloads, license keys, and support.';

/** Default site-wide description when a page does not override metadata (layout fallback). */
export const SITE_DEFAULT_DESCRIPTION = SITE_META_HOME_DESCRIPTION;
