# 🛡️ Shopstr Competency Test

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

## 📋 Installation Guide

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/shopstr-payment-escrow.git
cd shopstr-payment-escrow
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Step 5: Build for Production (Optional)

```bash
npm run build
npm run start
```

## 🧩 Project Structure

```
shopstr-payment-escrow/
├── src/                 
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components for each service
│   │   ├── cashu/       # Cashu token components
│   │   ├── dispute/     # Dispute resolution components
│   │   ├── layout/      # Layout components
│   │   ├── lightning/   # Lightning invoice components
│   │   ├── nostr/       # Nostr messaging components
│   │   └── ui/          # Shadcn UI components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Core functionality
│       ├── services/    # Service integrations
│       │   ├── nostr.ts      # Nostr NIP-17 implementation
│       │   ├── cashu.ts      # Cashu P2PK implementation
│       │   ├── lightning.ts  # Lightning HODL invoice implementation
│       │   └── dispute.ts    # Dispute resolution service
│       └── utils.ts     # Utility functions
│
├── public/              # Static assets
├── types/               # TypeScript type definitions
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── .env                 # Environment variables (create this file)
```

## 📄 License

MIT 
