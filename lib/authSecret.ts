const configuredSecret = process.env.AUTH_SECRET?.trim();

if (!configuredSecret || configuredSecret.length < 32) {
  throw new Error(
    "AUTH_SECRET must be configured with at least 32 characters before the application starts.",
  );
}

export const authSecret = new TextEncoder().encode(configuredSecret);
