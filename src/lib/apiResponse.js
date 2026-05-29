export const unwrapApiResponse = (payload, fallbackKeys = []) => {
  if (payload == null) {
    return payload
  }

  if (Array.isArray(payload)) {
    return payload
  }

  if (payload.success && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data
  }

  for (const key of fallbackKeys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      return payload[key]
    }
  }

  return payload
}

export const getApiErrorMessage = (error, fallbackMessage = 'Request failed') => {
  const payload = error?.response?.data

  if (!payload) {
    return fallbackMessage
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const firstError = payload.errors[0]
    if (typeof firstError === 'string') {
      return firstError
    }

    if (firstError && typeof firstError === 'object') {
      return firstError.message || fallbackMessage
    }
  }

  return payload.message || fallbackMessage
}