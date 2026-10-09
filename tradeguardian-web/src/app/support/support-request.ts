import { z } from "zod";

/**
 * Validation rules shared by the form's HTML attributes and its validation.
 * tradeguardian-backend enforces the same limits.
 */
export const supportRequestLimits = {
  email: 254,
  subject: 150,
  description: 5000,
} as const;

export const supportRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .max(supportRequestLimits.email, "Email address is too long.")
    .pipe(z.email("Enter a valid email address.")),
  subject: z
    .string()
    .trim()
    .min(1, "Enter a subject.")
    .max(
      supportRequestLimits.subject,
      `Keep the subject under ${supportRequestLimits.subject} characters.`,
    ),
  description: z
    .string()
    .trim()
    .min(1, "Describe what you need help with.")
    .max(
      supportRequestLimits.description,
      `Keep the description under ${supportRequestLimits.description} characters.`,
    ),
});

export type SupportRequest = z.infer<typeof supportRequestSchema>;
