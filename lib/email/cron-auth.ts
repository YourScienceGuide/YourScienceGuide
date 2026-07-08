export function isCronRequestAuthorized(
  request: Pick<Request, "headers">,
  secret = process.env.CRON_SECRET?.trim(),
): boolean {
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const headerSecret = request.headers.get("x-cron-secret");
  return headerSecret === secret;
}
