export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-IQ", { timeZone: "Asia/Baghdad", day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function formatJobLocation(location: { city?: string | null; province?: string | null }) {
  const city = location.city?.trim() || "";
  const province = location.province?.trim() || "";
  return [city && city !== "العراق" && city !== province ? city : "", province].filter(Boolean).join("، ") || city || "العراق";
}