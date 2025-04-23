"use client";

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  IconBolt, 
  IconCopy, 
  IconCoin, 
  IconArrowRight, 
  IconClock, 
  IconCheck, 
  IconX, 
  IconAlertCircle,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLockOpen,
  IconCode,
  IconShieldLock,
  IconArrowForward,
  IconRotate,
  IconReceipt,
  IconCoins,
  IconKey,
  IconCheckbox,
  IconHash,
  IconWallet,
  IconClockHour4,
  IconHistory,
  IconTrash
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  simulateHodlInvoice,
  createHodlInvoice,
  formatTimestamp,
  HodlInvoice,
  SimulationResult
} from '@/lib/services/lightning';

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

// Define invoice history interface
interface InvoiceHistory {
  id: string;
  createdAt: number;
  status: 'pending' | 'held' | 'settled' | 'canceled' | 'expired';
  amount: number;
  description: string;
  hash: string;
  preimage: string;
  paymentRequest: string;
}

export default function LightningPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('simulation');
  const [isLoading, setIsLoading] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  
  // Simulation state
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  // Manual process state
  const [createdInvoice, setCreatedInvoice] = useState<HodlInvoice | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'failed' | null>(null);
  
  // Track pending and settled invoices by hash
  const [pendingInvoices, setPendingInvoices] = useState<{[hash: string]: string}>({});
  const [settledInvoices, setSettledInvoices] = useState<{[hash: string]: boolean}>({});
  
  // History of created invoices
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Settlement animation states
  const [settleAnimationStage, setSettleAnimationStage] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  
  // Selected history invoice 
  const [selectedHistoryInvoice, setSelectedHistoryInvoice] = useState<InvoiceHistory | null>(null);
  
  // Add this near your other state variables
  const [showRawData, setShowRawData] = useState<{[key: string]: boolean}>({
    originalInvoice: false,
    heldInvoice: false,
    settledInvoice: false,
    canceledInvoice: false,
    expiredInvoice: false,
    failedSettlement: false
  });
  
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
  
  // Function to handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset forms when switching tabs
    if (value === 'create') {
      payInvoiceForm.reset();
      settleInvoiceForm.reset();
    } else if (value === 'pay') {
      createInvoiceForm.reset();
      settleInvoiceForm.reset();
    } else if (value === 'settle') {
      createInvoiceForm.reset();
      payInvoiceForm.reset();
    } else if (value === 'simulation') {
      createInvoiceForm.reset();
      payInvoiceForm.reset();
      settleInvoiceForm.reset();
    }
  };
  
  // Run a full HODL invoice simulation
  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const result = await simulateHodlInvoice();
      setSimulationResult(result);
      
      // Don't automatically set the created invoice - wait for explicit creation
      setCreatedInvoice(null);
      setPendingInvoices({});
      setSettledInvoices({});
      
      toast({
        title: 'Simulation Complete',
        description: 'HODL invoice lifecycle simulation completed successfully',
      });
    } catch {
      toast({
        title: 'Simulation Error',
        description: 'Failed to run HODL invoice simulation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create HODL invoice - Modified to track history
  const handleCreateInvoice = async (values: z.infer<typeof createInvoiceFormSchema>) => {
    try {
      // In a real implementation, this would use actual Lightning Network
      // For simulation, we'll create a mock invoice with a random hash
      
      // First, create a random preimage
      const preimageBytes = new Uint8Array(32);
      window.crypto.getRandomValues(preimageBytes);
      const preimage = Array.from(preimageBytes, byte => 
        byte.toString(16).padStart(2, '0')).join('');
      
      // For simulation, use a simplified hash calculation
      const mockHash = preimage.split('').reverse().join('');
      
      const invoice = createHodlInvoice(
        values.amount, 
        values.description, 
        mockHash, 
        values.expirySeconds
      );
      
      // Add the preimage to the invoice object for UI display
      const fullInvoice = {
        ...invoice,
        preimage: preimage // Store preimage for settlement
      };
      
      setCreatedInvoice(fullInvoice);
      
      // Add to invoice history
      const newInvoice: InvoiceHistory = {
        id: `inv_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: Date.now(),
        status: 'pending',
        amount: values.amount,
        description: values.description,
        hash: mockHash,
        preimage: preimage,
        paymentRequest: invoice.paymentRequest
      };
      
      setInvoiceHistory(prev => [newInvoice, ...prev]);
      
      // Auto-populate the settlement form fields
      settleInvoiceForm.setValue("hash", mockHash);
      
      toast({
        title: 'HODL Invoice Created',
        description: `Successfully created a HODL invoice for ${values.amount} sats`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create HODL invoice',
        variant: 'destructive',
      });
    }
  };
  
  // Pay HODL invoice - Modified for history tracking
  const handlePayInvoice = async (values: z.infer<typeof payInvoiceFormSchema>) => {
    try {
      const paymentRequest = values.paymentRequest;
      
      // Basic validation that it's a Lightning-style payment request
      if (!paymentRequest.startsWith('lnbc')) {
        toast({
          title: 'Invalid Payment Request',
          description: 'The payment request format is invalid',
          variant: 'destructive',
        });
        return;
      }
      
      // In simulation mode, just update the status
      setPaymentStatus('pending');
      
      // Find the invoice hash from the payment request
      // In a real implementation, this would decode the payment request
      // For simulation, look for invoices we created
      let invoiceHash = '';
      const matchedInvoice = invoiceHistory.find(inv => inv.paymentRequest === paymentRequest);
      
      // If we found it in history but not directly, update
      if (matchedInvoice && !invoiceHash) {
        invoiceHash = matchedInvoice.hash;
      }
      
      // If we still don't have it but have current invoice
      if (!invoiceHash && createdInvoice && createdInvoice.paymentRequest === paymentRequest) {
        invoiceHash = createdInvoice.hash;
      }
      
      // Store as a pending invoice
      if (invoiceHash) {
        setPendingInvoices(prev => ({
          ...prev,
          [invoiceHash]: paymentRequest
        }));
        
        // Update history status if found
        if (matchedInvoice) {
          setInvoiceHistory(prev => 
            prev.map(inv => inv.id === matchedInvoice?.id 
              ? {...inv, status: 'held'} 
              : inv
            )
          );
        }
      }
      
      toast({
        title: 'Payment Initiated',
        description: 'Your payment is in a pending state until the merchant reveals the preimage',
      });
      
      // Reset form
      payInvoiceForm.reset();
    } catch {
      setPaymentStatus('failed');
      
      toast({
        title: 'Error',
        description: 'Failed to pay invoice',
        variant: 'destructive',
      });
    }
  };
  
  // Settle HODL invoice - with animation and history updates
  const handleSettleInvoice = async (values: z.infer<typeof settleInvoiceFormSchema>) => {
    try {
      setIsLoading(true);
      setSettleAnimationStage('verifying');
      
      // Simulated verification delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In our simplified simulation, the hash should be the reverse of the preimage
      const providedPreimage = values.preimage;
      const providedHash = values.hash;
      const calculatedHash = providedPreimage.split('').reverse().join('');
      
      // Check if the invoice is in our pending list
      const isPending = pendingInvoices[providedHash] !== undefined;
      
      // Check if the hash matches what would be calculated from the preimage
      const hashMatches = calculatedHash === providedHash;
      
      // Find in history
      const matchedInvoice = invoiceHistory.find(inv => inv.hash === providedHash);
      
      if (hashMatches) {
        // Transition to success animation
        setSettleAnimationStage('success');
        setSettledInvoices(prev => ({
          ...prev,
          [providedHash]: true
        }));
        
        // Update history status if found
        if (matchedInvoice) {
          setInvoiceHistory(prev => 
            prev.map(inv => inv.hash === providedHash 
              ? {...inv, status: 'settled'} 
              : inv
            )
          );
        }
        
        // If this was a pending invoice, update payment status to success
        if (isPending) {
          setPaymentStatus('success');
        }
      
      toast({
        title: 'Invoice Settled',
        description: 'Successfully settled the HODL invoice by revealing the correct preimage',
      });
      
        // Don't reset form immediately, let user see what they entered
        setTimeout(() => {
      settleInvoiceForm.reset();
          setSettleAnimationStage('idle');
        }, 3000);
      } else {
        // Transition to error animation
        setSettleAnimationStage('error');
        
        setTimeout(() => {
          setSettleAnimationStage('idle');
        }, 2000);
        
        toast({
          title: 'Settlement Failed',
          description: 'The provided preimage does not match the invoice hash',
          variant: 'destructive',
        });
        // Don't reset the form on failure to let user correct their input
      }
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      setSettleAnimationStage('error');
      
      setTimeout(() => {
        setSettleAnimationStage('idle');
      }, 2000);
      
      toast({
        title: 'Error',
        description: 'Failed to settle invoice',
        variant: 'destructive',
      });
    }
  };
  
  // Function to handle a specific invoice from history
  const handleHistoryInvoice = (invoice: InvoiceHistory, purpose: 'pay' | 'settle') => {
    setSelectedHistoryInvoice(invoice);
    
    if (purpose === 'pay') {
      payInvoiceForm.setValue("paymentRequest", invoice.paymentRequest);
      setActiveTab('pay');
    } else {
      settleInvoiceForm.setValue("hash", invoice.hash);
      settleInvoiceForm.setValue("preimage", invoice.preimage);
      setActiveTab('settle');
    }
    
    toast({
      title: 'Invoice Loaded',
      description: 'The selected invoice details have been loaded',
    });
  };
  
  // Function to clear invoice history
  const clearInvoiceHistory = () => {
    setInvoiceHistory([]);
    toast({
      title: 'History Cleared',
      description: 'Your invoice history has been cleared',
    });
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };
  
  // Apply preimage to settlement form
  const usePreimageForSettlement = () => {
    if (!createdInvoice?.preimage || !createdInvoice?.hash) {
      toast({
        title: 'No Invoice Data',
        description: 'Create an invoice first to get the preimage',
        variant: 'destructive',
      });
      return;
    }
    
    // Set the values in the settlement form
    settleInvoiceForm.setValue("hash", createdInvoice.hash);
    settleInvoiceForm.setValue("preimage", createdInvoice.preimage);
    
    // Switch to the settlement tab
    setActiveTab('settle');
    
    toast({
      title: 'Preimage Applied',
      description: 'Invoice details have been applied to the settlement form',
    });
  };
  
  // Helper to check if an invoice has been settled
  const isInvoiceSettled = (hash: string) => {
    return settledInvoices[hash] === true;
  };
  
  // Add a useEffect to check for settled invoices
  useEffect(() => {
    // If we have pending invoices and any of them are settled, update payment status
    if (paymentStatus === 'pending' && Object.keys(pendingInvoices).some(hash => isInvoiceSettled(hash))) {
      setPaymentStatus('success');
    }
  }, [pendingInvoices, settledInvoices, paymentStatus]);
  
  // Modify renderDetailedView to include a toggle for raw data
  const renderDetailedView = (invoice: HodlInvoice, invoiceType: string) => {
    if (!invoice) return null;
    
    const toggleRawView = () => {
      setShowRawData(prev => ({
        ...prev,
        [invoiceType]: !prev[invoiceType]
      }));
    };
    
    if (showRawData[invoiceType]) {
      return (
        <div className="space-y-3">
          <div className="flex justify-end mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleRawView}
              className="text-xs"
            >
              <IconEye size={14} className="mr-1" />
              Show Formatted View
            </Button>
          </div>
          <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs whitespace-pre-wrap">
            {JSON.stringify(invoice, null, 2)}
          </pre>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleRawView}
            className="text-xs"
          >
            <IconCode size={14} className="mr-1" />
            View Raw JSON
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 border rounded-md">
            <h4 className="text-sm font-medium mb-1">Basic Information</h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono truncate max-w-[180px]">{invoice.id.substring(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span>{invoice.amount} sats</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                {renderStatusBadge(invoice.status)}
              </div>
            </div>
          </div>
          
          <div className="p-3 border rounded-md">
            <h4 className="text-sm font-medium mb-1">Timing Information</h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatTimestamp(invoice.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires:</span>
                <span>{formatTimestamp(invoice.expiresAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{Math.floor((invoice.expiresAt - invoice.createdAt) / 60)} minutes</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-3 border rounded-md">
          <h4 className="text-sm font-medium mb-1">Cryptographic Information</h4>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Payment Request:</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => copyToClipboard(invoice.paymentRequest)}
                >
                  <IconCopy size={12} className="mr-1" />
                  Copy
                </Button>
              </div>
              <code className="text-xs bg-muted p-1 rounded block mt-1 overflow-hidden truncate">
                {invoice.paymentRequest}
              </code>
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Hash:</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => copyToClipboard(invoice.hash)}
                >
                  <IconCopy size={12} className="mr-1" />
                  Copy
                </Button>
              </div>
              <code className="text-xs bg-muted p-1 rounded block mt-1 overflow-hidden truncate">
                {invoice.hash}
              </code>
            </div>
            
            {invoice.preimage && (
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Preimage:</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => copyToClipboard(invoice.preimage)}
                  >
                    <IconCopy size={12} className="mr-1" />
                    Copy
                  </Button>
                </div>
                <code className="text-xs bg-muted p-1 rounded block mt-1 overflow-hidden truncate">
                  {invoice.preimage}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Animation classes
  const fadeIn = "transition-opacity duration-500 ease-in-out";
  const slideIn = "transition-all duration-300 ease-in-out";
  const spin = "animate-spin";
  const pulse = "animate-pulse";
  const expandIn = "transition-all duration-500 ease-out scale-95 animate-in zoom-in-95";
  const glowEffect = "transition-all duration-300 hover:shadow-md hover:shadow-primary/20";
  const slideFromRight = "animate-in slide-in-from-right duration-500";
  const slideFromLeft = "animate-in slide-in-from-left duration-500";
  const zoomIn = "animate-in zoom-in-50 duration-500";
  const shimmer = "animate-shimmer bg-gradient-to-r from-transparent via-muted/20 to-transparent bg-[length:400%_100%]";
  
  // Status badges
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-1"><IconClock size={12} className={pulse} /> Pending</Badge>;
      case 'held':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 flex items-center gap-1"><IconLock size={12} /> Held</Badge>;
      case 'settled':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1"><IconCheck size={12} /> Settled</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 flex items-center gap-1"><IconX size={12} /> Canceled</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><IconAlertCircle size={12} /> Unknown</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">HODL Invoices</h1>
      <p className="text-muted-foreground mb-8">
        Create and use time-locked Lightning invoices that only complete when the merchant releases them.
      </p>
      
      <Alert className="mb-8">
        <IconBolt className="h-4 w-4" />
        <AlertTitle>Lightning Simulation</AlertTitle>
        <AlertDescription>
          This is a simulation environment. No actual Lightning Network node is required.
        </AlertDescription>
      </Alert>
      
      {/* Invoice History Section */}
      {invoiceHistory.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <IconHistory size={18} />
              Invoice History
            </h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? <IconEyeOff size={14} className="mr-1" /> : <IconEye size={14} className="mr-1" />}
                {showHistory ? 'Hide History' : 'Show History'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearInvoiceHistory}
                className="text-red-500 hover:text-red-600"
              >
                <IconTrash size={14} className="mr-1" />
                Clear
              </Button>
            </div>
          </div>
          
          {showHistory && (
            <div className={`border rounded-lg overflow-hidden ${slideIn}`}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-xs font-medium text-left p-3">Status</th>
                      <th className="text-xs font-medium text-left p-3">Amount</th>
                      <th className="text-xs font-medium text-left p-3">Description</th>
                      <th className="text-xs font-medium text-left p-3">Created</th>
                      <th className="text-xs font-medium text-left p-3">Hash (short)</th>
                      <th className="text-xs font-medium text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceHistory.map((invoice, index) => (
                      <tr key={invoice.id} className={`border-t ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                        <td className="p-3">
                          {renderStatusBadge(invoice.status)}
                        </td>
                        <td className="p-3 font-mono text-xs">{invoice.amount} sats</td>
                        <td className="p-3 text-sm truncate max-w-xs">{invoice.description}</td>
                        <td className="p-3 text-xs text-muted-foreground">{new Date(invoice.createdAt).toLocaleString()}</td>
                        <td className="p-3 font-mono text-xs truncate">{invoice.hash.substring(0, 8)}...</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => handleHistoryInvoice(invoice, 'pay')}
                              disabled={invoice.status === 'settled'}
                            >
                              <IconWallet size={14} className="text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => handleHistoryInvoice(invoice, 'settle')}
                              disabled={invoice.status === 'settled' || invoice.status === 'canceled'}
                            >
                              <IconKey size={14} className="text-amber-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="create">Create Invoice</TabsTrigger>
          <TabsTrigger value="pay">Pay Invoice</TabsTrigger>
          <TabsTrigger value="settle">Settle Invoice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="simulation" className={fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBolt size={20} />
                HODL Invoice Lifecycle Simulation
              </CardTitle>
              <CardDescription>
                Generate a complete simulation demonstrating the HODL invoice lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between">
                  <Button 
                    onClick={runSimulation}
                    disabled={isLoading}
                    className="relative"
                  >
                    {isLoading ? (
                      <>
                        <IconClock size={16} className={`mr-2 ${spin}`} />
                        Generating...
                      </>
                    ) : (
                      'Generate Simulation'
                    )}
                  </Button>
                  
                  {simulationResult && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowFullDetails(!showFullDetails)}
                      className="ml-2"
                    >
                      {showFullDetails ? <IconEyeOff size={16} className="mr-1" /> : <IconEye size={16} className="mr-1" />}
                      {showFullDetails ? 'Hide Full Details' : 'Show Full Details'}
                    </Button>
                  )}
                </div>
                
                {simulationResult && (
                  <div className={`mt-6 space-y-6 ${fadeIn} opacity-0 animate-in`} style={{ opacity: 1 }}>
                    {/* Summary */}
                    <div className="p-4 border rounded-lg bg-muted/20">
                      <h3 className="text-lg font-bold mb-4">HODL Invoice Lifecycle</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                        <div className={`p-3 border rounded-lg ${slideIn} hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all duration-300`}>
                          <div className="text-yellow-500 flex justify-center mb-2">
                            <IconCoin size={24} />
                          </div>
                          <h4 className="font-medium mb-1">1. Created</h4>
                          {renderStatusBadge('pending')}
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <IconArrowRight className="text-muted-foreground" />
                        </div>
                        
                        <div className={`p-3 border rounded-lg ${slideIn} hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300`}>
                          <div className="text-blue-500 flex justify-center mb-2">
                            <IconLock size={24} />
                          </div>
                          <h4 className="font-medium mb-1">2. Paid & Held</h4>
                          {renderStatusBadge('held')}
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <IconArrowRight className="text-muted-foreground" />
                        </div>
                        
                        <div className={`p-3 border rounded-lg ${slideIn} hover:border-green-500/50 hover:bg-green-500/10 transition-all duration-300`}>
                          <div className="text-green-500 flex justify-center mb-2">
                            <IconLockOpen size={24} />
                          </div>
                          <h4 className="font-medium mb-1">3. Settled</h4>
                          {renderStatusBadge(simulationResult.settledInvoice.status)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg bg-yellow-500/10">
                        <h3 className="font-bold flex items-center">
                          <IconCoin size={18} className="mr-2 text-yellow-500" />
                          Original Invoice
                        </h3>
                        <div className="mt-2 text-sm">
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Status:</span>
                            {renderStatusBadge(simulationResult.originalInvoice.status)}
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Amount:</span>
                            <span>{simulationResult.originalInvoice.amount} sats</span>
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Description:</span>
                            <span>{simulationResult.originalInvoice.description}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-blue-500/10">
                        <h3 className="font-bold flex items-center">
                          <IconLock size={18} className="mr-2 text-blue-500" />
                          Held Invoice
                        </h3>
                        <div className="mt-2 text-sm">
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Status:</span>
                            {renderStatusBadge(simulationResult.heldInvoice.status)}
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Payment:</span>
                            <span>Payment held in escrow</span>
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Preimage Revealed:</span>
                            <span>No</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-green-500/10">
                        <h3 className="font-bold flex items-center">
                          <IconCheck size={18} className="mr-2 text-green-500" />
                          Settled Invoice
                        </h3>
                        <div className="mt-2 text-sm">
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Status:</span>
                            {renderStatusBadge(simulationResult.settledInvoice.status)}
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Preimage Revealed:</span>
                            <span>Yes (correct preimage)</span>
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Settlement:</span>
                            <span>Funds released to recipient</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-red-500/10">
                        <h3 className="font-bold flex items-center">
                          <IconX size={18} className="mr-2 text-red-500" />
                          Canceled Invoice
                        </h3>
                        <div className="mt-2 text-sm">
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Status:</span>
                            {renderStatusBadge(simulationResult.canceledInvoice.status)}
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Result:</span>
                            <span>Payment returned to sender</span>
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="font-medium">Reason:</span>
                            <span>Merchant canceled payment</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Failed Settlement */}
                    <div className="p-4 border rounded-lg bg-muted/20">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold flex items-center">
                          <IconAlertCircle size={18} className="mr-2 text-amber-500" />
                          Failed Settlement Attempt
                        </h3>
                        {showFullDetails && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowRawData(prev => ({ ...prev, failedSettlement: !prev.failedSettlement }))}
                            className="text-xs"
                          >
                            {showRawData.failedSettlement ? 
                              <><IconEye size={14} className="mr-1" />Show Formatted View</> : 
                              <><IconCode size={14} className="mr-1" />View Raw JSON</>}
                          </Button>
                        )}
                      </div>
                      
                      {showRawData.failedSettlement && showFullDetails ? (
                        <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs whitespace-pre-wrap">
                          {JSON.stringify(simulationResult.failedSettlement, null, 2)}
                        </pre>
                      ) : (
                        <>
                          <p className="text-sm mb-4">
                            When a merchant tries to settle with an incorrect preimage, the payment remains held.
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 border rounded-lg bg-muted/20">
                              <h4 className="font-medium text-sm mb-2">Provided Preimage:</h4>
                              <code className="text-xs bg-background/50 p-2 rounded block truncate">
                                {simulationResult.preimageAndHash.preimage.substring(0, 16)}...
                              </code>
                            </div>
                            <div className="p-3 border rounded-lg bg-muted/20">
                              <h4 className="font-medium text-sm mb-2">Random Wrong Preimage:</h4>
                              <code className="text-xs bg-background/50 p-2 rounded block truncate text-red-500">
                                (incorrect preimage attempted)
                              </code>
                            </div>
                            <div className="p-3 border rounded-lg bg-muted/20">
                              <h4 className="font-medium text-sm mb-2">Status After Correct Preimage:</h4>
                              {renderStatusBadge('settled')}
                            </div>
                            <div className="p-3 border rounded-lg bg-muted/20">
                              <h4 className="font-medium text-sm mb-2">Status After Wrong Preimage:</h4>
                              {renderStatusBadge('held')}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Key Concepts */}
                    <Accordion type="single" collapsible className="border rounded-lg">
                      <AccordionItem value="preimage">
                        <AccordionTrigger className="px-4">
                          <span className="text-md font-medium">Preimage & Hash</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <p className="text-sm mb-3">
                            The preimage is a cryptographic secret known only to the merchant. 
                            The hash of this preimage is used to create the HODL invoice. When 
                            the merchant reveals the correct preimage, it proves they are authorized 
                            to receive the payment.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className="p-2 rounded bg-muted/20">
                              <h5 className="text-sm font-medium mb-1">Original Preimage:</h5>
                              <code className="text-xs p-1 bg-background rounded block overflow-hidden truncate">
                                {simulationResult.preimageAndHash.preimage}
                              </code>
                            </div>
                            <div className="p-2 rounded bg-muted/20">
                              <h5 className="text-sm font-medium mb-1">Hash:</h5>
                              <code className="text-xs p-1 bg-background rounded block overflow-hidden truncate">
                                {simulationResult.preimageAndHash.hash}
                              </code>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="hodl">
                        <AccordionTrigger className="px-4">
                          <span className="text-md font-medium">How HODL Invoices Work</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <ol className="list-decimal list-inside text-sm space-y-2">
                            <li><strong>Creation:</strong> Merchant creates a HODL invoice with a secret preimage</li>
                            <li><strong>Payment:</strong> Customer pays the invoice, but funds are held in escrow</li>
                            <li><strong>Service/Delivery:</strong> Merchant provides goods or services</li>
                            <li><strong>Settlement:</strong> Merchant reveals the preimage to release the funds</li>
                            <li><strong>Alternative:</strong> If there&apos;s a dispute, the payment can be canceled</li>
                          </ol>
                          <p className="mt-3 text-sm">
                            HODL invoices are perfect for escrow use cases where you want to ensure both 
                            parties fulfill their obligations before funds are released.
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    
                    {/* Full Details JSON */}
                    {showFullDetails && (
                      <div className="mt-4 space-y-4">
                        <h3 className="font-medium">Full Invoice Details:</h3>
                        
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="originalInvoice">
                            <AccordionTrigger className="text-sm font-medium">
                              Original Invoice
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderDetailedView(simulationResult.originalInvoice, 'originalInvoice')}
                            </AccordionContent>
                          </AccordionItem>
                          
                          <AccordionItem value="heldInvoice">
                            <AccordionTrigger className="text-sm font-medium">
                              Held Invoice
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderDetailedView(simulationResult.heldInvoice, 'heldInvoice')}
                            </AccordionContent>
                          </AccordionItem>
                          
                          <AccordionItem value="settledInvoice">
                            <AccordionTrigger className="text-sm font-medium">
                              Settled Invoice
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderDetailedView(simulationResult.settledInvoice, 'settledInvoice')}
                            </AccordionContent>
                          </AccordionItem>
                          
                          <AccordionItem value="canceledInvoice">
                            <AccordionTrigger className="text-sm font-medium">
                              Canceled Invoice
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderDetailedView(simulationResult.canceledInvoice, 'canceledInvoice')}
                            </AccordionContent>
                          </AccordionItem>
                          
                          <AccordionItem value="expiredInvoice">
                            <AccordionTrigger className="text-sm font-medium">
                              Expired Invoice
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderDetailedView(simulationResult.expiredInvoice, 'expiredInvoice')}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <Card className={slideIn}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCoins size={20} />
                Create HODL Invoice
              </CardTitle>
              <CardDescription>
                Create an invoice that will remain pending until you explicitly release it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createInvoiceForm}>
                <form onSubmit={createInvoiceForm.handleSubmit(handleCreateInvoice)} className="space-y-4">
                  <FormField
                    control={createInvoiceForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <IconCoins size={14} className="text-muted-foreground" />
                          Amount (sats)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            className={glowEffect}
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
                        <FormLabel className="flex items-center gap-1">
                          <IconReceipt size={14} className="text-muted-foreground" />
                          Description
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Description or purpose of the invoice"
                            className={glowEffect}
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
                        <FormLabel className="flex items-center gap-1">
                          <IconClockHour4 size={14} className="text-muted-foreground" />
                          Expiry (seconds)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={60}
                            className={glowEffect}
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
                  
                  <Button type="submit" className="w-full">
                    <IconRotate size={16} className="mr-1" />
                    Create HODL Invoice
                  </Button>
                </form>
              </Form>
              
              {createdInvoice && (
                <div className={`mt-6 border rounded-lg overflow-hidden ${expandIn}`}>
                  <div className="bg-primary/5 p-3 border-b">
                    <h3 className="font-medium flex items-center gap-2">
                      <IconReceipt size={18} className="text-primary" />
                      Created HODL Invoice
                    </h3>
                  </div>
                  
                  <div className="p-3 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-2 bg-muted/30 rounded-md flex flex-col justify-between">
                        <span className="text-xs text-muted-foreground">Amount</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-bold">{createdInvoice.amount}</span>
                          <span className="text-xs">sats</span>
                        </div>
                      </div>
                      
                      <div className="p-2 bg-muted/30 rounded-md flex flex-col justify-between">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <div className="mt-1">
                          {renderStatusBadge('pending')}
                        </div>
                      </div>
                      
                      <div className="p-2 bg-muted/30 rounded-md flex flex-col justify-between">
                        <span className="text-xs text-muted-foreground">Expires</span>
                        <div className="flex items-center gap-1 mt-1">
                          <IconClock size={14} />
                          <span className="text-sm">{formatTimestamp(createdInvoice.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium flex items-center gap-1">
                          <IconShieldLock size={14} />
                          Payment Security Details
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <IconKey size={14} /> 
                              Preimage (secret key)
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => copyToClipboard(createdInvoice.preimage)}
                            >
                              <IconCopy size={12} className="mr-1" />
                              Copy
                            </Button>
                          </div>
                          <div className="flex items-center">
                            <code className="text-xs bg-muted p-1.5 rounded block w-full overflow-hidden truncate font-mono">
                              {createdInvoice.preimage}
                        </code>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <IconHash size={14} /> 
                              Payment Hash
                            </span>
                        <Button
                              variant="ghost" 
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => copyToClipboard(createdInvoice.hash)}
                            >
                              <IconCopy size={12} className="mr-1" />
                              Copy
                        </Button>
                          </div>
                          <div className="flex items-center">
                            <code className="text-xs bg-muted p-1.5 rounded block w-full overflow-hidden truncate font-mono">
                              {createdInvoice.hash}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                        <IconBolt size={14} />
                        Payment Request
                      </h4>
                      <div className="flex">
                        <code className="p-2 bg-primary/5 rounded-l text-xs break-all flex-grow font-mono border-y border-l">
                          {createdInvoice.paymentRequest}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-l-none border-l-0"
                          onClick={() => copyToClipboard(createdInvoice.paymentRequest)}
                        >
                          <IconCopy size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            payInvoiceForm.setValue("paymentRequest", createdInvoice.paymentRequest);
                            setActiveTab("pay");
                          }}
                        >
                          <IconWallet size={14} className="mr-1" />
                          Pay This Invoice
                        </Button>
                        
                        <Button 
                          className={`w-full ${slideFromRight}`}
                          onClick={usePreimageForSettlement}
                        >
                          <IconKey size={14} className="mr-1" />
                          Use For Settlement
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
          <Card className={slideIn}>
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
                <form onSubmit={payInvoiceForm.handleSubmit(handlePayInvoice)} className="space-y-4">
                  <FormField
                    control={payInvoiceForm.control}
                    name="paymentRequest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <IconBolt size={14} className="text-muted-foreground" />
                          Payment Request
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                          <Textarea
                            placeholder="lnbc..."
                            className="font-mono text-xs"
                            {...field}
                          />
                            {createdInvoice && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                className="whitespace-nowrap"
                                onClick={() => {
                                  field.onChange(createdInvoice.paymentRequest);
                                }}
                              >
                                <IconReceipt size={14} className="mr-1" />
                                Use Created Invoice
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Paste the BOLT11 invoice here
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    <IconArrowForward size={16} className="mr-1" />
                    Pay Invoice
                  </Button>
                </form>
              </Form>
              
              {paymentStatus && (
                <div className={`mt-6 ${expandIn} overflow-hidden rounded-lg border ${
                  paymentStatus === 'success' ? 'border-green-500/30' : 
                  paymentStatus === 'pending' ? 'border-yellow-500/30' : 
                  'border-red-500/30'
                }`}>
                  <div className={`p-3 ${
                    paymentStatus === 'success' ? 'bg-green-500/10' : 
                    paymentStatus === 'pending' ? 'bg-yellow-500/10' : 
                    'bg-red-500/10'
                  }`}>
                    <h3 className="font-medium">Payment Status</h3>
                  </div>
                  
                  <div className="p-4">
                  {paymentStatus === 'success' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-green-500/20 rounded-full p-2">
                            <IconCheck size={18} className="text-green-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">Payment Completed Successfully!</h4>
                            <p className="text-sm text-muted-foreground">The merchant has settled the invoice and received the payment.</p>
                          </div>
                        </div>
                        
                        <div className={`py-3 ${slideFromLeft}`}>
                          <div className="relative">
                            <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-green-500/50 to-green-500/10 ml-3"></div>
                            <ol className="space-y-5 relative">
                              <li className="ml-7 relative">
                                <div className="absolute -left-[29px] bg-green-500 rounded-full border-4 border-background p-1">
                                  <IconBolt size={12} className="text-white" />
                                </div>
                                <h5 className="text-sm font-medium">Invoice Created</h5>
                                <p className="text-xs text-muted-foreground">The payment invoice was generated by the merchant</p>
                              </li>
                              <li className="ml-7 relative">
                                <div className="absolute -left-[29px] bg-green-500 rounded-full border-4 border-background p-1">
                                  <IconWallet size={12} className="text-white" />
                                </div>
                                <h5 className="text-sm font-medium">Payment Sent</h5>
                                <p className="text-xs text-muted-foreground">You&apos;ve sent the payment which was held in escrow</p>
                              </li>
                              <li className="ml-7 relative">
                                <div className="absolute -left-[29px] bg-green-500 rounded-full border-4 border-background p-1">
                                  <IconKey size={12} className="text-white" />
                                </div>
                                <h5 className="text-sm font-medium">Preimage Revealed</h5>
                                <p className="text-xs text-muted-foreground">The merchant revealed the secret preimage to claim the funds</p>
                              </li>
                              <li className="ml-7 relative">
                                <div className="absolute -left-[29px] bg-green-500 rounded-full border-4 border-background p-1">
                                  <IconCheck size={12} className="text-white" />
                                </div>
                                <h5 className="text-sm font-medium">Payment Completed</h5>
                                <p className="text-xs text-muted-foreground">The payment has been fully settled</p>
                              </li>
                            </ol>
                          </div>
                        </div>
                        
                        <div className="bg-muted/40 p-3 rounded-lg">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <IconCheckbox size={14} className="text-green-500" />
                            Settlement Details
                          </h4>
                          <div className="grid grid-cols-2 gap-y-1 text-sm">
                            <div className="text-muted-foreground">Transaction ID:</div>
                            <div className="font-mono text-xs truncate">tx_hodl_{Math.random().toString(36).substr(2, 9)}</div>
                            <div className="text-muted-foreground">Settled at:</div>
                            <div>{new Date().toLocaleTimeString()}</div>
                            <div className="text-muted-foreground">Network fee:</div>
                            <div>~1 sat</div>
                          </div>
                        </div>
                      </div>
                  ) : paymentStatus === 'pending' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-yellow-500/20 rounded-full p-2">
                            <IconClock size={18} className={`text-yellow-500 ${pulse}`} />
                          </div>
                          <div>
                            <h4 className="font-medium">Payment is in Pending State</h4>
                            <p className="text-sm text-muted-foreground">The payment will remain in escrow until the merchant reveals the preimage</p>
                          </div>
                        </div>
                        
                        <div className={`py-3 ${slideFromLeft}`}>
                          <div className="relative">
                            <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-yellow-500/50 to-yellow-500/10 ml-3"></div>
                            <ol className="space-y-5 relative">
                              <li className="ml-7 relative">
                                <div className="absolute -left-[29px] bg-green-500 rounded-full border-4 border-background p-1">
                                  <IconBolt size={12} className="text-white" />
                                </div>
                                <h5 className="text-sm font-medium">Invoice Created</h5>
                                <p className="text-xs text-muted-foreground">The payment invoice was generated by the merchant</p>
                              </li>
                              <li className="ml-7 relative">
                                <div className="absolute -left-[29px] bg-green-500 rounded-full border-4 border-background p-1">
                                  <IconWallet size={12} className="text-white" />
                                </div>
                                <h5 className="text-sm font-medium">Payment Sent</h5>
                                <p className="text-xs text-muted-foreground">You&apos;ve sent the payment which is now held in escrow</p>
                              </li>
                              <li className="ml-7 relative">
                                <div className="absolute -left-[29px] bg-yellow-500 rounded-full border-4 border-background p-1">
                                  <IconClock size={12} className={`text-white ${pulse}`} />
                                </div>
                                <h5 className="text-sm font-medium">Awaiting Preimage</h5>
                                <p className="text-xs text-muted-foreground">Waiting for merchant to reveal the secret preimage</p>
                              </li>
                              <li className="ml-7 relative">
                                <div className="absolute -left-[29px] bg-muted rounded-full border-4 border-background p-1">
                                  <IconCheck size={12} className="text-muted-foreground" />
                                </div>
                                <h5 className="text-sm font-medium text-muted-foreground">Payment Incomplete</h5>
                                <p className="text-xs text-muted-foreground">The payment has not been settled yet</p>
                              </li>
                            </ol>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-lg">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <IconLock size={14} className="text-yellow-500" />
                            HODL Invoice Escrow
                          </h4>
                          <p className="text-xs mb-2">
                            Your payment is secured in escrow. The funds will only be released when:
                          </p>
                          <ul className="text-xs space-y-1 list-disc pl-5">
                            <li>The merchant reveals the correct preimage (payment completes)</li>
                            <li>The invoice expires or is canceled (funds returned to you)</li>
                          </ul>
                        </div>
                        
                        {Object.keys(pendingInvoices).some(hash => isInvoiceSettled(hash)) && (
                          <div className={`p-3 bg-green-100 dark:bg-green-900/20 rounded-lg ${zoomIn}`}>
                            <p className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                              <IconCheck size={14} /> 
                              A pending invoice has been settled!
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-xs text-green-600/70 dark:text-green-400/70">
                                Refresh the status to see the updated payment details
                              </p>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs border-green-500/30 text-green-600"
                                onClick={() => setActiveTab('pay')}
                              >
                                <IconRotate size={12} className="mr-1" />
                                Refresh Status
                              </Button>
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-red-500/20 rounded-full p-2">
                            <IconX size={18} className="text-red-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">Payment Failed</h4>
                            <p className="text-sm text-muted-foreground">The payment could not be processed. Please check the invoice and try again.</p>
                          </div>
                        </div>
                        
                        <div className="bg-muted/40 p-3 rounded-lg">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <IconAlertCircle size={14} className="text-red-500" />
                            Error Details
                          </h4>
                          <div className="text-sm">
                            <p>The payment request may be invalid or expired. Please obtain a new invoice from the merchant.</p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => {
                            payInvoiceForm.reset();
                            setPaymentStatus(null);
                          }}
                        >
                          <IconRotate size={14} className="mr-1" />
                          Try Again
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settle">
          <Card className={slideIn}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBolt size={20} />
                Settle HODL Invoice
              </CardTitle>
              <CardDescription>
                Settle a HODL invoice by revealing the preimage (for merchants)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary/5 rounded-lg p-3">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <IconShieldLock size={16} className="mr-1 text-primary" />
                  Settlement Process Information
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  When you settle a HODL invoice, you reveal the preimage (secret) that matches the payment hash.
                  This cryptographically proves you&apos;re authorized to claim the funds, which will be released from escrow.
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-muted/30 rounded flex flex-col items-center">
                    <IconLock size={16} className="mb-1 text-blue-500" />
                    <span className="font-medium">1. Funds Held</span>
                    <span className="text-center text-muted-foreground">Payment in escrow</span>
                  </div>
                  <div className="p-2 bg-muted/30 rounded flex flex-col items-center">
                    <IconKey size={16} className="mb-1 text-amber-500" />
                    <span className="font-medium">2. Reveal Preimage</span>
                    <span className="text-center text-muted-foreground">Share the secret</span>
                  </div>
                  <div className="p-2 bg-muted/30 rounded flex flex-col items-center">
                    <IconCoins size={16} className="mb-1 text-green-500" />
                    <span className="font-medium">3. Funds Released</span>
                    <span className="text-center text-muted-foreground">Payment settled</span>
                  </div>
                </div>
              </div>
              
              {selectedHistoryInvoice && (
                <div className={`p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 ${zoomIn}`}>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <IconReceipt size={14} className="text-blue-600" />
                      Using Invoice from History
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedHistoryInvoice(null)}
                      className="h-6 text-xs"
                    >
                      <IconX size={12} className="mr-1" />
                      Clear
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium ml-1">{selectedHistoryInvoice.amount} sats</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium ml-1">{new Date(selectedHistoryInvoice.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Description:</span>
                      <span className="font-medium ml-1">{selectedHistoryInvoice.description}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-1">{renderStatusBadge(selectedHistoryInvoice.status)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Verification Animation */}
              {settleAnimationStage !== 'idle' && (
                <div className={`border rounded-lg p-4 ${zoomIn}`}>
                  {settleAnimationStage === 'verifying' && (
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className={`w-16 h-16 rounded-full border-4 border-t-primary ${spin} mb-4`}></div>
                      <h3 className="text-lg font-medium mb-1">Verifying Preimage</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        Checking cryptographic proof and releasing funds...
                      </p>
                      
                      <div className="w-full max-w-md h-2 bg-muted/30 rounded-full mt-6 overflow-hidden">
                        <div className={`h-full bg-primary ${shimmer}`} style={{width: '60%'}}></div>
                      </div>
                    </div>
                  )}
                  
                  {settleAnimationStage === 'success' && (
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                        <IconCheck size={32} className="text-green-500" />
                      </div>
                      <h3 className="text-lg font-medium mb-1 text-green-600">Verification Successful</h3>
                      <p className="text-sm text-center">
                        Preimage matched the hash. Funds have been released from escrow.
                      </p>
                    </div>
                  )}
                  
                  {settleAnimationStage === 'error' && (
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                        <IconX size={32} className="text-red-500" />
                      </div>
                      <h3 className="text-lg font-medium mb-1 text-red-600">Verification Failed</h3>
                      <p className="text-sm text-center">
                        The preimage does not match the payment hash. Please check your inputs.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <Form {...settleInvoiceForm}>
                <form onSubmit={settleInvoiceForm.handleSubmit(handleSettleInvoice)} className="space-y-4">
                  <FormField
                    control={settleInvoiceForm.control}
                    name="hash"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <IconHash size={14} className="text-muted-foreground" />
                          Invoice Hash
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                          <Input
                            placeholder="The payment hash"
                              className={glowEffect}
                            {...field}
                          />
                            {createdInvoice && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                  settleInvoiceForm.setValue("hash", createdInvoice.hash);
                                }}
                                className="whitespace-nowrap"
                              >
                                <IconReceipt size={14} className="mr-1" />
                                Use Created Hash
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          The hash identifies which payment to settle
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settleInvoiceForm.control}
                    name="preimage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <IconKey size={14} className="text-muted-foreground" />
                          Preimage
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                          <Input
                            placeholder="The secret preimage that will release the payment"
                              className={glowEffect}
                            {...field}
                          />
                            {createdInvoice?.preimage && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                  settleInvoiceForm.setValue("preimage", createdInvoice.preimage);
                                }}
                                className="whitespace-nowrap"
                              >
                                <IconKey size={14} className="mr-1" />
                                Use Created Preimage
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          This is the secret value that will release the held payment.
                          You should have received this when creating the invoice.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading || settleAnimationStage !== 'idle'}
                  >
                    {isLoading ? (
                      <>
                        <IconClock size={16} className={`mr-2 ${spin}`} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <IconLockOpen size={16} className="mr-1" />
                        Settle Invoice
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 