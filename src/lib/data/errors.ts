export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class RateLimitError extends AppError {
  constructor(public readonly retryAfter?: number) {
    super('Rate limited by upstream provider', 'RATE_LIMITED')
    this.name = 'RateLimitError'
  }
}

export class UpstreamError extends AppError {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message, 'UPSTREAM_ERROR')
    this.name = 'UpstreamError'
  }
}

export class NotFoundError extends AppError {
  constructor(address: string) {
    super(`Address not found: ${address}`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}
