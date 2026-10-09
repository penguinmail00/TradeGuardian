import type { SupportRequest } from "@/app/support/support-request";
import { BackendApiError, backendRequest, getErrorDetail } from "@/lib/backend-api";

/** Sends a support request to the backend, which stores it for the team. */
export async function sendSupportRequest(request: SupportRequest): Promise<void> {
  const response = await backendRequest("/support", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new BackendApiError(await getErrorDetail(response));
}
