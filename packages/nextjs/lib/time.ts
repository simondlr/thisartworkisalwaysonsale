const UNITS: Array<[seconds: number, name: string]> = [
  [31_536_000, "year"],
  [2_592_000, "month"],
  [86_400, "day"],
  [3_600, "hour"],
  [60, "minute"],
  [1, "second"],
];

function plural(count: number, name: string): string {
  return `${count} ${name}${count === 1 ? "" : "s"}`;
}

// Largest whole unit, e.g. "1 year", "3 days", "45 seconds".
export function humanizeDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  for (const [size, name] of UNITS) {
    if (s >= size) return plural(Math.floor(s / size), name);
  }
  return plural(0, "second");
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
