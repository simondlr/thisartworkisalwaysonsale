"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { formatEther } from "viem";
import { Address } from "@/components/Address";
import { ExternalLink } from "@/components/ExternalLink";
import { WallLabel, WallLabelRow } from "@/components/WallLabel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STEWARDS_QUERY, STEWARDS_QUERY_VARIABLES, totalTimeHeld, type StewardData } from "@/lib/graphql";
import { useEthPrice, formatUsd } from "@/hooks/usePrices";
import { useNow } from "@/hooks/useNow";
import { humanizeDuration } from "@/lib/time";
import { stewardState } from "@/lib/patronage";
import { formatEth } from "@/lib/utils";
import { ARTWORKS, type Version } from "@/lib/artworks";

interface StewardsQueryResult {
  v1: StewardData;
  v2: StewardData;
}

const PRESS: Array<{ year: number; href: string; title: string }> = [
  { year: 2025, href: "https://www.taschen.com/en/books/art/08154/on-nfts/", title: "Taschen — On NFTs" },
  { year: 2025, href: "https://artmetropole.com/shop/16485", title: "Espace 140: Blockchain" },
  { year: 2022, href: "https://shop.spikeartmagazine.com/products/issue-70-winter-2021-web3", title: "Spike Magazine 70: Web3" },
  { year: 2022, href: "https://www.lumenprize.com/2022-nft-award-longlist", title: "Lumen Prize Longlist — NFT Award" },
  { year: 2021, href: "https://celestialhermitage.ru/en/", title: "Ethereal Aether — State Hermitage" },
  { year: 2021, href: "https://bijutsu.press/books/4892/", title: "Bijutsu Techo — Special Feature: What is “NFT Art”?!" },
  {
    year: 2021,
    href: "https://news.artnet.com/opinion/artists-blockchain-resale-royalties-1956903",
    title: "artnet — “Artists Have Been Attempting to Secure Royalties…”",
  },
  {
    year: 2021,
    href: "https://amt-lab.org/blog/2021/9/nft-considerations-and-implications",
    title: "AMTLab — “NFTs Legal Considerations And Implications”",
  },
  {
    year: 2021,
    href: "https://www.clotmag.com/oped/talking-about-art-and-the-blockchain-by-charlotte-kent",
    title: "CLOTmag — “Talking about Art and the Blockchain”",
  },
  {
    year: 2019,
    href: "https://www.youtube.com/watch?v=all1wr0Gk7o",
    title: "ParaSite Hong Kong — “This Artwork is Always on Sale: A Crypto Story”",
  },
  {
    year: 2019,
    href: "https://www.coindesk.com/markets/2019/03/26/the-radicalxchange-movements-crypto-cypherpunk-appeal/",
    title: "CoinDesk — “The RadicalxChange Movement’s Crypto-Cypherpunk Appeal”",
  },
];

function ArtworkImage({ version }: { version: Version }) {
  const { image, title } = ARTWORKS[version];
  return (
    <Link href={`/${version}`} className="block group focus-visible:outline-none" tabIndex={-1} aria-hidden="true">
      <Image
        src={image}
        alt=""
        width={600}
        height={400}
        sizes="(min-width: 768px) 460px, 100vw"
        className="artwork-frame transition-transform duration-300 group-hover:-translate-y-0.5"
        priority
      />
      <span className="sr-only">{title}</span>
    </Link>
  );
}

function ArtworkHeading({ version }: { version: Version }) {
  const { title, subtitle } = ARTWORKS[version];
  return (
    <div>
      <h2 className="font-serif text-3xl tracking-tight">
        <Link href={`/${version}`} className="hover:opacity-70 transition-opacity">
          {title}
        </Link>
      </h2>
      <p className="font-serif italic text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function ArtworkCardSkeleton({ version }: { version: Version }) {
  return (
    <article className="space-y-6">
      <ArtworkImage version={version} />
      <ArtworkHeading version={version} />
      <div className="divide-y border-y" aria-busy="true">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between py-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </article>
  );
}

function ArtworkCard({
  version,
  data,
  ethPrice,
  now,
}: {
  version: Version;
  data: StewardData | undefined;
  ethPrice: number;
  now: number;
}) {
  const { steward, rateLabel } = ARTWORKS[version];
  const state = stewardState(data, version, now);
  const price = state?.price ?? 0n;
  const priceUsd = formatUsd(parseFloat(formatEther(price)), ethPrice);
  const isHeldBySteward = data?.currentPatron?.id?.toLowerCase() === steward.toLowerCase();

  return (
    <article className="space-y-6">
      <ArtworkImage version={version} />
      <ArtworkHeading version={version} />

      <WallLabel>
        <WallLabelRow label="Price">
          <span className="font-serif text-xl tabular-nums">{formatEth(price)} ETH</span>
          {priceUsd && <span className="ml-2 text-xs text-muted-foreground">≈ ${priceUsd}</span>}
        </WallLabelRow>
        <WallLabelRow label="Held by">
          {isHeldBySteward ? (
            "The steward (foreclosed)"
          ) : (
            <span className="font-mono text-xs" title={data?.currentPatron?.id}>
              <Address address={data?.currentPatron?.id} short />
            </span>
          )}
        </WallLabelRow>
        <WallLabelRow label="For">{humanizeDuration(totalTimeHeld(data, now))}</WallLabelRow>
        <WallLabelRow label="Patronage">{rateLabel} / year</WallLabelRow>
      </WallLabel>

      {state?.isPastDue && (
        <p className="rounded-md bg-notice text-notice-foreground px-3 py-2 text-sm">
          Deposit has run out — collectable for just a deposit.
        </p>
      )}

      <Link href={`/${version}`} className="gallery-link text-sm font-medium">
        View &amp; collect <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-serif text-3xl tracking-tight">
      {children}
    </h2>
  );
}

export default function Home() {
  const { data, loading, error, refetch } = useQuery<StewardsQueryResult>(STEWARDS_QUERY, {
    variables: STEWARDS_QUERY_VARIABLES,
    fetchPolicy: "cache-and-network",
  });

  const { data: ethPrice = 0 } = useEthPrice();
  const now = useNow();

  const showSkeleton = loading && !data;

  return (
    <div className="space-y-24">
      <div className="space-y-10 sm:space-y-12">
        {/* Title: spans the full width of the two-artwork grid below */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
          This Artwork Is Always On Sale
        </h1>

        {/* The artworks */}
        <section aria-label="The artworks">
          {error && !data ? (
            // The artworks themselves don't depend on the subgraph, so keep showing them.
            <div className="space-y-8">
              <div className="grid gap-16 md:grid-cols-2 md:gap-12">
                {(["v1", "v2"] as const).map((v) => (
                  <article key={v} className="space-y-6">
                    <ArtworkImage version={v} />
                    <ArtworkHeading version={v} />
                  </article>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <p className="text-destructive">Couldn&apos;t load the artworks&apos; current prices and holders.</p>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  Try again
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-16 md:grid-cols-2 md:gap-12">
              {showSkeleton ? (
                <>
                  <ArtworkCardSkeleton version="v1" />
                  <ArtworkCardSkeleton version="v2" />
                </>
              ) : (
                <>
                  <ArtworkCard version="v1" data={data?.v1} ethPrice={ethPrice} now={now} />
                  <ArtworkCard version="v2" data={data?.v2} ethPrice={ethPrice} now={now} />
                </>
              )}
            </div>
          )}
        </section>
      </div>

      {/* About */}
      <section aria-labelledby="about-heading" className="border-t pt-12 grid gap-6 md:grid-cols-[12rem_1fr]">
        <SectionHeading id="about-heading">The Artworks</SectionHeading>
        <div className="prose-gallery">
          <p>
            First launched on March 21, 2019, these NFT, digital artworks explore digital art with novel property rights
            associated with it. Using the Ethereum blockchain, it is possible to introduce scarcity of ownership alongside
            novel economic and property rights. Inspired by Radical Markets, this artwork follows a modified Harberger Tax
            (COST) property ownership where the tax on the property (patronage) is collected only by the artist. It is
            perpetual royalty.
          </p>
          <p>
            The owner must always specify a sale price. Contingent on this price and the patronage rate, the smart
            contract automatically deducts royalties from the owner&apos;s deposit.
          </p>
          <p>Through this artwork, it asks a few questions:</p>
          <ul className="space-y-2 border-l-2 border-link/30 pl-5 font-serif italic text-lg text-foreground">
            <li>Does this digital art property rights system change the relationship between collector/patron and artist?</li>
            <li>Does allowing for a more readily available avenue for patronage create more revenue for an artist?</li>
            <li>Does this property rights system allow for more sustainable funding of creative works?</li>
            <li>
              Does an always-on auction and market for arts and subsequent speculation/pricing change the relationship
              towards the art and the artist?
            </li>
            <li>
              Does the increased turnover of the digital art and subsequent possibility of ownership by more people
              increase the value of the art (financially and artistically)?
            </li>
            <li>
              Does always-on-sale art help us understand how much of our currently life is already always on sale without
              us knowing it?
            </li>
          </ul>
          <p>
            For more information, read{" "}
            <ExternalLink href="https://medium.com/@simondlr/this-artwork-is-always-on-sale-92a7d0c67f43">
              this article
            </ExternalLink>
            .
          </p>
          <p>
            The first artwork (V1) has a patronage rate of 5%. It was restored after it was discovered that it was
            damaged. A new edition (V2) was created, launched in June 2020, using a new patronage rate of 100% in order to
            continue experimentation.
          </p>
          <p>
            You can check out more technical details, fork this project, and create your own artwork{" "}
            <ExternalLink href="https://github.com/simondlr/thisartworkisalwaysonsale">on GitHub</ExternalLink>.
          </p>
        </div>
      </section>

      {/* Press */}
      <section aria-labelledby="press-heading" className="border-t pt-12 grid gap-6 md:grid-cols-[12rem_1fr]">
        <SectionHeading id="press-heading">Press</SectionHeading>
        <ul className="max-w-prose divide-y border-y">
          {PRESS.map((item) => (
            <li key={item.href} className="grid grid-cols-[3.5rem_1fr] gap-4 py-3 text-[0.95rem]">
              <span className="tabular-nums text-muted-foreground">{item.year}</span>
              <ExternalLink href={item.href}>{item.title}</ExternalLink>
            </li>
          ))}
        </ul>
      </section>

      {/* Artist */}
      <section aria-labelledby="artist-heading" className="border-t pt-12 grid gap-6 md:grid-cols-[12rem_1fr]">
        <SectionHeading id="artist-heading">The Artist</SectionHeading>
        <div className="prose-gallery">
          <p>
            I&apos;m a creator at heart. Besides my art practice, I have created games, novels, music, companies, and new
            economics. In the Ethereum world, I helped create the ERC20 token standard and co-invented and popularised
            token bonding curves. Today, I&apos;m primarily a writer, artist, and technologist.
          </p>
          <p>
            Subscribe to my newsletter!{" "}
            <ExternalLink href="https://sceneswithsimon.com">sceneswithsimon.com</ExternalLink>
          </p>
          <p>
            Check my other art projects:{" "}
            <ExternalLink href="https://home.simondlr.com/art">home.simondlr.com/art</ExternalLink>
          </p>
          <p className="text-sm text-muted-foreground">Last updated: November 2026</p>
        </div>
      </section>
    </div>
  );
}
