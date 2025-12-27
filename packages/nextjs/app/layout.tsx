import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "This Artwork Is Always On Sale",
  description: "A digital artwork exploring novel property rights using Harberger Tax on the Ethereum blockchain",
  openGraph: {
    title: "This Artwork Is Always On Sale",
    description: "A digital artwork exploring novel property rights using Harberger Tax on the Ethereum blockchain",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "This Artwork Is Always On Sale",
    description: "A digital artwork exploring novel property rights using Harberger Tax on the Ethereum blockchain",
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
          <main className="max-w-2xl mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
