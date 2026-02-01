"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { formatEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import { mainnet } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STEWARD_V1_QUERY, STEWARD_V2_QUERY, type StewardData } from "@/lib/graphql";
import { useEthPrice, getUsdValue } from "@/hooks/usePrices";
import { humanizeDuration, formatDate } from "@/lib/time";
import { CONTRACT_ADDRESSES } from "@/lib/wagmi";
import {
  BuyForm,
  ChangePriceForm,
  TopupDepositForm,
  WithdrawDepositForm,
  ExitForm,
} from "@/components/ActionForms";

interface ArtworkDetailProps {
  version: "v1" | "v2";
}

function truncateAddress(address?: string): string {
  if (!address) return "Unknown";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const YEAR_SECONDS = 31536000n;
const V1_NUMERATOR = 50000000000n; // 5%
const V2_NUMERATOR = 1000000000000n; // 100%
const DENOMINATOR = 1000000000000n;

function calculatePatronageOwed(
  price: bigint,
  timeElapsed: bigint,
  version: "v1" | "v2"
): bigint {
  const numerator = version === "v1" ? V1_NUMERATOR : V2_NUMERATOR;
  return (price * timeElapsed * numerator) / DENOMINATOR / YEAR_SECONDS;
}

function ValueSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-9 w-72" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted/50 px-4 py-3 space-y-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-3 w-32" />
        <hr />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

function DetailsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
        <CardTitle>On-chain Details</CardTitle>
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center space-y-4">
        <p className="text-destructive">Error loading artwork data. Please try again.</p>
        <Button onClick={onRetry} variant="outline">
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

export function ArtworkDetail({ version }: ArtworkDetailProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const isCorrectNetwork = chainId === mainnet.id;

  const stewardAddress = version === "v1" ? CONTRACT_ADDRESSES.v1Steward : CONTRACT_ADDRESSES.v2Steward;
  const query = version === "v1" ? STEWARD_V1_QUERY : STEWARD_V2_QUERY;
  const patronageRate = version === "v1" ? "5%" : "100%";
  const imageSrc = version === "v1" ? "/artwork-v1.png" : "/artwork-v2.png";

  const { data, loading, error, refetch } = useQuery<{ steward: StewardData }>(query, {
    fetchPolicy: "cache-and-network",
  });

  const { data: ethPrice = 0 } = useEthPrice();

  const steward = data?.steward;
  const isForeclosed = steward?.currentPatron?.id?.toLowerCase() === stewardAddress.toLowerCase();

  const priceWei = steward ? BigInt(steward.currentPrice) : 0n;
  const priceEth = formatEther(priceWei);
  const priceUsd = getUsdValue(parseFloat(priceEth), ethPrice);

  const depositWei = steward?.currentDeposit ? BigInt(steward.currentDeposit) : 0n;
  const timeLastCollected = steward ? parseInt(steward.timeLastCollected) : 0;
  const now = Math.floor(Date.now() / 1000);
  const timeElapsed = BigInt(now - timeLastCollected);
  const patronageOwed = calculatePatronageOwed(priceWei, timeElapsed, version);
  const availableDeposit = depositWei > patronageOwed ? depositWei - patronageOwed : 0n;
  const availableDepositEth = formatEther(availableDeposit);

  const foreclosureTime = steward?.foreclosureTime ? parseInt(steward.foreclosureTime) : 0;
  const foreclosureTimeFormatted = foreclosureTime > 0 ? formatDate(foreclosureTime) : "N/A";
  const isForeclosurePast = foreclosureTime > 0 && foreclosureTime < now;

  const timeHeld = steward?.currentPatron?.stewards?.[0]?.timeHeld || "0";
  const totalTimeHeld = parseInt(timeHeld) + (now - timeLastCollected);
  const timeHeldHumanized = humanizeDuration(totalTimeHeld);

  const totalCollectedWei = steward?.totalCollected ? BigInt(steward.totalCollected) : 0n;
  const combinedCollected = totalCollectedWei + patronageOwed;
  const combinedCollectedEth = formatEther(combinedCollected);

  const handleRefresh = () => {
    refetch();
  };

  const showSkeleton = loading && !steward;
  const showError = error && !steward;

  return (
    <div className="space-y-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        &larr; Back to Gallery
      </Link>

      {/* Artwork Image */}
      <div>
        <Image
          src={imageSrc}
          alt={`Artwork ${version.toUpperCase()}`}
          width={600}
          height={600}
          className="gallery mx-auto rounded-lg"
          priority
        />
      </div>

      {/* Value Section */}
      {showError ? (
        <ErrorCard onRetry={handleRefresh} />
      ) : showSkeleton ? (
        <ValueSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <p className="text-3xl font-bold tracking-tight">
              Valued at: {priceEth} ETH <span className="text-base font-normal text-muted-foreground">(~${priceUsd} USD)</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isForeclosed ? (
              <div className="rounded-md bg-muted/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Foreclosed — held by smart contract steward for {timeHeldHumanized}
                </p>
              </div>
            ) : (
              <div className="rounded-md bg-muted/50 px-4 py-3 space-y-1">
                <p className="text-sm">
                  Held by{" "}
                  <span className="font-mono text-xs text-muted-foreground break-all" title={steward?.currentPatron?.id}>
                    <span className="hidden sm:inline">{steward?.currentPatron?.id}</span>
                    <span className="sm:hidden">{truncateAddress(steward?.currentPatron?.id)}</span>
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">For {timeHeldHumanized}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Patronage: {patronageRate}/yr of sale price
            </p>
            <hr />
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>The digital artwork above is always on sale. In order to own it, you always have to specify a sale price. Anyone can buy it from the current patron at any time for the specified sale price.</p>
              <p>Whilst held, a fee (based on the patronage rate) is constantly levied, per second, as patronage towards the artist.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restoration Section (V1 only) */}
      {version === "v1" && (
        <section className="border-t pt-6">
          <h2 className="text-lg font-semibold tracking-tight mb-4">Restoration</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            This artwork was damaged, and went through a digital restoration. The damaged canvas is
            now irrevocably fused into this version. It&apos;s the first digital artwork that&apos;s always
            on sale that underwent a unique restoration procedure.
          </p>
        </section>
      )}

      {/* Details Section */}
      {showError ? (
        <ErrorCard onRetry={handleRefresh} />
      ) : showSkeleton ? (
        <DetailsSkeleton />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
            <CardTitle>On-chain Details</CardTitle>
            <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-4">
                <dt className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Held By</dt>
                <dd className="font-medium font-mono text-xs break-all" title={steward?.currentPatron?.id}>
                  <span className="hidden sm:inline">{steward?.currentPatron?.id}</span>
                  <span className="sm:hidden">{truncateAddress(steward?.currentPatron?.id)}</span>
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-4">
                <dt className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Available Deposit</dt>
                <dd className="font-medium">{availableDepositEth} ETH</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-4">
                <dt className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Foreclosure Time</dt>
                <dd className="font-medium">{foreclosureTimeFormatted}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-4">
                <dt className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Lifetime Patronage</dt>
                <dd className="font-medium">{combinedCollectedEth} ETH</dd>
              </div>
            </dl>

            {isForeclosurePast && !isForeclosed && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm text-destructive">
                  The foreclosure time has passed. This artwork is past due and can be foreclosed.
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              The current deposit covers patronage until the foreclosure time. After that, the smart contract steward takes ownership and resets the price to zero. Once past this time, the patron can no longer top up their deposit.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Wallet Notice */}
      {!isConnected ? (
        <div className="rounded-lg bg-muted/50 p-6">
          <p className="text-muted-foreground">
            You are not connected to an Ethereum wallet. In order to interact with this artwork, you need
            to connect your wallet using the button in the top right corner.
          </p>
        </div>
      ) : !isCorrectNetwork ? (
        <div className="rounded-lg bg-muted/50 p-6">
          <p className="text-destructive">
            You are on the wrong network. Please switch to Ethereum Mainnet.
          </p>
        </div>
      ) : (
        <>
          {/* Buy Section */}
          <Card>
            <CardHeader>
              <CardTitle>Buy Artwork</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You will pay {priceEth} ETH. Since this is always on sale, you need to add your own sale
                price and initial amount you want to deposit for patronage:
              </p>
              <BuyForm
                stewardAddress={stewardAddress}
                currentPrice={priceWei}
                onSuccess={handleRefresh}
              />
            </CardContent>
          </Card>

          {/* Patron Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Patron Actions</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <p className="text-sm text-muted-foreground pb-6">
                Only the current patron can execute these functions.
              </p>

              <div className="py-6 space-y-4">
                <h4 className="text-base font-semibold">Change Price</h4>
                <ChangePriceForm stewardAddress={stewardAddress} onSuccess={handleRefresh} />
              </div>

              <div className="py-6 space-y-4">
                <h4 className="text-base font-semibold">Top Up Deposit</h4>
                <TopupDepositForm stewardAddress={stewardAddress} onSuccess={handleRefresh} />
              </div>

              <div className="py-6 space-y-4">
                <h4 className="text-base font-semibold">Withdraw Some Deposit</h4>
                <WithdrawDepositForm stewardAddress={stewardAddress} onSuccess={handleRefresh} />
              </div>

              <div className="pt-6 space-y-4">
                <h4 className="text-base font-semibold">Exit</h4>
                <ExitForm stewardAddress={stewardAddress} onSuccess={handleRefresh} />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
