/**
 * Maps API error responses to user-friendly messages.
 *
 * Supports common backend response shapes:
 *
 * Custom API:
 *   {
 *     status: 'error',
 *     message: '...',
 *     errors: ['Field X: ...']
 *   }
 *
 * DRF / SimpleJWT:
 *   {
 *     detail: 'No active account found with the given credentials'
 *   }
 */
export function getErrorMessage(err) {
  if (!err.response) {
    return 'Network error — please check your connection.';
  }

  const { status, data } = err.response;

  // Prefer explicit backend message when available
  const backendMessage =
    data?.message ||
    data?.detail ||
    data?.error;

  switch (status) {
    case 400:
      if (
        Array.isArray(data?.errors) &&
        data.errors.length > 0
      ) {
        return data.errors.join(' ');
      }

      return backendMessage || 'Invalid request.';

    case 401:
      return (
        backendMessage ||
        'Authentication failed. Please check your credentials.'
      );

    case 403:
      return (
        backendMessage ||
        'You do not have permission to perform this action.'
      );

    case 404:
      return (
        backendMessage ||
        'The requested item could not be found.'
      );

    case 409:
      return (
        backendMessage ||
        'Conflict — check for duplicate codes or insufficient stock.'
      );

    case 500:
      return (
        backendMessage ||
        'Something went wrong on the server. Please try again.'
      );

    default:
      return (
        backendMessage ||
        'An unexpected error occurred.'
      );
  }
}

/**
 * Extracts field-level errors from a 400 response.
 *
 * Backend errors array:
 *   ["Field 'ProductCode': already exists."]
 *
 * Converts to:
 *   {
 *     ProductCode: 'already exists.'
 *   }
 */
export function extractFieldErrors(err) {
  if (
    !err.response ||
    err.response.status !== 400
  ) {
    return {};
  }

  const errors = err.response.data?.errors;

  if (!Array.isArray(errors)) {
    return {};
  }

  const fieldErrors = {};

  errors.forEach((msg) => {
    const match = msg.match(
      /^Field '(\w+)': (.+)$/
    );

    if (match) {
      fieldErrors[match[1]] = match[2];
    }
  });

  return fieldErrors;
}