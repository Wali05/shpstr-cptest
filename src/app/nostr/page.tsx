"use client";

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconSend, IconKey, IconRefresh, IconMessage } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  generateNostrKeys, 
  importNostrKeys, 
  sendGiftWrappedMessage, 
  receiveGiftWrappedMessages,
  subscribeToGiftWrappedMessages
} from '@/lib/services/nostr';

// Define form schema
const sendMessageFormSchema = z.object({
  recipientPublicKey: z.string().min(1, {
    message: "Recipient's public key is required",
  }),
  message: z.string().min(1, {
    message: "Message is required",
  }),
});

const keyManagementFormSchema = z.object({
  privateKey: z.string().optional(),
});

export default function NostrPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('send');
  const [keys, setKeys] = useState<{ privateKey: string; publicKey: string } | null>(null);
  const [messages, setMessages] = useState<Array<{ message: string; sender: string; timestamp: number }>>([]);
  const [isLoading, setIsLoading] = useState<{
    keys: boolean;
    send: boolean;
    receive: boolean;
  }>({ keys: false, send: false, receive: false });
  
  // Check for saved keys in localStorage on initial load
  useEffect(() => {
    const savedPrivateKey = localStorage.getItem('nostr_private_key');
    if (savedPrivateKey) {
      try {
        const importedKeys = importNostrKeys(savedPrivateKey);
        setKeys(importedKeys);
        toast({
          title: 'Keys Loaded',
          description: 'Your saved keys have been loaded successfully.',
        });
      } catch (error) {
        console.error('Failed to load saved keys:', error);
        localStorage.removeItem('nostr_private_key');
      }
    }
  }, [toast]);
  
  // Subscribe to new messages when keys are available
  useEffect(() => {
    if (!keys) return;
    
    // Set up subscription to new messages
    const unsubscribe = subscribeToGiftWrappedMessages(
      keys.privateKey,
      (newMessage) => {
        setMessages((prev) => [newMessage, ...prev]);
        toast({
          title: 'New Message',
          description: `You received a new message from ${newMessage.sender.substring(0, 10)}...`,
        });
      }
    );
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [keys, toast]);
  
  // Send message form
  const sendMessageForm = useForm<z.infer<typeof sendMessageFormSchema>>({
    resolver: zodResolver(sendMessageFormSchema),
    defaultValues: {
      recipientPublicKey: '',
      message: '',
    },
  });
  
  // Key management form
  const keyManagementForm = useForm<z.infer<typeof keyManagementFormSchema>>({
    resolver: zodResolver(keyManagementFormSchema),
    defaultValues: {
      privateKey: '',
    },
  });
  
  // Generate new keys
  const generateKeys = async () => {
    setIsLoading({ ...isLoading, keys: true });
    try {
      const newKeys = generateNostrKeys();
      setKeys(newKeys);
      
      // Save to localStorage for persistence
      localStorage.setItem('nostr_private_key', newKeys.privateKey);
      
      toast({
        title: 'New Keys Generated',
        description: 'Your new keys have been generated. Keep your private key safe!',
      });
    } catch (error) {
      console.error('Error generating keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate new keys.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading({ ...isLoading, keys: false });
    }
  };
  
  // Import keys from private key
  const importKeys = async (privateKey: string) => {
    setIsLoading({ ...isLoading, keys: true });
    try {
      const importedKeys = importNostrKeys(privateKey);
      setKeys(importedKeys);
      
      // Save to localStorage for persistence
      localStorage.setItem('nostr_private_key', importedKeys.privateKey);
      
      toast({
        title: 'Keys Imported',
        description: 'Your keys have been imported successfully.',
      });
    } catch (error) {
      console.error('Error importing keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to import keys. Make sure your private key is valid.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading({ ...isLoading, keys: false });
    }
  };
  
  // Send message
  const sendMessage = async (values: z.infer<typeof sendMessageFormSchema>) => {
    if (!keys) {
      toast({
        title: 'Error',
        description: 'You need to generate or import keys first.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading({ ...isLoading, send: true });
    
    try {
      await sendGiftWrappedMessage(
        keys.privateKey,
        values.recipientPublicKey,
        values.message
      );
      
      toast({
        title: 'Message Sent',
        description: 'Your gift-wrapped message has been sent successfully.',
      });
      
      // Reset form
      sendMessageForm.reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Check recipient public key.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading({ ...isLoading, send: false });
    }
  };
  
  // Receive messages
  const refreshMessages = async () => {
    if (!keys) {
      toast({
        title: 'Error',
        description: 'You need to generate or import keys first.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading({ ...isLoading, receive: true });
    
    try {
      // Get messages since one week ago (604800 seconds)
      const oneWeekAgo = Math.floor(Date.now() / 1000) - 604800;
      const receivedMessages = await receiveGiftWrappedMessages(
        keys.privateKey,
        oneWeekAgo,
        50
      );
      
      setMessages(receivedMessages);
      
      toast({
        title: 'Messages Refreshed',
        description: `Received ${receivedMessages.length} messages.`,
      });
    } catch (error) {
      console.error('Error receiving messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to retrieve messages.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading({ ...isLoading, receive: false });
    }
  };
  
  // Submit key management form
  const onKeyManagementSubmit = (values: z.infer<typeof keyManagementFormSchema>) => {
    if (values.privateKey) {
      importKeys(values.privateKey);
    } else {
      generateKeys();
    }
  };
  
  // Format npub for display
  const formatNpub = (pubkey: string) => {
    if (pubkey.startsWith('npub')) {
      return pubkey;
    }
    return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 4)}`;
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gift-wrapped Nostr Messages</h1>
      <p className="text-muted-foreground mb-8">
        Send and receive encrypted messages using NIP-17 protocol.
      </p>
      
      {!keys && (
        <Alert className="mb-8">
          <IconKey className="h-4 w-4" />
          <AlertTitle>No Keys Found</AlertTitle>
          <AlertDescription>
            You need to generate or import Nostr keys to send and receive messages.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconKey size={20} />
              Key Management
            </CardTitle>
            <CardDescription>
              Generate new Nostr keys or import existing ones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...keyManagementForm}>
              <form onSubmit={keyManagementForm.handleSubmit(onKeyManagementSubmit)} className="space-y-4">
                <FormField
                  control={keyManagementForm.control}
                  name="privateKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Private Key (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your private key to import"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty to generate new keys
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    type="submit" 
                    className="flex items-center gap-2"
                    disabled={isLoading.keys}
                  >
                    <IconKey size={16} />
                    {isLoading.keys ? 'Processing...' : keyManagementForm.getValues('privateKey') ? 'Import Keys' : 'Generate New Keys'}
                  </Button>
                </div>
              </form>
            </Form>
            
            {keys && (
              <div className="mt-4 space-y-2">
                <div>
                  <span className="font-medium">Your Public Key:</span>
                  <code className="ml-2 p-1 bg-muted rounded text-xs">{keys.publicKey}</code>
                </div>
                <div>
                  <span className="font-medium">Your Private Key:</span>
                  <code className="ml-2 p-1 bg-muted rounded text-xs">
                    {keys.privateKey.substring(0, 4)}...{keys.privateKey.substring(keys.privateKey.length - 4)}
                  </code>
                  <span className="text-xs text-muted-foreground ml-2">(Keep this secret!)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="send">Send Message</TabsTrigger>
            <TabsTrigger value="receive">Receive Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSend size={20} />
                  Send Gift-wrapped Message
                </CardTitle>
                <CardDescription>
                  Send an encrypted message to another Nostr user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...sendMessageForm}>
                  <form onSubmit={sendMessageForm.handleSubmit(sendMessage)} className="space-y-4">
                    <FormField
                      control={sendMessageForm.control}
                      name="recipientPublicKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Public Key</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="npub1... or hex key"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={sendMessageForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your message here..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading.send || !keys}
                    >
                      {isLoading.send ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="receive">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconMessage size={20} />
                  Received Messages
                </CardTitle>
                <CardDescription>
                  View encrypted messages sent to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button 
                    onClick={refreshMessages}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isLoading.receive || !keys}
                  >
                    <IconRefresh size={16} />
                    {isLoading.receive ? 'Loading...' : 'Refresh Messages'}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No messages found. Click refresh to check for new messages.
                    </p>
                  ) : (
                    messages.map((msg, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            From: {formatNpub(msg.sender)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp * 1000).toLocaleString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 