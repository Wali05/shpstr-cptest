import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for{' '}
            <Link
              href="https://github.com/GammaMarkets/market-spec"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Shopstr
            </Link>{' '}
            as a payment escrow system.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row md:gap-2 md:px-0">
          <Link
            href="https://github.com/cashubtc/nuts/blob/main/11.md"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium underline underline-offset-4"
          >
            Cashu P2PK
          </Link>
          
          <span className="hidden sm:inline-block">•</span>
          
          <Link
            href="https://github.com/lightningnetwork/lnd/pull/2022"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium underline underline-offset-4"
          >
            HODL Invoices
          </Link>
          
          <span className="hidden sm:inline-block">•</span>
          
          <Link
            href="https://github.com/nostr-protocol/nips/blob/master/17.md"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium underline underline-offset-4"
          >
            NIP-17
          </Link>
        </div>
      </div>
    </footer>
  );
} 