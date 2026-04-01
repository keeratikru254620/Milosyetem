import { firebaseApi } from './firebaseApi';
import { localDataApi } from './localDataApi';

export const isServerApiEnabled = false;
export const isFirebaseApiEnabled = true;

export const api = {
  ...firebaseApi,
  ...localDataApi,
};
