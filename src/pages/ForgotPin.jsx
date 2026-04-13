import React, { useState } from "react";
import { ShieldCheck, LockKeyhole, Save, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAppLock } from "../context/AppLockContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";

export default function ForgotPin() {
  const { verifyIdentity, setOrUpdatePin, lockOptions } = useAppLock();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Step 1 State
  const [password, setPassword] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Step 2 State
  const [pinLength, setPinLength] = useState(4);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [lockMode, setLockMode] = useState("every_open");
  const [saving, setSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const durationOptions = Object.entries(lockOptions).map(([id, value]) => ({
    id,
    label: value.label,
  }));

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!password || !securityKey) {
      toast.error("Please enter both password and security key.");
      return;
    }

    setVerifying(true);
    try {
      const passOk = await verifyIdentity({ method: "password", secret: password });
      if (!passOk) throw new Error("Invalid Auth");

      const keyOk = await verifyIdentity({ method: "security_key", secret: securityKey });
      if (!keyOk) throw new Error("Invalid Auth");

      toast.success("Identity verified securely.");
      setStep(2);
    } catch (error) {
      toast.error("Verification failed. Please check your credentials.");
      setPassword("");
      setSecurityKey("");
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!/^\d+$/.test(newPin) || newPin.length !== pinLength) {
      toast.error(`PIN must be exactly ${pinLength} digits.`);
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PIN confirmation does not match.");
      return;
    }

    setSaving(true);
    try {
      await setOrUpdatePin({
        pin: newPin,
        pinLength,
        lockMode,
        enable: true,
      });
      toast.success("App Lock PIN reset successfully.");
      navigate("/");
    } catch (error) {
      toast.error("Failed to reset PIN.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pattern-bg">
      <div className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            {step === 1 ? <ShieldCheck size={32} /> : <LockKeyhole size={32} />}
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            Forgot PIN
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {step === 1
              ? "Verify your identity using your account password and security key to reset your PIN."
              : "Reconfigure your App Lock securely."}
          </p>
        </div>

        {step === 1 ? (
          <form className="space-y-4" onSubmit={handleVerify}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
                  Account Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
                  Security Key
                </label>
                <input
                  type="password"
                  value={securityKey}
                  onChange={(e) => setSecurityKey(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  placeholder="Enter your security key"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying || !password || !securityKey}
              className="w-full py-4 mt-2 bg-primary text-primary-foreground rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <ShieldCheck size={18} />
              {verifying ? "Verifying Identity..." : "Continue to Reset"}
            </button>
            <div className="text-center pt-2">
              <Link to="/unlock" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                Back to Unlock
              </Link>
            </div>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleReset}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">PIN Length</label>
                <select
                  value={pinLength}
                  onChange={(e) => {
                    setPinLength(Number(e.target.value));
                    setNewPin("");
                    setConfirmPin("");
                  }}
                  className="w-full p-3.5 rounded-xl border border-border bg-background font-medium"
                >
                  <option value={4}>4-digit</option>
                  <option value={6}>6-digit</option>
                  <option value={8}>8-digit</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">Duration</label>
                <select
                  value={lockMode}
                  onChange={(e) => setLockMode(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-border bg-background font-medium text-sm"
                >
                  {durationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={pinLength}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder={`Enter new ${pinLength}-digit PIN`}
                  className="w-full p-3.5 pr-12 rounded-xl border border-border bg-background font-medium tracking-[0.2em] text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPin ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={pinLength}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Confirm new PIN"
                  className="w-full p-3.5 pr-12 rounded-xl border border-border bg-background font-medium tracking-[0.2em] text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPin ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
            
            <div className="bg-surface-hover p-4 rounded-xl border border-border/50 text-xs text-muted-foreground flex items-start gap-2 shadow-inner">
               <KeyRound size={16} className="mt-0.5 shrink-0 text-primary" />
               <p>Your new PIN will be secured via robust PBKDF2 hashing. Plain-text PINs are never stored.</p>
            </div>

            <button
              type="submit"
              disabled={saving || !newPin || !confirmPin}
              className="w-full py-4 mt-2 bg-primary text-primary-foreground rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save New PIN"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
