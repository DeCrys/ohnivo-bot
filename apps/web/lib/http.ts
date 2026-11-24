import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isInsufficientCreditsError } from "./errors";
import { ConfigError } from "./env";

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, detail: error.detail } },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_input",
          message: "Validation failed",
          detail: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof ConfigError) {
    return NextResponse.json(
      { error: { code: "config_missing", message: error.message } },
      { status: 500 },
    );
  }

  if (isInsufficientCreditsError(error)) {
    return NextResponse.json(
      { error: { code: "insufficient_credits", message: "Insufficient credits" } },
      { status: 402 },
    );
  }

  console.error("[api] unhandled error", error);
  return NextResponse.json(
    { error: { code: "unknown", message: "Unexpected server error" } },
    { status: 500 },
  );
}

export async function parseJson<T>(
  request: Request,
  parse: (value: unknown) => T,
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("invalid_input", "Request body must be valid JSON");
  }
  return parse(body);
}

/**
 * Basic CSRF hardening for cookie-authenticated mutations.
 * Browsers always send Origin for cross-site POSTs; server-to-server calls
 * (Stripe webhook) do not use this helper.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const allowed = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  const incoming = new URL(origin);
  if (incoming.host !== allowed.host) {
    throw new AppError("forbidden", "Cross-origin request rejected");
  }
}
