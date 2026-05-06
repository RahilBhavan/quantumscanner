import type { ApiResponse } from '@/lib/api/envelope'
import type { AddressResult } from '@/lib/api/resolve-address'

export async function scanAddress(address: string): Promise<AddressResult> {
  const res = await fetch(`/api/v1/address/${encodeURIComponent(address)}`)
  const json: ApiResponse<AddressResult> = await res.json()

  if (!json.ok) {
    throw new Error(json.error.message)
  }
  return json.data
}
