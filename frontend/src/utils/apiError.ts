import { API_PROVIDER } from '../services/apiConfig';

interface ApiErrorMessageOptions {
  duplicateMessage?: string;
  invalidCredentialsMessage?: string;
  networkMessage?: string;
  fallbackMessage: string;
}

export const getApiErrorMessage = (
  error: unknown,
  {
    duplicateMessage = 'ข้อมูลนี้ถูกใช้งานอยู่แล้ว',
    invalidCredentialsMessage = 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง',
    networkMessage =
      API_PROVIDER === 'firebase'
        ? 'ไม่สามารถเชื่อมต่อ Firebase ได้ กรุณาตรวจสอบการตั้งค่าและเครือข่าย'
        : 'ไม่สามารถเชื่อมต่อระบบข้อมูลได้',
    fallbackMessage,
  }: ApiErrorMessageOptions,
) => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: string }).code || '').trim();

    if (
      code === 'auth/email-already-in-use' ||
      code === 'auth/account-exists-with-different-credential'
    ) {
      return duplicateMessage;
    }

    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-login-credentials' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password'
    ) {
      return invalidCredentialsMessage;
    }

    if (code === 'auth/network-request-failed') {
      return networkMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};
