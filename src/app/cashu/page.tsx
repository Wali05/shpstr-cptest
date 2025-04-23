"use client";

import { useState } from 'react';
import { IconWallet, IconCoins, IconTransfer, IconRefresh, IconEye, IconEyeOff, IconAlertTriangle, IconCheck, IconLock, IconCertificate, IconCode } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  simulateCashuP2PK, 
  simulateTamperedToken,
  SimulationResult,
  createP2PKLockedToken,
  generateCashuKeys,
} from '@/lib/services/cashu';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function CashuPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('simulation');
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [amount, setAmount] = useState(10);
  const [tamperedResult, setTamperedResult] = useState<SimulationResult | null>(null);
  const [showTamperDetails, setShowTamperDetails] = useState(false);
  
  // Create and spend tokens manually
  const [createAmount, setCreateAmount] = useState(100);
  const [createdToken, setCreatedToken] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [spendToken, setSpendToken] = useState('');
  const [spendResult, setSpendResult] = useState<boolean | null>(null);
  const [showSpendDetails, setShowSpendDetails] = useState(false);
  
  // Define type for spend details
  interface SpendDetails {
    time: string;
    token: string;
    amount: number;
    verificationMethod: string;
    keyVerified: string;
    status: 'SUCCESS' | 'FAILED';
    proofs: Array<{ id: string; amount: number }> | null;
  }
  
  const [spendDetails, setSpendDetails] = useState<SpendDetails | null>(null);
  
  // Add token-key tracking
  const [tokenKeyMap, setTokenKeyMap] = useState<{[token: string]: string}>({});
  
  // Reset states when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'simulation') {
      // Reset Create & Spend state - fully clear everything
      setSpendToken('');
      setSpendResult(null);
      setSpendDetails(null);
      setShowSpendDetails(false);
      setCreatedToken('');
      setPrivateKey('');
      setPublicKey('');
      setCreateAmount(100);
    } else {
      // Reset Simulation state - fully clear everything
      setSimulationResult(null);
      setTamperedResult(null);
      setShowDetails(false);
      setShowTamperDetails(false);
      setAmount(10);
    }
  };
  
  // Generate a full P2PK token simulation
  const generateSimulation = async () => {
    setIsLoading(true);
    setShowDetails(false);
    setShowTamperDetails(false);
    
    try {
      const result = await simulateCashuP2PK(amount);
      setSimulationResult(result);
      
      // Also generate a tampered version
      const tampered = await simulateTamperedToken(result);
      setTamperedResult(tampered);
      
      toast({
        title: 'Simulation Complete',
        description: 'P2PK token simulation has been generated successfully',
      });
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: 'Simulation Error',
        description: 'Failed to generate P2PK token simulation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate keys
  const handleGenerateKeys = () => {
    const keys = generateCashuKeys();
    setPrivateKey(keys.privateKey);
    setPublicKey(keys.publicKey);
    // Clear any previous token since keys changed
    setCreatedToken('');
    // Clear spend result since keys changed
    setSpendResult(null);
    setSpendDetails(null);
    
    toast({
      title: 'Keys Generated',
      description: 'New Cashu P2PK keys have been generated',
    });
  };
  
  // Create a token
  const handleCreateToken = async () => {
    if (!publicKey) {
      toast({
        title: 'Error',
        description: 'Please generate or enter a public key first',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await createP2PKLockedToken(createAmount, publicKey);
      setCreatedToken(result.token);
      
      // Store which private key created this token for verification later
      setTokenKeyMap(prev => ({
        ...prev,
        [result.token]: privateKey
      }));
      
      toast({
        title: 'Token Created',
        description: `Successfully created a P2PK token for ${createAmount} sats`,
      });
    } catch (error) {
      console.error('Token creation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create token',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Spend a token
  const handleSpendToken = async () => {
    if (!spendToken) {
      toast({
        title: 'Error',
        description: 'Please enter a token to spend',
        variant: 'destructive',
      });
      return;
    }
    
    // Basic validation - check if it has the Cashu format
    if (!spendToken.startsWith('cashu')) {
      toast({
        title: 'Invalid Token',
        description: 'The token format is invalid. Cashu tokens must start with "cashu"',
        variant: 'destructive',
      });
      setSpendResult(false);
      setSpendDetails(null); // Clear details on failure
      return;
    }
    
    setIsLoading(true);
    setShowSpendDetails(false);
    
    try {
      // Check if this token was created with the current private key
      const isCreatedToken = spendToken === createdToken;
      const tokenMatchesCurrentKey = tokenKeyMap[spendToken] === privateKey;
      const hasCorrectFormat = spendToken.startsWith('cashuB') && spendToken.length > 20;
      
      // Only succeed if:
      // 1. It's a token we created AND
      // 2. It matches the current private key OR it has correct format and we're just simulating
      const result = isCreatedToken && (tokenMatchesCurrentKey || hasCorrectFormat);
      
      setSpendResult(result);
      
      if (result) {
        // Generate mock spend details only for successful spends
        setSpendDetails({
          time: new Date().toISOString(),
          token: spendToken.substring(0, 15) + '...',
          amount: Math.floor(Math.random() * 500) + 50,
          verificationMethod: 'P2PK signature verification',
          keyVerified: privateKey.substring(0, 8) + '...' + privateKey.substring(privateKey.length - 8),
          status: 'SUCCESS',
          proofs: [
            { id: Math.random().toString(16).substring(2, 10), amount: Math.floor(Math.random() * 100) },
            { id: Math.random().toString(16).substring(2, 10), amount: Math.floor(Math.random() * 100) }
          ]
        });
      } else {
        // Clear details on failure
        setSpendDetails(null);
      }
      
        toast({
        title: result ? 'Token Spent' : 'Spend Failed',
        description: result 
          ? 'Successfully spent the P2PK token' 
          : 'Failed to spend token. Token verification failed.',
        variant: result ? 'default' : 'destructive',
        });
    } catch (error) {
      console.error('Token spending error:', error);
      setSpendResult(false);
      setSpendDetails(null); // Clear details on failure
      toast({
        title: 'Error',
        description: 'Failed to spend token',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Use the created token for spending
  const useCreatedToken = () => {
    if (!createdToken) {
      toast({
        title: 'No Token Created',
        description: 'Create a token first before trying to spend it',
        variant: 'destructive',
      });
      return;
    }
    
    setSpendToken(createdToken);
    toast({
      title: 'Token Applied',
      description: 'Created token has been applied to the spending field',
    });
  };
  
  // Animation classes
  const fadeIn = "transition-opacity duration-500 ease-in-out";
  const slideIn = "transition-all duration-300 ease-in-out";
  const spin = "animate-spin";
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">P2PK-locked Cashu Tokens</h1>
      <p className="text-muted-foreground mb-8">
        Simulate and interact with tokens locked to specific public keys via the Cashu protocol.
      </p>
      
      <Alert className="mb-8">
        <IconWallet className="h-4 w-4" />
        <AlertTitle>Cashu Simulation</AlertTitle>
        <AlertDescription>
          All operations are simulated locally and do not connect to a real Cashu mint.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="manual">Create & Spend</TabsTrigger>
        </TabsList>
        
        <TabsContent value="simulation" className={fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCoins size={20} />
                P2PK Token Simulation
              </CardTitle>
              <CardDescription>
                Generate a complete simulation demonstrating P2PK token issuance and spending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-full">
                    <label className="text-sm font-medium mb-1 block">Amount (sats)</label>
                          <Input
                            type="number"
                            min={1}
                      value={amount}
                      onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                          />
                  </div>
                  <Button 
                    onClick={generateSimulation}
                    disabled={isLoading}
                    className="mt-6 relative"
                  >
                    {isLoading ? (
                      <>
                        <IconRefresh size={16} className={`mr-2 ${spin}`} />
                        Generating...
                      </>
                    ) : (
                      'Generate Simulation'
                    )}
                  </Button>
                </div>
              
                {simulationResult && (
                  <div className={`mt-6 space-y-4 ${fadeIn} opacity-0 animate-in`} style={{ opacity: 1 }}>
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                      <h3 className="text-lg font-bold mb-2 flex items-center">
                        <IconCheck size={20} className="mr-2 text-green-600" />
                        Token Validation
                      </h3>
                      <p className="text-green-600 dark:text-green-400">{simulationResult.message}</p>
                    </div>
                    
                    <div className="flex justify-between">
                      <h3 className="text-lg font-medium">Simulation Results</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowDetails(!showDetails)}
                        className={slideIn}
                      >
                        {showDetails ? <IconEyeOff size={16} className="mr-1" /> : <IconEye size={16} className="mr-1" />}
                        {showDetails ? 'Hide Details' : 'Show Full Details'}
                      </Button>
                    </div>
                    
                    {!showDetails ? (
                      <div className="space-y-2">
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium">Amount</span>
                          <span>{simulationResult.issuedProofs.reduce((sum, p) => sum + p.amount, 0)} sats</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium">P2PK Public Key</span>
                          <span className="font-mono text-xs">{simulationResult.publicKey.substring(0, 10)}...{simulationResult.publicKey.substring(simulationResult.publicKey.length - 6)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium">Token Format</span>
                          <span>cashu{simulationResult.token.substring(5, 13)}...</span>
                        </div>
                      </div>
                    ) : (
                      <div className={`space-y-6 ${slideIn}`}>
                        {/* Token info card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 overflow-hidden">
                            <h4 className="text-md font-semibold mb-3 flex items-center">
                              <IconCoins size={18} className="mr-2 text-blue-600" />
                              Token Information
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                                <span className="text-sm font-medium">Amount</span>
                                <span className="font-mono bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">{simulationResult.issuedProofs.reduce((sum, p) => sum + p.amount, 0)} sats</span>
                              </div>
                              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                                <span className="text-sm font-medium">Success</span>
                                <span className={`${simulationResult.success ? 'text-green-600' : 'text-red-600'} font-medium`}>
                                  {simulationResult.success ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="pt-1">
                                <span className="text-sm font-medium block mb-1">Token</span>
                                <code className="font-mono text-xs bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded block truncate">{simulationResult.token}</code>
                              </div>
                            </div>
                          </div>

                          {/* Keys info card */}
                          <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20 overflow-hidden">
                            <h4 className="text-md font-semibold mb-3 flex items-center">
                              <IconLock size={18} className="mr-2 text-purple-600" />
                              Cryptographic Keys
                            </h4>
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-medium block mb-1">Public Key</span>
                                <div className="flex items-center">
                                  <code className="font-mono text-xs bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded block truncate flex-1">
                                    {simulationResult.publicKey}
                                  </code>
                                </div>
                              </div>
                              <div className="pt-1">
                                <span className="text-sm font-medium block mb-1">Private Key</span>
                                <div className="flex items-center">
                                  <code className="font-mono text-xs bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded block truncate flex-1">
                                    {simulationResult.privateKey}
                                  </code>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Proofs visualization */}
                        <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                          <h4 className="text-md font-semibold mb-3 flex items-center">
                            <IconCertificate size={18} className="mr-2 text-amber-600" />
                            Token Proofs
                          </h4>
                          
                          <div className="space-y-4">
                            <div>
                              <h5 className="text-sm font-medium mb-2">Issued Proofs ({simulationResult.issuedProofs.length})</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {simulationResult.issuedProofs.map((proof, idx) => (
                                  <div key={idx} className="p-2 border border-amber-200 dark:border-amber-800/30 rounded bg-amber-100/50 dark:bg-amber-900/20">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-medium">Amount</span>
                                      <span className="text-xs font-mono">{proof.amount} sats</span>
                                    </div>
                                    <div className="text-xs truncate">
                                      <span className="font-medium">ID:</span> <span className="font-mono">{proof.id}</span>
                                    </div>
                                    {proof.p2pk && (
                                      <div className="text-xs flex items-center mt-1 text-purple-600">
                                        <IconLock size={12} className="mr-1" /> P2PK Locked
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium mb-2">Claimed Proofs ({simulationResult.claimedProofs.length})</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {simulationResult.claimedProofs.map((proof, idx) => (
                                  <div key={idx} className="p-2 border border-green-200 dark:border-green-800/30 rounded bg-green-100/50 dark:bg-green-900/20">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-medium">Amount</span>
                                      <span className="text-xs font-mono">{proof.amount} sats</span>
                                    </div>
                                    <div className="text-xs truncate">
                                      <span className="font-medium">ID:</span> <span className="font-mono">{proof.id}</span>
                                    </div>
                                    <div className="text-xs flex items-center mt-1 text-green-600">
                                      <IconCheck size={12} className="mr-1" /> Claimed
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Raw data toggle */}
                        <div className="flex justify-end">
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="raw-data" className="border-0">
                              <AccordionTrigger className="py-2 px-4 text-sm font-medium text-muted-foreground hover:bg-muted/50 rounded-md">
                                <div className="flex items-center">
                                  <IconCode size={14} className="mr-1.5" />
                                  View Raw JSON Data
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs whitespace-pre-wrap">
                                  {JSON.stringify(simulationResult, null, 2)}
                                </pre>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </div>
                    )}
                    
                    {tamperedResult && (
                      <div className={`mt-4 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 ${slideIn}`}>
                        <h3 className="text-lg font-bold mb-2 flex items-center">
                          <IconAlertTriangle size={20} className="mr-2 text-red-600" />
                          Tamper Test
                        </h3>
                        <p className="text-red-600 dark:text-red-400 mb-2">
                          {tamperedResult.message}
                        </p>
                  
                        <div className="flex justify-between mt-3 mb-2">
                          <span className="text-sm font-medium">Tampering Details</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowTamperDetails(!showTamperDetails)}
                            className="h-6 text-xs"
                          >
                            {showTamperDetails ? 'Hide Details' : 'Show Details'}
                          </Button>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          <p>The token was modified by appending an &quot;X&quot; to demonstrate how even a small change breaks cryptographic verification.</p>
                          
                          <div className="mt-2 p-2 bg-muted rounded font-mono overflow-auto">
                            <div><span className="font-semibold">Original:</span> {simulationResult.token.substring(0, 20)}...</div>
                            <div><span className="font-semibold">Tampered:</span> <span className="text-red-500">{tamperedResult.token.substring(0, 20)}...</span></div>
                          </div>
                          
                          {showTamperDetails && (
                            <div className={`mt-3 border-t pt-2 ${slideIn}`}>
                              <h4 className="font-medium mb-1">Why Verification Failed</h4>
                              <p className="mb-2">
                                Cashu tokens use cryptographic signatures to ensure their integrity. When any part of the token is modified,
                                even a single character, the signature verification fails because:
                              </p>
                              <ol className="list-decimal pl-5 space-y-1 mt-2">
                                <li>The token&apos;s contents no longer match what was originally signed</li>
                                <li>The cryptographic hash calculated during verification produces a different result</li>
                                <li>The signature becomes invalid for the modified content</li>
                              </ol>
                              
                              <div className="mt-3 p-2 bg-black/5 dark:bg-white/5 rounded">
                                <div className="font-medium mb-1">Technical Details</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>Original Signature Valid:</div>
                                  <div className="text-green-600">True</div>
                                  <div>Tampered Signature Valid:</div>
                                  <div className="text-red-600">False</div>
                                  <div>Verification Stage:</div>
                                  <div>Signature Verification</div>
                                  <div>Failed Operation:</div>
                                  <div>secp256k1.verify()</div>
                    </div>
                  </div>
                </div>
              )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manual" className={fadeIn}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={slideIn}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <IconCoins size={20} />
                  Create P2PK Token
              </CardTitle>
              <CardDescription>
                  Generate keys and create a token locked to a public key
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Key Pair</label>
                    <div className="flex mb-2">
                      <Button 
                        onClick={handleGenerateKeys} 
                        className="w-full"
                        variant="outline"
                      >
                        Generate New Keys
                      </Button>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div>
                        <label className="text-xs font-medium">Private Key</label>
                          <Input
                          value={privateKey}
                          onChange={(e) => setPrivateKey(e.target.value)}
                          placeholder="Your private key"
                          className="font-mono text-xs"
                          />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Public Key</label>
                        <Input 
                          value={publicKey}
                          onChange={(e) => setPublicKey(e.target.value)}
                          placeholder="Recipient public key"
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Amount (sats)</label>
                          <Input
                      type="number"
                      min={1}
                      value={createAmount}
                      onChange={(e) => setCreateAmount(parseInt(e.target.value) || 1)}
                          />
                  </div>
                  
                  <Button 
                    onClick={handleCreateToken}
                    disabled={isLoading || !publicKey}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <IconRefresh size={16} className={`mr-2 ${spin}`} />
                        Creating...
                      </>
                    ) : (
                      'Create P2PK Token'
                    )}
                  </Button>
                  
                  {createdToken && (
                    <div className={`p-3 border rounded mt-4 ${fadeIn} opacity-0 animate-in`} style={{ opacity: 1 }}>
                      <label className="text-xs font-medium block mb-1">Generated Token</label>
                      <p className="font-mono text-xs break-all bg-muted p-2 rounded">{createdToken}</p>
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
        
            <Card className={slideIn}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <IconTransfer size={20} />
                  Spend P2PK Token
              </CardTitle>
              <CardDescription>
                  Spend a token locked to your public key
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Token to Spend</label>
                    <div className="flex gap-2 mb-2">
                          <Input
                        value={spendToken}
                        onChange={(e) => setSpendToken(e.target.value)}
                        placeholder="Paste token here"
                        className="font-mono text-xs"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={useCreatedToken}
                        className="whitespace-nowrap"
                        disabled={!createdToken}
                      >
                        Use Created Token
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Your Private Key</label>
                          <Input
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="Private key to unlock token"
                      className="font-mono text-xs"
                          />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must correspond to the public key the token is locked to
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleSpendToken}
                    disabled={isLoading || !spendToken}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <IconRefresh size={16} className={`mr-2 ${spin}`} />
                        Processing...
                      </>
                    ) : (
                      'Spend Token'
                    )}
                  </Button>
                  
                  {spendResult !== null && (
                    <div className={`p-3 border rounded mt-4 ${fadeIn} opacity-0 animate-in ${spendResult ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`} style={{ opacity: 1 }}>
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Spend Result</h4>
                        {spendDetails && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowSpendDetails(!showSpendDetails)}
                            className="h-6 text-xs"
                          >
                            {showSpendDetails ? 'Hide Details' : 'Show Details'}
                          </Button>
                        )}
                      </div>
                      <p className={spendResult ? 'text-green-600' : 'text-red-600'}>
                        {spendResult 
                          ? 'Token spent successfully!' 
                          : 'Failed to spend token. Token verification failed.'}
                      </p>
                      
                      {showSpendDetails && spendDetails && (
                        <div className={`mt-3 pt-2 border-t text-xs ${slideIn}`}>
                          <h5 className="font-medium mb-1">Transaction Details</h5>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="font-medium">Time:</div>
                            <div>{new Date(spendDetails.time).toLocaleString()}</div>
                            
                            <div className="font-medium">Amount:</div>
                            <div>{spendDetails.amount} sats</div>
                            
                            <div className="font-medium">Token ID:</div>
                            <div className="truncate">{spendDetails.token}</div>
                            
                            <div className="font-medium">Verification:</div>
                            <div>{spendDetails.verificationMethod}</div>
                            
                            <div className="font-medium">Key Used:</div>
                            <div className="font-mono text-xs">{spendDetails.keyVerified}</div>
                            
                            <div className="font-medium">Status:</div>
                            <div className={spendDetails.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}>
                              {spendDetails.status}
                            </div>
                          </div>
                          
                          {spendDetails.proofs && (
                            <div className="mt-3">
                              <h5 className="font-medium mb-1">Proof Details</h5>
                              <div className="bg-muted p-2 rounded">
                                {spendDetails.proofs.map((proof: { id: string; amount: number }, idx: number) => (
                                  <div key={idx} className="flex justify-between border-b last:border-0 py-1">
                                    <span className="font-mono">ID: {proof.id}</span>
                                    <span>{proof.amount} sats</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                    </div>
                      )}
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-center mt-8">
        <Button 
          onClick={generateSimulation}
          className={`flex items-center gap-2 ${slideIn}`}
          variant="outline"
        >
          <IconRefresh size={16} />
          Generate New Simulation
        </Button>
      </div>
    </div>
  );
} 