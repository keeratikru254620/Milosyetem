/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_BACKEND?: 'local' | 'firebase';
  readonly VITE_ADMIN_ALLOWED_EMAILS?: string;
  readonly VITE_ADMIN_ALLOWED_UIDS?: string;
  readonly VITE_ADMIN_FIREBASE_API_KEY?: string;
  readonly VITE_ADMIN_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_ADMIN_FIREBASE_PROJECT_ID?: string;
  readonly VITE_ADMIN_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_ADMIN_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_ADMIN_FIREBASE_APP_ID?: string;
  readonly VITE_ADMIN_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_BYPASS_ORGANIZATION_VERIFICATION?: string;
  readonly VITE_SHOW_EQUIPMENT_DELETE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const workerUrl: string;
  export default workerUrl;
}
