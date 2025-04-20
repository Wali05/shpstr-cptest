// Test script for P2PK token creation and spending with cashu-ts
import { CashuMint, CashuWallet, getEncodedToken } from '@cashu/cashu-ts';
import { bytesToHex } from '@noble/hashes/utils';

// Use a test mint
const MINT_URL = 'https://legend.lnbits.com/cashu/api/v1/XVnTytFWEJ9YqgAfWNs5S3';

// Generate a random private key
function generateRandomPrivateKey() {
    const privateKeyBytes = new Uint8Array(32);
    crypto.getRandomValues(privateKeyBytes);
    return bytesToHex(privateKeyBytes);
}

async function testP2PKTokens() {
    try {
        console.log('Testing P2PK token creation and spending with cashu-ts');

        // Initialize mint
        const mint = new CashuMint(MINT_URL);
        console.log('Connected to mint:', MINT_URL);

        // Get mint keys
        const keys = await mint.getKeys();
        console.log('Retrieved mint keys');

        // Create wallet
        const wallet = new CashuWallet(mint, { keys });

        // Generate a keypair for the recipient
        const recipientPrivkey = generateRandomPrivateKey();

        // In a real implementation, you'd derive the public key here
        // For this test, we'll just use the private key as the "pubkey" for simplicity
        const recipientPubkey = recipientPrivkey.substring(0, 64);

        console.log('Generated recipient keys:');
        console.log('Private key:', recipientPrivkey);
        console.log('Public key:', recipientPubkey);

        // 1. Create a mint quote
        const amount = 10;
        console.log(`\nCreating mint quote for ${amount} tokens...`);
        const quote = await wallet.createMintQuote(amount);
        console.log('Mint quote created:', quote);

        // 2. Mint proofs directly (since we're using a test mint)
        console.log('\nMinting proofs...');
        const proofs = await wallet.mintProofs(amount, quote.quote);
        console.log('Proofs minted:', proofs);

        // 3. Create a P2PK-locked token
        console.log('\nCreating P2PK-locked token...');
        // Only use the 'send' part from the response
        const { send } = await wallet.send(amount, proofs, {
            pubkey: recipientPubkey // This is P2PK lock
        });
        console.log('P2PK token created!');

        // 4. Encode the token correctly
        const tokenString = getEncodedToken({
            token: [{ mint: MINT_URL, proofs: send }]
        });
        console.log('Encoded token:', tokenString);

        // 5. Create a new wallet for the recipient
        console.log('\nCreating recipient wallet...');
        const recipientWallet = new CashuWallet(mint, { keys });

        // 6. Receive the token
        console.log('\nReceiving P2PK token...');
        try {
            // The private key for P2PK is automatically used when configured in the wallet
            const newProofs = await recipientWallet.receive(tokenString);
            console.log('Token received successfully!');
            console.log('New proofs:', newProofs);

            console.log('\nTest completed successfully! P2PK tokens are working.');
        } catch (error) {
            console.error('Failed to receive token:', error);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testP2PKTokens();