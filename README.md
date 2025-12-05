# One-Look

**One-Look** is an end-to-end encrypted, ephemeral secret sharing tool. 
Secrets are encrypted in the browser (client-side) before being sent to the server. The server only stores the encrypted blob. The decryption key is part of the URL hash and is never sent to the server.

Once a secret is viewed, it is atomically deleted from the database.

## Features

- **End-to-End Encryption**: AES-256-GCM encryption in the browser.
- **Zero-Knowledge**: The server never sees the key or the plaintext.
- **Burn on Read**: Secrets are deleted instantly upon retrieval (Redis `GETDEL`).
- **File Support**: Securely share text or files (up to 3MB).
- **TTL**: Auto-expiry if not viewed within a set time.

## Getting Started

### Prerequisites

You need a Redis instance. You can use [Upstash](https://upstash.com/) for a free managed Redis database.

### Installation

1. Clone the repository:

   ```bash
   git clone [https://github.com/yourusername/one-look.git](https://github.com/yourusername/one-look.git)
   cd one-look
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Redis URL:

   ```bash
   REDIS_URL="redis://default:password@your-redis-url:port"
   ```

4. Run the development server:

   ```bash
    pnpm dev
    ```

    Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser.

## Deployment on Vercel

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  In the Vercel project settings, go to **Environment Variables**.
4.  Add `REDIS_URL` with your Redis connection string (e.g., from Upstash).
5.  Deploy.

## Security

  - **Encryption**: Web Crypto API (AES-GCM).
  - **Keys**: Generated client-side, embedded in the URL fragment (`#`).
  - **Storage**: Encrypted blobs only.

## License

MIT