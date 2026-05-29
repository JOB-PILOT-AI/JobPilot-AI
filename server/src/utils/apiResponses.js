export const buildSuccessResponse = (data, extras = {}) => ({
  success: true,
  data,
  ...extras,
})

export const buildErrorResponse = (message, extras = {}) => ({
  success: false,
  message,
  ...extras,
})

export const buildValidationErrorResponse = (errors = [], message = 'Validation failed', extras = {}) => ({
  success: false,
  message,
  errors,
  ...extras,
})