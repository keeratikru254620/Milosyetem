const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim() || DEFAULT_API_BASE_URL;

export const BACKEND_ORIGIN = new URL(API_BASE_URL).origin;
