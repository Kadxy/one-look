<div align="center">

  <h1 align="center">One-Look</h1>

  <p align="center">
    <strong>End-to-End Encrypted & Ephemeral Secret Sharing</strong>
  </p>

  <p align="center">
    <a href="https://one-look.kadxy.com">View Demo</a>
    ·
    <a href="https://github.com/Kadxy/one-look/issues">Report Bug</a>
    ·
    <a href="https://github.com/Kadxy/one-look/pulls">Request Feature</a>
  </p>

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKadxy%2Fone-look&env=REDIS_URL&project-name=one-look&repository-name=one-look)
</div>


## Overview

**One-Look** is a secure, ephemeral secret sharing tool designed for the paranoid.

Unlike other tools, One-Look uses **Client-Side Encryption**. The decryption key is generated in your browser and anchored in the URL fragment (`#`). This means the key **never** hits our servers. We simply store the encrypted blob.

Once a secret is retrieved, it is **atomically deleted** from the database. One look is truly all you get.

## Features

🔒 **End-to-End Encryption**: AES-256-GCM encryption performed entirely in the browser.

👁️ **Zero-Knowledge**: The server sees nothing but encrypted gibberish.

🔥 **Burn on Read**: Secrets are atomically destroyed (Redis `GETDEL`) upon retrieval.

📁 **File Support**: Securely share text or files (default up to 3MB, configurable) encrypted in-flight.

⏱️ **Auto-Expiry**: Configurable TTL (Time To Live) ensures secrets don't rot in the vault.

⚡ **Lightning Fast**: Built on Next.js 16 (App Router) and Redis.

## Deploy Your Own

### Option 1: Docker Compose (self-hosted, recommended)

Ships with a bundled Redis — no external services needed.

```bash
git clone https://github.com/Kadxy/one-look.git
cd one-look
docker compose up -d --build
```

The app listens on `127.0.0.1:3000`. Put a reverse proxy with TLS in front of it — **HTTPS is required** (encryption uses `window.crypto.subtle`, which browsers only expose in secure contexts). Example with [Caddy](https://caddyserver.com/):

```
your-domain.com {
    reverse_proxy 127.0.0.1:3000
}
```

If you use Nginx instead, set `client_max_body_size 10m;` (encrypted file payloads are ~2x the raw file size).

Notes:

- Redis runs in-memory only (`--save "" --appendonly no`): secrets never touch disk, but unread secrets are lost if Redis restarts. Prefer durability? Change the redis `command` in `docker-compose.yml` to use `--appendonly yes` and mount a volume.
- `NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB` is baked in at **build time**. To change it, edit `build.args` in `docker-compose.yml` and run `docker compose up -d --build`.

### Option 2: Vercel

You can deploy your own instance of One-Look in seconds. You only need a Redis instance (e.g., from [Upstash](https://upstash.com/)).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKadxy%2Fone-look&env=REDIS_URL&project-name=one-look&repository-name=one-look)

### Environment Variables

| Variable | Description | Required |
| :--- | :--- | :--- |
| `REDIS_URL` | Connection string for your Redis instance (e.g., `redis://:password@host:port`) | **Yes** |
| `NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB` | Maximum upload file size in MB (default: `3`) | No |

## Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kadxy/one-look.git
   cd one-look
   ```

2.  **Install dependencies**

    ```bash
    pnpm install
    ```

3.  **Set up environment**

    ```bash
    cp .env.example .env
    ```

4.  **Run development server**

    ```bash
    pnpm dev
    ```

## Security Architecture

1.  **Key Generation**: A random AES-256 key is generated via `window.crypto.subtle`.
2.  **Encryption**: The payload (text or file) is encrypted locally using the key and a random IV.
3.  **Storage**: The encrypted data and IV are sent to the server. The key **stays** on the client.
4.  **Link Creation**: The server returns an ID. The client constructs the link: `https://.../s/[ID]#[KEY]`.
5.  **Retrieval**:
      * Browser requests `ID` from server.
      * Server returns encrypted data + IV and **deletes** the record.
      * Browser extracts `KEY` from URL hash and decrypts the data locally.

## License

MIT
