"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-3xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-semibold text-lg hover:opacity-80 transition-opacity">
          TAIAOS
        </Link>
        <ConnectButton />
      </div>
    </header>
  );
}
