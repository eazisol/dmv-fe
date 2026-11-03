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

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

/** React Query key for company branding (shell, etc.). */
export const brandingQueryKey = ["settings", "branding"] as const;

function isHexColor(value: string | null | undefined): value is string {
  return !!value && HEX6.test(value.trim());
}

/**
 * Apply brand colors to CSS variables.
 * Primary → accent / ring (CTAs) + sidebar menu hover/select (opacity mix).
 * Secondary → primary / sidebar background.
 */
export function applyBrandingTheme(branding: Pick<BrandingSettings, "primaryColor" | "secondaryColor"> | null | undefined) {
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
}

/** Shared branding fetch for sidebar logo, etc. */
export function useCompanyBranding() {
  return useQuery({
    queryKey: brandingQueryKey,
    queryFn: async () => (await settingsService.getBranding()).data ?? null,
    staleTime: 60_000,
  });
}

/** Keep shell theme in sync with saved branding colors. */
export function useApplyBrandingTheme() {
  const brandingQuery = useCompanyBranding();
  useEffect(() => {
    applyBrandingTheme(brandingQuery.data ?? null);
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
