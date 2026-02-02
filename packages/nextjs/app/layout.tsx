import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
            {children}
          </main>
          <footer className="border-t">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>This Artwork Is Always On Sale</span>
              <span className="hidden sm:inline" aria-hidden="true">&middot;</span>
              <a href="https://github.com/simondlr/thisartworkisalwaysonsale" target="_blank" rel="noopener noreferrer" className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors">GitHub</a>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
