# 🛡️ Shopstr Payment Escrow System Competency Test

A Next.js application for secure payment escrow using Bitcoin technologies, enabling trustless transactions between buyers and merchants with Nostr messaging and dispute resolution.

## 🚀 Features

- **Gift-wrapped Nostr Messages**: Send and receive encrypted messages using NIP-17 protocol
- **P2PK-locked Cashu Tokens**: Create tokens cryptographically locked to specific public keys
- **HODL Invoices**: Time-locked Lightning invoices for secure payment settlement
- **Dispute Resolution**: Open disputes with optional third-party arbitration
- **Real-time Updates**: Live subscription to Nostr relays for messaging

## 🧰 Tech Stack

- Next.js 15.x
- TypeScript
- Nostr Protocol (NIP-17)
- Lightning Network (HODL Invoices)
- Cashu for P2PK tokens
- Tailwind CSS with Shadcn UI
- React Hook Form with Zod validation

## 🔧 Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Access to Nostr relays
- Access to a Cashu mint
- LND node for Lightning features (optional)

### 🛠 Environment Variables

Create a `.env` file in the competency-test directory:

```
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Nostr Configuration
NEXT_PUBLIC_NOSTR_RELAYS=wss://relay.damus.io,wss://nos.lol
NEXT_PUBLIC_NOSTR_RELAY_URL=wss://relay.damus.io
NEXT_PUBLIC_NOSTR_MERCHANT_PUBKEY=npub1...
NEXT_PUBLIC_NOSTR_ARBITER_PUBKEY=npub1...

# Cashu Configuration
NEXT_PUBLIC_CASHU_MINT_URL=https://8333.space:3338
NEXT_PUBLIC_CASHU_MINT_PUBKEY=02...

# Lightning Configuration
NEXT_PUBLIC_LIGHTNING_NODE_URL=https://localhost:10009
NEXT_PUBLIC_LIGHTNING_MACAROON=base64_encoded_macaroon

# Authentication
NEXT_PUBLIC_AUTH_SECRET=your-auth-secret-here

# Feature Flags
NEXT_PUBLIC_ENABLE_DISPUTES=true
NEXT_PUBLIC_ENABLE_HODL_INVOICES=true
```

## Components

- **Nostr Service**: Handles encrypted messaging using Nostr protocol
- **Cashu Service**: Manages P2PK token creation and verification
- **Lightning Service**: Handles HODL invoice creation/settlement
- **Dispute Service**: Manages dispute flow and resolution

## Project Structure

```
competency-test/
├── src/                 
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components for each service
│   │   ├── cashu/       # Cashu token components
│   │   ├── dispute/     # Dispute resolution components
│   │   ├── layout/      # Layout components
│   │   ├── lightning/   # Lightning invoice components
│   │   ├── nostr/       # Nostr messaging components
│   │   └── ui/          # Shadcn UI components
│   └── lib/             # Core functionality
│       ├── services/    # Service integrations
│       │   ├── nostr.ts      # Nostr NIP-17 implementation
│       │   ├── cashu.ts      # Cashu P2PK implementation
│       │   ├── lightning.ts  # Lightning HODL invoice implementation
│       │   └── dispute.ts    # Dispute resolution service
│       └── utils.ts     # Utility functions
│
└── .env                 # Environment variables
```

## Features

- Gift-wrapped Nostr messaging with NIP-17
- P2PK-locked Cashu tokens based on NUT-11
- HODL invoices for time-locked payments
- Multi-signature escrow for token spending
- Third-party dispute arbitration
- Real-time communication

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/shopstr-payment-escrow.git
cd shopstr-payment-escrow
```

### 2. Install Dependencies

```bash
cd competency-test
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit the .env file with your service details
```

### 4. Start Development Server

```bash
npm run dev
```

## Development

- Frontend runs on port 3000
- Access the application at http://localhost:3000
- Gift Messages, P2PK Tokens, HODL Invoices, and Disputes accessible from navbar
- Real-time updates from Nostr relays when available

## License

MIT 
