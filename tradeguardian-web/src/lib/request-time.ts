import { cache } from "react";

/**
 * The current time, fixed for the whole server request so every component
 * that renders an age agrees (and re-renders stay pure). Server-only.
 */
export const getRequestTime = cache(() => Date.now());
