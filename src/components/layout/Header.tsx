import Link from 'next/link';
import { IconBolt } from '@tabler/icons-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur-md">
      <div className="container flex h-14 items-center px-4 sm:px-8">
        <div className="mr-4 flex items-center">
          <IconBolt className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <Link href="/" className="ml-2 flex items-center">
            <h1 className="text-md font-semibold sm:text-xl">Shopstr Competency Test</h1>
          </Link>
        </div>
        
        <div className="flex-1"></div>
        
          <ThemeToggle />
      </div>
    </header>
  );
} 