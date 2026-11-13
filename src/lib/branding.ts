import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiMenu } from "@/lib/api/services/auth";
import { settingsService, type BrandingSettings } from "@/lib/api/services/settings";

/** Branding settings route. */
export const BRANDING_ROUTE = "/branding";

/** Legacy menu code (stripped if still present from an old seed). */
export const BRANDING_CODE = "BRANDING";

/** Defaults matching `styles.css` palette comments. */
export const DEFAULT_PRIMARY_COLOR = "#0D9488";
export const DEFAULT_SECONDARY_COLOR = "#1E293B";

/** Cached theme colors so auth pages can paint before the public branding GET returns. */
const BRANDING_THEME_CACHE_KEY = "branding.theme.v1";

type BrandingThemeColors = Pick<BrandingSettings, "primaryColor" | "secondaryColor">;

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

/** React Query key for company branding (shell, etc.). */
export const brandingQueryKey = ["settings", "branding"] as const;

function isHexColor(value: string | null | undefined): value is string {
  return !!value && HEX6.test(value.trim());
}

function readCachedBrandingTheme(): BrandingThemeColors | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BRANDING_THEME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BrandingThemeColors>;
    const primaryColor = parsed.primaryColor?.trim() ?? "";
    const secondaryColor = parsed.secondaryColor?.trim() ?? "";
    if (!isHexColor(primaryColor) && !isHexColor(secondaryColor)) return null;
    return { primaryColor, secondaryColor };
  } catch {
    return null;
  }
}

function writeCachedBrandingTheme(branding: BrandingThemeColors | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    const primaryColor = branding?.primaryColor?.trim() ?? "";
    const secondaryColor = branding?.secondaryColor?.trim() ?? "";
    if (!isHexColor(primaryColor) && !isHexColor(secondaryColor)) {
      window.localStorage.removeItem(BRANDING_THEME_CACHE_KEY);
      return;
    }
    window.localStorage.setItem(
      BRANDING_THEME_CACHE_KEY,
      JSON.stringify({ primaryColor, secondaryColor }),
    );
  } catch {
    /* storage disabled — ignore */
  }
}

/**
 * Apply brand colors to CSS variables.
 * Primary → accent / ring (CTAs) + sidebar menu hover/select (opacity mix).
 * Secondary → primary / sidebar background.
 */
export function applyBrandingTheme(branding: BrandingThemeColors | null | undefined) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const primary = branding?.primaryColor?.trim();
  const secondary = branding?.secondaryColor?.trim();

  if (isHexColor(primary)) {
    root.style.setProperty("--accent", primary);
    root.style.setProperty("--ring", primary);
    // Menu select (stronger) + hover (softer) from primary
    root.style.setProperty(
      "--sidebar-accent",
      `color-mix(in srgb, ${primary} 42%, transparent)`,
    );
    root.style.setProperty(
      "--sidebar-menu-hover",
      `color-mix(in srgb, ${primary} 24%, transparent)`,
    );
    root.style.setProperty("--sidebar-accent-foreground", "#ffffff");
  } else {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--sidebar-accent");
    root.style.removeProperty("--sidebar-menu-hover");
    root.style.removeProperty("--sidebar-accent-foreground");
  }

  if (isHexColor(secondary)) {
    root.style.setProperty("--primary", secondary);
    root.style.setProperty("--sidebar", secondary);
  } else {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--sidebar");
  }

  writeCachedBrandingTheme(
    branding
      ? {
          primaryColor: isHexColor(primary) ? primary : "",
          secondaryColor: isHexColor(secondary) ? secondary : "",
        }
      : null,
  );
}

/** Shared branding fetch for shell + public auth screens. */
export function useCompanyBranding() {
  return useQuery({
    queryKey: brandingQueryKey,
    queryFn: async () => (await settingsService.getBranding({ silentError: true })).data ?? null,
    staleTime: 60_000,
  });
}

/** Keep CSS theme in sync with saved branding (AppShell + AuthLayout). */
export function useApplyBrandingTheme() {
  const brandingQuery = useCompanyBranding();
  useEffect(() => {
    const cached = readCachedBrandingTheme();
    if (cached) applyBrandingTheme(cached);
  }, []);
  useEffect(() => {
    if (brandingQuery.data !== undefined) {
      applyBrandingTheme(brandingQuery.data ?? null);
    }
  }, [brandingQuery.data]);
}

function normalizeCode(code: string | null | undefined): string {
  return (code ?? "").trim().toUpperCase();
}

/** Drop any API Branding node (legacy seed) from the tree. */
export function stripBrandingMenu(menus: ApiMenu[]): ApiMenu[] {
  const strip = (items: ApiMenu[]): ApiMenu[] =>
    items
      .filter((menu) => normalizeCode(menu.code) !== BRANDING_CODE)
      .map((menu) => ({
        ...menu,
        children: menu.children?.length ? strip(menu.children) : menu.children,
      }));

  return strip(menus);
}
