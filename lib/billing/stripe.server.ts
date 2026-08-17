import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeSecretConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in the environment.",
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2026-06-24.dahlia",
    });
  }
  return stripeClient;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

function urlFromRequest(request: Request): string | null {
  const origin = request.headers.get("origin")?.trim();
  if (origin) {
    return stripTrailingSlash(origin);
  }

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim();
  if (!host) return null;

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (isLocalhostUrl(`http://${host}`) ? "http" : "https");

  return stripTrailingSlash(`${proto}://${host}`);
}

function urlFromVercelEnv(): string | null {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!host) return null;
  const normalized = host.replace(/^https?:\/\//, "");
  return stripTrailingSlash(`https://${normalized}`);
}

/**
 * Public site origin for Stripe redirects and absolute links.
 * Prefer the live request host, then a non-localhost APP_URL, then Vercel.
 */
export function getAppBaseUrl(request?: Request): string {
  const fromRequest = request ? urlFromRequest(request) : null;
  if (fromRequest && !isLocalhostUrl(fromRequest)) {
    return fromRequest;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    const normalized = stripTrailingSlash(configured);
    if (!isLocalhostUrl(normalized) || !urlFromVercelEnv()) {
      return normalized;
    }
  }

  const fromVercel = urlFromVercelEnv();
  if (fromVercel) return fromVercel;

  if (fromRequest) return fromRequest;

  return "http://localhost:3000";
}
