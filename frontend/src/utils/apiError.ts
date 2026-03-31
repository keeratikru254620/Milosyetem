import axios from 'axios';

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
    networkMessage = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาเปิด backend ก่อน',
    fallbackMessage,
  }: ApiErrorMessageOptions,
) => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return networkMessage;
    }

    const statusCode = error.response.status;
    const responseMessage =
      typeof error.response.data?.message === 'string' ? error.response.data.message.trim() : '';

    if (statusCode === 409) {
      return duplicateMessage;
    }

    if (statusCode === 401) {
      return invalidCredentialsMessage;
    }

    if (responseMessage) {
      return responseMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};
