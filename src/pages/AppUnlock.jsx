import React, { useState } from "react";
import { Lock, Unlock, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useAppLock } from "../context/AppLockContext";
import { useNavigate, Link } from "react-router-dom";

export default function AppUnlock() {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { config, unlockWithPin } = useAppLock();
  const navigate = useNavigate();

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError("");

    if (!pin) {
      setError("Please enter your PIN.");
      return;
    }

    try {
      setLoading(true);
      const ok = await unlockWithPin(pin);
      if (!ok) {
        setError("Incorrect PIN. Please try again.");
        setLoading(false);
        return;
      }
      navigate("/", { replace: true });
    } catch (unlockError) {
      setError("Unable to unlock app right now.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-xl p-6 space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Lock size={26} />
          </div>
          <h1 className="text-2xl font-bold text-primary">App Locked</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your PIN to continue.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleUnlock}>
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full p-3 text-center tracking-[0.5em] text-lg rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="••••"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPin ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          {error && (
            <div className="flex items-center justify-center gap-2 text-sm text-red-500">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Unlock size={16} />
            {loading ? "Unlocking..." : "Unlock App"}
          </button>
          <div className="text-center pt-2">
            <Link to="/forgot-pin" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              Forgot PIN?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
