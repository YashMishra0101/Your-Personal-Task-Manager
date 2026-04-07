import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTimestamp(value) {
  if (!value) return "—";
  const date = toDate(value);
  if (!date) return "—";
  return format(date, "d MMM yyyy • h:mm a");
}

function DeviceIcon({ type }) {
  if (type === "Mobile") return <Smartphone size={18} />;
  if (type === "Tablet") return <Tablet size={18} />;
  return <Monitor size={18} />;
}

export default function DeviceActivity() {
  const {
    deviceSessions,
    deviceSessionsLoading,
    activeSessionCount,
    deduplicatedSessionsCount,
  } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = useMemo(() => {
    const loggedOut = deviceSessions.filter(
      (s) => s.status === "logged_out"
    ).length;
    const currentDevice = deviceSessions.find((s) => s.isCurrentSession);
    return {
      total: deviceSessions.length,
      active: activeSessionCount,
      loggedOut,
    };
  }, [activeSessionCount, deviceSessions]);

  const filteredSessions = useMemo(() => {
    const byTime = [...deviceSessions].sort((a, b) => {
      const aTime = toDate(a.loginAt || a.clientLoginAt)?.getTime() || 0;
      const bTime = toDate(b.loginAt || b.clientLoginAt)?.getTime() || 0;
      return bTime - aTime;
    });
    if (statusFilter === "all") return byTime;
    if (statusFilter === "login") {
      return byTime.filter((session) => session.status === "active");
    }
    return byTime.filter((session) => session.status === statusFilter);
  }, [deviceSessions, statusFilter]);

  const statusOptions = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "login", label: "Login" },
    { id: "logged_out", label: "Logged Out" },
  ];

  return (
    <Layout title="Device Activity">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary/80 font-semibold">Active Devices</p>
            <p className="text-2xl font-bold text-primary mt-1">{stats.active}</p>
          </div>
          <div className="p-4 rounded-2xl bg-surface border border-border">
            <p className="text-xs text-muted-foreground font-semibold">Total Sessions</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
          </div>
        </div>
        {deduplicatedSessionsCount > 0 && (
          <p className="text-[11px] text-muted-foreground px-1">
            Debug: auto-cleaned duplicate sessions: {deduplicatedSessionsCount}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setStatusFilter(option.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                statusFilter === option.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {deviceSessionsLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-6 rounded-2xl border border-border bg-surface text-muted-foreground">
            No sessions found for this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              return (
              <div
                key={session.id}
                className="p-4 rounded-2xl border border-border bg-surface"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-primary">
                      <DeviceIcon type={session.deviceType} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {session.deviceType || "Unknown Device"} •{" "}
                        {session.browser || "Unknown Browser"}
                        {session.isCurrentSession ? (
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            This device
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.os || "Unknown OS"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                      session.status === "active"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    <ShieldCheck size={12} />
                    {session.status === "active" ? "Active" : "Logged Out"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-background border border-border/50">
                    <p className="text-muted-foreground mb-1">Login</p>
                    <p className="text-foreground font-medium flex items-center gap-1.5">
                      <Clock size={12} />
                      {formatTimestamp(session.loginAt || session.clientLoginAt)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border/50">
                    <p className="text-muted-foreground mb-1">Logout</p>
                    <p className="text-foreground font-medium flex items-center gap-1.5">
                      <LogOut size={12} />
                      {formatTimestamp(session.logoutAt)}
                    </p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
