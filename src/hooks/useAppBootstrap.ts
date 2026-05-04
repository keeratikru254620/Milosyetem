import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';

import { APP_PATHS, isPublicPath } from '../constants/views';
import { api } from '../services/api';
import type { User } from '../types';

interface UseAppBootstrapArgs {
  initialPathname: string;
  loadAllData: (user?: User | null) => Promise<void>;
  navigate: (path: string) => void;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
}

interface UseAppBootstrapResult {
  isAppReady: boolean;
  bootstrapError: Error | null;
}

const SESSION_CHECK_TIMEOUT_MS = 8000;
const DATA_LOAD_TIMEOUT_MS = 10000;

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });

export const useAppBootstrap = ({
  initialPathname,
  loadAllData,
  navigate,
  setCurrentUser,
}: UseAppBootstrapArgs): UseAppBootstrapResult => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);
  const initialPathnameRef = useRef(initialPathname);
  const loadAllDataRef = useRef(loadAllData);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    loadAllDataRef.current = loadAllData;
  }, [loadAllData]);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        setBootstrapError(null);

        const user = await withTimeout(
          api.verifySession(),
          SESSION_CHECK_TIMEOUT_MS,
          'session_check_timeout',
        );

        if (!isMounted) {
          return;
        }

        if (user) {
          setCurrentUser(user);
          try {
            await withTimeout(
              loadAllDataRef.current(user),
              DATA_LOAD_TIMEOUT_MS,
              'data_load_timeout',
            );
          } catch (error) {
            console.warn('Initial data load did not finish before the app became ready:', error);
          }
        } else if (!isPublicPath(initialPathnameRef.current)) {
          navigateRef.current(APP_PATHS.login);
        }
      } catch (error) {
        if (isMounted) {
          const resolvedError =
            error instanceof Error ? error : new Error(String(error ?? 'Unknown bootstrap error'));
          console.warn('Session bootstrap did not complete, continuing as signed out:', resolvedError);

          setCurrentUser(null);

          if (!isPublicPath(initialPathnameRef.current)) {
            navigateRef.current(APP_PATHS.login);
          }
        }
      } finally {
        if (isMounted) {
          setIsAppReady(true);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [setCurrentUser]);

  return { isAppReady, bootstrapError };
};
