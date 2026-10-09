/**
 * tradeguardian-backend. Called from the browser, so the backend must allow
 * the site's origin (its `CORS_ORIGINS`).
 */
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

/** The backend couldn't be reached, isn't configured, or returned an error. */
export class BackendApiError extends Error {
  name = "BackendApiError";
}

export async function backendRequest(path: string, init?: RequestInit) {
  if (!backendUrl) throw new BackendApiError("NEXT_PUBLIC_BACKEND_URL is not set.");
  try {
    return await fetch(`${backendUrl}${path}`, {
      ...init,
      // Trades change on every save, so never serve a cached response.
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new BackendApiError(`Couldn't reach the backend: ${error}`);
  }
}

/** FastAPI puts the reason in `detail`. */
export async function getErrorDetail(response: Response) {
  const body = await response.json().catch(() => undefined);
  return typeof body?.detail === "string" ? body.detail : `The backend returned ${response.status}.`;
}
