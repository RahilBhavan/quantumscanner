import { z } from 'zod'
import { fetchWithTimeout } from './http'

const PriceSchema = z.object({
  bitcoin: z.object({ usd: z.number() }),
})

export async function fetchBtcPrice(baseUrl: string): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(
      `${baseUrl}/simple/price?ids=bitcoin&vs_currencies=usd`
    )
    if (!response.ok) return null

    const raw = await response.json()
    const parsed = PriceSchema.safeParse(raw)
    if (!parsed.success) return null

    return parsed.data.bitcoin.usd
  } catch {
    return null
  }
}
