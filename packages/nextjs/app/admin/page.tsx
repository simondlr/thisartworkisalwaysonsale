"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { artStewardAbi } from "@/contracts/artStewardAbi";
import { CONTRACT_ADDRESSES } from "@/lib/wagmi";

const ADMIN_ADDRESS = "0x0CaCC6104D8Cd9d7b2850b4f35c65C1eCDEECe03";

function TransactionError({ error }: { error: Error | null }) {
  if (!error) return null;
  const message = error.message?.includes("User rejected")
    ? "Transaction was rejected."
    : error.message?.split("\n")[0] || "Transaction failed.";
  return <p className="text-sm text-destructive mt-2">{message}</p>;
}

function StewardSection({ title, stewardAddress }: { title: string; stewardAddress: `0x${string}` }) {
  const { data: artistFund, refetch: refetchFund } = useReadContract({
    address: stewardAddress,
    abi: artStewardAbi,
    functionName: "artistFund",
  });

  const {
    data: collectHash,
    writeContract: writeCollect,
    isPending: isCollectPending,
    error: collectError,
  } = useWriteContract();

  const { isLoading: isCollectConfirming, isSuccess: isCollectSuccess } = useWaitForTransactionReceipt({
    hash: collectHash,
  });

  const {
    data: withdrawHash,
    writeContract: writeWithdraw,
    isPending: isWithdrawPending,
    error: withdrawError,
  } = useWriteContract();

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const handleCollect = () => {
    writeCollect({
      address: stewardAddress,
      abi: artStewardAbi,
      functionName: "_collectPatronage",
    });
  };

  const handleWithdraw = () => {
    writeWithdraw({
      address: stewardAddress,
      abi: artStewardAbi,
      functionName: "withdrawArtistFunds",
    });
  };

  if (isCollectSuccess || isWithdrawSuccess) {
    refetchFund();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Artist Fund Balance:{" "}
          <span className="font-mono font-medium text-foreground">
            {artistFund !== undefined ? `${formatEther(artistFund)} ETH` : "Loading..."}
          </span>
        </p>

        <div className="flex gap-2">
          <Button onClick={handleCollect} disabled={isCollectPending || isCollectConfirming}>
            {isCollectPending || isCollectConfirming ? "Processing..." : "Collect Patronage"}
          </Button>
          <Button onClick={handleWithdraw} disabled={isWithdrawPending || isWithdrawConfirming}>
            {isWithdrawPending || isWithdrawConfirming ? "Processing..." : "Withdraw Artist Funds"}
          </Button>
        </div>

        {isCollectSuccess && <p className="text-sm text-green-600">Patronage collected!</p>}
        <TransactionError error={collectError} />
        {isWithdrawSuccess && <p className="text-sm text-green-600">Artist funds withdrawn!</p>}
        <TransactionError error={withdrawError} />
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Connect your wallet to access the admin page.</p>
      </div>
    );
  }

  if (address?.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Unauthorized. This page is restricted.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin</h1>
      <StewardSection title="V1 Steward" stewardAddress={CONTRACT_ADDRESSES.v1Steward} />
      <StewardSection title="V2 Steward" stewardAddress={CONTRACT_ADDRESSES.v2Steward} />
    </div>
  );
}
