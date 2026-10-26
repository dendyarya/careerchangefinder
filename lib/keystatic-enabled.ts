/**
 * Keystatic admin is on only in local development, or when the GitHub App secrets are set.
 * Without them /keystatic and /api/keystatic return 404, so a server without secrets
 * never exposes an admin screen.
 */
export const keystaticEnabled =
  (process.env.NODE_ENV === "development" && process.env.KEYSTATIC_GITHUB !== "1") ||
  Boolean(
    process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
    process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
    process.env.KEYSTATIC_SECRET,
  );
