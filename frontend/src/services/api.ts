import { serverApi } from './serverApi';
import { API_BASE_URL } from './apiConfig';

export const isServerApiEnabled = Boolean(API_BASE_URL);

export const api = serverApi;
