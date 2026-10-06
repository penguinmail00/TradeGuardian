import { z } from "zod";

/** Validation rules shared by the form's HTML attributes and the server. */
export const itemDetailsLimits = {
  itemName: 80,
  description: 2000,
} as const;

/**
 * The trade's off-chain details. The escrow only stores the addresses and
 * price, so the item's name and description are saved by the site.
 */
export const itemDetailsSchema = z.object({
  itemName: z
    .string()
    .trim()
    .min(1, "Enter an item name.")
    .max(
      itemDetailsLimits.itemName,
      `Keep the name under ${itemDetailsLimits.itemName} characters.`,
    ),
  description: z
    .string()
    .trim()
    .max(
      itemDetailsLimits.description,
      `Keep the description under ${itemDetailsLimits.description} characters.`,
    ),
});

export type ItemDetails = z.infer<typeof itemDetailsSchema>;
