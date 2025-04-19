"use client";

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconWallet, IconCoins, IconTransfer, IconShieldLock } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Define form schemas
const createTokenFormSchema = z.object({
  amount: z.coerce.number().min(1, {
    message: "Amount must be at least 1",
  }),
  recipientPublicKey: z.string().min(1, {
    message: "Recipient's public key is required",
  }),
});

const spendTokenFormSchema = z.object({
  token: z.string().min(1, {
    message: "Token is required",
  }),
  privateKey: z.string().min(1, {
    message: "Private key is required",
  }),
});

const escrowFormSchema = z.object({
  amount: z.coerce.number().min(1, {
    message: "Amount must be at least 1",
  }),
  buyerPublicKey: z.string().min(1, {
    message: "Buyer's public key is required",
  }),
  sellerPublicKey: z.string().min(1, {
    message: "Seller's public key is required",
  }),
  arbiterPublicKey: z.string().optional(),
});

interface Token {
  token: string;
  amount: number;
  lockTo?: string;
}

export default function CashuPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('create');
  const [createdToken, setCreatedToken] = useState<Token | null>(null);
  const [spendResult, setSpendResult] = useState<string | null>(null);
  const [escrowToken, setEscrowToken] = useState<Token | null>(null);
  
  // Create token form
  const createTokenForm = useForm<z.infer<typeof createTokenFormSchema>>({
    resolver: zodResolver(createTokenFormSchema),
    defaultValues: {
      amount: 1000,
      recipientPublicKey: '',
    },
  });
  
  // Spend token form
  const spendTokenForm = useForm<z.infer<typeof spendTokenFormSchema>>({
    resolver: zodResolver(spendTokenFormSchema),
    defaultValues: {
      token: '',
      privateKey: '',
    },
  });
  
  // Escrow form
  const escrowForm = useForm<z.infer<typeof escrowFormSchema>>({
    resolver: zodResolver(escrowFormSchema),
    defaultValues: {
      amount: 5000,
      buyerPublicKey: '',
      sellerPublicKey: '',
      arbiterPublicKey: '',
    },
  });
  
  // Create P2PK-locked token
  const createToken = async (values: z.infer<typeof createTokenFormSchema>) => {
    try {
      // In a real implementation, this would use the createP2PKLockedToken function
      // For demo purposes, we'll just create a mock token
      const mockToken: Token = {
        token: `cashuA1${values.recipientPublicKey.substring(0, 10)}${Date.now()}`,
        amount: values.amount,
        lockTo: values.recipientPublicKey,
      };
      
      setCreatedToken(mockToken);
      
      toast({
        title: 'Token Created',
        description: `Successfully created a P2PK-locked token of ${values.amount} sats`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create token',
        variant: 'destructive',
      });
    }
  };
  
  // Spend P2PK-locked token
  const spendToken = async (values: z.infer<typeof spendTokenFormSchema>) => {
    try {
      // In a real implementation, this would use the spendP2PKLockedToken function
      // For demo purposes, we'll just simulate a successful spend
      
      setSpendResult('success');
      
      toast({
        title: 'Token Spent',
        description: 'Successfully spent the P2PK-locked token',
      });
      
      // Reset form
      spendTokenForm.reset();
    } catch (error) {
      setSpendResult('failure');
      
      toast({
        title: 'Error',
        description: 'Failed to spend token',
        variant: 'destructive',
      });
    }
  };
  
  // Create escrow contract
  const createEscrow = async (values: z.infer<typeof escrowFormSchema>) => {
    try {
      // In a real implementation, this would use the createEscrowContract function
      // For demo purposes, we'll just create a mock escrow token
      const mockEscrow: Token = {
        token: `cashuEscrow${values.buyerPublicKey.substring(0, 5)}${values.sellerPublicKey.substring(0, 5)}${Date.now()}`,
        amount: values.amount,
        lockTo: JSON.stringify({
          type: 'escrow',
          parties: [values.buyerPublicKey, values.sellerPublicKey, values.arbiterPublicKey].filter(Boolean),
        }),
      };
      
      setEscrowToken(mockEscrow);
      
      toast({
        title: 'Escrow Created',
        description: `Successfully created an escrow contract of ${values.amount} sats`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create escrow contract',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">P2PK-locked Cashu Tokens</h1>
      <p className="text-muted-foreground mb-8">
        Create and spend tokens locked to specific public keys, enabling escrow payments.
      </p>
      
      <Alert className="mb-8">
        <IconWallet className="h-4 w-4" />
        <AlertTitle>Cashu Mint</AlertTitle>
        <AlertDescription>
          Connected to mint: {process.env.NEXT_PUBLIC_CASHU_MINT_URL || 'https://8333.space:3338'}
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="create">Create Token</TabsTrigger>
          <TabsTrigger value="spend">Spend Token</TabsTrigger>
          <TabsTrigger value="escrow">Escrow Contract</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCoins size={20} />
                Create P2PK-locked Token
              </CardTitle>
              <CardDescription>
                Create a token that can only be spent by the owner of a specific public key
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createTokenForm}>
                <form onSubmit={createTokenForm.handleSubmit(createToken)} className="space-y-4">
                  <FormField
                    control={createTokenForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (sats)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createTokenForm.control}
                    name="recipientPublicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Public Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="The recipient's public key"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Only the owner of this key will be able to spend the token
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Create Token</Button>
                </form>
              </Form>
              
              {createdToken && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Created Token:</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Amount:</span> {createdToken.amount} sats</div>
                    <div><span className="font-medium">Locked To:</span> {createdToken.lockTo}</div>
                    <div className="break-all">
                      <span className="font-medium">Token:</span> {createdToken.token}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="spend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTransfer size={20} />
                Spend P2PK-locked Token
              </CardTitle>
              <CardDescription>
                Spend a token that is locked to your public key
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...spendTokenForm}>
                <form onSubmit={spendTokenForm.handleSubmit(spendToken)} className="space-y-4">
                  <FormField
                    control={spendTokenForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Paste the token here"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={spendTokenForm.control}
                    name="privateKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Private Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your private key to prove ownership"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This is needed to prove you are the rightful recipient of this token
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Spend Token</Button>
                </form>
              </Form>
              
              {spendResult && (
                <div className={`mt-6 p-4 border rounded-lg ${spendResult === 'success' ? 'bg-green-950/20' : 'bg-red-950/20'}`}>
                  <h3 className="font-medium mb-2">Result:</h3>
                  {spendResult === 'success' ? (
                    <p className="text-green-500">Token was successfully spent!</p>
                  ) : (
                    <p className="text-red-500">Failed to spend token. Check your private key.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="escrow">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShieldLock size={20} />
                Create Escrow Contract
              </CardTitle>
              <CardDescription>
                Create a multi-signature escrow contract for secure payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...escrowForm}>
                <form onSubmit={escrowForm.handleSubmit(createEscrow)} className="space-y-4">
                  <FormField
                    control={escrowForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (sats)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={escrowForm.control}
                    name="buyerPublicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buyer Public Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="The buyer's public key"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={escrowForm.control}
                    name="sellerPublicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Public Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="The seller's public key"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={escrowForm.control}
                    name="arbiterPublicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arbiter Public Key (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="A third-party arbiter's public key"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional third party who can help resolve disputes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Create Escrow</Button>
                </form>
              </Form>
              
              {escrowToken && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Created Escrow Contract:</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Amount:</span> {escrowToken.amount} sats</div>
                    <div className="break-all">
                      <span className="font-medium">Contract Details:</span> {escrowToken.lockTo}
                    </div>
                    <div className="break-all">
                      <span className="font-medium">Token:</span> {escrowToken.token}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 