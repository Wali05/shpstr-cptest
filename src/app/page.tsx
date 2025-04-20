"use client";

import { BackgroundBeamsWithCollisionDemo } from "@/components/ui/background-beams-demo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full">
        <BackgroundBeamsWithCollisionDemo />
      </div>
      
      <div className="mt-24 container mx-auto px-4 text-center">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4">Encrypted Messaging</h3>
            <p className="text-muted-foreground mb-4">
              Secure communication between buyers and sellers using Nostr&apos;s encryption. 
              Create gift messages that can only be decrypted with the proper keys.
            </p>
            <Link href="/nostr" className="inline-block">
              <Button className="mt-2 transition-all duration-300 hover:bg-opacity-90 hover:shadow-lg hover:scale-105">
                Try Messaging →
              </Button>
            </Link>
          </div>
          
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4">P2PK Tokens</h3>
            <p className="text-muted-foreground mb-4">
              Issue and redeem Cashu tokens with P2PK conditions. Perfect for gift cards and
              digital collectibles with provable ownership.
            </p>
            <Link href="/cashu" className="inline-block">
              <Button className="mt-2 transition-all duration-300 hover:bg-opacity-90 hover:shadow-lg hover:scale-105">
                View Tokens →
              </Button>
            </Link>
          </div>
          
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4">HODL Invoices</h3>
            <p className="text-muted-foreground mb-4">
              Create time-locked Lightning payments that only complete when the merchant releases them.
              Perfect for escrow and conditional payments.
            </p>
            <Link href="/lightning" className="inline-block">
              <Button className="mt-2 transition-all duration-300 hover:bg-opacity-90 hover:shadow-lg hover:scale-105">
                Explore Lightning →
              </Button>
            </Link>
          </div>
          
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4">Dispute Resolution</h3>
            <p className="text-muted-foreground mb-4">
              Fair and transparent dispute resolution system for buyers and sellers.
              Neutral third-party arbitration when things don&apos;t go as planned.
            </p>
            <Link href="/disputes" className="inline-block">
              <Button className="mt-2 transition-all duration-300 hover:bg-opacity-90 hover:shadow-lg hover:scale-105">
                Dispute Center →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
