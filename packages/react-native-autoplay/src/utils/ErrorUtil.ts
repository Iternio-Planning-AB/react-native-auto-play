const isTemplateNotFoundError = (error: unknown): error is Error => {
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

  return error.message.startsWith('templateNotFound');
};

export const ErrorUtil = { isTemplateNotFoundError };
