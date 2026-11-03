import { toast } from "sonner";
import type { ApiMenu } from "@/lib/api/services/auth";
import { canAccessPath, toAppPath } from "@/lib/authorization";

/** Extract pathname from a notification deep link (e.g. `/users?x=1` → `/users`). */
export function notificationLinkPathname(linkPath: string | null | undefined): string | null {
  const raw = (linkPath ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw, "http://local.invalid");
    return toAppPath(url.pathname);
  } catch {
    const pathOnly = raw.split("?")[0]?.split("#")[0] ?? "";
    return pathOnly ? toAppPath(pathOnly) : null;
  }
}

function parseLink(linkPath: string): URL | null {
  try {
    return new URL(linkPath.trim(), "http://local.invalid");
  } catch {
    return null;
  }
}

/**
 * Resolves where a notification should navigate.
 * Returns null when the user cannot open any related destination.
 */
export function resolveNotificationLink(
  menus: ApiMenu[],
  linkPath: string | null | undefined,
): string | null {
  const raw = (linkPath ?? "").trim();
  if (!raw) return null;

  const url = parseLink(raw);
  const pathname = notificationLinkPathname(raw);
  if (!pathname || !url) return null;

  if (canAccessPath(menus, pathname)) {
    return raw.startsWith("/") ? raw : `${pathname}${url.search}`;
  }

  toast.error("You don't have access to open this notification.");
  return null;
}

/**
 * Navigate to a resolved notification link (path + optional query string).
 * Prefer router.navigate over history.push so search params validate correctly.
 */
export function navigateToNotificationLink(
  navigate: (opts: { href: string }) => unknown,
  linkPath: string,
) {
  const raw = linkPath.trim();
  if (!raw) return;
  const href = raw.startsWith("/") ? raw : `/${raw}`;
  void navigate({ href });
}

/**
 * @deprecated Prefer resolveNotificationLink — kept for simple access checks.
 */
export function canOpenNotificationLink(
  menus: ApiMenu[],
  linkPath: string | null | undefined,
): boolean {
  return resolveNotificationLink(menus, linkPath) != null;
}
