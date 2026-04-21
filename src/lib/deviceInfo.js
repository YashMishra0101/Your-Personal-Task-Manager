export function detectDeviceType(userAgent = "") {
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet|playbook|silk/.test(ua)) return "Tablet";
  if (
    /mobi|android(?!.*tablet)|iphone|ipod|blackberry|iemobile|opera mini/.test(
      ua
    )
  ) {
    return "Mobile";
  }
  return "Desktop";
}

export function detectOs(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios"))
    return "iOS";
  if (ua.includes("linux")) return "Linux";
  return "Unknown OS";
}

export function detectBrowser(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome/") && !ua.includes("edg/")) return "Chrome";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  if (ua.includes("opr/") || ua.includes("opera/")) return "Opera";
  return "Unknown Browser";
}

export function getDeviceMetadata() {
  const userAgent = navigator.userAgent || "Unknown";
  return {
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    os: detectOs(userAgent),
    platform: navigator.platform || "Unknown Platform",
    language: navigator.language || "Unknown Language",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown Timezone",
    userAgent,
  };
}
