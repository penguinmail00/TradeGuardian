"use server";

import { z } from "zod";

import {
  type SupportRequest,
  type SupportRequestState,
  supportRequestSchema,
} from "./support-request";

/**
 * Validates a support request and hands it off for delivery. Used with
 * `useActionState`, so it returns the next form state instead of throwing.
 */
export async function submitSupportRequest(
  _previousState: SupportRequestState,
  formData: FormData,
): Promise<SupportRequestState> {
  const values = {
    email: readField(formData, "email"),
    subject: readField(formData, "subject"),
    description: readField(formData, "description"),
  };

  const result = supportRequestSchema.safeParse(values);
  if (!result.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: z.flattenError(result.error).fieldErrors,
      values,
    };
  }

  try {
    await deliverSupportRequest(result.data);
  } catch (error) {
    console.error("Failed to deliver support request", error);
    return {
      status: "error",
      message: "We couldn't send your request. Please try again in a moment.",
      fieldErrors: {},
      values,
    };
  }

  return { status: "success" };
}

function readField(formData: FormData, name: keyof SupportRequest) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * TODO: send the request to the support inbox or ticketing system. Until then
 * requests are only logged on the server.
 */
async function deliverSupportRequest(request: SupportRequest) {
  console.info("Support request received", {
    email: request.email,
    subject: request.subject,
  });
}
