export function formatDate(date: string, includeYear = true): string {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

export function formatReadTime(value: string): string {
  const duration = value.trim().replace(/\s+read$/i, "");
  return duration ? `${duration} read` : "";
}
