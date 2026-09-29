import { z } from "zod"

export const schema = z.object({
  id: z.number(),
  name: z.string(),
  offering: z.string(),
  purchaseDate: z.string(),
  amount: z.number(),
  currency: z.string(),
  country: z.string(),
  purchaseCount: z.number(),
  paymentStatus: z.string(),
  deliveryStatus: z.string(),
  paymentProvider: z.string(),
})
