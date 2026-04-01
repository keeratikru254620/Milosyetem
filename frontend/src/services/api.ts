import { firebaseApi } from './firebaseApi';
import { localDataApi } from './localDataApi';

export const api = {
  ...firebaseApi,
  ...localDataApi,
};
