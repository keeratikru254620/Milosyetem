import type { ConfirmState } from '../types';

type ConfirmListener = (payload: ConfirmState) => void;

class ConfirmEmitter {
  private listeners: ConfirmListener[] = [];

  subscribe(listener: ConfirmListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((current) => current !== listener);
    };
  }

  confirm(title: string, message: string) {
    return new Promise<boolean>((resolve) => {
      this.listeners.forEach((listener) => listener({ title, message, resolve }));
    });
  }
}

export const confirmService = new ConfirmEmitter();
export const confirmDialog = (title: string, message: string) =>
  confirmService.confirm(title, message);
