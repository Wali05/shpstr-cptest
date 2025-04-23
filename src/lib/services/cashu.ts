/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Cashu P2PK simulation service
 */
import { randomBytes } from 'crypto';
import * as secp from '@noble/secp256k1';

// Simulated mint URL
const MINT_URL = 'https://testnut.cashu.space';

// Interfaces for our simulation
export interface Proof {
  amount: number;
  C: string;
  id: string;
  secret: string;
  dleq: {
    s: string;
    e: string;
    r: string;
  };
  p2pk?: string; // Optional P2PK lock
}

export interface CashuToken {
  token: string;
  amount: number;
  proofs: Proof[];
  lockTo?: string;
}

export interface SimulationResult {
  success: boolean;
  privateKey: string;
  publicKey: string;
  issuedProofs: Proof[];
  token: string;
  claimedProofs: Proof[];
  message: string;
}

/**
 * Generate a new secp256k1 key pair
 */
export function generateCashuKeys() {
  const privateKeyBytes = randomBytes(32);
  const privateKey = Buffer.from(privateKeyBytes).toString('hex');
  const publicKey = Buffer.from(secp.getPublicKey(privateKeyBytes, true)).toString('hex');
  
  return {
    privateKey,
    publicKey,
  };
}

/**
 * Generate a random ID for proofs
 */
function generateId(): string {
  return Buffer.from(randomBytes(8)).toString('hex');
}

/**
 * Generate a random hex string of given length
 */
function randomHex(length = 64): string {
  return Buffer.from(randomBytes(length / 2)).toString('hex');
}

/**
 * Helper to simulate P2PK locking by adding a 'p2pk' field to each proof
 */
function lockProofs(proofs: Proof[], pubkey: string): Proof[] {
  return proofs.map(proof => ({
    ...proof,
    p2pk: pubkey, // Indicates this proof is locked to the provided public key
  }));
}

/**
 * Simulate creating a mint quote
 */
async function createMintQuote(amount: number) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    quote: {
      id: randomHex(16),
      amount,
      created_time: Date.now(),
      expiry_time: Date.now() + 3600000, // 1 hour from now
    }
  };
}

async function mintProofs(amount: number): Promise<Proof[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Split the amount into powers of 2
  const denominations: number[] = [];
  let remaining = amount;
  let denom = 1;
  
  while (remaining > 0) {
    if (remaining & 1) {
      denominations.push(denom);
    }
    denom *= 2;
    remaining = Math.floor(remaining / 2);
  }
  
  // Create a proof for each denomination
  const id = generateId();
  return denominations.map(amt => ({
    amount: amt,
    C: `02${randomHex(64).substring(0, 62)}`,
    id,
    secret: randomHex(),
    dleq: {
      s: randomHex(),
      e: randomHex(),
      r: randomHex()
    }
  }));
}

/**
 * Encode proofs into a token string
 */
function getEncodedToken(data: { proofs: Proof[], mint: string }): string {
  // This is a simplified version for simulation purposes
  // In real cashu-ts, this performs proper encoding
  const base = `cashuB${randomHex(8)}`;
  const tokenData = Buffer.from(JSON.stringify(data)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return base + tokenData;
}

/**
 * Create a P2PK-locked Cashu token
 */
export async function createP2PKLockedToken(
  amount: number,
  recipientPublicKey: string
): Promise<CashuToken> {
  try {
    // 1) Get a mint quote
    await createMintQuote(amount);
    
    // 2) Mint proofs
    const proofs = await mintProofs(amount);
    
    // 3) Lock proofs with P2PK
    const lockedProofs = lockProofs(proofs, recipientPublicKey);
    
    // 4) Encode token
    const tokenString = getEncodedToken({
      proofs: lockedProofs,
      mint: MINT_URL
    });
    
    return {
      token: tokenString,
      amount,
      proofs: lockedProofs,
      lockTo: recipientPublicKey
    };
  } catch (err) {
    console.error('createP2PKLockedToken error:', err);
    throw err;
  }
}

export async function spendP2PKLockedToken(): Promise<boolean> {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real implementation, this would verify the P2PK signature
    // and process the token, but here we'll just simulate success
    return true;
  } catch (err) {
    console.error('spendP2PKLockedToken error:', err);
    return false;
  }
}

/**
 * Generate a full simulation of P2PK token issuance and claiming
 */
export async function simulateCashuP2PK(amount: number = 10): Promise<SimulationResult> {
  // Generate a key pair
  const { privateKey, publicKey } = generateCashuKeys();
  
  // Issue a P2PK-locked token
  const { proofs, token } = await createP2PKLockedToken(amount, publicKey);
  
  // Simulate claiming the token
  await spendP2PKLockedToken();
  
  // Generate "claimed" proofs (different from the original ones)
  const claimedProofs = await mintProofs(amount);
  
  return {
    success: true,
    privateKey,
    publicKey,
    issuedProofs: proofs,
    token,
    claimedProofs,
    message: 'Successfully created and spent P2PK token!'
  };
}

/**
 * Simulate a tampered token that will fail validation
 */
export async function simulateTamperedToken(result: SimulationResult): Promise<SimulationResult> {
  // Make a copy of the result
  const tamperedResult = { ...result };
  
  // Tamper with the token by appending an 'X'
  tamperedResult.token = result.token + 'X';
  
  // Set success to false
  tamperedResult.success = false;
  tamperedResult.message = 'Token validation failed: Signature verification failed';
  
  return tamperedResult;
}

// Export mint info
export function getMintInfo() {
  return { url: MINT_URL, pubkey: '' };
} 