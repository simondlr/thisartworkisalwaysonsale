"use client";

import { useId, useState } from "react";
import { formatEther } from "viem";
import { mainnet } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TxStatus } from "@/components/TransactionStatus";
import { artStewardAbi } from "@/contracts/artStewardAbi";
import { useStewardWrite } from "@/hooks/useStewardWrite";
import type { Version } from "@/lib/artworks";
import { depositRunwaySeconds, patronageForSeconds } from "@/lib/patronage";
import { humanizeDuration } from "@/lib/time";
import { cn, formatEth, safeParseEther } from "@/lib/utils";

interface FormProps {
  stewardAddress: `0x${string}`;
  onSuccess?: () => void;
}

const INVALID_AMOUNT = "Enter a positive ETH amount (max 18 decimals).";

// Patronage time held back on withdrawals, covering the wait until the transaction is mined.
const WITHDRAW_MARGIN_SECONDS = 15 * 60;

function runwayText(seconds: number | null): string {
  return seconds === null ? "—" : `about ${humanizeDuration(seconds)}`;
}

function EthInput({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  hint?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="eyebrow block">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="pr-12 font-mono tabular-nums"
          required
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          ETH
        </span>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

function InputError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

// A summary line: label on the left, value on the right.
function SummaryRow({ label, children, strong }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono tabular-nums text-right", strong && "font-semibold text-foreground")}>{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Buy

// currentPrice is the price shown to the buyer (from the subgraph, 0 if past due), so the deposit
// they choose is based on what they see. If it's stale, buy() reverts with "Current Price incorrect".
export function BuyForm({
  stewardAddress,
  version,
  currentPrice,
  isPastDue,
  onSuccess,
}: FormProps & { version: Version; currentPrice: bigint; isPastDue: boolean }) {
  const [newPrice, setNewPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const { writeContract, hash, status, isBusy, error } = useStewardWrite(onSuccess);

  const newPriceWei = safeParseEther(newPrice);
  const depositWei = safeParseEther(deposit);
  const runway = newPriceWei && depositWei ? depositRunwaySeconds(newPriceWei, depositWei, version) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPriceWei === null || depositWei === null) {
      setInputError(INVALID_AMOUNT);
      return;
    }
    setInputError(null);

    writeContract({
      chainId: mainnet.id,
      address: stewardAddress,
      abi: artStewardAbi,
      functionName: "buy",
      args: [newPriceWei, currentPrice],
      value: currentPrice + depositWei,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <EthInput
          label="Your sale price"
          placeholder="1.0"
          value={newPrice}
          onChange={setNewPrice}
          hint="Anyone can buy it from you at this price."
        />
        <EthInput
          label="Deposit"
          placeholder="0.5"
          value={deposit}
          onChange={setDeposit}
          hint="Patronage is paid from this, per second."
        />
      </div>

      <div className="rounded-md bg-muted/60 px-4 py-3 space-y-1.5 text-sm">
        {/* Exact amounts here (not rounded by formatEth): this is what leaves the buyer's wallet. */}
        <SummaryRow label={isPastDue ? "Price (foreclosed)" : "Current price"}>{formatEther(currentPrice)} ETH</SummaryRow>
        <SummaryRow label="Deposit">{depositWei ? formatEther(depositWei) : "—"} ETH</SummaryRow>
        <SummaryRow label="You send" strong>
          {formatEther(currentPrice + (depositWei ?? 0n))} ETH
        </SummaryRow>
        <p className="pt-1.5 text-xs text-muted-foreground">
          {runway !== null
            ? `At your sale price, this deposit covers patronage for ${runwayText(runway)}.`
            : "Enter a sale price and deposit to see how long your deposit lasts."}
        </p>
      </div>

      <div className="space-y-3">
        <Button type="submit" size="lg" disabled={isBusy} className="w-full sm:w-auto">
          {isBusy ? "Processing…" : "Buy artwork"}
        </Button>
        <InputError message={inputError} />
        <TxStatus status={status} hash={hash} error={error} successMessage="You now hold the artwork." />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------------------------
// Patron actions

type PatronTab = "price" | "topup" | "withdraw";

const TABS: Array<{ id: PatronTab; label: string }> = [
  { id: "price", label: "Change price" },
  { id: "topup", label: "Top up" },
  { id: "withdraw", label: "Withdraw" },
];

function AmountForm({
  stewardAddress,
  onSuccess,
  functionName,
  label,
  placeholder,
  submitLabel,
  preview,
  validate,
}: FormProps & {
  functionName: "changePrice" | "depositWei" | "withdrawDeposit";
  label: string;
  placeholder: string;
  submitLabel: string;
  preview: (wei: bigint | null) => React.ReactNode;
  validate?: (wei: bigint) => string | null;
}) {
  const [amount, setAmount] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const { writeContract, hash, status, isBusy, error } = useStewardWrite(onSuccess);
  const wei = safeParseEther(amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wei === null) {
      setInputError(INVALID_AMOUNT);
      return;
    }
    const validationError = validate?.(wei) ?? null;
    if (validationError) {
      setInputError(validationError);
      return;
    }
    setInputError(null);

    const base = { chainId: mainnet.id, address: stewardAddress, abi: artStewardAbi } as const;
    if (functionName === "depositWei") {
      writeContract({ ...base, functionName, value: wei });
    } else {
      writeContract({ ...base, functionName, args: [wei] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <EthInput label={label} placeholder={placeholder} value={amount} onChange={setAmount} />
        </div>
        <Button type="submit" disabled={isBusy}>
          {isBusy ? "Processing…" : submitLabel}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{preview(wei)}</p>
      <InputError message={inputError} />
      <TxStatus status={status} hash={hash} error={error} />
    </form>
  );
}

function ExitForm({ stewardAddress, onSuccess }: FormProps) {
  const [confirming, setConfirming] = useState(false);
  const { writeContract, hash, status, isBusy, error } = useStewardWrite(onSuccess);

  const exit = () => {
    setConfirming(false);
    writeContract({ chainId: mainnet.id, address: stewardAddress, abi: artStewardAbi, functionName: "exit" });
  };

  return (
    <div className="space-y-3">
      {confirming ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm">
            Exiting returns your remaining deposit and forfeits the artwork to its steward. Anyone can then collect it
            for just a deposit. This can&apos;t be undone.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={exit}>
              Exit and forfeit artwork
            </Button>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setConfirming(true)} disabled={isBusy}>
          {isBusy ? "Processing…" : "Exit…"}
        </Button>
      )}
      <TxStatus status={status} hash={hash} error={error} successMessage="You have exited." />
    </div>
  );
}

export function PatronActions({
  stewardAddress,
  version,
  price,
  availableDeposit,
  onSuccess,
}: FormProps & { version: Version; price: bigint; availableDeposit: bigint }) {
  const [tab, setTab] = useState<PatronTab>("price");
  const current = depositRunwaySeconds(price, availableDeposit, version);

  // availableDeposit is as of the last render; patronage keeps accruing until the withdrawal is mined, and the
  // contract reverts ("Withdrawing too much") if the deposit no longer covers it. Hold back a margin for that.
  const margin = patronageForSeconds(price, WITHDRAW_MARGIN_SECONDS, version);
  const maxWithdraw = availableDeposit > margin ? availableDeposit - margin : 0n;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div role="tablist" aria-label="Patron actions" className="inline-flex rounded-md border p-0.5 bg-muted/40">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`patron-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="patron-tabpanel"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-[3px] px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="patron-tabpanel" aria-labelledby={`patron-tab-${tab}`}>
          {tab === "price" && (
            <AmountForm
              key="price"
              stewardAddress={stewardAddress}
              onSuccess={onSuccess}
              functionName="changePrice"
              label="New sale price"
              placeholder={formatEth(price)}
              submitLabel="Change price"
              preview={(wei) =>
                wei
                  ? `Your deposit would last ${runwayText(depositRunwaySeconds(wei, availableDeposit, version))} (now ${runwayText(current)}).`
                  : `A higher price means more patronage per second, so your deposit runs out sooner.`
              }
            />
          )}
          {tab === "topup" && (
            <AmountForm
              key="topup"
              stewardAddress={stewardAddress}
              onSuccess={onSuccess}
              functionName="depositWei"
              label="Add to deposit"
              placeholder="0.1"
              submitLabel="Top up"
              preview={(wei) =>
                wei
                  ? `Your deposit would last ${runwayText(depositRunwaySeconds(price, availableDeposit + wei, version))} (now ${runwayText(current)}).`
                  : `Your deposit currently lasts ${runwayText(current)}.`
              }
            />
          )}
          {tab === "withdraw" && (
            <AmountForm
              key="withdraw"
              stewardAddress={stewardAddress}
              onSuccess={onSuccess}
              functionName="withdrawDeposit"
              label="Withdraw from deposit"
              placeholder="0.1"
              submitLabel="Withdraw"
              validate={(wei) =>
                wei > maxWithdraw
                  ? `You can withdraw at most ${formatEth(maxWithdraw)} ETH. To take out everything, use Exit below.`
                  : null
              }
              preview={(wei) =>
                wei && wei <= maxWithdraw
                  ? `Your deposit would last ${runwayText(depositRunwaySeconds(price, availableDeposit - wei, version))} (now ${runwayText(current)}).`
                  : `Up to ${formatEth(maxWithdraw)} ETH can be withdrawn. A little is held back for the patronage that accrues before the transaction confirms.`
              }
            />
          )}
        </div>
      </div>

      <div className="border-t pt-6 space-y-2">
        <h3 className="eyebrow">Exit</h3>
        <p className="text-sm text-muted-foreground">Withdraw your whole deposit and give up the artwork.</p>
        <ExitForm stewardAddress={stewardAddress} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
