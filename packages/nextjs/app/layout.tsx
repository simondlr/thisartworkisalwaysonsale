import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { ExternalLink } from "@/components/ExternalLink";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", style: ["normal", "italic"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://thisartworkisalwaysonsale.com"),
  title: "This Artwork Is Always On Sale",
  description: "A digital artwork exploring novel property rights using Harberger Tax on the Ethereum blockchain",
  openGraph: {
    title: "This Artwork Is Always On Sale",
    description: "A digital artwork exploring novel property rights using Harberger Tax on the Ethereum blockchain",
    type: "website",
    images: [{ url: "/artwork-v1.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "This Artwork Is Always On Sale",
    description: "A digital artwork exploring novel property rights using Harberger Tax on the Ethereum blockchain",
    images: ["/artwork-v1.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <Header />
          <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
            {children}
          </main>
          <footer className="border-t">
            <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
              <p className="font-serif text-base italic text-foreground">This Artwork Is Always On Sale</p>
              <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
                <ExternalLink href="https://medium.com/@simondlr/this-artwork-is-always-on-sale-92a7d0c67f43">Essay</ExternalLink>
                <ExternalLink href="https://github.com/simondlr/thisartworkisalwaysonsale">GitHub</ExternalLink>
                <ExternalLink href="https://home.simondlr.com/art">Simon de la Rouviere</ExternalLink>
              </nav>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
