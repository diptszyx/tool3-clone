import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://522d251ae347e8a81e492ee7410d1a52@o4509806286798848.ingest.us.sentry.io/4509806924791808',
  sendDefaultPii: true,
  integrations: [],
});
