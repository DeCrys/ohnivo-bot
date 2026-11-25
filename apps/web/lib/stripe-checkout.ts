export function isMissingStripeCustomerError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (
    "type" in error &&
    error.type === "StripeInvalidRequestError" &&
    "code" in error &&
    error.code === "resource_missing" &&
    "param" in error &&
    error.param === "customer"
  );
}
