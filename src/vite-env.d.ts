/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_KIOSK_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
