/**
 * Global Environment Configuration
 * By default, Vite sets import.meta.env.PROD to true when built via `npm run build`.
 * You can override this to force development mode in production by setting VITE_APP_ENV=dev in your .env file.
 */
export const IS_PRODUCTION = import.meta.env.PROD && import.meta.env.VITE_APP_ENV !== 'dev';
export const IS_DEV = !IS_PRODUCTION;

export const bootstrapEnvironment = () => {
  if (IS_PRODUCTION) {
    // 1. Disable standard console logs in production to clean up the browser console
    // We intentionally leave console.error and console.warn active for critical debugging!
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    
    // 2. Disable React DevTools in production to prevent snooping and improve performance
    if (typeof window !== "undefined" && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject === "function") {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = () => {};
      }
    }
  } else {
    console.log("%c🚀 Running in Development Mode", "color: #2dd4bf; font-size: 1.25rem; font-weight: bold;");
  }
};
