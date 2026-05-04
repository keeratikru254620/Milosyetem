import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

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

export const useAppBootstrap = ({
  initialPathname,
  loadAllData,
  navigate,
  setCurrentUser,
}: UseAppBootstrapArgs): UseAppBootstrapResult => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const user = await api.verifySession();

        if (!isMounted) {
          return;
        }

        if (user) {
          setCurrentUser(user);
          await loadAllData(user);
        } else if (!isPublicPath(initialPathname)) {
          navigate(APP_PATHS.login);
        }
      } catch (error) {
        if (isMounted) {
          const resolvedError =
            error instanceof Error ? error : new Error(String(error ?? 'Unknown bootstrap error'));
          console.error('App bootstrap failed:', resolvedError);
          setBootstrapError(resolvedError);
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
  }, [initialPathname, loadAllData, navigate, setCurrentUser]);

  return { isAppReady, bootstrapError };
};
