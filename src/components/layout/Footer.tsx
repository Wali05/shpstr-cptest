import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Shopstr Test</h3>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/boy.png" alt="Profile" width={20} height={20} className="rounded-full" />
              <p className="text-xs text-muted-foreground">
                Made By Wali Ahed Hussain for the Shopstr Competency Test
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              This application demonstrates:
            </p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 mt-1 space-y-0.5">
              <li>Send/receive gift-wrapped Nostr messages (NIP-17)</li>
              <li>Create and spend P2PK-locked Cashu tokens</li>
              <li>Create and spend from a HODL invoice</li>
            </ul>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold mb-2">Technologies</h4>
            <ul className="space-y-1">
              <li>
                <Link
                  href="https://github.com/nostr-protocol/nips/blob/master/17.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm hover:underline text-muted-foreground hover:text-foreground"
                >
                  Nostr NIP-17 (Gift Messages)
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/cashubtc/nuts/blob/main/11.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm hover:underline text-muted-foreground hover:text-foreground"
                >
                  Cashu P2PK Tokens
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/lightningnetwork/lnd/pull/2022"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm hover:underline text-muted-foreground hover:text-foreground"
                >
                  Lightning HODL Invoices
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold mb-2">Project Links</h4>
            <ul className="space-y-1">
              <li>
                <Link
                  href="https://github.com/Wali05/shpstr-cptest"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm hover:underline text-muted-foreground hover:text-foreground"
                >
                  Project Repository
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
} 