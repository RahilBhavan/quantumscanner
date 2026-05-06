import { z } from 'zod'

const envSchema = z.object({
  MEMPOOL_API_URL: z.string().url().default('https://mempool.space/api'),
  ESPLORA_API_URL: z.string().url().default('https://blockstream.info/api'),
  COINGECKO_API_URL: z
    .string()
    .url()
    .default('https://api.coingecko.com/api/v3'),
  BULK_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(6),
  NEXT_PUBLIC_LIVE_COUNTER_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  NEXT_PUBLIC_CANONICAL_URL: z
    .string()
    .url()
    .default('http://localhost:3000'),
})

const _env = envSchema.parse(process.env)

export const env = Object.freeze(_env)
