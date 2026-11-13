/**
 * Build-time / host app identity for Core UI shells.
 * Product-specific hosts set VITE_* in `.env`; the defaults below target DMV.
 */

function env(key: keyof ImportMetaEnv, fallback: string): string {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export const appConfig = {
  /** Short product name shown in chrome (e.g. DMV). */
  appName: env("VITE_APP_NAME", "DMV"),
  /** One-line product descriptor under the name (optional). */
  appTagline: env("VITE_APP_TAGLINE", ""),
  /** Legal / copyright line (AuthLayout footer). */
  companyName: env("VITE_COMPANY_NAME", "DMV"),
  /** Document title suffix: `Sign in | …`. */
  documentTitle: env("VITE_DOCUMENT_TITLE", "DMV"),
  supportEmail: env("VITE_SUPPORT_EMAIL", "support@example.com"),
  emailPlaceholder: env("VITE_EMAIL_PLACEHOLDER", "you@example.com"),
  /** Marketing blurb on the AuthLayout aside (optional empty to hide). */
  authHeroTitle: env(
    "VITE_AUTH_HERO_TITLE",
    "Secure access to your DMV dashboard",
  ),
  authHeroBody: env(
    "VITE_AUTH_HERO_BODY",
    "Sign in to manage users, roles, permissions and settings from one place.",
  ),
  /**
   * Default API base. Prefer `VITE_API_BASE_URL` in `.env`.
   */
  apiBaseUrl: env("VITE_API_BASE_URL", "https://dmv.yehtohoga.com/api/"),
  // apiBaseUrl: env("VITE_API_BASE_URL", "http://localhost:5179/api/"),
  /** Post-login home / bootstrap fallback. */
  defaultHomePath: env("VITE_DEFAULT_HOME_PATH", "/"),
} as const;

/** Browser tab title helper — `pageTitle("Sign in")` → `Sign in | Auth & User Management`. */
export function pageTitle(page: string): string {
  const suffix = appConfig.documentTitle;
  const trimmed = page.trim();
  if (!trimmed) return suffix;
  return `${trimmed} | ${suffix}`;
}
