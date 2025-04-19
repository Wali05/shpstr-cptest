"use client";

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconBolt, IconCopy, IconCoin, IconArrowRight, IconClock } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Define form schemas
const createInvoiceFormSchema = z.object({
  amount: z.coerce.number().min(1, {
    message: "Amount must be at least 1",
  }),
  description: z.string().min(1, {
    message: "Description is required",
  }),
  expirySeconds: z.coerce.number().min(60, {
    message: "Expiry must be at least 60 seconds",
  }),
});

const payInvoiceFormSchema = z.object({
  paymentRequest: z.string().min(1, {
    message: "Payment request is required",
  }),
});

const settleInvoiceFormSchema = z.object({
  hash: z.string().min(1, {
    message: "Invoice hash is required",
  }),
  preimage: z.string().min(1, {
    message: "Preimage is required",
  }),
});

interface HodlInvoice {
  paymentRequest: string;
  preimage: string;
  hash: string;
  amount: number;
  expirySeconds: number;
  createdAt: number;
  description: string;
  status: 'pending' | 'settled' | 'canceled' | 'expired';
}

export default function LightningPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('create');
  const [createdInvoice, setCreatedInvoice] = useState<HodlInvoice | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'failed' | null>(null);
  const [settledInvoice, setSettledInvoice] = useState<string | null>(null);
  
  // Create invoice form
  const createInvoiceForm = useForm<z.infer<typeof createInvoiceFormSchema>>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: {
      amount: 1000,
      description: 'Order #' + Math.floor(Math.random() * 10000),
      expirySeconds: 86400, // 24 hours
    },
  });
  
  // Pay invoice form
  const payInvoiceForm = useForm<z.infer<typeof payInvoiceFormSchema>>({
    resolver: zodResolver(payInvoiceFormSchema),
    defaultValues: {
      paymentRequest: '',
    },
  });
  
  // Settle invoice form
  const settleInvoiceForm = useForm<z.infer<typeof settleInvoiceFormSchema>>({
    resolver: zodResolver(settleInvoiceFormSchema),
    defaultValues: {
      hash: '',
      preimage: '',
    },
  });
  
  // Create HODL invoice
  const createInvoice = async (values: z.infer<typeof createInvoiceFormSchema>) => {
    try {
      // In a real implementation, this would use the createHodlInvoice function
      // For demo purposes, we'll just create a mock invoice
      
      // Generate a random preimage (32 bytes)
      const preimage = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (byte) => byte.toString(16).padStart(2, '0')
      ).join('');
      
      // Calculate SHA-256 hash of preimage (simplified for demo)
      const hash = preimage.split('').reverse().join('');
      
      const mockInvoice: HodlInvoice = {
        paymentRequest: `lnbc${values.amount}p1${hash.substring(0, 10)}`,
        preimage,
        hash,
        amount: values.amount,
        expirySeconds: values.expirySeconds,
        createdAt: Math.floor(Date.now() / 1000),
        description: values.description,
        status: 'pending',
      };
      
      setCreatedInvoice(mockInvoice);
      
      toast({
        title: 'HODL Invoice Created',
        description: `Successfully created a HODL invoice for ${values.amount} sats`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create HODL invoice',
        variant: 'destructive',
      });
    }
  };
  
  // Pay HODL invoice
  const payInvoice = async (values: z.infer<typeof payInvoiceFormSchema>) => {
    try {
      // In a real implementation, this would use the payHodlInvoice function
      // For demo purposes, we'll just simulate a pending payment
      
      setPaymentStatus('pending');
      
      toast({
        title: 'Payment Initiated',
        description: 'Your payment is in a pending state until the merchant releases it',
      });
      
      // Reset form
      payInvoiceForm.reset();
    } catch (error) {
      setPaymentStatus('failed');
      
      toast({
        title: 'Error',
        description: 'Failed to pay invoice',
        variant: 'destructive',
      });
    }
  };
  
  // Settle HODL invoice
  const settleInvoice = async (values: z.infer<typeof settleInvoiceFormSchema>) => {
    try {
      // In a real implementation, this would use the settleHodlInvoice function
      // For demo purposes, we'll just simulate a successful settlement
      
      setSettledInvoice(values.hash);
      
      toast({
        title: 'Invoice Settled',
        description: 'Successfully settled the HODL invoice by revealing the preimage',
      });
      
      // Reset form
      settleInvoiceForm.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to settle invoice',
        variant: 'destructive',
      });
    }
  };
  
  // Copy payment request to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">HODL Invoices</h1>
      <p className="text-muted-foreground mb-8">
        Create and use time-locked Lightning invoices that only complete when the merchant releases them.
      </p>
      
      <Alert className="mb-8">
        <IconBolt className="h-4 w-4" />
        <AlertTitle>Lightning Node</AlertTitle>
        <AlertDescription>
          Connected to node: {process.env.NEXT_PUBLIC_LIGHTNING_NODE_URL || 'https://localhost:10009'}
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="create">Create HODL Invoice</TabsTrigger>
          <TabsTrigger value="pay">Pay Invoice</TabsTrigger>
          <TabsTrigger value="settle">Settle Invoice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCoin size={20} />
                Create HODL Invoice
              </CardTitle>
              <CardDescription>
                Create an invoice that will remain pending until you explicitly release it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createInvoiceForm}>
                <form onSubmit={createInvoiceForm.handleSubmit(createInvoice)} className="space-y-4">
                  <FormField
                    control={createInvoiceForm.control}
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
                    control={createInvoiceForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Description or purpose of the invoice"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createInvoiceForm.control}
                    name="expirySeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={60}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          How long the invoice will be valid for (86400 = 24 hours)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Create HODL Invoice</Button>
                </form>
              </Form>
              
              {createdInvoice && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Created HODL Invoice:</h3>
                  <div className="space-y-3 text-sm">
                    <div><span className="font-medium">Amount:</span> {createdInvoice.amount} sats</div>
                    <div><span className="font-medium">Description:</span> {createdInvoice.description}</div>
                    <div><span className="font-medium">Expires in:</span> {Math.floor(createdInvoice.expirySeconds / 3600)} hours</div>
                    
                    <div className="flex flex-col">
                      <span className="font-medium mb-1">Payment Request:</span>
                      <div className="flex items-center gap-2">
                        <code className="p-2 bg-background rounded text-xs break-all">
                          {createdInvoice.paymentRequest}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(createdInvoice.paymentRequest)}
                        >
                          <IconCopy size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="font-medium mb-1">Preimage (keep this secret!):</span>
                      <div className="flex items-center gap-2">
                        <code className="p-2 bg-background rounded text-xs break-all">
                          {createdInvoice.preimage}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(createdInvoice.preimage)}
                        >
                          <IconCopy size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="font-medium mb-1">Hash:</span>
                      <div className="flex items-center gap-2">
                        <code className="p-2 bg-background rounded text-xs break-all">
                          {createdInvoice.hash}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(createdInvoice.hash)}
                        >
                          <IconCopy size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pay">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconArrowRight size={20} />
                Pay HODL Invoice
              </CardTitle>
              <CardDescription>
                Pay a HODL invoice (payment will be pending until the merchant releases it)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...payInvoiceForm}>
                <form onSubmit={payInvoiceForm.handleSubmit(payInvoice)} className="space-y-4">
                  <FormField
                    control={payInvoiceForm.control}
                    name="paymentRequest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Request</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="lnbc..."
                            className="font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Paste the BOLT11 invoice here
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Pay Invoice</Button>
                </form>
              </Form>
              
              {paymentStatus && (
                <div className={`mt-6 p-4 border rounded-lg ${
                  paymentStatus === 'success' ? 'bg-green-950/20' : 
                  paymentStatus === 'pending' ? 'bg-yellow-950/20' : 
                  'bg-red-950/20'
                }`}>
                  <h3 className="font-medium mb-2">Payment Status:</h3>
                  {paymentStatus === 'success' ? (
                    <p className="text-green-500">Payment completed successfully!</p>
                  ) : paymentStatus === 'pending' ? (
                    <div className="space-y-2">
                      <p className="text-yellow-500 flex items-center gap-2">
                        <IconClock size={16} />
                        Payment is pending until the merchant reveals the preimage
                      </p>
                      <p className="text-sm text-muted-foreground">
                        The funds are locked but haven't been transferred yet. The merchant needs to
                        settle the invoice to complete the payment.
                      </p>
                    </div>
                  ) : (
                    <p className="text-red-500">Payment failed. Please try again.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settle">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBolt size={20} />
                Settle HODL Invoice
              </CardTitle>
              <CardDescription>
                Settle a HODL invoice by revealing the preimage (for merchants)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settleInvoiceForm}>
                <form onSubmit={settleInvoiceForm.handleSubmit(settleInvoice)} className="space-y-4">
                  <FormField
                    control={settleInvoiceForm.control}
                    name="hash"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Hash</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="The payment hash"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settleInvoiceForm.control}
                    name="preimage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preimage</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="The secret preimage that will release the payment"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This is the secret value that will release the held payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Settle Invoice</Button>
                </form>
              </Form>
              
              {settledInvoice && (
                <div className="mt-6 p-4 border rounded-lg bg-green-950/20">
                  <h3 className="font-medium mb-2">Settlement Result:</h3>
                  <p className="text-green-500">
                    Invoice <code className="text-xs bg-background/50 p-1 rounded">{settledInvoice.substring(0, 10)}...</code> has been successfully settled!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    The payment has been completed and the funds are now available.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 