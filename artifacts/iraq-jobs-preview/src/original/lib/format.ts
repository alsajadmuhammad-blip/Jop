export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB-u-ca-gregory-nu-latn", {
    timeZone: "Asia/Baghdad",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatJobLocation(location: { city?: string | null; province?: string | null }) {
  const city = location.city?.trim() || "";
  const province = location.province?.trim() || "";
  return [city && city !== "العراق" && city !== province ? city : "", province].filter(Boolean).join("، ") || city || "العراق";
}