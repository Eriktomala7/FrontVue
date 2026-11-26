type ErrorDetails = {
  message?: unknown
  response?: {
    data?: {
      message?: unknown
    }
  }
}

export function getErrorMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined

  const details = error as ErrorDetails
  const responseMessage = details.response?.data?.message
  if (typeof responseMessage === 'string' && responseMessage) return responseMessage

  return typeof details.message === 'string' ? details.message : undefined
}
