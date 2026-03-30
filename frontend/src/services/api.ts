import { mockApi } from './mockApi';
import { serverApi } from './serverApi';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim();

export const isServerApiEnabled = Boolean(apiBaseUrl);

export const api = isServerApiEnabled ? serverApi : mockApi;
