"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { artStewardAbi } from "@/contracts/artStewardAbi";

interface FormProps {
  stewardAddress: `0x${string}`;
  onSuccess?: () => void;
}

export function BuyForm({
  stewardAddress,
  currentPrice,
  onSuccess,
}: FormProps & { currentPrice: bigint }) {
  const [newPrice, setNewPrice] = useState("");
  const [deposit, setDeposit] = useState("");

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice || !deposit) return;

    const newPriceWei = parseEther(newPrice);
    const depositWei = parseEther(deposit);
    const totalValue = currentPrice + depositWei;

    writeContract({
      address: stewardAddress,
      abi: artStewardAbi,
      functionName: "buy",
      args: [newPriceWei, currentPrice],
      value: totalValue,
    });
  };

  if (isSuccess && onSuccess) {
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">New Sale Price (ETH)</label>
        <Input
          type="number"
          step="any"
          placeholder="1.0"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Initial Deposit (ETH)</label>
        <Input
          type="number"
          step="any"
          placeholder="0.5"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isPending || isConfirming}>
        {isPending || isConfirming ? "Processing..." : "Buy Artwork"}
      </Button>
      {isSuccess && <p className="text-sm text-green-600">Transaction confirmed!</p>}
    </form>
  );
}

export function ChangePriceForm({ stewardAddress, onSuccess }: FormProps) {
  const [newPrice, setNewPrice] = useState("");

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice) return;

    writeContract({
      address: stewardAddress,
      abi: artStewardAbi,
      functionName: "changePrice",
      args: [parseEther(newPrice)],
    });
  };

  if (isSuccess && onSuccess) {
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">New Price (ETH)</label>
        <Input
          type="number"
          step="any"
          placeholder="1.0"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isPending || isConfirming}>
        {isPending || isConfirming ? "..." : "Change Price"}
      </Button>
    </form>
  );
}

export function TopupDepositForm({ stewardAddress, onSuccess }: FormProps) {
  const [amount, setAmount] = useState("");

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    writeContract({
      address: stewardAddress,
      abi: artStewardAbi,
      functionName: "depositWei",
      value: parseEther(amount),
    });
  };

  if (isSuccess && onSuccess) {
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">Amount (ETH)</label>
        <Input
          type="number"
          step="any"
          placeholder="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isPending || isConfirming}>
        {isPending || isConfirming ? "..." : "Top Up"}
      </Button>
    </form>
  );
}

export function WithdrawDepositForm({ stewardAddress, onSuccess }: FormProps) {
  const [amount, setAmount] = useState("");

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    writeContract({
      address: stewardAddress,
      abi: artStewardAbi,
      functionName: "withdrawDeposit",
      args: [parseEther(amount)],
    });
  };

  if (isSuccess && onSuccess) {
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">Amount (ETH)</label>
        <Input
          type="number"
          step="any"
          placeholder="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isPending || isConfirming}>
        {isPending || isConfirming ? "..." : "Withdraw"}
      </Button>
    </form>
  );
}

export function ExitForm({ stewardAddress, onSuccess }: FormProps) {
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    writeContract({
      address: stewardAddress,
      abi: artStewardAbi,
      functionName: "exit",
    });
  };

  if (isSuccess && onSuccess) {
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit" variant="destructive" disabled={isPending || isConfirming}>
        {isPending || isConfirming ? "Processing..." : "Withdraw Entire Deposit & Foreclose"}
      </Button>
    </form>
  );
}
