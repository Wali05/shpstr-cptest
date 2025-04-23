"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { IconLockSquare, IconEye, IconEyeOff, IconCode, IconRefresh } from '@tabler/icons-react';
import { useToast } from '@/hooks/use-toast';
import { generateGiftWrappedMessageSimulation, GiftWrappedMessageSimulation } from '@/lib/services/nostr';

export default function NostrPage() {
  const { toast } = useToast();
  const [customMessage, setCustomMessage] = useState("");
  const [simulation, setSimulation] = useState<GiftWrappedMessageSimulation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(true);
    
  // Generate the simulation results
  const generateSimulation = async () => {
    if (!customMessage.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message to encrypt',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await generateGiftWrappedMessageSimulation(customMessage);
      setSimulation(result);
      setShowResults(true);
      
      toast({
        title: 'Simulation Generated',
        description: 'Nostr gift-wrapped message simulation created successfully.',
      });
    } catch (error) {
      console.error('Error generating simulation:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate simulation.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format a public key for display
  const formatPublicKey = (publicKey: string) => {
    if (!publicKey) return '';
    return `${publicKey.substring(0, 8)}...${publicKey.substring(publicKey.length - 4)}`;
  };

  // Compare original and tampered content to highlight the difference
  const highlightDifference = () => {
    if (!simulation) return null;
    
    const originalContent = simulation.giftWrappedMsg.content;
    const tamperedContent = simulation.tampered.giftWrappedMsg.content;
    
    // Find the position where the change was made
    let diffIndex = -1;
    for (let i = 0; i < originalContent.length; i++) {
      if (i >= tamperedContent.length || originalContent[i] !== tamperedContent[i]) {
        diffIndex = i;
        break;
      }
    }
    
    if (diffIndex === -1) return null;
    
    // Create a display that shows the difference
    const beforeChange = originalContent.substring(Math.max(0, diffIndex - 10), diffIndex);
    const originalChar = originalContent.substring(diffIndex, diffIndex + 1);
    const tamperedChar = tamperedContent.substring(diffIndex, diffIndex + 1);
    const afterChange = originalContent.substring(diffIndex + 1, Math.min(originalContent.length, diffIndex + 11));
    
    return (
      <div className="mt-4 border p-4 rounded-md bg-muted/30">
        <h4 className="font-medium mb-2">Byte Change Comparison</h4>
        <div className="text-xs font-mono">
          <div className="flex gap-2 items-center mb-2">
            <span className="font-semibold">Original:</span>
            <span className="bg-muted p-1 rounded">{beforeChange}</span>
            <span className="bg-green-200 p-1 rounded dark:bg-green-900">{originalChar}</span>
            <span className="bg-muted p-1 rounded">{afterChange}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Tampered:</span> 
            <span className="bg-muted p-1 rounded">{beforeChange}</span>
            <span className="bg-red-200 p-1 rounded dark:bg-red-900">{tamperedChar}</span>
            <span className="bg-muted p-1 rounded">{afterChange}</span>
          </div>
        </div>
        <p className="text-xs mt-2 text-muted-foreground">
          Position: {diffIndex} of {originalContent.length} characters
        </p>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Nostr Gift-Wrapped Messages</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates a simulation of Nostr gift-wrapped messaging, showcasing the encryption and security process.
      </p>
      
      <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <IconLockSquare size={20} />
            Nostr Message Simulation
            </CardTitle>
            <CardDescription>
            Generate a new simulation showing the gift-wrapped message process
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Enter Message</label>
              <Textarea 
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your message to encrypt"
                className="min-h-[100px]"
                        />
              <p className="text-sm text-muted-foreground">
                This message will be encrypted using the Nostr gift-wrapped protocol
              </p>
            </div>
            
                  <Button 
              onClick={generateSimulation}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Generating...' : 'Generate Simulation'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {simulation && showResults && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Nostr Results</h2>
            <Button variant="outline" onClick={() => setShowResults(false)}>
              Hide Nostr Results
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Original Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="p-4 bg-muted rounded-md whitespace-pre-wrap">{simulation.originalMessage}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Decrypted Content</CardTitle>
            </CardHeader>
            <CardContent>
              {simulation.decryptedContent ? (
                <p className="p-4 bg-muted rounded-md whitespace-pre-wrap">{simulation.decryptedContent}</p>
              ) : (
                <Alert>
                  <AlertTitle>Decryption Failed</AlertTitle>
                  <AlertDescription>The message could not be decrypted.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Keys</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                {showDetails ? ' Hide Details' : ' Show Details'}
                  </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Sender</span>
                  <code className="text-xs bg-muted p-1 rounded">
                    {formatPublicKey(simulation.keys.sender.publicKey)}
                  </code>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Receiver</span>
                  <code className="text-xs bg-muted p-1 rounded">
                    {formatPublicKey(simulation.keys.receiver.publicKey)}
                  </code>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="font-medium">Wrapper</span>
                  <code className="text-xs bg-muted p-1 rounded">
                    {formatPublicKey(simulation.keys.wrapper.publicKey)}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {showDetails && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Direct Message (Kind 14)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
                    {JSON.stringify(simulation.directMsg, null, 2)}
                  </pre>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sealed Message (Kind 13)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
                    {JSON.stringify(simulation.sealedMsg, null, 2)}
                  </pre>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Gift-Wrapped Message (Kind 1059)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
                    {JSON.stringify(simulation.giftWrappedMsg, null, 2)}
                  </pre>
          </CardContent>
        </Card>
        
              <Card>
                <CardHeader>
                  <CardTitle>Unwrapped Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
                    {JSON.stringify(simulation.unwrappedMsg, null, 2)}
                  </pre>
                </CardContent>
              </Card>
              
            <Card>
              <CardHeader>
                  <CardTitle>Tamper Test</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <IconCode className="h-4 w-4" />
                      <AlertTitle>Tampered Message</AlertTitle>
                      <AlertDescription>
                        The last byte of the wrapped event content was changed to simulate tampering.
                        This demonstrates how even a single-byte change breaks the cryptographic integrity.
                      </AlertDescription>
                    </Alert>
                    
                    {highlightDifference()}
                    
                    <div className="border p-4 rounded-md">
                      <h4 className="font-medium mb-2">Unwrap Result</h4>
                      {simulation.tampered.unwrappedMsg === null ? (
                        <p className="text-destructive">Failed to unwrap (Expected - Cryptographic verification failed)</p>
                      ) : (
                        <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
                          {JSON.stringify(simulation.tampered.unwrappedMsg, null, 2)}
                        </pre>
                      )}
                    </div>
                    
                    <div className="border p-4 rounded-md">
                      <h4 className="font-medium mb-2">Decrypt Result</h4>
                      {simulation.tampered.decryptedContent === null ? (
                        <p className="text-destructive">Failed to decrypt (Expected - Cryptographic verification failed)</p>
                      ) : (
                        <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
                          {simulation.tampered.decryptedContent}
                        </pre>
                      )}
                    </div>
                  </div>
              </CardContent>
            </Card>
          
            <Card>
              <CardHeader>
                  <CardTitle>Full Simulation Details</CardTitle>
              </CardHeader>
              <CardContent>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const el = document.createElement('textarea');
                      el.value = JSON.stringify(simulation, null, 2);
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand('copy');
                      document.body.removeChild(el);
                      
                      toast({
                        title: 'Copied to Clipboard',
                        description: 'Full simulation details copied to clipboard.',
                      });
                    }}
                  >
                    Copy Full Simulation JSON
                  </Button>
              </CardContent>
            </Card>
            </>
          )}
          
          <div className="flex justify-center mt-8">
            <Button 
              onClick={generateSimulation}
              className="flex items-center gap-2"
              variant="outline"
            >
              <IconRefresh size={16} />
              Generate New Simulation
            </Button>
          </div>
      </div>
      )}
    </div>
  );
} 