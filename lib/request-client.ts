const ADDRESS_PATTERN = /^[0-9a-f:.]{3,64}$/i;

/**
 * Return a bounded network-client key using headers set by the deployment's
 * trusted edge or reverse proxy. The right-most forwarded address is the hop
 * appended by the nearest proxy; accepting the first value would let a client
 * prepend an arbitrary address and evade per-client limits.
 */
export function requestClientKey(request: Request): string {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((address) => address.trim())
    .filter(Boolean)
    .at(-1);
  const address =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    forwarded ||
    "unknown";

  return ADDRESS_PATTERN.test(address) ? address.toLowerCase() : "unknown";
}
