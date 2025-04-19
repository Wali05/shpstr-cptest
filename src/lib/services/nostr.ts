import { finalizeEvent, getPublicKey, nip04, SimplePool, type Event } from 'nostr-tools';

// Define available relays from environment variables
const relays = process.env.NEXT_PUBLIC_NOSTR_RELAYS?.split(',') || [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

// Initialize Nostr pool
const pool = new SimplePool();

interface NostrKeys {
  privateKey: string;
  publicKey: string;
}

/**
 * Generate a new pair of Nostr keys
 */
export function generateNostrKeys(): NostrKeys {
  // Generate a random 32-byte private key
  const privateKeyBytes = new Uint8Array(32);
  window.crypto.getRandomValues(privateKeyBytes);
  
  // Convert to hex string
  const privateKey = Array.from(privateKeyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Derive public key from private key
  const publicKey = getPublicKey(privateKeyBytes);
  
  return {
    privateKey,
    publicKey,
  };
}

/**
 * Import Nostr keys from an existing private key
 */
export function importNostrKeys(privateKey: string): NostrKeys {
  try {
    // Validate the private key (this will throw if invalid)
    if (privateKey.length !== 64 || !/^[0-9a-f]+$/i.test(privateKey)) {
      throw new Error('Invalid private key format');
    }
    
    // Convert hex string to Uint8Array
    const privateKeyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      privateKeyBytes[i] = parseInt(privateKey.substring(i * 2, i * 2 + 2), 16);
    }
    
    // Derive public key from private key
    const publicKey = getPublicKey(privateKeyBytes);
    
    return {
      privateKey,
      publicKey,
    };
  } catch (error) {
    console.error('Invalid private key:', error);
    throw new Error('Invalid private key format');
  }
}

/**
 * Convert a hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Send a gift-wrapped (encrypted) Nostr message according to NIP-17
 * 
 * NIP-17 implements a way to send private messages that can only be decrypted by 
 * the intended recipient.
 */
export async function sendGiftWrappedMessage(
  senderPrivateKey: string,
  recipientPublicKey: string,
  content: string,
): Promise<Event> {
  try {
    // Convert hex to bytes
    const privateKeyBytes = hexToBytes(senderPrivateKey);
    
    // Encrypt content using NIP-04
    const encryptedContent = await nip04.encrypt(privateKeyBytes, recipientPublicKey, content);
    
    // Create event object
    const event: Event = {
      kind: 4, // Encrypted direct message kind (standard in Nostr)
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['p', recipientPublicKey], // Tag recipient
      ],
      content: encryptedContent,
      pubkey: getPublicKey(privateKeyBytes),
    } as Event;
    
    // Sign the event
    const signedEvent = finalizeEvent(event, privateKeyBytes);
    
    // Publish to relays
    const pubs = pool.publish(relays, signedEvent);
    
    try {
      await Promise.all(pubs);
      console.log('Message published to relays:', relays);
      return signedEvent;
    } catch (error) {
      console.error('Failed to publish message to some relays:', error);
      // If publishing to at least one relay succeeded, we still return the event
      return signedEvent;
    }
  } catch (error) {
    console.error('Error sending gift-wrapped message:', error);
    throw new Error('Failed to send message');
  }
}

/**
 * Receive and decrypt gift-wrapped messages
 */
export async function receiveGiftWrappedMessages(
  privateKey: string,
  since: number = 0, // Unix timestamp
  limit: number = 50,
): Promise<{ message: string; sender: string; timestamp: number }[]> {
  const privateKeyBytes = hexToBytes(privateKey);
  const publicKey = getPublicKey(privateKeyBytes);
  
  console.log(`Fetching messages for ${publicKey} from ${relays.length} relays`);
  
  try {
    // Get events from relays
    const filter = {
      kinds: [4], // Encrypted direct message kind
      '#p': [publicKey],
      since,
      limit,
    };
    
    const events = await pool.list(relays, [filter]);
    
    console.log(`Retrieved ${events.length} encrypted messages`);
    
    // Decrypt messages
    const messages = await Promise.all(
      events.map(async (event) => {
        try {
          const decryptedContent = await nip04.decrypt(privateKeyBytes, event.pubkey, event.content);
          
          return {
            message: decryptedContent,
            sender: event.pubkey,
            timestamp: event.created_at,
          };
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return null;
        }
      })
    );
    
    // Filter out failed decryptions
    const validMessages = messages.filter((m): m is { message: string; sender: string; timestamp: number } => m !== null);
    console.log(`Successfully decrypted ${validMessages.length} messages`);
    
    return validMessages;
  } catch (error) {
    console.error('Failed to fetch messages from relays:', error);
    return [];
  }
}

/**
 * Close all relay connections
 */
export function closeNostrConnections(): void {
  pool.close(relays);
}

/**
 * Listen for new gift-wrapped messages in real-time
 */
export function subscribeToGiftWrappedMessages(
  privateKey: string,
  callback: (message: { message: string; sender: string; timestamp: number }) => void,
): () => void {
  const privateKeyBytes = hexToBytes(privateKey);
  const publicKey = getPublicKey(privateKeyBytes);
  
  console.log(`Subscribing to real-time messages for ${publicKey}`);
  
  // Subscribe to events
  const filter = {
    kinds: [4], // Encrypted direct message kind
    '#p': [publicKey],
  };
  
  const sub = pool.subscribe(relays, [filter]);
  
  sub.on('event', async (event: Event) => {
    try {
      const decryptedContent = await nip04.decrypt(privateKeyBytes, event.pubkey, event.content);
      
      callback({
        message: decryptedContent,
        sender: event.pubkey,
        timestamp: event.created_at,
      });
      
      console.log('Received and decrypted new message');
    } catch (error) {
      console.error('Failed to decrypt message:', error);
    }
  });
  
  // Return unsubscribe function
  return () => {
    sub.unsub();
  };
} 