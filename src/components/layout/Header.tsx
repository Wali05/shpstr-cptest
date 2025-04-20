import Link from 'next/link';
import { IconWallet } from '@tabler/icons-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-center py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <IconWallet size={24} className="text-primary" />
            <span className="text-xl font-bold tracking-tight">Shopstr Escrow</span>
          </Link>
        </div>
        
        <div className="absolute right-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
} 