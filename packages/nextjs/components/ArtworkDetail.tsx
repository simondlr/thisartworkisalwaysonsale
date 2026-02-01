"use client";

import Image from "next/image";
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
        <Skeleton className="h-8 w-80" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-4 w-72" />
        <hr className="my-4" />
        <p className="text-sm text-muted-foreground">
          The digital artwork above is always on sale.
          <br />
          In order to own this artwork, you always have to specify a sale price.
          <br />
          Anyone can buy it from the current patron at any time for the specified sale price.
          <br />
          Whilst held, a fee (based on the patronage rate) is constantly levied, per second, as patronage towards the artist.
        </p>
      </CardContent>
    </Card>
  );
}

function DetailsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>More Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-40" />
        </div>
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
    <div className="space-y-6">
      {/* Artwork Image */}
      <Card>
        <CardContent className="pt-6">
          <Image
            src={imageSrc}
            alt={`Artwork ${version.toUpperCase()}`}
            width={600}
            height={600}
            className="gallery mx-auto rounded-lg"
            priority
          />
        </CardContent>
      </Card>

      {/* Value Section */}
      {showError ? (
        <ErrorCard onRetry={handleRefresh} />
      ) : showSkeleton ? (
        <ValueSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Valued at: {priceEth} ETH (~${priceUsd} USD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isForeclosed ? (
              <p className="text-muted-foreground">
                This artwork was recently foreclosed and is in control of the smart contract steward.
                It has not been bought for 0 ETH for: {timeHeldHumanized}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Currently held by{" "}
                <span className="font-mono text-xs break-all">{steward?.currentPatron?.id}</span>
                <br />
                They&apos;ve held it for a lifetime of {timeHeldHumanized} thus far.
              </p>
            )}
            <p className="text-sm">
              Patronage Rate: {patronageRate} per annum of current sale price, paid per block.
            </p>
            <hr className="my-4" />
            <p className="text-sm text-muted-foreground">
              The digital artwork above is always on sale.
              <br />
              In order to own this artwork, you always have to specify a sale price.
              <br />
              Anyone can buy it from the current patron at any time for the specified sale price.
              <br />
              Whilst held, a fee (based on the patronage rate) is constantly levied, per second, as patronage towards the artist.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Restoration Section (V1 only) */}
      {version === "v1" && (
        <Card>
          <CardHeader>
            <CardTitle>Restoration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              This artwork was damaged, and went through a digital restoration. The damaged canvas is
              now irrevocably fused into this version. It&apos;s the first digital artwork that&apos;s always
              on sale that underwent a unique restoration procedure.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Details Section */}
      {showError ? (
        <ErrorCard onRetry={handleRefresh} />
      ) : showSkeleton ? (
        <DetailsSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>More Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleRefresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh Data"}
            </Button>

            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Currently Held By:</span>{" "}
                <span className="font-mono text-xs break-all">{steward?.currentPatron?.id || "Unknown"}</span>
              </p>
              <p>
                <span className="font-medium">Current Available Deposit:</span> {availableDepositEth} ETH
              </p>
              <p>
                <span className="font-medium">Current Foreclosure Time:</span> {foreclosureTimeFormatted}
              </p>
              <p className="text-muted-foreground">
                The current deposit will cover the patronage until the time above. At this time, the smart
                contract steward takes ownership of the artwork and sets its price back to zero.
              </p>
              <p className="text-muted-foreground">
                Once it crosses this time period, the patron can&apos;t top up their deposit anymore and is
                effectively foreclosed.
              </p>
              <p>
                <span className="font-medium">Lifetime Patronage Collected:</span> {combinedCollectedEth} ETH
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buy Section */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Artwork</CardTitle>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <p className="text-muted-foreground">
              You are not connected to an Ethereum wallet. In order to interact with this artwork, you need
              to connect your wallet using the button in the top right corner.
            </p>
          ) : !isCorrectNetwork ? (
            <p className="text-destructive">
              You are on the wrong network. Please switch to Ethereum Mainnet.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                You will pay {priceEth} ETH. Since this is always on sale, you need to add your own sale
                price and initial amount you want to deposit for patronage:
              </p>
              <BuyForm
                stewardAddress={stewardAddress}
                currentPrice={priceWei}
                onSuccess={handleRefresh}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Patron Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Patron Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Only the current patron can execute these functions.
          </p>

          {!isConnected ? (
            <p className="text-muted-foreground">
              Connect your wallet to access patron actions.
            </p>
          ) : !isCorrectNetwork ? (
            <p className="text-destructive">
              Please switch to Ethereum Mainnet.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                <h4 className="font-medium">Change Price</h4>
                <ChangePriceForm stewardAddress={stewardAddress} onSuccess={handleRefresh} />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Top Up Deposit</h4>
                <TopupDepositForm stewardAddress={stewardAddress} onSuccess={handleRefresh} />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Withdraw Some Deposit</h4>
                <WithdrawDepositForm stewardAddress={stewardAddress} onSuccess={handleRefresh} />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Exit</h4>
                <ExitForm stewardAddress={stewardAddress} onSuccess={handleRefresh} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
