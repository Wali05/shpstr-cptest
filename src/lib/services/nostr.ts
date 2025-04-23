import { getPublicKey, nip04, Event, finalizeEvent } from 'nostr-tools';
import { randomBytes } from 'crypto';

/**
 * Simulated implementation of Nostr gift-wrapped messages
 * This is a mock implementation for demonstration purposes
 */

export interface NostrKeys {
  privateKey: string;
  publicKey: string;
}

// Interfaces for simulation response
export interface GiftWrappedMessageSimulation {
  keys: {
    sender: {
      publicKey: string;
    };
    receiver: {
      publicKey: string;
    };
    wrapper: {
      publicKey: string;
    };
  };
  originalMessage: string;
  directMsg: Event;
  sealedMsg: Event;
  giftWrappedMsg: Event;
  unwrappedMsg: Event | null;
  decryptedContent: string | null;
  tampered: {
    giftWrappedMsg: Event;
    unwrappedMsg: Event | null;
    decryptedContent: string | null;
  };
}

/**
 * Generate a new Nostr keypair.
 */
export function generateNostrKeys(): NostrKeys {
  // Generate a random 32-byte private key
  const privateKeyHex = randomBytes(32).toString('hex');
  
  // Create a Uint8Array for nostr-tools
  const privateKeyBytes = new Uint8Array(32);
  const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
  for (let i = 0; i < 32; i++) {
    privateKeyBytes[i] = privateKeyBuffer[i];
  }
  
  // Derive public key using nostr-tools
  const publicKey = getPublicKey(privateKeyBytes);
  
  return {
    privateKey: privateKeyHex,
    publicKey,
  };
}

/**
 * Import Nostr keys from an existing private key
 */
export function importNostrKeys(privateKey: string): NostrKeys {
  try {
    // Validate the private key format
    if (privateKey.length !== 64 || !/^[0-9a-f]+$/i.test(privateKey)) {
      throw new Error('Invalid private key format');
    }
    
    // Convert to Uint8Array for nostr-tools
    const privateKeyBytes = new Uint8Array(32);
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    for (let i = 0; i < 32; i++) {
      privateKeyBytes[i] = privateKeyBuffer[i];
    }
    
    // Derive public key using nostr-tools
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
 * Build a plain direct message (kind 14).
 */
export function buildDirectMessage(
  senderPubkey: string,
  receiverPubkey: string,
  message: string
): Event {
  return {
    kind: 14,
    pubkey: senderPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["p", receiverPubkey, "wss://relay.example.com"]],
    content: message,
    id: '', // To be set after signing
    sig: '',
  };
}

/**
 * Compute the event's id and signature.
 */
async function finishEvent(event: Event, privateKey: string): Promise<Event> {
  // Convert private key to Uint8Array for nostr-tools
  const privateKeyBytes = hexToBytes(privateKey);
  
  // Use nostr-tools' finalizeEvent which handles both id generation and signing
  return finalizeEvent(event, privateKeyBytes);
}

/**
 * Convert hex string to Uint8Array for nostr-tools
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(32);
  const buffer = Buffer.from(hex, 'hex');
  for (let i = 0; i < 32; i++) {
    bytes[i] = buffer[i];
  }
  return bytes;
}

/**
 * Seal the message (convert to kind 13).
 */
export async function sealMessage(
  plainEvent: Event,
  senderPrivkey: string,
  receiverPubkey: string
): Promise<Event> {
  // Convert private key to Uint8Array for nostr-tools
  const senderPrivkeyBytes = hexToBytes(senderPrivkey);
    
  const encryptedContent = await nip04.encrypt(
    senderPrivkeyBytes,
    receiverPubkey,
    plainEvent.content
  );

  const sealedEvent: Event = {
    ...plainEvent,
    kind: 13, // Sealed message kind
      content: encryptedContent,
  };
    
  // Finish (sign) the event
  return await finishEvent(sealedEvent, senderPrivkey);
    }

/**
 * Gift-wrap the sealed message (kind 1059).
 */
export async function giftWrapMessage(
  sealedEvent: Event,
  wrappingPrivkey: string,
  receiverPubkey: string
): Promise<Event> {
  // Convert private key to Uint8Array for nostr-tools
  const wrappingPrivkeyBytes = hexToBytes(wrappingPrivkey);
  
  const giftContent = await nip04.encrypt(
    wrappingPrivkeyBytes,
    receiverPubkey,
    JSON.stringify(sealedEvent)
  );

  // Get the wrapper's public key
  const wrappingPubkey = getPublicKey(hexToBytes(wrappingPrivkey));
  
  // Create the gift-wrapped event
  const giftWrappedEvent: Event = {
    kind: 1059, // Gift-wrapped message kind
    pubkey: wrappingPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["p", receiverPubkey]],
    content: giftContent,
    id: '',
    sig: '',
  };

  // Finish (sign) the event
  return await finishEvent(giftWrappedEvent, wrappingPrivkey);
}

/**
 * Unwrap a gift-wrapped message.
 */
export async function unwrapGiftMessage(
  giftWrappedEvent: Event,
  receiverPrivkey: string
): Promise<Event | null> {
        try {
    // Convert private key to Uint8Array for nostr-tools
    const receiverPrivkeyBytes = hexToBytes(receiverPrivkey);
    const senderPubkey = giftWrappedEvent.pubkey;
    
    // Decrypt the gift-wrapped content
    const decryptedContent = await nip04.decrypt(
      receiverPrivkeyBytes,
      senderPubkey,
      giftWrappedEvent.content
    );
    
    // Parse the decrypted content back to an Event object
    return JSON.parse(decryptedContent) as Event;
  } catch (error) {
    console.error("Failed to unwrap gift message:", error);
    return null;
  }
}

/**
 * Unseal (decrypt) a sealed message.
 */
export async function unsealMessage(
  sealedEvent: Event,
  receiverPrivkey: string
): Promise<string | null> {
  try {
    // Convert private key to Uint8Array for nostr-tools
    const receiverPrivkeyBytes = hexToBytes(receiverPrivkey);
    const senderPubkey = sealedEvent.pubkey;
    
    // Decrypt the sealed message content
    return await nip04.decrypt(
      receiverPrivkeyBytes,
      senderPubkey,
      sealedEvent.content
    );
  } catch (error) {
    console.error("Failed to unseal message:", error);
    return null;
  }
}

/**
 * Generate a full gift-wrapped message simulation
 */
export async function generateGiftWrappedMessageSimulation(message: string = "This is a secure message for the Shopstr competency test!"): Promise<GiftWrappedMessageSimulation> {
  // Generate keys for all participants
  const sender = generateNostrKeys();
  const receiver = generateNostrKeys();
  const wrapper = generateNostrKeys();
  
  // Build the direct message
  const directMsg = buildDirectMessage(sender.publicKey, receiver.publicKey, message);
  
  // Seal the message
  const sealedMsg = await sealMessage(directMsg, sender.privateKey, receiver.publicKey);
  
  // Gift-wrap the sealed message
  const giftWrappedMsg = await giftWrapMessage(sealedMsg, wrapper.privateKey, receiver.publicKey);
  
  // Unwrap the gift-wrapped message
  const unwrappedMsg = await unwrapGiftMessage(giftWrappedMsg, receiver.privateKey);
  
  // Unseal the message
  const decryptedContent = unwrappedMsg ? await unsealMessage(unwrappedMsg, receiver.privateKey) : null;
  
  // Create a tampered message (for verification)
  const tamperedGiftWrappedMsg = {
    ...giftWrappedMsg,
    content: giftWrappedMsg.content.substring(0, giftWrappedMsg.content.length - 1) + 'X', // Change last character
  };
  
  const tamperedUnwrappedMsg = await unwrapGiftMessage(tamperedGiftWrappedMsg, receiver.privateKey);
  const tamperedDecryptedContent = tamperedUnwrappedMsg 
    ? await unsealMessage(tamperedUnwrappedMsg, receiver.privateKey) 
    : null;
  
  // Return the complete simulation
  return {
    keys: {
      sender: {
        publicKey: sender.publicKey
      },
      receiver: {
        publicKey: receiver.publicKey
      },
      wrapper: {
        publicKey: wrapper.publicKey
      }
    },
    originalMessage: message,
    directMsg,
    sealedMsg,
    giftWrappedMsg,
    unwrappedMsg,
    decryptedContent,
    tampered: {
      giftWrappedMsg: tamperedGiftWrappedMsg,
      unwrappedMsg: tamperedUnwrappedMsg,
      decryptedContent: tamperedDecryptedContent
    }
  };
}

// For compatibility with the API route
export async function sendGiftWrappedMessage(
  senderPrivateKey: string,
  recipientPublicKey: string,
  content: string,
): Promise<Event> {
  // Instead of actually sending, we simulate the gift wrapping process
  const sender = importNostrKeys(senderPrivateKey);
  const directMsg = buildDirectMessage(sender.publicKey, recipientPublicKey, content);
  const sealedMsg = await sealMessage(directMsg, senderPrivateKey, recipientPublicKey);
  const wrapper = generateNostrKeys(); // Generate a wrapper for simulation
  return await giftWrapMessage(sealedMsg, wrapper.privateKey, recipientPublicKey);
} 