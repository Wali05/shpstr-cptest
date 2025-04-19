/**
 * Lightning Network service for HODL invoices
 * 
 * This implements HODL invoice functionality for the Lightning Network.
 */

// Define interfaces
export interface HodlInvoice {
  paymentRequest: string;
  preimage?: string; // Known only to the merchant
  hash: string;
  amount: number;
  expirySeconds: number;
  createdAt: number;
  description: string;
  status: 'pending' | 'settled' | 'canceled' | 'expired';
}

export interface PaymentStatus {
  status: 'success' | 'failed' | 'pending';
  preimage?: string;
  error?: string;
}

// Get Lightning Network configuration from environment variables
const LIGHTNING_NODE_URL = process.env.NEXT_PUBLIC_LIGHTNING_NODE_URL || '';
const LIGHTNING_MACAROON = process.env.NEXT_PUBLIC_LIGHTNING_MACAROON || '';
// Cert is used for secure connections in production
// const LIGHTNING_CERT = process.env.NEXT_PUBLIC_LIGHTNING_CERT || '';

/**
 * Create a HODL invoice
 * 
 * A HODL invoice is a Lightning invoice where the merchant doesn't
 * immediately release the preimage upon payment. Instead, the payment
 * remains in a pending state until the merchant explicitly settles by
 * revealing the preimage.
 */
export async function createHodlInvoice(
  amount: number,
  description: string,
  expirySeconds: number = 86400 // 24 hours
): Promise<HodlInvoice> {
  try {
    // Generate a random preimage (32 bytes)
    const preimage = Array.from(
      window.crypto.getRandomValues(new Uint8Array(32)),
      (byte) => byte.toString(16).padStart(2, '0')
    ).join('');
    
    // Calculate SHA-256 hash of preimage
    const encoder = new TextEncoder();
    const data = encoder.encode(preimage);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(
      new Uint8Array(hashBuffer),
      (byte) => byte.toString(16).padStart(2, '0')
    ).join('');
    
    // Make API request to create a HODL invoice
    const requestBody = {
      value: amount,
      memo: description,
      hash: hash, // The payment hash
      expiry: expirySeconds,
      hodl: true, // Specify that this is a HODL invoice
    };
    
    const response = await fetch(`${LIGHTNING_NODE_URL}/hodlinvoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LIGHTNING_MACAROON}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create HODL invoice: ${errorData}`);
    }
    
    const invoiceData = await response.json();
    console.log('Created HODL invoice:', invoiceData);
    
    // Save the preimage for later settlement
    // In a production environment, you would store this securely
    localStorage.setItem(`preimage_${hash}`, preimage);
    
    return {
      paymentRequest: invoiceData.payment_request,
      preimage: preimage, // Save for merchant use only
      hash: hash,
      amount: amount,
      expirySeconds: expirySeconds,
      createdAt: Math.floor(Date.now() / 1000),
      description: description,
      status: 'pending'
    };
  } catch (error) {
    console.error('Failed to create HODL invoice:', error);
    throw new Error('Failed to create HODL invoice');
  }
}

/**
 * Pay a HODL invoice
 * 
 * This simulates a buyer paying a HODL invoice.
 * The payment will remain in a pending state until
 * the preimage is revealed by the merchant.
 */
export async function payHodlInvoice(
  paymentRequest: string
): Promise<PaymentStatus> {
  try {
    // Make API request to pay the invoice
    const requestBody = {
      payment_request: paymentRequest,
    };
    
    const response = await fetch(`${LIGHTNING_NODE_URL}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LIGHTNING_MACAROON}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to pay HODL invoice: ${errorData}`);
    }
    
    const paymentData = await response.json();
    console.log('Payment initiated:', paymentData);
    
    // In a real HODL invoice implementation, the payment will be pending
    // until the merchant settles it by revealing the preimage
    
    return {
      status: 'pending',
    };
  } catch (error) {
    console.error('Failed to pay HODL invoice:', error);
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Settle a HODL invoice
 * 
 * This is done by the merchant to release the payment
 * by revealing the preimage. This completes the transaction
 * and allows the buyer to claim the payment.
 */
export async function settleHodlInvoice(
  invoice: HodlInvoice
): Promise<boolean> {
  try {
    // Retrieve the preimage - in a real app, you'd get this from secure storage
    const preimage = invoice.preimage || localStorage.getItem(`preimage_${invoice.hash}`);
    
    if (!preimage) {
      throw new Error('Preimage not found for this invoice');
    }
    
    // Make API request to settle the invoice
    const requestBody = {
      hash: invoice.hash,
      preimage: preimage,
    };
    
    const response = await fetch(`${LIGHTNING_NODE_URL}/hodlinvoice/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LIGHTNING_MACAROON}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to settle HODL invoice: ${errorData}`);
    }
    
    console.log('Invoice settled successfully');
    
    // Update the invoice status
    invoice.status = 'settled';
    
    return true;
  } catch (error) {
    console.error('Failed to settle HODL invoice:', error);
    throw new Error('Failed to settle HODL invoice');
  }
}

/**
 * Cancel a HODL invoice
 * 
 * This is done by the merchant to cancel a pending invoice
 * that should no longer be valid.
 */
export async function cancelHodlInvoice(
  invoice: HodlInvoice
): Promise<boolean> {
  try {
    // Make API request to cancel the invoice
    const requestBody = {
      hash: invoice.hash,
    };
    
    const response = await fetch(`${LIGHTNING_NODE_URL}/hodlinvoice/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LIGHTNING_MACAROON}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to cancel HODL invoice: ${errorData}`);
    }
    
    console.log('Invoice canceled successfully');
    
    // Update the invoice status
    invoice.status = 'canceled';
    
    return true;
  } catch (error) {
    console.error('Failed to cancel HODL invoice:', error);
    throw new Error('Failed to cancel HODL invoice');
  }
}

/**
 * Check the status of a HODL invoice
 */
export async function checkHodlInvoiceStatus(
  hash: string
): Promise<'pending' | 'settled' | 'canceled' | 'expired'> {
  try {
    // Make API request to check invoice status
    const response = await fetch(`${LIGHTNING_NODE_URL}/hodlinvoice/${hash}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LIGHTNING_MACAROON}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to check HODL invoice status: ${errorData}`);
    }
    
    const invoiceData = await response.json();
    console.log('Invoice status:', invoiceData);
    
    // Map the status from the API to our status types
    if (invoiceData.settled) {
      return 'settled';
    } else if (invoiceData.canceled) {
      return 'canceled';
    } else if (invoiceData.expired) {
      return 'expired';
    } else {
      return 'pending';
    }
  } catch (error) {
    console.error('Failed to check HODL invoice status:', error);
    throw new Error('Failed to check HODL invoice status');
  }
}

/**
 * Create an automated HODL invoice settlement service
 * 
 * This service would run in the background and automatically
 * settle HODL invoices when certain conditions are met
 * (e.g., order status changed to shipped).
 */
export async function createAutomatedSettlementService(
  orderCompletionCallback: (hash: string) => Promise<boolean>
): Promise<{ cleanup: () => void; addInvoice: (invoice: HodlInvoice) => void }> {
  // Keep track of invoices to monitor
  const monitoredInvoices: { 
    [hash: string]: { 
      invoice: HodlInvoice, 
      checkInterval: NodeJS.Timeout 
    } 
  } = {};
  
  // Function to add an invoice to monitoring
  const addInvoiceToMonitoring = (invoice: HodlInvoice) => {
    // Check every minute if the order has been completed
    const checkInterval = setInterval(async () => {
      try {
        // Check if order is complete
        const isComplete = await orderCompletionCallback(invoice.hash);
        
        if (isComplete) {
          // Settle the invoice
          await settleHodlInvoice(invoice);
          
          // Stop monitoring this invoice
          clearInterval(monitoredInvoices[invoice.hash].checkInterval);
          delete monitoredInvoices[invoice.hash];
        }
      } catch (error) {
        console.error('Error in automated settlement service:', error);
      }
    }, 60000); // Check every minute
    
    // Add to monitored invoices
    monitoredInvoices[invoice.hash] = {
      invoice,
      checkInterval
    };
  };
  
  // Return functions for cleanup and adding invoices
  return {
    cleanup: () => {
      // Clear all intervals
      Object.values(monitoredInvoices).forEach(({ checkInterval }) => {
        clearInterval(checkInterval);
      });
    },
    addInvoice: addInvoiceToMonitoring
  };
} 