import Link from 'next/link';
import { IconWallet, IconMessage, IconScale, IconBolt } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <IconWallet size={24} className="text-primary" />
            <span className="text-xl font-bold tracking-tight">Shopstr Escrow</span>
          </Link>
        </div>
        
        <nav className="flex items-center gap-4">
          <Link href="/nostr">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <IconMessage size={18} />
              <span>Gift Messages</span>
            </Button>
          </Link>
          
          <Link href="/cashu">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <IconWallet size={18} />
              <span>P2PK Tokens</span>
            </Button>
          </Link>
          
          <Link href="/lightning">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <IconBolt size={18} />
              <span>HODL Invoices</span>
            </Button>
          </Link>
          
          <Link href="/disputes">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <IconScale size={18} />
              <span>Disputes</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
} 