import "./globals.css";
import { Layout } from "@/components/layout/Layout";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopstr Payment Escrow",
  description: "A secure payment escrow system for Shopstr",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Layout>{children}</Layout>
        <Toaster />
      </body>
    </html>
  );
}
