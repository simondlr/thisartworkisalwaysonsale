"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { mainnet } from "wagmi/chains";
import { Address } from "@/components/Address";
import { ExternalLink } from "@/components/ExternalLink";
import { WallLabel, WallLabelRow } from "@/components/WallLabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BuyForm, PatronActions } from "@/components/ActionForms";
import { STEWARD_QUERY, totalTimeHeld, type StewardData } from "@/lib/graphql";
import { ARTWORKS, isAdminAddress, stewardGraphId, type Version } from "@/lib/artworks";
import { stewardState } from "@/lib/patronage";
import { formatEth } from "@/lib/utils";
import { humanizeDuration, formatDate } from "@/lib/time";
import { useEthPrice, formatUsd } from "@/hooks/usePrices";
import { useNow } from "@/hooks/useNow";

// The subgraph lags the chain by a few blocks; refetch it again after this delay.
const SUBGRAPH_REFETCH_DELAY_MS = 15_000;

function LabelSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading artwork details">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="divide-y border-y">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-md border p-6 space-y-3">
      <p className="text-destructive">Couldn&apos;t load this artwork&apos;s details.</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        Try again
      </Button>
    </div>
  );
}

export function ArtworkDetail({ version }: { version: Version }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const isCorrectNetwork = chainId === mainnet.id;

  const artwork = ARTWORKS[version];
  const stewardAddress = artwork.steward;

  const { data, loading, error, refetch } = useQuery<{ steward: StewardData }>(STEWARD_QUERY, {
    variables: { id: stewardGraphId(version) },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const { data: ethPrice = 0 } = useEthPrice();
  const now = useNow();

  // Everything comes from the subgraph; patronage and foreclosure are derived from it locally.
  const steward = data?.steward;
  const state = stewardState(steward, version, now);
  const currentPatron = steward?.currentPatron?.id;
  const isHeldBySteward = currentPatron?.toLowerCase() === stewardAddress.toLowerCase();
  const isPatron = !!address && !isHeldBySteward && address.toLowerCase() === currentPatron?.toLowerCase();
  const isAdmin = isAdminAddress(address);

  const price = state?.price ?? 0n;
  const priceUsd = formatUsd(parseFloat(formatEther(price)), ethPrice);
  const isPastDue = state?.isPastDue ?? false;
  const buyPrice = state?.buyPrice ?? 0n;

  // When the subgraph data last arrived, for the "Updated … ago" note.
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  useEffect(() => {
    if (!loading && steward) setUpdatedAt(Math.floor(Date.now() / 1000));
  }, [loading, steward]);
  const updatedAgo = updatedAt === null ? null : now - updatedAt < 60 ? "just now" : `${humanizeDuration(now - updatedAt)} ago`;

  const delayedRefetch = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(delayedRefetch.current), []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleTxSuccess = useCallback(() => {
    refetch();
    clearTimeout(delayedRefetch.current);
    delayedRefetch.current = setTimeout(() => refetch(), SUBGRAPH_REFETCH_DELAY_MS);
  }, [refetch]);

  const showSkeleton = loading && !steward;
  const showError = error && !steward;

  return (
    <div className="space-y-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span aria-hidden="true">&larr;</span> All artworks
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 items-start">
        {/* The artwork */}
        <figure className="lg:sticky lg:top-24 space-y-3">
          <Image
            src={artwork.image}
            alt={`This Artwork Is Always On Sale, ${artwork.title}`}
            width={600}
            height={400}
            sizes="(min-width: 1024px) 540px, 100vw"
            className="artwork-frame"
            priority
          />
          <figcaption className="text-xs text-muted-foreground">
            Digital artwork (ERC-721) held by a smart contract steward.
          </figcaption>
        </figure>

        {/* The wall label */}
        <div className="space-y-10">
          <header className="space-y-1">
            <p className="eyebrow">This Artwork Is Always On Sale</p>
            <h1 className="font-serif text-4xl sm:text-5xl tracking-tight">{artwork.title}</h1>
            <p className="font-serif italic text-lg text-muted-foreground">{artwork.subtitle}</p>
          </header>

          {showError ? (
            <LoadError onRetry={handleRefresh} />
          ) : showSkeleton ? (
            <LabelSkeleton />
          ) : (
            <div className="space-y-6">
              <div>
                <p className="eyebrow">Sale price</p>
                <p className="font-serif text-5xl tracking-tight tabular-nums mt-1">
                  {formatEth(price)} <span className="text-3xl">ETH</span>
                </p>
                {priceUsd && <p className="text-sm text-muted-foreground mt-1">≈ ${priceUsd} USD</p>}
              </div>

              {isPastDue && (
                <p className="rounded-md bg-notice text-notice-foreground px-4 py-3 text-sm">
                  The patron&apos;s deposit has run out. Anyone can now collect this artwork for just a deposit; the
                  sale price is waived.
                </p>
              )}

              <WallLabel>
                <WallLabelRow label="Held by">
                  {isHeldBySteward ? (
                    <span>The steward (foreclosed)</span>
                  ) : (
                    <span className="font-mono text-xs break-all" title={currentPatron}>
                      <Address address={currentPatron} />
                    </span>
                  )}
                </WallLabelRow>
                <WallLabelRow label="Held for">{humanizeDuration(totalTimeHeld(steward, now))}</WallLabelRow>
                <WallLabelRow label="Patronage">{artwork.rateLabel} of the sale price per year</WallLabelRow>
                {!isHeldBySteward && (
                  <>
                    <WallLabelRow label="Deposit left">
                      <span className="tabular-nums">{state ? `${formatEth(state.availableDeposit)} ETH` : "…"}</span>
                    </WallLabelRow>
                    <WallLabelRow label="Forecloses">
                      {isPastDue ? "Now" : state?.foreclosureTime ? formatDate(state.foreclosureTime) : "—"}
                    </WallLabelRow>
                  </>
                )}
                <WallLabelRow label="Lifetime patronage">
                  <span className="tabular-nums">{state ? `${formatEth(state.lifetimePatronage)} ETH` : "…"}</span>
                </WallLabelRow>
                <WallLabelRow label="Contract">
                  <ExternalLink href={`https://etherscan.io/address/${stewardAddress}`} className="font-mono text-xs">
                    <Address address={stewardAddress} />
                  </ExternalLink>
                </WallLabelRow>
              </WallLabel>

              <p className="text-xs text-muted-foreground">
                {updatedAgo ? `Updated ${updatedAgo}` : "Loading"} ·{" "}
                <button type="button" onClick={handleRefresh} disabled={loading} className="gallery-link disabled:opacity-50">
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
              </p>

              <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>
                  This artwork is always on sale. Whoever holds it must set a sale price, and anyone can buy it from them
                  at that price at any time.
                </p>
                <p>
                  While held, patronage is paid to the artist every second from the holder&apos;s deposit. When the
                  deposit runs out, the artwork returns to its steward and can be collected for just a deposit.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          {!showError && !showSkeleton && (
            <section aria-labelledby="actions-heading">
              {!isConnected ? (
                <div className="border-t pt-8 space-y-4">
                  <h2 id="actions-heading" className="font-serif text-2xl tracking-tight">
                    Collect this artwork
                  </h2>
                  <p className="text-sm text-muted-foreground">Connect an Ethereum wallet to buy this artwork.</p>
                  <ConnectButton label="Connect wallet" />
                </div>
              ) : !isCorrectNetwork ? (
                <div className="border-t pt-8 space-y-4">
                  <h2 id="actions-heading" className="font-serif text-2xl tracking-tight">
                    Collect this artwork
                  </h2>
                  <p className="text-sm text-muted-foreground">This artwork lives on Ethereum Mainnet.</p>
                  <Button onClick={() => switchChain({ chainId: mainnet.id })} disabled={isSwitching}>
                    {isSwitching ? "Switching…" : "Switch to Ethereum Mainnet"}
                  </Button>
                </div>
              ) : isPatron ? (
                <Card>
                  <CardHeader>
                    <CardTitle id="actions-heading">You hold this artwork</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PatronActions
                      stewardAddress={stewardAddress}
                      version={version}
                      price={price}
                      availableDeposit={state?.availableDeposit ?? 0n}
                      onSuccess={handleTxSuccess}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle id="actions-heading">Buy this artwork</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {isPastDue || isHeldBySteward
                          ? "It's held by its steward, so you only pay a deposit."
                          : "The current price goes to the holder."}{" "}
                        You then set your own sale price and leave a deposit for patronage.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <BuyForm
                        stewardAddress={stewardAddress}
                        version={version}
                        currentPrice={buyPrice}
                        isPastDue={isPastDue}
                        onSuccess={handleTxSuccess}
                      />
                    </CardContent>
                  </Card>

                  {/* Admin-only preview of the patron panel, to check how it looks without holding the artwork. */}
                  {isAdmin && (
                    <Card className="border-dashed">
                      <CardHeader>
                        <p className="eyebrow">Admin preview</p>
                        <CardTitle as="h3">You hold this artwork</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          This is what the current holder sees. You aren&apos;t the holder, so these transactions would be
                          rejected by the contract.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <PatronActions
                          stewardAddress={stewardAddress}
                          version={version}
                          price={price}
                          availableDeposit={state?.availableDeposit ?? 0n}
                          onSuccess={handleTxSuccess}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Restoration (V1 only) */}
      {version === "v1" && (
        <section className="border-t pt-10 space-y-4" aria-labelledby="restoration-heading">
          <h2 id="restoration-heading" className="font-serif text-2xl tracking-tight">
            Restoration
          </h2>
          <div className="prose-gallery">
            <p>
              This artwork was damaged, and{" "}
              <ExternalLink href="https://home.simondlr.com/posts/the-story-of-restoring-a-digital-artwork-that-is-always-on-sale">
                went through a digital restoration
              </ExternalLink>
              . The damaged canvas is now irrevocably fused into this version. It&apos;s the first digital artwork
              that&apos;s always on sale that underwent a unique restoration procedure.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
