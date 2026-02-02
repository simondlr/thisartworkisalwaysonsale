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

export function getUsdValue(ethAmount: number, ethPrice: number): number {
  return Math.floor(ethAmount * ethPrice);
}
