import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import { api } from '../services/api';
import { injectGlobalAppStyles } from '../styles/globalAppStyles';
import type { User } from '../types';

interface UseAppBootstrapArgs {
  initialPathname: string;
  loadAllData: () => Promise<void>;
  navigate: (path: string) => void;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
}

const PUBLIC_PATHS = new Set(['/','/login', '/register', '/forgot-password']);

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
        const user = await api.verifySession();

        if (!isMounted) {
          return;
        }

        if (user) {
          setCurrentUser(user);
          await loadAllData();
        } else if (!PUBLIC_PATHS.has(initialPathname)) {
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
