/** Display helpers for role badges (UI only — not permission logic). */

export const ROLE_BADGE_FALLBACK = "bg-muted text-foreground/70 border-border";

/** Optional per-role-code badge classes; unknown roles use `ROLE_BADGE_FALLBACK`. */
export const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/20",
};

export function roleBadgeClassFor(role: string | null | undefined): string {
  return ROLE_BADGE[(role ?? "").trim().toUpperCase()] ?? ROLE_BADGE_FALLBACK;
}
