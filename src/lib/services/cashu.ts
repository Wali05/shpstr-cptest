/**
 * Cashu service for P2PK-locked tokens
 * 
 * This implements P2PK token functionality for Cashu e-cash
 */

// Define interfaces
export interface Token {
  token: string;
  amount: number;
  lockTo?: string; // Public key to lock token to (P2PK)
}

export interface CashuMint {
  url: string;
  pubkey: string;
}

// Add MintInfo interface
export interface MintInfo {
  name?: string;
  pubkey: string;
  version?: string;
  nuts?: string[];
  features?: string[];
  [key: string]: unknown; // For any additional fields
}

// Get mint information from environment variables
const MINT_URL = process.env.NEXT_PUBLIC_CASHU_MINT_URL || 'https://8333.space:3338';
const MINT_PUBKEY = process.env.NEXT_PUBLIC_CASHU_MINT_PUBKEY || '';

/**
 * Create a P2PK-locked Cashu token
 * 
 * In P2PK, the token is locked to a specific public key and
 * can only be spent if the owner has the corresponding private key.
 * 
 * Implementation based on NUT-11: https://github.com/cashubtc/nuts/blob/main/11.md
 */
export async function createP2PKLockedToken(
  amount: number,
  recipientPublicKey: string
): Promise<Token> {
  try {
    // First get the mint information
    const mintInfo = await fetchMintInfo();
    console.log('Mint info:', mintInfo);
    
    // Request a P2PK-locked token from the mint
    const requestBody = {
      amount,
      pubkey: recipientPublicKey,
      lock_type: 'p2pk'
    };
    
    const response = await fetch(`${MINT_URL}/token/p2pk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mint error: ${errorText}`);
    }
    
    const tokenData = await response.json();
    console.log('Created P2PK token:', tokenData);
    
    return {
      token: tokenData.token,
      amount,
      lockTo: recipientPublicKey
    };
  } catch (error) {
    console.error('Failed to create P2PK-locked token:', error);
    throw new Error('Failed to create P2PK-locked token');
  }
}

/**
 * Fetch mint information to verify that it supports P2PK
 */
export async function fetchMintInfo(): Promise<MintInfo> {
  try {
    const response = await fetch(`${MINT_URL}/info`);
    
    if (!response.ok) {
      throw new Error(`Failed to get mint info: ${response.status}`);
    }
    
    const mintInfo = await response.json();
    return mintInfo;
  } catch (error) {
    console.error('Error fetching mint info:', error);
    throw new Error('Failed to fetch mint information');
  }
}

/**
 * Spend a P2PK-locked Cashu token
 * 
 * This requires proving ownership of the private key
 * corresponding to the public key the token is locked to.
 */
export async function spendP2PKLockedToken(
  token: Token,
  privateKey: string
): Promise<boolean> {
  try {
    // Parse the token to get the P2PK condition
    const tokenObj = typeof token.token === 'string' 
      ? JSON.parse(token.token) 
      : token.token;
    
    // Create a signature to prove ownership of the private key
    const message = `spend_token_${Date.now()}`;
    const signature = await signMessage(message, privateKey);
    
    // Send the token and signature to the mint
    const requestBody = {
      token: tokenObj,
      signature,
      message
    };
    
    const response = await fetch(`${MINT_URL}/token/spend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mint error: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Token spent successfully:', result);
    
    return true;
  } catch (error) {
    console.error('Failed to spend P2PK-locked token:', error);
    throw new Error('Failed to spend P2PK-locked token');
  }
}

/**
 * Sign a message with a private key
 * Helper function to create signatures for P2PK operations
 */
async function signMessage(message: string, privateKey: string): Promise<string> {
  try {
    // Convert the private key from hex to bytes
    const keyBytes = hexToBytes(privateKey);
    
    // Import the private key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    
    // Encode the message
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Sign the message
    const signature = await window.crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      data
    );
    
    // Convert the signature to hex
    return bytesToHex(new Uint8Array(signature));
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Error('Failed to sign message');
  }
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get information about the mint
 */
export function getMintInfo(): CashuMint {
  return {
    url: MINT_URL,
    pubkey: MINT_PUBKEY
  };
}

/**
 * Check if a token is valid and can be spent by the user
 */
export async function validateToken(
  token: Token,
  userPublicKey: string
): Promise<boolean> {
  try {
    // Check if token is locked to a specific key
    if (token.lockTo && token.lockTo !== userPublicKey) {
      return false;
    }
    
    // Validate the token with the mint
    const tokenObj = typeof token.token === 'string' 
      ? JSON.parse(token.token) 
      : token.token;
    
    const response = await fetch(`${MINT_URL}/token/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: tokenObj }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.valid === true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

/**
 * Create an escrow contract using P2PK tokens
 * 
 * This creates a token that requires signatures from multiple
 * parties to be spent (similar to multisig).
 */
export async function createEscrowContract(
  amount: number,
  buyerPublicKey: string,
  sellerPublicKey: string,
  arbiterPublicKey?: string
): Promise<Token> {
  try {
    // Create a special P2PK token with multiple keys
    const parties = [buyerPublicKey, sellerPublicKey];
    if (arbiterPublicKey) {
      parties.push(arbiterPublicKey);
    }
    
    // Request an escrow token from the mint
    const requestBody = {
      amount,
      pubkeys: parties,
      lock_type: 'p2pk_multi', // Multiple keys required
      threshold: arbiterPublicKey ? 2 : 2, // Number of signatures required
    };
    
    const response = await fetch(`${MINT_URL}/token/escrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mint error: ${errorText}`);
    }
    
    const tokenData = await response.json();
    
    return {
      token: tokenData.token,
      amount,
      lockTo: JSON.stringify({
        type: 'escrow',
        parties,
        threshold: arbiterPublicKey ? 2 : 2
      })
    };
  } catch (error) {
    console.error('Failed to create escrow contract:', error);
    throw new Error('Failed to create escrow contract');
  }
}

/**
 * Release an escrow to the seller
 */
export async function releaseEscrowToSeller(
  token: Token,
  buyerPrivateKey: string,
  sellerPublicKey: string
): Promise<boolean> {
  try {
    // Parse the token
    const tokenObj = typeof token.token === 'string' 
      ? JSON.parse(token.token) 
      : token.token;
    
    // Sign a message approving the release
    const message = `release_to_${sellerPublicKey}_${Date.now()}`;
    const signature = await signMessage(message, buyerPrivateKey);
    
    // Send the approval to the mint
    const requestBody = {
      token: tokenObj,
      signature,
      message,
      recipient: sellerPublicKey
    };
    
    const response = await fetch(`${MINT_URL}/token/escrow/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mint error: ${errorText}`);
    }
    
    await response.json();
    return true;
  } catch (error) {
    console.error('Failed to release escrow to seller:', error);
    throw new Error('Failed to release escrow to seller');
  }
}

/**
 * Return an escrow to the buyer (refund)
 */
export async function returnEscrowToBuyer(
  token: Token,
  sellerPrivateKey: string,
  buyerPublicKey: string
): Promise<boolean> {
  try {
    // Parse the token
    const tokenObj = typeof token.token === 'string' 
      ? JSON.parse(token.token) 
      : token.token;
    
    // Sign a message approving the return
    const message = `return_to_${buyerPublicKey}_${Date.now()}`;
    const signature = await signMessage(message, sellerPrivateKey);
    
    // Send the approval to the mint
    const requestBody = {
      token: tokenObj,
      signature,
      message,
      recipient: buyerPublicKey
    };
    
    const response = await fetch(`${MINT_URL}/token/escrow/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mint error: ${errorText}`);
    }
    
    await response.json();
    return true;
  } catch (error) {
    console.error('Failed to return escrow to buyer:', error);
    throw new Error('Failed to return escrow to buyer');
  }
} 