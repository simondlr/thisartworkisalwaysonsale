"use client";

import { useEffect, useRef } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export type TxPhase = "idle" | "signing" | "pending" | "success" | "error";

// Wraps a contract write + receipt wait, calling onSuccess exactly once per confirmed tx.
export function useStewardWrite(onSuccess?: () => void) {
  const { data: hash, writeContract, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const handledHash = useRef<string>();

  useEffect(() => {
    if (isSuccess && hash && handledHash.current !== hash) {
      handledHash.current = hash;
      onSuccessRef.current?.();
    }
  }, [isSuccess, hash]);

  const error = writeError ?? receiptError ?? null;
  const status: TxPhase = error
    ? "error"
    : isPending
      ? "signing"
      : isConfirming
        ? "pending"
        : isSuccess
          ? "success"
          : "idle";

  return { writeContract, reset, hash, status, isBusy: isPending || isConfirming, isSuccess, error };
}
