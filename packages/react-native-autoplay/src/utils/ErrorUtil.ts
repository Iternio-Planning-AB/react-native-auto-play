const isError = (error: unknown): error is { message: string } => {
  if (error == null) {
    return false;
  }

  if (typeof error !== 'object') {
    return false;
  }

  if (!('message' in error && 'name' in error)) {
    return false;
  }

  if (error.name !== 'Error') {
    return false;
  }

  if (typeof error.message !== 'string') {
    return false;
  }

  return true;
};

const isTemplateNotFoundError = (error: unknown): error is Error => {
  if (isError(error)) {
    return error.message.startsWith('templateNotFound');
  }

  return false;
};

const isVoiceInputCanceledError = (error: unknown): error is Error => {
  if (isError(error)) {
    return error.message.startsWith('voiceInputCancelled');
  }

  return false;
};

export const ErrorUtil = { isTemplateNotFoundError, isVoiceInputCanceledError };
