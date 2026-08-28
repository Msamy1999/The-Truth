/** Return a safe HTTPS source URL, or undefined for unsupported input. */
export function safeExternalUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function validateExternalUrl(value: string | null | undefined) {
  if (!value) return true;
  return safeExternalUrl(value)
    ? true
    : "Use a complete HTTPS source URL without embedded credentials.";
}
