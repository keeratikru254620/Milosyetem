import axios from 'axios';

import { AUTH_TOKEN_KEY } from '../utils/auth';

const baseURL = (import.meta.env.VITE_API_BASE_URL ?? '').trim();

export const http = axios.create({
  baseURL,
});

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
