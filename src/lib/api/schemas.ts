import { z } from 'zod'

export const AddressParamSchema = z.object({
  address: z.string().min(26).max(62),
})

export const PortfolioBodySchema = z.object({
  addresses: z
    .array(z.string().min(26).max(62))
    .min(1)
    .max(100, 'Maximum 100 addresses per batch request'),
})

export const PortfolioStreamBodySchema = z.object({
  addresses: z
    .array(z.string().min(26).max(62))
    .min(1)
    .max(1000, 'Maximum 1000 addresses per stream request'),
})
