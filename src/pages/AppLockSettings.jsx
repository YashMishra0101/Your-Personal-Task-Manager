import React, { useMemo, useState } from "react";
import Layout from "../components/Layout";
import { useAppLock } from "../context/AppLockContext";
import { Lock, ShieldCheck, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AppLockSettings() {
  const {
    config,
    lockOptions,
    verifyIdentity,
    setOrUpdatePin,
    disableAppLock,
    lockNow,
  } = useAppLock();

  const [method, setMethod] = useState("password");
  const [secret, setSecret] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [pinLength, setPinLength] = useState(config?.pinLength || 4);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [lockMode, setLockMode] = useState(config?.lockMode || "every_open");
  const [saving, setSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const durationOptions = useMemo(
    () =>
      Object.entries(lockOptions).map(([id, value]) => ({
        id,
        label: value.label,
      })),
    [lockOptions]
  );

  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    try {
      setVerifying(true);
      const valid = await verifyIdentity({ method, secret });
      if (!valid) {
        toast.error("Verification failed");
        setVerifying(false);
        return;
      }
      setIsVerified(true);
      toast.success("Identity verified");
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error("Verify identity first");
      return;
    }
    if (!/^\d+$/.test(pin) || pin.length !== pinLength) {
      toast.error(`PIN must be exactly ${pinLength} digits`);
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PIN confirmation does not match");
      return;
    }
    try {
      setSaving(true);
      await setOrUpdatePin({
        pin,
        pinLength,
        lockMode,
        enable: true,
      });
      toast.success("App Lock settings updated");
      setPin("");
      setConfirmPin("");
    } catch (error) {
      toast.error("Failed to update App Lock");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    if (!isVerified) {
      toast.error("Verify identity first");
      return;
    }
    try {
      await disableAppLock();
      toast.success("App Lock disabled");
    } catch (error) {
      toast.error("Failed to disable App Lock");
    }
  };

  return (
    <Layout title="App Lock">
      <div className="space-y-6">
        <div className="p-4 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <ShieldCheck size={16} className="text-primary" />
            Identity Verification (Required)
          </div>
          <form onSubmit={handleVerifyIdentity} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMethod("password")}
                className={`px-3 py-1.5 text-xs rounded-lg border ${method === "password" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground"}`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setMethod("security_key")}
                className={`px-3 py-1.5 text-xs rounded-lg border ${method === "security_key" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground"}`}
              >
                Security Key
              </button>
            </div>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={method === "password" ? "Enter account password" : "Enter security key"}
              className="w-full p-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={verifying || !secret.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {verifying ? "Verifying..." : isVerified ? "Verified" : "Verify Identity"}
            </button>
          </form>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Lock size={16} className="text-primary" />
            PIN and Lock Configuration
          </div>
          <form onSubmit={handleSavePin} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">PIN Length</label>
                <select
                  value={pinLength}
                  onChange={(e) => setPinLength(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-border bg-background"
                >
                  <option value={4}>4-digit</option>
                  <option value={6}>6-digit</option>
                  <option value={8}>8-digit</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Lock Duration</label>
                <select
                  value={lockMode}
                  onChange={(e) => setLockMode(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-background"
                >
                  {durationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={pinLength}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder={`Enter ${pinLength}-digit PIN`}
                  className="w-full p-3 pr-10 rounded-xl border border-border bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  placeholder="Confirm PIN"
                  className="w-full p-3 pr-10 rounded-xl border border-border bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPin ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving || !isVerified}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Saving..." : config?.enabled ? "Update PIN" : "Enable App Lock"}
              </button>
              {config?.enabled && (
                <>
                  <button
                    type="button"
                    onClick={handleDisable}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold"
                  >
                    Disable App Lock
                  </button>
                  <button
                    type="button"
                    onClick={lockNow}
                    className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-semibold border border-border"
                  >
                    Lock Now
                  </button>
                </>
              )}
            </div>
          </form>
        </div>


      </div>
    </Layout>
  );
}
