import type { User } from '../types';

export const AUTH_TOKEN_KEY = 'ccib_auth_token';

export const generateToken = (user: User) =>
  btoa(
    JSON.stringify({
      id: user._id,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }),
  );
