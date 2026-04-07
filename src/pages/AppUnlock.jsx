import React, { useState } from "react";
import { Lock, Unlock, ShieldAlert } from "lucide-react";
import { useAppLock } from "../context/AppLockContext";
import { useNavigate } from "react-router-dom";

export default function AppUnlock() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { config, unlockWithPin } = useAppLock();
  const navigate = useNavigate();

  const pinLength = config?.pinLength || 4;

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d+$/.test(pin) || pin.length !== pinLength) {
      setError(`Enter a valid ${pinLength}-digit PIN.`);
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
            Enter your {pinLength}-digit PIN to continue.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleUnlock}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={pinLength}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="w-full p-3 text-center tracking-[0.5em] text-lg rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={"•".repeat(pinLength)}
          />
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || pin.length !== pinLength}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Unlock size={16} />
            {loading ? "Unlocking..." : "Unlock App"}
          </button>
        </form>
      </div>
    </div>
  );
}
