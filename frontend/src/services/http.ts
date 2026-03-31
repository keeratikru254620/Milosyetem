import axios from 'axios';

import { AUTH_TOKEN_KEY } from '../utils/auth';
import { API_BASE_URL } from './apiConfig';

export const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
