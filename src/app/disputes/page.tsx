"use client";

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconScale, IconFileUpload, IconCheck, IconRefresh, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Import types from the dispute service
import type { Dispute, DisputeStatus } from '@/lib/services/dispute';

// Define form schemas
const createDisputeFormSchema = z.object({
  orderId: z.string().min(1, {
    message: "Order ID is required",
  }),
  sellerPubkey: z.string().min(1, {
    message: "Seller's public key is required",
  }),
  reason: z.string().min(10, {
    message: "Please provide a more detailed reason for the dispute",
  }),
  evidence: z.string().optional(),
  privateKey: z.string().min(1, {
    message: "Your private key is required to sign the dispute",
  }),
});

const addEvidenceFormSchema = z.object({
  disputeId: z.string().min(1, {
    message: "Dispute ID is required",
  }),
  evidence: z.string().min(1, {
    message: "Evidence is required",
  }),
  privateKey: z.string().min(1, {
    message: "Your private key is required",
  }),
});

const resolveDisputeFormSchema = z.object({
  disputeId: z.string().min(1, {
    message: "Dispute ID is required",
  }),
  resolution: z.enum(['buyer', 'seller', 'partial'], {
    required_error: "Resolution type is required",
  }),
  refundPercentage: z.coerce.number().min(0).max(100).optional(),
  comments: z.string().optional(),
  privateKey: z.string().min(1, {
    message: "Your private key is required",
  }),
});

export default function DisputesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('create');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [createdDispute, setCreatedDispute] = useState<Dispute | null>(null);
  
  // Create dispute form
  const createDisputeForm = useForm<z.infer<typeof createDisputeFormSchema>>({
    resolver: zodResolver(createDisputeFormSchema),
    defaultValues: {
      orderId: '',
      sellerPubkey: '',
      reason: '',
      evidence: '',
      privateKey: '',
    },
  });
  
  // Add evidence form
  const addEvidenceForm = useForm<z.infer<typeof addEvidenceFormSchema>>({
    resolver: zodResolver(addEvidenceFormSchema),
    defaultValues: {
      disputeId: '',
      evidence: '',
      privateKey: '',
    },
  });
  
  // Resolve dispute form
  const resolveDisputeForm = useForm<z.infer<typeof resolveDisputeFormSchema>>({
    resolver: zodResolver(resolveDisputeFormSchema),
    defaultValues: {
      disputeId: '',
      resolution: 'buyer',
      refundPercentage: 50,
      comments: '',
      privateKey: '',
    },
  });
  
  // Create a dispute
  const createDispute = async (values: z.infer<typeof createDisputeFormSchema>) => {
    try {
      // In a real implementation, this would use the createDispute function
      // For demo purposes, we'll just create a mock dispute
      const now = Math.floor(Date.now() / 1000);
      const mockDispute: Dispute = {
        id: `dispute_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        orderId: values.orderId,
        buyerPubkey: 'npub_buyer_' + Math.random().toString(36).substring(2, 9),
        sellerPubkey: values.sellerPubkey,
        arbiterPubkey: process.env.NEXT_PUBLIC_NOSTR_ARBITER_PUBKEY || 'npub_arbiter_default',
        reason: values.reason,
        evidence: values.evidence ? [values.evidence] : [],
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      
      setCreatedDispute(mockDispute);
      setDisputes(prev => [...prev, mockDispute]);
      
      toast({
        title: 'Dispute Created',
        description: `Dispute for order ${values.orderId} has been created`,
      });
      
      // Reset form
      createDisputeForm.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create dispute',
        variant: 'destructive',
      });
    }
  };
  
  // Add evidence to a dispute
  const addEvidence = async (values: z.infer<typeof addEvidenceFormSchema>) => {
    try {
      // In a real implementation, this would use the addDisputeEvidence function
      // For demo purposes, we'll just update the mock dispute
      setDisputes(prev => prev.map(dispute => {
        if (dispute.id === values.disputeId) {
          return {
            ...dispute,
            evidence: [...dispute.evidence, values.evidence],
            updatedAt: Math.floor(Date.now() / 1000),
          };
        }
        return dispute;
      }));
      
      toast({
        title: 'Evidence Added',
        description: 'Your evidence has been added to the dispute',
      });
      
      // Reset form
      addEvidenceForm.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add evidence',
        variant: 'destructive',
      });
    }
  };
  
  // Resolve a dispute
  const resolveDispute = async (values: z.infer<typeof resolveDisputeFormSchema>) => {
    try {
      // In a real implementation, this would use the resolveDisputeByParties or resolveDisputeByArbiter function
      // For demo purposes, we'll just update the mock dispute
      setDisputes(prev => prev.map(dispute => {
        if (dispute.id === values.disputeId) {
          return {
            ...dispute,
            status: 'resolved' as DisputeStatus,
            updatedAt: Math.floor(Date.now() / 1000),
            resolution: {
              resolution: values.resolution,
              refundPercentage: values.resolution === 'partial' ? values.refundPercentage : undefined,
              resolvedBy: 'npub_resolver_' + Math.random().toString(36).substring(2, 9),
              comments: values.comments || '',
              timestamp: Math.floor(Date.now() / 1000),
            },
          };
        }
        return dispute;
      }));
      
      toast({
        title: 'Dispute Resolved',
        description: `The dispute has been resolved in favor of the ${values.resolution === 'partial' ? 'partial (both parties)' : values.resolution}`,
      });
      
      // Reset form
      resolveDisputeForm.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve dispute',
        variant: 'destructive',
      });
    }
  };
  
  // Refresh disputes list
  const refreshDisputes = () => {
    // In a real implementation, this would fetch disputes from a service
    // For demo purposes, we'll just add a mock dispute if the list is empty
    if (disputes.length === 0) {
      const now = Math.floor(Date.now() / 1000);
      const mockDispute: Dispute = {
        id: `dispute_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        orderId: `order_${Math.floor(Math.random() * 1000)}`,
        buyerPubkey: 'npub_buyer_' + Math.random().toString(36).substring(2, 9),
        sellerPubkey: 'npub_seller_' + Math.random().toString(36).substring(2, 9),
        arbiterPubkey: process.env.NEXT_PUBLIC_NOSTR_ARBITER_PUBKEY || 'npub_arbiter_default',
        reason: 'Item not as described. The product was damaged during shipping.',
        evidence: ['Picture of damaged package: https://example.com/evidence1.jpg'],
        status: 'pending',
        createdAt: now - 86400, // 1 day ago
        updatedAt: now - 43200, // 12 hours ago
      };
      
      setDisputes([mockDispute]);
    }
    
    toast({
      title: 'Disputes Refreshed',
      description: `Found ${disputes.length || 1} disputes`,
    });
  };
  
  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: DisputeStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-950/20 text-yellow-500';
      case 'evidence-required':
        return 'bg-blue-950/20 text-blue-500';
      case 'arbitration':
        return 'bg-purple-950/20 text-purple-500';
      case 'resolved':
        return 'bg-green-950/20 text-green-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dispute Resolution</h1>
      <p className="text-muted-foreground mb-8">
        Open and resolve disputes between buyers and sellers with optional third-party arbitration.
      </p>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="create">Create Dispute</TabsTrigger>
          <TabsTrigger value="manage">Add Evidence</TabsTrigger>
          <TabsTrigger value="resolve">Resolve Dispute</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconScale size={20} />
                Create New Dispute
              </CardTitle>
              <CardDescription>
                Open a dispute if you have an issue with an order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createDisputeForm}>
                <form onSubmit={createDisputeForm.handleSubmit(createDispute)} className="space-y-4">
                  <FormField
                    control={createDisputeForm.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="The ID of the order in dispute"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createDisputeForm.control}
                    name="sellerPubkey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Public Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="The seller's Nostr public key"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createDisputeForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Dispute</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the issue in detail"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Please be specific about the problem and what resolution you are seeking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createDisputeForm.control}
                    name="evidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evidence (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide links to photos, screenshots, or other evidence"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URLs to photos, chat logs, or other supporting evidence
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createDisputeForm.control}
                    name="privateKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Private Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your Nostr private key for signing"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Required to sign the dispute message
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Create Dispute</Button>
                </form>
              </Form>
              
              {createdDispute && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Dispute Created:</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Dispute ID:</span> {createdDispute.id}</div>
                    <div><span className="font-medium">Order ID:</span> {createdDispute.orderId}</div>
                    <div><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(createdDispute.status)}`}>{createdDispute.status}</span></div>
                    <div><span className="font-medium">Created:</span> {formatDate(createdDispute.createdAt)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFileUpload size={20} />
                Add Evidence
              </CardTitle>
              <CardDescription>
                Add evidence to an existing dispute
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium">Active Disputes</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={refreshDisputes}
                  >
                    <IconRefresh size={14} />
                    Refresh
                  </Button>
                </div>
                
                {disputes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No disputes found. Create a dispute first or click refresh.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {disputes.map(dispute => (
                      <div 
                        key={dispute.id} 
                        className="p-3 border rounded-lg flex flex-col md:flex-row md:items-center gap-3 md:justify-between"
                        onClick={() => {
                          addEvidenceForm.setValue('disputeId', dispute.id);
                        }}
                      >
                        <div>
                          <h4 className="font-medium">Order #{dispute.orderId}</h4>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {dispute.reason.substring(0, 60)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(dispute.status)}`}>
                            {dispute.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(dispute.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Form {...addEvidenceForm}>
                <form onSubmit={addEvidenceForm.handleSubmit(addEvidence)} className="space-y-4">
                  <FormField
                    control={addEvidenceForm.control}
                    name="disputeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dispute ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="The ID of the dispute to add evidence to"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Select a dispute from the list above or enter the ID
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addEvidenceForm.control}
                    name="evidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evidence</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide new evidence for the dispute"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URLs, transaction IDs, or detailed descriptions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addEvidenceForm.control}
                    name="privateKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Private Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your Nostr private key for signing"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Add Evidence</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resolve">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCheck size={20} />
                Resolve Dispute
              </CardTitle>
              <CardDescription>
                Resolve a dispute as a buyer, seller, or arbiter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium">Active Disputes</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={refreshDisputes}
                  >
                    <IconRefresh size={14} />
                    Refresh
                  </Button>
                </div>
                
                {disputes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No disputes found. Create a dispute first or click refresh.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {disputes.map(dispute => (
                      <div 
                        key={dispute.id} 
                        className="p-3 border rounded-lg flex flex-col md:flex-row md:items-center gap-3 md:justify-between"
                        onClick={() => {
                          resolveDisputeForm.setValue('disputeId', dispute.id);
                        }}
                      >
                        <div>
                          <h4 className="font-medium">Order #{dispute.orderId}</h4>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {dispute.reason.substring(0, 60)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(dispute.status)}`}>
                            {dispute.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Form {...resolveDisputeForm}>
                <form onSubmit={resolveDisputeForm.handleSubmit(resolveDispute)} className="space-y-4">
                  <FormField
                    control={resolveDisputeForm.control}
                    name="disputeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dispute ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="The ID of the dispute to resolve"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Select a dispute from the list above or enter the ID
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={resolveDisputeForm.control}
                    name="resolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolution Type</FormLabel>
                        <div className="flex flex-col md:flex-row gap-2">
                          <Button
                            type="button"
                            variant={field.value === 'buyer' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => resolveDisputeForm.setValue('resolution', 'buyer')}
                          >
                            In favor of Buyer
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'seller' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => resolveDisputeForm.setValue('resolution', 'seller')}
                          >
                            In favor of Seller
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'partial' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => resolveDisputeForm.setValue('resolution', 'partial')}
                          >
                            Partial (Split)
                          </Button>
                        </div>
                        <input className="sr-only" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {resolveDisputeForm.watch('resolution') === 'partial' && (
                    <FormField
                      control={resolveDisputeForm.control}
                      name="refundPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refund Percentage to Buyer</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            What percentage of the payment should be refunded to the buyer (0-100)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={resolveDisputeForm.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comments (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain the reasoning for your resolution"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={resolveDisputeForm.control}
                    name="privateKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Private Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your Nostr private key for signing"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Required to sign the resolution message
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Resolve Dispute</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 