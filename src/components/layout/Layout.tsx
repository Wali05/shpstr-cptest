import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingNav } from './floating-nav';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8">{children}</main>
      <Footer />
      <FloatingNav />
    </div>
  );
} 