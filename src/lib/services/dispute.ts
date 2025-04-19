/**
 * Dispute resolution service
 * 
 * This service handles the process of raising and resolving disputes
 * between buyers and sellers, with optional third-party arbitration.
 */

import { sendGiftWrappedMessage } from './nostr';

// Define interfaces
export interface Dispute {
  id: string;
  orderId: string;
  buyerPubkey: string;
  sellerPubkey: string;
  arbiterPubkey?: string;
  reason: string;
  evidence: string[];
  status: DisputeStatus;
  createdAt: number;
  updatedAt: number;
  resolution?: DisputeResolution;
}

export interface DisputeResolution {
  resolution: 'buyer' | 'seller' | 'partial';
  refundPercentage?: number; // For partial resolutions
  resolvedBy: string; // Pubkey of resolver
  comments: string;
  timestamp: number;
}

export type DisputeStatus = 'pending' | 'evidence-required' | 'arbitration' | 'resolved';

export interface DisputeRequest {
  orderId: string;
  reason: string;
  evidence?: string[];
}

// Get arbiter pubkey from environment variables
const ARBITER_PUBKEY = process.env.NEXT_PUBLIC_NOSTR_ARBITER_PUBKEY || '';

/**
 * Create a new dispute
 */
export async function createDispute(
  buyerPrivateKey: string,
  buyerPubkey: string,
  sellerPubkey: string,
  request: DisputeRequest
): Promise<Dispute> {
  // Generate a unique ID for the dispute
  const id = `dispute_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = Math.floor(Date.now() / 1000);
  
  // Create the dispute object
  const dispute: Dispute = {
    id,
    orderId: request.orderId,
    buyerPubkey,
    sellerPubkey,
    arbiterPubkey: ARBITER_PUBKEY,
    reason: request.reason,
    evidence: request.evidence || [],
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  
  // Notify the seller about the dispute via Nostr
  try {
    await sendGiftWrappedMessage(
      buyerPrivateKey,
      sellerPubkey,
      JSON.stringify({
        type: 'dispute',
        action: 'created',
        dispute: { ...dispute, evidence: request.evidence?.length || 0 }, // Don't send the actual evidence in the notification
      })
    );
    
    // Notify the arbiter if one is specified
    if (ARBITER_PUBKEY) {
      await sendGiftWrappedMessage(
        buyerPrivateKey,
        ARBITER_PUBKEY,
        JSON.stringify({
          type: 'dispute',
          action: 'created',
          dispute: { ...dispute, evidence: request.evidence?.length || 0 },
        })
      );
    }
  } catch (error) {
    console.error('Failed to notify about dispute:', error);
  }
  
  return dispute;
}

/**
 * Add evidence to a dispute
 */
export async function addDisputeEvidence(
  senderPrivateKey: string,
  senderPubkey: string,
  dispute: Dispute,
  evidence: string[]
): Promise<Dispute> {
  // Add the evidence
  dispute.evidence = [...dispute.evidence, ...evidence];
  dispute.updatedAt = Math.floor(Date.now() / 1000);
  
  // Determine who to notify (the other party and the arbiter)
  const recipientPubkey = senderPubkey === dispute.buyerPubkey
    ? dispute.sellerPubkey
    : dispute.buyerPubkey;
  
  // Notify the recipient
  try {
    await sendGiftWrappedMessage(
      senderPrivateKey,
      recipientPubkey,
      JSON.stringify({
        type: 'dispute',
        action: 'evidence-added',
        disputeId: dispute.id,
        evidenceCount: evidence.length,
      })
    );
    
    // Notify the arbiter if one is specified
    if (dispute.arbiterPubkey) {
      await sendGiftWrappedMessage(
        senderPrivateKey,
        dispute.arbiterPubkey,
        JSON.stringify({
          type: 'dispute',
          action: 'evidence-added',
          disputeId: dispute.id,
          evidenceCount: evidence.length,
        })
      );
    }
  } catch (error) {
    console.error('Failed to notify about new evidence:', error);
  }
  
  return dispute;
}

/**
 * Resolve a dispute (buyer and seller agreement)
 */
export async function resolveDisputeByParties(
  resolverPrivateKey: string,
  resolverPubkey: string,
  dispute: Dispute,
  resolution: 'buyer' | 'seller' | 'partial',
  refundPercentage?: number,
  comments: string = ''
): Promise<Dispute> {
  // Ensure the resolver is either the buyer or seller
  if (resolverPubkey !== dispute.buyerPubkey && resolverPubkey !== dispute.sellerPubkey) {
    throw new Error('Only the buyer or seller can propose a resolution');
  }
  
  // Create the resolution
  const disputeResolution: DisputeResolution = {
    resolution,
    refundPercentage: resolution === 'partial' ? refundPercentage : undefined,
    resolvedBy: resolverPubkey,
    comments,
    timestamp: Math.floor(Date.now() / 1000),
  };
  
  // Update the dispute
  dispute.resolution = disputeResolution;
  dispute.status = 'resolved';
  dispute.updatedAt = disputeResolution.timestamp;
  
  // Determine who to notify (the other party and the arbiter)
  const recipientPubkey = resolverPubkey === dispute.buyerPubkey
    ? dispute.sellerPubkey
    : dispute.buyerPubkey;
  
  // Notify the recipient
  try {
    await sendGiftWrappedMessage(
      resolverPrivateKey,
      recipientPubkey,
      JSON.stringify({
        type: 'dispute',
        action: 'resolved',
        disputeId: dispute.id,
        resolution: disputeResolution,
      })
    );
    
    // Notify the arbiter if one is specified
    if (dispute.arbiterPubkey) {
      await sendGiftWrappedMessage(
        resolverPrivateKey,
        dispute.arbiterPubkey,
        JSON.stringify({
          type: 'dispute',
          action: 'resolved',
          disputeId: dispute.id,
          resolution: disputeResolution,
        })
      );
    }
  } catch (error) {
    console.error('Failed to notify about dispute resolution:', error);
  }
  
  return dispute;
}

/**
 * Resolve a dispute by arbiter
 */
export async function resolveDisputeByArbiter(
  arbiterPrivateKey: string,
  arbiterPubkey: string,
  dispute: Dispute,
  resolution: 'buyer' | 'seller' | 'partial',
  refundPercentage?: number,
  comments: string = ''
): Promise<Dispute> {
  // Ensure the resolver is the arbiter
  if (arbiterPubkey !== dispute.arbiterPubkey) {
    throw new Error('Only the assigned arbiter can resolve this dispute');
  }
  
  // Create the resolution
  const disputeResolution: DisputeResolution = {
    resolution,
    refundPercentage: resolution === 'partial' ? refundPercentage : undefined,
    resolvedBy: arbiterPubkey,
    comments,
    timestamp: Math.floor(Date.now() / 1000),
  };
  
  // Update the dispute
  dispute.resolution = disputeResolution;
  dispute.status = 'resolved';
  dispute.updatedAt = disputeResolution.timestamp;
  
  // Notify both parties
  try {
    await sendGiftWrappedMessage(
      arbiterPrivateKey,
      dispute.buyerPubkey,
      JSON.stringify({
        type: 'dispute',
        action: 'resolved-by-arbiter',
        disputeId: dispute.id,
        resolution: disputeResolution,
      })
    );
    
    await sendGiftWrappedMessage(
      arbiterPrivateKey,
      dispute.sellerPubkey,
      JSON.stringify({
        type: 'dispute',
        action: 'resolved-by-arbiter',
        disputeId: dispute.id,
        resolution: disputeResolution,
      })
    );
  } catch (error) {
    console.error('Failed to notify about arbiter resolution:', error);
  }
  
  return dispute;
}

/**
 * Request arbitration for a dispute
 */
export async function requestArbitration(
  requesterPrivateKey: string,
  requesterPubkey: string,
  dispute: Dispute
): Promise<Dispute> {
  // Ensure the requester is either the buyer or seller
  if (requesterPubkey !== dispute.buyerPubkey && requesterPubkey !== dispute.sellerPubkey) {
    throw new Error('Only the buyer or seller can request arbitration');
  }
  
  // Ensure there is an arbiter
  if (!dispute.arbiterPubkey) {
    throw new Error('No arbiter is assigned to this dispute');
  }
  
  // Update the dispute status
  dispute.status = 'arbitration';
  dispute.updatedAt = Math.floor(Date.now() / 1000);
  
  // Notify the arbiter
  try {
    await sendGiftWrappedMessage(
      requesterPrivateKey,
      dispute.arbiterPubkey,
      JSON.stringify({
        type: 'dispute',
        action: 'arbitration-requested',
        disputeId: dispute.id,
        requester: requesterPubkey === dispute.buyerPubkey ? 'buyer' : 'seller',
      })
    );
    
    // Notify the other party
    const otherPartyPubkey = requesterPubkey === dispute.buyerPubkey
      ? dispute.sellerPubkey
      : dispute.buyerPubkey;
    
    await sendGiftWrappedMessage(
      requesterPrivateKey,
      otherPartyPubkey,
      JSON.stringify({
        type: 'dispute',
        action: 'arbitration-requested',
        disputeId: dispute.id,
        requester: requesterPubkey === dispute.buyerPubkey ? 'buyer' : 'seller',
      })
    );
  } catch (error) {
    console.error('Failed to notify about arbitration request:', error);
  }
  
  return dispute;
} 