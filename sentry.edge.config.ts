import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn,
  enabled: !!dsn,
  sendDefaultPii: false,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.02"),
  beforeSend(event) {
    if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
    if (event.request) {
      event.request.data = undefined;
      event.request.headers = undefined;
    }
    return event;
  },
});
