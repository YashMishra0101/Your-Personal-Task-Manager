import React from "react";
import { Lock } from "lucide-react";

export default function AppLockBootstrapScreen({
  title = "Securing your workspace",
  message = "Loading your protected session...",
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-xl p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Lock size={26} />
          </div>
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>

        <div className="mt-6 space-y-4 animate-pulse">
          <div className="h-14 rounded-xl bg-background border border-border" />
          <div className="h-12 rounded-xl bg-primary/10" />
          <div className="h-4 w-24 mx-auto rounded bg-surface-hover" />
        </div>
      </div>
    </div>
  );
}
