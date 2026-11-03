/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_TAGLINE?: string;
  readonly VITE_COMPANY_NAME?: string;
  readonly VITE_DOCUMENT_TITLE?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
  readonly VITE_EMAIL_PLACEHOLDER?: string;
  readonly VITE_AUTH_HERO_TITLE?: string;
  readonly VITE_AUTH_HERO_BODY?: string;
  readonly VITE_DEFAULT_HOME_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
