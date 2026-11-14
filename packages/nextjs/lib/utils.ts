import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatEther, parseEther } from "viem";

// Human-readable ETH: at most 4 significant decimals, trailing zeros trimmed ("1.25", "0.0042", "<0.0001").
export function formatEth(wei: bigint): string {
  if (wei === 0n) return "0";
  const negative = wei < 0n;
  const abs = negative ? -wei : wei;
  if (abs < 10n ** 14n) return negative ? "-<0.0001" : "<0.0001";

  const [whole, fraction = ""] = formatEther(abs).split(".");
  let decimals: string;
  if (whole !== "0") {
    decimals = fraction.slice(0, 4);
  } else {
    // Keep 4 significant digits after the leading zeros, e.g. 0.000123 -> "0.000123".
    const firstNonZero = fraction.search(/[1-9]/);
    decimals = fraction.slice(0, Math.min(firstNonZero + 4, 18));
  }
  decimals = decimals.replace(/0+$/, "");
  const wholeFormatted = BigInt(whole).toLocaleString("en-US");
  return `${negative ? "-" : ""}${wholeFormatted}${decimals ? `.${decimals}` : ""}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address?: string): string {
  if (!address) return "Unknown";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Returns null for anything that isn't a positive decimal ETH amount with at most 18 decimals.
export function safeParseEther(value: string): bigint | null {
  if (!/^\d*\.?\d+$/.test(value.trim())) return null;
  try {
    const wei = parseEther(value.trim());
    return wei > 0n ? wei : null;
  } catch {
    return null;
  }
}
