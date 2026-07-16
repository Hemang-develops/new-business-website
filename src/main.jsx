import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App.jsx';
import { ThemeProvider } from '@material-tailwind/react';
import * as Sentry from "@sentry/react";
import logger from "./utils/logger";

import { bootstrapEnvironment } from './config/env';

bootstrapEnvironment();

// Initialize Sentry if DSN is configured
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Global unhandled promise rejection listener
window.addEventListener("unhandledrejection", (event) => {
  logger.error(event.reason || "Unhandled Promise Rejection", {
    type: "unhandled_promise_rejection",
  });
});

// Global uncaught runtime exception listener
window.addEventListener("error", (event) => {
  // Avoid duplicate error logging if event.error was already handled
  if (event.error) {
    logger.error(event.error, {
      type: "global_uncaught_error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  } else {
    logger.warn(`Uncaught error message: ${event.message}`, {
      type: "global_uncaught_message",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  }
});

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>
  );
}
