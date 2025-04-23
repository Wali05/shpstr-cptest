import { NextRequest, NextResponse } from 'next/server';
import { sendGiftWrappedMessage } from '@/lib/services/nostr';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.content || !body.recipientPubkey || !body.senderPrivkey) {
      return NextResponse.json(
        { error: 'Missing required fields: content, recipientPubkey, senderPrivkey' },
        { status: 400 }
      );
    }
    
    // Send the gift-wrapped message
    const event = await sendGiftWrappedMessage(
      body.senderPrivkey,
      body.recipientPubkey,
      body.content
    );
    
    return NextResponse.json({ 
      success: true, 
      event: {
        id: event.id,
        pubkey: event.pubkey,
        created_at: event.created_at,
        kind: event.kind
      }
    });
  } catch (error) {
    console.error('Error sending gift-wrapped message:', error);
    return NextResponse.json(
      { error: 'Failed to send message. ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 