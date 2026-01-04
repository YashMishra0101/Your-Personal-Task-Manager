import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, ArrowRight, Loader } from "lucide-react";

export default function SecurityKey() {
  const { verifySecurityKey } = useAuth();
  const navigate = useNavigate();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;

    setError("");
    setLoading(true);

    try {
      await verifySecurityKey(key.trim());
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid Security Key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 space-y-2">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/5">
            <LockKeyhole size={40} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Security Check
          </h1>
          <p className="text-muted-foreground">
            Please enter your security key to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="relative group">
              <input
                type="password"
                placeholder="Enter Security Key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full pl-6 pr-6 py-5 rounded-2xl bg-surface border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg tracking-widest font-mono text-center placeholder:text-muted-foreground/30 placeholder:font-sans placeholder:tracking-normal group-hover:border-primary/30"
                autoFocus
                required
              />
            </div>
            {error && (
              <p className="text-sm font-bold text-red-500 text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !key}
            className="w-full py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={24} />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Continue to Dashboard</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground/50 font-medium">
          Protected by Task Manager Security Protocol
        </p>
      </div>
    </div>
  );
}
