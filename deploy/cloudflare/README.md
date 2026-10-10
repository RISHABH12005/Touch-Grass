# Cloudflare Tunnel for Touch Grass

Cloudflare Tunnel publishes a locally hosted service without opening an inbound port. This repository does not include a tunnel token or account-specific hostname.

## Development quick tunnel

1. Start the app locally:

   ```bash
   npm install
   npm run dev
   ```

2. In a second terminal, run:

   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. Open the temporary `https://….trycloudflare.com` URL printed by cloudflared. It works only while the process is running and is intended for testing.

## Persistent tunnel

For a stable hostname, add a domain to Cloudflare and create a remotely-managed tunnel in **Cloudflare Dashboard → Networking → Tunnels**. Configure a published application route whose service is `http://localhost:3000` on the machine running Next.js, then install/run cloudflared using the tunnel token supplied by the dashboard.

Store the tunnel token in the host's service manager or secret store, never in Git. See the official guide: https://developers.cloudflare.com/tunnel/get-started/

## Architecture note

A tunnel running on a developer laptop exposes that laptop's service; it does not run the app inside Vercel. Cloudflare Tunnel is optional if Touch Grass remains on Vercel. It can be useful for exposing a local model or API to Vercel, but protect it with authentication or Cloudflare Access and use a stable hostname. Do not expose an unauthenticated Ollama endpoint to the public internet.
