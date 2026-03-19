import { useEffect } from 'react';

import type { User } from '../types';

export const useIdleLogout = (
  currentUser: User | null,
  onIdle: () => Promise<void> | void,
) => {
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        void onIdle();
      }, 15 * 60 * 1000);
    };

    const events: Array<keyof WindowEventMap> = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [currentUser, onIdle]);
};
