"use client";

import { useAccount, useReadContracts } from "wagmi";
import { mainnet } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TxStatus } from "@/components/TransactionStatus";
import { artStewardAbi } from "@/contracts/artStewardAbi";
import { useStewardWrite } from "@/hooks/useStewardWrite";
import { ARTWORKS, isAdminAddress } from "@/lib/artworks";
import { formatEth } from "@/lib/utils";

function AmountRow({ label, value, hint, strong }: { label: string; value?: bigint; hint?: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <div>
        <dt className={strong ? "font-medium" : "eyebrow"}>{label}</dt>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <dd className={strong ? "font-serif text-3xl tabular-nums" : "font-mono tabular-nums"}>
        {value !== undefined ? `${formatEth(value)} ETH` : "…"}
      </dd>
    </div>
  );
}

function StewardSection({ title, stewardAddress }: { title: string; stewardAddress: `0x${string}` }) {
  // Read in one batch so all values come from the same block and add up consistently.
  const contract = { chainId: mainnet.id, address: stewardAddress, abi: artStewardAbi } as const;
  const { data, refetch, isFetching } = useReadContracts({
    contracts: [
      { ...contract, functionName: "artistFund" },
      { ...contract, functionName: "patronageOwed" },
      { ...contract, functionName: "deposit" },
      { ...contract, functionName: "price" },
    ],
  });
  const [artistFund, patronageOwed, deposit, price] = (data ?? []).map((r) => r.result as bigint | undefined);

  // What _collectPatronage() would move into the artist fund right now: nothing while the steward holds it
  // (price 0), otherwise the patronage owed, capped at the patron's deposit (the rest is foreclosure).
  const uncollected =
    price === undefined || patronageOwed === undefined || deposit === undefined
      ? undefined
      : price === 0n
        ? 0n
        : patronageOwed < deposit
          ? patronageOwed
          : deposit;
  const total = artistFund !== undefined && uncollected !== undefined ? artistFund + uncollected : undefined;
  const wouldForeclose = price !== undefined && price > 0n && deposit !== undefined && patronageOwed !== undefined && patronageOwed >= deposit;

  const collect = useStewardWrite(refetch);
  const withdraw = useStewardWrite(refetch);

  const handleCollect = () => {
    collect.writeContract({ chainId: mainnet.id, address: stewardAddress, abi: artStewardAbi, functionName: "_collectPatronage" });
  };

  const handleWithdraw = () => {
    withdraw.writeContract({ chainId: mainnet.id, address: stewardAddress, abi: artStewardAbi, functionName: "withdrawArtistFunds" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="divide-y border-y text-sm">
          <AmountRow label="Artist fund" value={artistFund} hint="Already collected, ready to withdraw." />
          <AmountRow
            label="Uncollected patronage"
            value={uncollected}
            hint={
              wouldForeclose
                ? "The patron's deposit has run out: collecting takes the rest of it and forecloses the artwork."
                : "Accrued since the last collection. Collecting moves it into the artist fund."
            }
          />
          <AmountRow label="Available after collecting" value={total} strong />
        </dl>

        <p className="text-xs text-muted-foreground">
          Patronage keeps accruing every second ·{" "}
          <button type="button" onClick={() => refetch()} disabled={isFetching} className="gallery-link disabled:opacity-50">
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCollect} disabled={collect.isBusy}>
            {collect.isBusy ? "Processing…" : "Collect patronage"}
          </Button>
          <Button onClick={handleWithdraw} disabled={withdraw.isBusy} variant="outline">
            {withdraw.isBusy ? "Processing…" : "Withdraw artist funds"}
          </Button>
        </div>

        <TxStatus status={collect.status} hash={collect.hash} error={collect.error} successMessage="Patronage collected." />
        <TxStatus status={withdraw.status} hash={withdraw.hash} error={withdraw.error} successMessage="Artist funds withdrawn." />
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

  if (!isAdminAddress(address)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Unauthorized. This page is restricted.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-4xl tracking-tight">Admin</h1>
      <StewardSection title="V1 Steward" stewardAddress={ARTWORKS.v1.steward} />
      <StewardSection title="V2 Steward" stewardAddress={ARTWORKS.v2.steward} />
    </div>
  );
}
