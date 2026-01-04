import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import {
  Smartphone,
  Monitor,
  Tablet,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { getDeviceId } from "../lib/device";
import { toast } from "sonner";

export default function DeviceManagement() {
  const { getUserDevices, removeDevice } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentDeviceId = getDeviceId();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const userDevices = await getUserDevices();
      setDevices(userDevices);
    } catch (error) {
      console.error("Failed to load devices:", error);
      toast.error("Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    if (deviceId === currentDeviceId) {
      toast.error("Cannot remove current device");
      return;
    }

    try {
      await removeDevice(deviceId);
      toast.success("Device removed successfully");
      loadDevices();
    } catch (error) {
      console.error("Failed to remove device:", error);
      toast.error("Failed to remove device");
    }
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return "desktop";
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android")) return "mobile";
    if (ua.includes("tablet") || ua.includes("ipad")) return "tablet";
    return "desktop";
  };

  const getDeviceIcon = (userAgent) => {
    const type = getDeviceType(userAgent);
    switch (type) {
      case "mobile":
        return <Smartphone className="w-5 h-5 text-primary" />;
      case "tablet":
        return <Tablet className="w-5 h-5 text-primary" />;
      default:
        return <Monitor className="w-5 h-5 text-primary" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Layout title="Device Management">
        <div className="text-center py-20 text-muted-foreground">
          Loading devices...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Device Management">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary mb-2">
            Registered Devices
          </h2>
          <p className="text-sm text-muted-foreground">
            You can access your account from up to 2 devices. Remove old devices
            to add new ones.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-lg">
            <CheckCircle2 size={16} />
            <span className="font-medium">{devices.length}/2 slots used</span>
          </div>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-surface rounded-2xl border border-border">
            <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No devices registered</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => {
              const isCurrentDevice = device.deviceId === currentDeviceId;
              const deviceType = getDeviceType(device.userAgent);

              return (
                <div
                  key={device.deviceId}
                  className={`bg-surface rounded-2xl border p-4 transition-all ${
                    isCurrentDevice
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {getDeviceIcon(device.userAgent)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-primary capitalize">
                            {deviceType}
                          </h3>
                          {isCurrentDevice && (
                            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-md">
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 truncate">
                          {device.userAgent}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Added: {formatDate(device.addedAt)}
                        </p>
                      </div>
                    </div>

                    {!isCurrentDevice && (
                      <button
                        onClick={() => handleRemoveDevice(device.deviceId)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                        title="Remove device"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <strong>Note:</strong> For security, you can only access this
            account from 2 devices. If you try to login from a 3rd device,
            you'll need to remove one first.
          </p>
        </div>
      </div>
    </Layout>
  );
}
