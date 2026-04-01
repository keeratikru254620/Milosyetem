interface ErrorMessageOptions {
  duplicateMessage?: string;
  invalidCredentialsMessage?: string;
  fallbackMessage: string;
}

export const getErrorMessage = (
  error: unknown,
  { duplicateMessage, invalidCredentialsMessage, fallbackMessage }: ErrorMessageOptions,
) => {
  if (error instanceof Error) {
    const message = error.message.trim();

    if (!message) {
      return fallbackMessage;
    }

    if (message === 'duplicate_record') {
      return duplicateMessage || fallbackMessage;
    }

    if (message === 'invalid_credentials') {
      return invalidCredentialsMessage || fallbackMessage;
    }

    return message;
  }

  return fallbackMessage;
};
