export async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 4000
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
