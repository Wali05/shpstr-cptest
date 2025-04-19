import Link from 'next/link';
import { IconWallet, IconMessage, IconScale, IconBolt } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <section className="w-full max-w-5xl space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          <span className="text-primary">Shopstr</span> Payment Escrow
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground sm:text-xl">
          A secure payment escrow system for Shopstr, enabling trust-minimized transactions 
          between buyers and merchants with automated order processing.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/nostr">
            <Button size="lg" className="gap-2">
              <IconMessage size={20} />
              <span>Get Started</span>
            </Button>
          </Link>
        </div>
      </section>

      <section className="w-full max-w-5xl py-8">
        <h2 className="mb-8 text-center text-3xl font-bold">Key Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <IconMessage className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Gift-wrapped Nostr Messages</CardTitle>
              <CardDescription>
                Send and receive encrypted messages according to NIP-17
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Securely communicate order details and payment information
                between buyers and sellers using encrypted Nostr messages.
              </p>
              <div className="mt-4">
                <Link href="/nostr">
                  <Button variant="outline" size="sm">Try It</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <IconWallet className="h-10 w-10 text-primary mb-2" />
              <CardTitle>P2PK-locked Cashu Tokens</CardTitle>
              <CardDescription>
                Create and spend tokens locked to specific public keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Lock your Cashu tokens to specific public keys, ensuring
                only the intended recipient can spend them. Perfect for
                escrow payments.
              </p>
              <div className="mt-4">
                <Link href="/cashu">
                  <Button variant="outline" size="sm">Try It</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <IconBolt className="h-10 w-10 text-primary mb-2" />
              <CardTitle>HODL Invoices</CardTitle>
              <CardDescription>
                Create and spend from time-locked Lightning invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use HODL invoices to automate the release of payments
                once order conditions are met. Ideal for automated
                merchant operations.
              </p>
              <div className="mt-4">
                <Link href="/lightning">
                  <Button variant="outline" size="sm">Try It</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <IconScale className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Dispute Resolution</CardTitle>
              <CardDescription>
                Open disputes between buyer and seller with optional third-party arbitration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                In case of disagreements, our platform offers a structured dispute resolution
                process. Buyers can raise issues, merchants can respond, and optional third-party
                arbiters can help resolve complex disputes fairly.
              </p>
              <div className="mt-4">
                <Link href="/disputes">
                  <Button variant="outline" size="sm">Try It</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
