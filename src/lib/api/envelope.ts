export interface ApiSuccess<T> {
  ok: true
  data: T
}

export interface ApiError {
  ok: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function success<T>(data: T): ApiSuccess<T> {
  return { ok: true, data }
}

export function failure(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  return { ok: false, error: { code, message, details } }
}
