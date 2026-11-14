"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchEthPrice(): Promise<number> {
  try {
    const response = await fetch("https://api.kraken.com/0/public/Ticker?pair=ETHUSD");
    const data = await response.json();
    if (data?.result?.XETHZUSD?.c?.[0]) {
      return parseFloat(data.result.XETHZUSD.c[0]);
    }
    return 0;
  } catch {
    return 0;
  }
}

export function useEthPrice() {
  return useQuery({
    queryKey: ["ethPrice"],
    queryFn: fetchEthPrice,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Returns null when the ETH price is unavailable, so callers can hide the USD figure.
export function formatUsd(ethAmount: number, ethPrice: number): string | null {
  if (!ethPrice) return null;
  return Math.floor(ethAmount * ethPrice).toLocaleString("en-US");
}
