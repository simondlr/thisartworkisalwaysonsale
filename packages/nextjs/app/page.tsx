"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function truncateAddress(address?: string): string {
  if (!address) return "Unknown";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
import { Skeleton } from "@/components/ui/skeleton";
import { STEWARDS_QUERY, type StewardData } from "@/lib/graphql";
import { useEthPrice, getUsdValue } from "@/hooks/usePrices";
import { humanizeDuration } from "@/lib/time";
import { CONTRACT_ADDRESSES } from "@/lib/wagmi";

interface StewardsQueryResult {
  v1: StewardData;
  v2: StewardData;
}

function ArtworkCardSkeleton({ imageSrc, subtitle }: { imageSrc: string; subtitle: string }) {
  return (
    <div>
      <Image
        src={imageSrc}
        alt="Artwork"
        width={600}
        height={600}
        className="gallery mx-auto"
        priority
      />
      <div className="mt-6 text-center">
        <p className="text-xl font-semibold tracking-tight text-foreground mb-4">{subtitle}</p>
        <div className="max-w-[80%] mx-auto">
          <div className="rounded-lg border bg-muted/30 px-5 py-4 space-y-3 text-left">
            <Skeleton className="h-8 w-72" />
            <hr />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-32 mx-auto mt-4" />
        </div>
      </div>
    </div>
  );
}

function ArtworkCard({
  version,
  data,
  ethPrice,
  imageSrc,
  patronageRate,
  subtitle,
}: {
  version: "v1" | "v2";
  data: StewardData | null;
  ethPrice: number;
  imageSrc: string;
  patronageRate: string;
  subtitle: string;
}) {
  const stewardAddress = version === "v1" ? CONTRACT_ADDRESSES.v1Steward.toLowerCase() : CONTRACT_ADDRESSES.v2Steward.toLowerCase();

  const priceEth = data ? formatEther(BigInt(data.currentPrice)) : "0";
  const priceUsd = data ? getUsdValue(parseFloat(priceEth), ethPrice) : 0;

  const isForeclosed = data?.currentPatron?.id?.toLowerCase() === stewardAddress;

  const timeHeld = data?.currentPatron?.stewards?.[0]?.timeHeld || "0";
  const timeSinceLastCollected = data ? Math.floor(Date.now() / 1000) - parseInt(data.timeLastCollected) : 0;
  const totalTimeHeld = parseInt(timeHeld) + timeSinceLastCollected;
  const timeHeldHumanized = humanizeDuration(totalTimeHeld);

  return (
    <div>
      <Image
        src={imageSrc}
        alt={`Artwork ${version.toUpperCase()}`}
        width={600}
        height={600}
        className="gallery mx-auto"
        priority
      />
      <div className="mt-6 text-center">
        <p className="text-xl font-semibold tracking-tight text-foreground mb-4">{subtitle}</p>

        <div className="max-w-[80%] mx-auto">
        <div className="rounded-lg border bg-muted/30 px-5 py-4 space-y-3 text-left">
          <p className="text-2xl font-bold tracking-tight">
            Valued at: {priceEth} ETH <span className="text-sm font-normal text-muted-foreground">(~${priceUsd} USD)</span>
          </p>

          <hr />

          {isForeclosed ? (
            <p className="text-sm text-muted-foreground">
              Foreclosed — held by smart contract steward for {timeHeldHumanized}
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm">
                Held by{" "}
                <span className="font-mono text-xs text-muted-foreground break-all" title={data?.currentPatron?.id}>
                  <span className="hidden sm:inline">{data?.currentPatron?.id}</span>
                  <span className="sm:hidden">{truncateAddress(data?.currentPatron?.id)}</span>
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                For {timeHeldHumanized}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground/70">
            Patronage: {patronageRate}/yr
          </p>
        </div>

        <Link
          href={`/${version}`}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mt-4"
        >
          View Details
        </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data, loading, error, refetch } = useQuery<StewardsQueryResult>(STEWARDS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const { data: ethPrice = 0 } = useEthPrice();

  const showSkeleton = loading && !data;

  return (
    <div className="space-y-12">
      {/* Artwork Cards or Skeletons */}
      {error && !data ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive">Error loading artwork data. Please try again.</p>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : showSkeleton ? (
        <>
          <ArtworkCardSkeleton imageSrc="/artwork-v1.png" subtitle="Original (2019). Restored (2021)." />
          <ArtworkCardSkeleton imageSrc="/artwork-v2.png" subtitle="V2 (2020)" />
        </>
      ) : (
        <>
          <ArtworkCard
            version="v1"
            data={data?.v1 || null}
            ethPrice={ethPrice}
            imageSrc="/artwork-v1.png"
            patronageRate="5%"
            subtitle="Original (2019). Restored (2021)."
          />
          <ArtworkCard
            version="v2"
            data={data?.v2 || null}
            ethPrice={ethPrice}
            imageSrc="/artwork-v2.png"
            patronageRate="100%"
            subtitle="V2 (2020)"
          />
        </>
      )}

      {/* About Section */}
      <section className="border-t pt-10 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">The Artworks</h2>
        <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
          <p>
            First launched on March 21, 2019, these NFT, digital artworks explore digital art with novel
            property rights associated with it. Using the Ethereum blockchain, it is possible to introduce
            scarcity of ownership alongside novel economic and property rights. Inspired by Radical Markets,
            this artwork follows a modified Harberger Tax (COST) property ownership where the tax on the
            property (patronage) is collected only by the artist. It is perpetual royalty.
          </p>
          <p>
            The owner must always specify a sale price. Contingent on this price and the patronage rate, the smart contract
            automatically deducts royalties from the owner's deposit.
          </p>
          <p>Through this artwork, it asks a few questions:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Does this digital art property rights system change the relationship between collector/patron and artist?</li>
            <li>Does allowing for a more readily available avenue for patronage create more revenue for an artist?</li>
            <li>Does this property rights system allow for more sustainable funding of creative works?</li>
            <li>Does an always-on auction and market for arts and subsequent speculation/pricing change the relationship towards the art and the artist?</li>
            <li>Does the increased turnover of the digital art and subsequent possibility of ownership by more people increase the value of the art (financially and artistically)?</li>
            <li>Does always-on-sale art help us understand how much of our currently life is already always on sale without us knowing it?</li>
          </ul>
          <p>
            For more information, read this article:{" "}
            <a href="https://medium.com/@simondlr/this-artwork-is-always-on-sale-92a7d0c67f43" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">
              https://medium.com/@simondlr/this-artwork-is-always-on-sale-92a7d0c67f43
            </a>
          </p>
          <p>
            The first artwork (V1) has a patronage rate of 5%. It was restored after it was discovered that it was damaged.
            A new edition (V2) was created, launched in June 2020, using a new patronage rate of 100% in order to continue experimentation.
          </p>
          <p>
            You can check out more technical details, fork this project, and create your own artwork here:{" "}
            <a href="https://github.com/simondlr/thisartworkisalwaysonsale" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">
              https://github.com/simondlr/thisartworkisalwaysonsale
            </a>
          </p>
        </div>
      </section>

      {/* Press Section */}
      <Card>
        <CardHeader>
          <CardTitle>Select Press/Mentions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ul className="space-y-3">
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2025</span>{" "}
              <a href="https://www.taschen.com/en/books/art/08154/on-nfts/" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">Taschen - On NFTs</a>
            </li>
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2025</span>{" "}
              <a href="https://artmetropole.com/shop/16485" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">Espace 140: Blockchain</a>
            </li>
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2022</span>{" "}
              <a href="https://shop.spikeartmagazine.com/products/issue-70-winter-2021-web3" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">Spike Magazine 70: Web3</a>
            </li>
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2022</span>{" "}
              <a href="https://www.lumenprize.com/2022-nft-award-longlist" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">Lumen Prize Longlist — NFT Award</a>
            </li>
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2021</span>{" "}
              <a href="https://celestialhermitage.ru/en/" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">Ethereal Aether — State Hermitage</a>
            </li>
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2021</span>{" "}
              <a href="https://bijutsu.press/books/4892/" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">Bijutsu Techo — Special Feature: What is &quot;NFT Art&quot;?!</a>
            </li>
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2021</span>{" "}
              <a href="https://news.artnet.com/opinion/artists-blockchain-resale-royalties-1956903" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">artnet — &quot;Artists Have Been Attempting to Secure Royalties...&quot;</a>
            </li>
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2021</span>{" "}
              <a href="https://amt-lab.org/blog/2021/9/nft-considerations-and-implications" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">AMTLab — &quot;NFTs Legal Considerations And Implications&quot;</a>
            </li>
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2021</span>{" "}
              <a href="https://www.clotmag.com/oped/talking-about-art-and-the-blockchain-by-charlotte-kent" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">CLOTmag — &quot;Talking about Art and the Blockchain&quot;</a>
            </li>
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2019</span>{" "}
              <a href="https://www.youtube.com/watch?v=all1wr0Gk7o" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">ParaSite Hong Kong — &quot;This Artwork is Always on Sale: A Crypto Story&quot;</a>
            </li>
            <li>
              <span className="inline-block w-12 font-medium tabular-nums text-muted-foreground/70">2019</span>{" "}
              <a href="https://www.coindesk.com/markets/2019/03/26/the-radicalxchange-movements-crypto-cypherpunk-appeal/" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">CoinDesk — &quot;The RadicalxChange Movement&apos;s Crypto-Cypherpunk Appeal&quot;</a>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Artist Section */}
      <section className="border-t pt-10 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">The Artist</h2>
        <div className="text-base text-muted-foreground leading-relaxed space-y-4">
          <p>
            I'm a creator at heart. Besides my art practice, I have created games, novels, music, companies, and 
            new economics. In the Ethereum world, I helped create the ERC20 token standard and co-invented and popularised
            token bonding curves. Today, I'm primarily a writer, artist, and technologist.
          </p>
          <p>
            Subscribe to my newsletter!{" "}
            <a href="https://sceneswithsimon.com" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">sceneswithsimon.com</a>
          </p>
          <p>
            Check my other art projects:{" "}
            <a href="https://home.simondlr.com/art" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer">home.simondlr.com/art</a>
          </p>
          <p>
            Last updated: February 2026
          </p>
        </div>
      </section>
    </div>
  );
}
