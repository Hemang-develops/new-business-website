import { z } from "zod"

export const schema = z.object({
  id: z.number(),
  name: z.string(),
  offering: z.string(),
  purchaseDate: z.string(),
  amount: z.number(),
  country: z.string(),
  purchaseCount: z.number(),
})
