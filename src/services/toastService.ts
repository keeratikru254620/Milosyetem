import type { ToastPayload, ToastType } from '../types';

type ToastListener = (payload: ToastPayload) => void;

class ToastEmitter {
  private listeners: ToastListener[] = [];

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((current) => current !== listener);
    };
  }

  show(message: string, type: ToastType = 'success') {
    this.listeners.forEach((listener) => listener({ message, type }));
  }
}

export const toastService = new ToastEmitter();
export const showToast = (message: string, type: ToastType = 'success') =>
  toastService.show(message, type);
