/* eslint-disable */
/**
 * Cashu P2PK service with Cashu-TS v2
 */
import { CashuMint, CashuWallet, getEncodedToken, SendResponse, MintKeys } from '@cashu/cashu-ts';

// Environment variables
const MINT_URL = process.env.NEXT_PUBLIC_CASHU_MINT_URL!;
const MINT_PUBKEY = process.env.NEXT_PUBLIC_CASHU_MINT_PUBKEY!;

// Token interface for our service
export interface Token {
  token: string;
  amount: number;
  lockTo?: string;
}

// Initialize Cashu mint and wallet
async function initCashu(): Promise<{ mint: CashuMint; wallet: CashuWallet }> {
  const mint = new CashuMint(MINT_URL);
  const keys = (await mint.getKeys()) as unknown as MintKeys;
  const wallet = new CashuWallet(mint, { keys });
  return { mint, wallet };
}

// Get pre-configured wallet instance
async function getWallet(): Promise<CashuWallet> {
  const { wallet } = await initCashu();
  return wallet;
}

/**
 * Create a P2PK-locked Cashu token
 */
export async function createP2PKLockedToken(
  amount: number,
  recipientPublicKey: string
): Promise<Token> {
  try {
    const wallet = await getWallet();
    // 1) Get a mint quote
    const { quote } = await wallet.createMintQuote(amount);
    // 2) Check quote (in test mint it's auto-approved)
    await wallet.checkMintQuote(quote);
    // 3) Mint proofs
    const proofs = await wallet.mintProofs(amount, quote);
    // 4) Send P2PK-locked proofs
    const sendRes: SendResponse = await wallet.send(amount, proofs, {
      p2pk: { pubkey: recipientPublicKey }
    });
    // 5) Encode token
    const tokenString = getEncodedToken(sendRes as any);
    return { token: tokenString, amount, lockTo: recipientPublicKey };
  } catch (err) {
    console.error('createP2PKLockedToken error:', err);
    throw err;
  }
}

/**
 * Spend/receive a P2PK-locked Cashu token
 */
export async function spendP2PKLockedToken(
  tokenOrString: Token | string
): Promise<boolean> {
  try {
    const wallet = await getWallet();
    const tokenString = typeof tokenOrString === 'string' ? tokenOrString : tokenOrString.token;
    await wallet.receive(tokenString);
    return true;
  } catch (err) {
    console.error('spendP2PKLockedToken error:', err);
    return false;
  }
}

// Export mint info
export function getMintInfo() {
  return { url: MINT_URL, pubkey: MINT_PUBKEY };
}

// --- STUBS for legacy functions not yet migrated to cashu-ts v2 ---

/** stub */
export async function validateToken(token: Token, userPublicKey: string): Promise<boolean> {
  throw new Error('validateToken not implemented');
}

/** stub */
export async function createEscrowContract(
  amount: number,
  buyerPublicKey: string,
  sellerPublicKey: string,
  arbiterPublicKey: string
): Promise<{ id: string; token: Token; amount: number; buyerPublicKey: string; sellerPublicKey: string; arbiterPublicKey: string; status: 'funded' | 'released' | 'refunded' | 'disputed'; createdAt: string }> {
  throw new Error('createEscrowContract not implemented');
}

/** stub */
export async function releaseEscrowToSeller(
  token: Token,
  buyerPrivateKey: string,
  sellerPublicKey: string
): Promise<boolean> {
  throw new Error('releaseEscrowToSeller not implemented');
}

/** stub */
export async function returnEscrowToBuyer(
  token: Token,
  sellerPrivateKey: string,
  buyerPublicKey: string
): Promise<boolean> {
  throw new Error('returnEscrowToBuyer not implemented');
}

/**
 * Utility function to sign a message with a private key
 */
async function signMessage(message: string, privateKey: string): Promise<string> {
  // In a real implementation, this would use a proper signing library
  // For this demo, we'll just return a placeholder
  return `signature_for_${message}_with_key_${privateKey.slice(0, 8)}`;
}

/**
 * Utility function to convert hex to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Utility function to convert bytes to hex
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
} 