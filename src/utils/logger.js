import * as Sentry from "@sentry/react";

// Sentry is initialized in main.jsx based on env existence,
// but we keep a local flag to check if Sentry client is active.
const isSentryEnabled = () => {
  return Boolean(import.meta.env.VITE_SENTRY_DSN);
};

export const logger = {
  /**
   * Log an informational message.
   * @param {string} message 
   * @param {Object} [context] 
   */
  info(message, context = {}) {
    if (import.meta.env.DEV) {
      console.log(`%c[INFO] ${message}`, "color: #38bdf8; font-weight: bold;", context);
    }
    if (isSentryEnabled()) {
      Sentry.addBreadcrumb({
        category: "app.info",
        message,
        level: "info",
        data: context,
      });
    }
  },

  /**
   * Log a warning message.
   * @param {string} message 
   * @param {Object} [context] 
   */
  warn(message, context = {}) {
    if (import.meta.env.DEV) {
      console.warn(`[WARN] ${message}`, context);
    }
    if (isSentryEnabled()) {
      Sentry.captureMessage(message, {
        level: "warning",
        extra: context,
      });
    }
  },

  /**
   * Log an error exception.
   * @param {Error|string} error 
   * @param {Object} [context] 
   */
  error(error, context = {}) {
    const errorObj = typeof error === "string" ? new Error(error) : error;

    if (import.meta.env.DEV) {
      console.error(`[ERROR]`, errorObj, context);
    }

    if (isSentryEnabled()) {
      Sentry.captureException(errorObj, {
        extra: context,
      });
    }
  },

  /**
   * Set user identity in logging context.
   * @param {Object} user 
   * @param {string} user.id 
   * @param {string} [user.email] 
   * @param {string} [user.name] 
   */
  setUser(user) {
    if (!user) {
      this.clearUser();
      return;
    }
    
    if (import.meta.env.DEV) {
      console.log(`%c[USER SET]`, "color: #10b981; font-weight: bold;", { id: user.id, email: user.email });
    }

    if (isSentryEnabled()) {
      Sentry.setUser({
        id: user.id,
        email: user.email || undefined,
        username: user.name || undefined,
      });
    }
  },

  /**
   * Clear active user identity from logging context.
   */
  clearUser() {
    if (import.meta.env.DEV) {
      console.log(`%c[USER CLEARED]`, "color: #f43f5e; font-weight: bold;");
    }
    if (isSentryEnabled()) {
      Sentry.setUser(null);
    }
  }
};

export default logger;
