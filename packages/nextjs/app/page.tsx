"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="mb-8">
      <CardHeader className="text-center">
        <Image
          src={imageSrc}
          alt="Artwork"
          width={600}
          height={600}
          className="gallery mx-auto rounded-lg"
          priority
        />
        <CardTitle className="mt-4">{subtitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-center">
        <Skeleton className="h-7 w-64 mx-auto" />
        <Skeleton className="h-5 w-80 mx-auto" />
        <Skeleton className="h-5 w-48 mx-auto" />
        <Skeleton className="h-4 w-56 mx-auto" />
        <Skeleton className="h-10 w-32 mx-auto mt-4" />
      </CardContent>
    </Card>
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
    <Card className="mb-8">
      <CardHeader className="text-center">
        <Image
          src={imageSrc}
          alt={`Artwork ${version.toUpperCase()}`}
          width={600}
          height={600}
          className="gallery mx-auto rounded-lg"
          priority
        />
        <CardTitle className="mt-4">{subtitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-center">
        <p className="text-lg">
          Valued at: <span className="font-semibold">{priceEth} ETH</span>{" "}
          <span className="text-muted-foreground">(~${priceUsd} USD)</span>
        </p>

        {isForeclosed ? (
          <p className="text-muted-foreground">
            This artwork was recently foreclosed and is in control of the smart contract steward.
            It has not been bought for 0 ETH for: {timeHeldHumanized}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Currently held by{" "}
            <span className="font-mono text-xs break-all">{data?.currentPatron?.id}</span>
            <br />
            They&apos;ve held it for a lifetime of {timeHeldHumanized} thus far.
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Patronage Rate: {patronageRate} per annum of sale price.
        </p>

        <Link href={`/${version}`}>
          <Button className="mt-4">More Details</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data, loading, error, refetch } = useQuery<StewardsQueryResult>(STEWARDS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const { data: ethPrice = 0 } = useEthPrice();

  const showSkeleton = loading && !data;

  return (
    <div className="space-y-8">
      {/* Artwork Cards or Skeletons */}
      {error && !data ? (
        <Card className="mb-8">
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
      <Card>
        <CardHeader>
          <CardTitle>The Artworks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            First launched on March 21, 2019, these NFT, digital artworks explore digital art with novel
            property rights associated with it. Using the Ethereum blockchain, it is possible to introduce
            scarcity of ownership alongside novel economic and property rights. Inspired by Radical Markets,
            this artwork follows a modified Harberger Tax (COST) property ownership where the tax on the
            property (patronage) is collected only by the artist. It is perpetual royalty.
          </p>
          <p>Through this, it asks a few questions:</p>
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
            <a href="https://medium.com/@simondlr/this-artwork-is-always-on-sale-92a7d0c67f43" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              https://medium.com/@simondlr/this-artwork-is-always-on-sale-92a7d0c67f43
            </a>
          </p>
          <p>
            The first artwork has a patronage rate of 5%. It was restored after it was discovered that it was damaged.
            A new edition was created, launched in June 2020, using a new patronage rate of 100% in order to continue experimentation.
          </p>
          <p>
            You can check out more technical details, fork this project, and create your own artwork here:{" "}
            <a href="https://github.com/simondlr/thisartworkisalwaysonsale" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              https://github.com/simondlr/thisartworkisalwaysonsale
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Press Section */}
      <Card>
        <CardHeader>
          <CardTitle>Press/Mentions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>Lumen Prize Longlist. NFT Award. (2022): <a href="https://www.lumenprize.com/2022-nft-award-longlist" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">2022 NFT Award Longlist</a></p>
          <p>Ethereal Aether. State Hermitage (2021): <a href="https://celestialhermitage.ru/en/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Celestial Hermitage</a></p>
          <p>Bijutsu Techo (2021): <a href="https://bijutsu.press/books/4892/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Special Feature What is &quot;NFT Art&quot;?!</a></p>
          <p>artnet (2021): <a href="https://news.artnet.com/opinion/artists-blockchain-resale-royalties-1956903" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">&quot;Artists Have Been Attempting to Secure Royalties...&quot;</a></p>
          <p>AMTLab (2021): <a href="https://amt-lab.org/blog/2021/9/nft-considerations-and-implications" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">&quot;NFTs Legal Considerations And Implications&quot;</a></p>
          <p>CLOTmag (2021): <a href="https://www.clotmag.com/oped/talking-about-art-and-the-blockchain-by-charlotte-kent" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">&quot;Talking about Art and the Blockchain&quot;</a></p>
          <p>ParaSite Hong Kong (2019): <a href="https://www.youtube.com/watch?v=all1wr0Gk7o" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">&quot;This Artwork is Always on Sale: A Crypto Story&quot;</a></p>
          <p>CoinDesk (2019): <a href="https://www.coindesk.com/markets/2019/03/26/the-radicalxchange-movements-crypto-cypherpunk-appeal/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">&quot;The RadicalxChange Movement&apos;s Crypto-Cypherpunk Appeal&quot;</a></p>
        </CardContent>
      </Card>

      {/* Artist Section */}
      <Card>
        <CardHeader>
          <CardTitle>The Artist</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-4">
          <p>
            I&apos;m a creator at heart. I have created games, writing, music, code, companies, and new economics.
            Solving the problems of the creator has always been important to me. In the past I co-founded Ujo Music,
            working with Grammy-winning artists such as Imogen Heap and RAC to launch the first music royalty projects
            using smart contracts. I&apos;ve helped kickstart wholly new markets and economies. I helped to create the
            Ethereum ERC20 token standard and token bonding curves, technologies that&apos;s currently facilitating
            economies worth several billion dollars of value. I enjoy creating new forms of art and experimenting
            with ways to empower creatives.
          </p>
          <p>
            Swing me a follow on Twitter!{" "}
            <a href="https://twitter.com/simondlr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">@simondlr</a>
          </p>
          <p>
            Check my other art projects:{" "}
            <a href="https://blog.simondlr.com/art" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">blog.simondlr.com/art</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
