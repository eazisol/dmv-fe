import { appConfig } from "@/lib/app-config";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  role: string;
  userTypeId?: number;
  userTypeCode?: string;
}

export interface SessionShape {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export const SESSION_KEY = "auth.api.session.v2";

export function getStoredSession(): SessionShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionShape;
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    if (!session.token || !session.user) return null;
    return session;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: SessionShape | null) {
  if (typeof window === "undefined") return;
  if (!session) window.localStorage.removeItem(SESSION_KEY);
  else window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Full-page replace to /signin. Returns true when navigation was started.
 * Avoids soft-nav races that leave the previous screen stuck/frozen.
 */
export function redirectToSignIn(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  if (path === "/signin" || path === "/forgot-password" || path === "/reset-password") {
    return false;
  }
  window.location.replace("/signin");
  return true;
}

export function clearLegacySessionKeys() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("auth.api.session.v1");
  } catch {
    /* ignore */
  }
}

/**
 * Runs before React paints. Prevents protected pages (e.g. Dashboard) from
 * flashing when there is no valid local session.
 * Paths come from app-config defaults baked at build time.
 */
const BOOTSTRAP_DEFAULT_HOME = JSON.stringify(appConfig.defaultHomePath);

export const AUTH_BOOTSTRAP_SCRIPT = `(function(){try{var p=location.pathname;var pub=p==="/signin"||p==="/forgot-password"||p==="/reset-password";var raw=localStorage.getItem(${JSON.stringify(SESSION_KEY)});var ok=false;var home=${BOOTSTRAP_DEFAULT_HOME};if(raw){var s=JSON.parse(raw);ok=!!(s&&s.token&&s.user&&!(s.expiresAt&&Date.parse(s.expiresAt)<Date.now()));if(!ok)localStorage.removeItem(${JSON.stringify(SESSION_KEY)});}if(!pub&&!ok){location.replace("/signin");return;}if(p==="/signin"&&ok){location.replace(home);}}catch(e){if(location.pathname!=="/signin"&&location.pathname!=="/forgot-password"&&location.pathname!=="/reset-password")location.replace("/signin");}})();`;
