import "./globals.css";
import { Layout } from "@/components/layout/Layout";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/hooks/use-theme";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopstr-Competency-Test",
  description: "A secure payment escrow system for Shopstr",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <Layout>{children}</Layout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
