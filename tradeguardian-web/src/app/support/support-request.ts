import { z } from "zod";

/** Validation rules shared by the form's HTML attributes and the server. */
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

export type SupportRequestState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<keyof SupportRequest, string[]>>;
      /** Echoed back so the fields keep what the user typed. */
      values: Partial<Record<keyof SupportRequest, string>>;
    };
