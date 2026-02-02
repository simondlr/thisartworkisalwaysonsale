export function humanizeDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months`;
  return `${Math.floor(seconds / 31536000)} years`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}
