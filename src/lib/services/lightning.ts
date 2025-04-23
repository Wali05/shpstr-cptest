/**
 * Lightning Network service for HODL invoices - Simulation
 * 
 * This implements a complete simulation of HODL invoice functionality for Lightning Network
 * without requiring an actual lightning node connection.
 */

// Define interfaces
export interface HodlInvoice {
  id: string;
  paymentRequest: string;
  preimage: string;
  hash: string;
  amount: number;
  description: string;
  status: 'pending' | 'held' | 'settled' | 'canceled';
  createdAt: number;
  expiresAt: number;
}

// Interface for preimage and hash generation result
export interface PreimageAndHash {
  preimage: string;
  hash: string;
}

// Interface for complete simulation result
export interface SimulationResult {
  preimageAndHash: PreimageAndHash;
  originalInvoice: HodlInvoice;
  heldInvoice: HodlInvoice;
  settledInvoice: HodlInvoice;
  failedSettlement: HodlInvoice;
  canceledInvoice: HodlInvoice;
  expiredInvoice: HodlInvoice;
}

/**
 * Generate a preimage and hash for a HODL invoice
 */
export function generatePreimageAndHash(): PreimageAndHash {
  // Create a random preimage (32 bytes)
  const preimageArray = new Uint8Array(32);
  window.crypto.getRandomValues(preimageArray);
  const preimage = Array.from(preimageArray, byte => 
    byte.toString(16).padStart(2, '0')).join('');
    
  // For synchronous usage, just return the preimage and compute a temporary hash
  // This will be replaced by the actual SHA-256 hash in the simulateHodlInvoice function
  return { 
    preimage, 
    hash: preimage.split('').reverse().join('') // Temporary hash for synchronous usage
  };
}

/**
 * Hash a preimage using SHA-256
 */
export async function hashPreimage(preimage: string): Promise<PreimageAndHash> {
  try {
    // Convert hex preimage to bytes
    const preimageBytes = new Uint8Array(preimage.match(/.{1,2}/g)!.map(byte => 
      parseInt(byte, 16)));
    
    // Use the Web Crypto API to create a SHA-256 hash
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', preimageBytes);
    
    // Convert the hash to a hex string
    const hash = Array.from(new Uint8Array(hashBuffer), byte => 
      byte.toString(16).padStart(2, '0')).join('');
    
    return { preimage, hash };
  } catch (error) {
    console.error('Failed to hash preimage:', error);
    throw new Error('Failed to hash preimage');
  }
}

/**
 * Generate a unique invoice ID
 */
function generateInvoiceId(): string {
  return Array.from(
    window.crypto.getRandomValues(new Uint8Array(16)),
    byte => byte.toString(16).padStart(2, '0')
  ).join('');
}

/**
 * Create a HODL invoice
 * 
 * A HODL invoice is a Lightning invoice where the payment is held until
 * the merchant explicitly settles it by revealing the preimage.
 */
export function createHodlInvoice(
  amount: number,
  description: string,
  hash: string,
  expirySeconds: number = 86400 // 24 hours
): HodlInvoice {
  const id = generateInvoiceId();
  const now = Math.floor(Date.now() / 1000);
    
  // Create a mock payment request
  const paymentRequest = `lnbcrt${amount}p1${hash.substring(0, 12)}s${id.substring(0, 8)}`;
    
    return {
    id,
    paymentRequest,
    preimage: '', // Preimage is not revealed yet
    hash,
    amount,
    description,
      status: 'pending',
    createdAt: now,
    expiresAt: now + expirySeconds
  };
}

/**
 * Pay a HODL invoice (simulate payment being held)
 */
export function payHodlInvoice(invoice: HodlInvoice): HodlInvoice {
  // Check if the invoice is expired
  const now = Math.floor(Date.now() / 1000);
  if (now > invoice.expiresAt) {
    throw new Error('Invoice has expired');
}

  // Check if the invoice is already settled or canceled
  if (invoice.status === 'settled' || invoice.status === 'canceled') {
    throw new Error(`Invoice cannot be paid: status is ${invoice.status}`);
  }
  
  // Return a new invoice with status set to 'held'
  return {
    ...invoice,
    status: 'held'
  };
}

/**
 * Settle a HODL invoice by revealing the preimage
 */
export async function settleHodlInvoice(
  invoice: HodlInvoice, 
  providedPreimage: string
): Promise<HodlInvoice> {
  // Check if the invoice is expired
  const now = Math.floor(Date.now() / 1000);
  if (now > invoice.expiresAt) {
    throw new Error('Invoice has expired and cannot be settled');
  }
  
  // Check if the invoice is in a state that can be settled
  if (invoice.status !== 'held') {
    throw new Error(`Invoice cannot be settled: status is ${invoice.status}`);
    }
    
  try {
    // Verify the provided preimage by hashing it
    const { hash } = await hashPreimage(providedPreimage);
    
    // Check if the hash matches
    if (hash === invoice.hash) {
      // If the hash matches, settle the invoice
      return {
        ...invoice,
        status: 'settled',
        preimage: providedPreimage
      };
    } else {
      // If the hash doesn't match, keep the invoice in 'held' state
      console.warn('Settlement failed: Provided preimage does not match hash');
      return invoice;
    }
  } catch (error) {
    console.error('Error verifying preimage:', error);
    throw new Error('Failed to verify preimage');
  }
}

/**
 * Cancel a HODL invoice
 */
export function cancelHodlInvoice(invoice: HodlInvoice): HodlInvoice {
  // Check if the invoice can be canceled
  if (invoice.status === 'settled') {
    throw new Error('Invoice cannot be canceled: already settled');
  }
  
  // Return a new invoice with status set to 'canceled'
  return {
    ...invoice,
    status: 'canceled'
  };
}

/**
 * Check if an invoice is expired
 */
export function isInvoiceExpired(invoice: HodlInvoice): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now > invoice.expiresAt;
    }
    
/**
 * Create a simulated expired invoice
 */
export function createExpiredInvoice(invoice: HodlInvoice): HodlInvoice {
  const now = Math.floor(Date.now() / 1000);
  
  return {
    ...invoice,
    expiresAt: now - 100 // Expired 100 seconds ago
  };
}

/**
 * Run a complete HODL invoice simulation lifecycle
 */
export async function simulateHodlInvoice(
  amount: number = 5000,
  description: string = "Shopstr order #" + Math.floor(Math.random() * 10000)
): Promise<SimulationResult> {
  try {
    // 1. Generate preimage and hash
    const initialPreimageAndHash = generatePreimageAndHash();
    // Get the proper hash using the crypto API
    const { preimage, hash } = await hashPreimage(initialPreimageAndHash.preimage);
    
    // 2. Create the original invoice
    const originalInvoice = createHodlInvoice(amount, description, hash);
    
    // 3. Simulate payment (invoice is held)
    const heldInvoice = payHodlInvoice(originalInvoice);
    
    // 4. Simulate successful settlement
    const settledInvoice = await settleHodlInvoice(heldInvoice, preimage);
    
    // 5. Simulate failed settlement with incorrect preimage
    const wrongPreimage = Array.from(
      window.crypto.getRandomValues(new Uint8Array(32)),
      byte => byte.toString(16).padStart(2, '0')
    ).join('');
    const failedSettlement = await settleHodlInvoice(heldInvoice, wrongPreimage);
    
    // 6. Simulate cancellation
    const canceledInvoice = cancelHodlInvoice(heldInvoice);
    
    // 7. Simulate an expired invoice
    const expiredInvoice = createExpiredInvoice(heldInvoice);
    
    // Return the complete simulation result
    return {
      preimageAndHash: { preimage, hash },
      originalInvoice,
      heldInvoice,
      settledInvoice,
      failedSettlement,
      canceledInvoice,
      expiredInvoice
    };
  } catch (error) {
    console.error('HODL invoice simulation failed:', error);
    throw new Error('HODL invoice simulation failed');
  }
}

/**
 * Format a timestamp as a human-readable date
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format a time duration in seconds as a human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} minutes`;
  } else if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hours`;
  } else {
    return `${Math.floor(seconds / 86400)} days`;
  }
} 