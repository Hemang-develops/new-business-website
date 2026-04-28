import { useState } from "react";
import { supabase } from "../../supabase-client";
import { useToast } from "../../context/ToastContext";
import { Input } from "../../components/ui/input";
import { RefreshCw, AlertCircle, CheckCircle2, UserPlus, CreditCard } from "lucide-react";

const FulfillmentTab = () => {
  const [mode, setMode] = useState("stripe"); // "stripe" or "direct"
  const [sessionId, setSessionId] = useState("");
  const [email, setEmail] = useState("");
  const [productId, setProductId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const toast = useToast();

  const handleResync = async (e) => {
    e.preventDefault();
    
    const payload = mode === "stripe" 
      ? { paymentId: sessionId.trim(), provider: "stripe" }
      : { email: email.trim(), productId: productId.trim(), provider: "manual" };

    if (mode === "stripe" && !sessionId.trim()) {
      toast.error("Please enter a Stripe Session ID");
      return;
    }
    if (mode === "direct" && (!email.trim() || !productId.trim())) {
      toast.error("Please enter both Email and Offering ID");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("course-access-fulfill", {
        body: payload
      });

      if (error) throw error;

      if (data.status === "success") {
        if (data.hasCourse) {
          setResult({
            type: "success",
            message: `Successfully fulfilled! Course: ${data.course?.title || "Unknown"}. Access URL created.`,
            details: data
          });
          toast.success("Course access granted successfully.");
        } else {
          setResult({
            type: "error",
            message: "The process finished, but no matching active course was found for that offering ID.",
            details: data
          });
          toast.error("Course not found or inactive.");
        }
      } else {
        setResult({
          type: "error",
          message: data.error || "Fulfillment failed.",
          details: data
        });
        toast.error("Fulfillment failed.");
      }
    } catch (error) {
      console.error("Fulfillment error:", error);
      setResult({
        type: "error",
        message: error.message || "An unexpected error occurred."
      });
      toast.error("An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Course Fulfillment Control</h2>
            <p className="text-white/65">
              Manually grant access to a course or sync a missing Stripe payment.
            </p>
          </div>

          <div className="flex gap-4 p-1 rounded-2xl bg-black/40 border border-white/10 w-fit">
            <button
              onClick={() => { setMode("stripe"); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                mode === "stripe" ? "bg-teal-300 text-gray-950" : "text-white/60 hover:text-white"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Stripe Sync
            </button>
            <button
              onClick={() => { setMode("direct"); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                mode === "direct" ? "bg-teal-300 text-gray-950" : "text-white/60 hover:text-white"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Direct Grant
            </button>
          </div>
          
          <form onSubmit={handleResync} className="space-y-4 pt-4">
            {mode === "stripe" ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="sessionId" className="text-sm font-medium text-white/80">
                  Stripe Session ID
                </label>
                <div className="flex gap-3">
                  <Input
                    id="sessionId"
                    placeholder="cs_test_..."
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="flex-1 border-white/10 bg-black/30 focus-visible:border-teal-300"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !sessionId.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-6 py-2 text-sm font-semibold text-gray-950 transition hover:bg-teal-200 disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Sync
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-white/80">User Email</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="customer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-white/10 bg-black/30 focus-visible:border-teal-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="productId" className="text-sm font-medium text-white/80">Offering ID</label>
                    <Input
                      id="productId"
                      placeholder="e.g. monthly-check-in"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="border-white/10 bg-black/30 focus-visible:border-teal-300"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || !productId.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-gray-950 transition hover:bg-teal-200 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Grant Course Access
                </button>
              </div>
            )}
          </form>

          {result && (
            <div className={`mt-8 rounded-2xl border p-6 ${
              result.type === "success" 
                ? "border-teal-300/30 bg-teal-300/10 text-teal-100" 
                : "border-rose-300/30 bg-rose-300/10 text-rose-100"
            }`}>
              <div className="flex items-start gap-4">
                {result.type === "success" ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-teal-300" />
                ) : (
                  <AlertCircle className="h-6 w-6 shrink-0 text-rose-300" />
                )}
                <div className="space-y-2 min-w-0">
                  <p className="font-semibold">{result.message}</p>
                  {result.details && (
                    <pre className="mt-4 max-h-60 overflow-auto rounded-lg bg-black/40 p-4 text-xs font-mono text-white/60">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <h3 className="text-lg font-semibold text-white mb-4">Troubleshooting Tips</h3>
        <ul className="space-y-3 text-sm text-white/65">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-300 shrink-0" />
            <span>Ensure the course is marked as <strong>Active</strong> in the Courses tab.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-300 shrink-0" />
            <span>Verify the <strong>Offering ID</strong> in the course settings matches the one in the product data.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-300 shrink-0" />
            <span>Check your Stripe Dashboard Webhook settings to ensure the URL is correct.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FulfillmentTab;
