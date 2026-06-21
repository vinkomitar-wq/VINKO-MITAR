export function getPublicUrl(): string {
  let origin = window.location.origin;
  if (origin.includes("ais-dev-")) {
    return origin.replace("ais-dev-", "ais-pre-");
  }
  return origin;
}
