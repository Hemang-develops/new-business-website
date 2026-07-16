import React from "react";
import logger from "@/utils/logger";

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error(error, {
      componentStack: errorInfo.componentStack,
      info: "Caught by GlobalErrorBoundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030406] text-white flex flex-col items-center justify-center p-6 selection:bg-teal-300/30 relative overflow-hidden">
          {/* Visual Accents */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.08),transparent_60%)]" />
          
          <div className="relative z-10 max-w-md w-full text-center space-y-6">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">Something went wrong</h1>
              <p className="text-sm text-white/60 leading-relaxed">
                An unexpected error occurred. The details have been automatically logged, and we are investigating the issue.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="rounded-full bg-teal-500 px-6 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-teal-400 shadow-lg shadow-teal-500/10 cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 cursor-pointer"
              >
                Go to Home
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 text-left p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-rose-400 overflow-auto max-h-40">
                <p className="font-bold mb-1">{this.state.error.toString()}</p>
                <p className="text-white/40 whitespace-pre-wrap">Check console for component stack trace.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
