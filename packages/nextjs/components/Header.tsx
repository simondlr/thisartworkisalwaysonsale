"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" className="font-serif text-lg sm:text-xl tracking-tight hover:opacity-70 transition-opacity">
          <span className="sm:hidden">TAIAOS</span>
          <span className="hidden sm:inline">This Artwork Is Always On Sale</span>
        </Link>
        <ConnectButton
          accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
          chainStatus="icon"
          showBalance={false}
        />
      </div>
    </header>
  );
}
