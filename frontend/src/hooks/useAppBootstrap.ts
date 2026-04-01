import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import { localAppService } from '../services/localAppService';
import { injectGlobalAppStyles } from '../styles/globalAppStyles';
import type { User } from '../types';

interface UseAppBootstrapArgs {
  initialPathname: string;
  loadAllData: (user?: User | null) => Promise<void>;
  navigate: (path: string) => void;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
}

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/terms',
  '/privacy',
  '/dashboard',
  '/documents',
  '/doctypes',
  '/users',
  '/settings',
  '/settings/profile',
  '/settings/general',
  '/settings/security',
  '/settings/support',
]);

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.has(pathname) || pathname === '/preview' || pathname.startsWith('/preview/');

export const useAppBootstrap = ({
  initialPathname,
  loadAllData,
  navigate,
  setCurrentUser,
}: UseAppBootstrapArgs) => {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const cleanup = injectGlobalAppStyles();

    const bootstrap = async () => {
      try {
        const user = await localAppService.verifySession();

        if (!isMounted) {
          return;
        }

        if (user) {
          setCurrentUser(user);
          await loadAllData(user);
        } else if (!isPublicPath(initialPathname)) {
          navigate('/login');
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
      cleanup();
    };
  }, []);

  return isAppReady;
};
