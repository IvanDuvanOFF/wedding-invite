/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Deployed Google Apps Script web-app URL that records RSVP submissions. */
  readonly VITE_RSVP_ENDPOINT?: string;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
