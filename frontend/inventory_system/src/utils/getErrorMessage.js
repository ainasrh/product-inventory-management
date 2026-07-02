/**
 * Maps API error responses to user-friendly messages.
 *
 * Backend error shape:
 *   { status: 'error', message: '...', errors: ['Field X: ...', '...'] }
 *
 * HTTP codes we handle explicitly:
 *   400 — validation / bad input
 *   401 — not authenticated
 *   404 — resource not found
 *   409 — conflict (insufficient stock, duplicate code)
 *   500 — server error
 */
export function getErrorMessage(err) {
  if (!err.response) {
    return 'Network error — please check your connection.';
  }

  const { status, data } = err.response;

  switch (status) {
    case 400:
      // Backend returns { status, message, errors: ['Field X: ...']}
      if (data?.errors?.length) {
        return data.errors.join(' ');
      }
      return data?.message || 'Invalid request.';

    case 401:
      return 'Session expired. Please log in again.';

    case 404:
      return 'The requested item could not be found.';

    case 409:
      // Insufficient stock comes back as 409
      return data?.message || 'Conflict — check for duplicate codes or insufficient stock.';

    case 500:
      return 'Something went wrong on the server. Please try again.';

    default:
      return data?.message || 'An unexpected error occurred.';
  }
}

/**
 * Extracts field-level errors from a 400 response for inline form display.
 * Backend errors array: ['Field \'ProductCode\': already exists.', ...]
 * We convert them back into { fieldName: 'message' } where possible.
 */
export function extractFieldErrors(err) {
  if (!err.response || err.response.status !== 400) return {};

  const errors = err.response.data?.errors;
  if (!Array.isArray(errors)) return {};

  const fieldErrors = {};
  errors.forEach((msg) => {
    // Match pattern: "Field 'FieldName': message"
    const match = msg.match(/^Field '(\w+)': (.+)$/);
    if (match) {
      fieldErrors[match[1]] = match[2];
    }
  });
  return fieldErrors;
}
