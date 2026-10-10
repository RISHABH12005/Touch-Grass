# Touch Grass — JUET Outdoor Challenge

A responsive web application that encourages students at **Jaypee University of Engineering and Technology (JUET), Guna** to spend time outdoors by completing one campus-focused challenge each day.

**Live app:** https://touch-grass-vert.vercel.app  
**Repository:** https://github.com/RISHABH12005/Touch-Grass

Students register with their name, roll number, and official JUET student email, view the daily challenge, and submit a photo as evidence. The app tracks submissions, completions, streaks, and milestones.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- PostgreSQL (Neon in production) and Prisma
- Ollama local or Ollama Cloud vision-capable model for image verification
- Vercel deployment; optional Cloudflare Tunnel for locally hosted services

## Local setup

```bash
git clone https://github.com/RISHABH12005/Touch-Grass.git
cd Touch-Grass
npm install
```

Create a local `.env` from `.env.example`, then set `DATABASE_URL` to your dedicated Touch Grass PostgreSQL database. Never commit environment files or production secrets.

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000.

## Email registration

The app normalizes email addresses to lowercase and validates the official `@juetguna.in` domain. It prevents one student email from being linked to multiple roll numbers. This is **format/domain validation only**; it does not currently send an OTP or verify mailbox ownership. Add an email provider and verification-token flow before describing registration as email-verified.

## Ollama image verification

The server can use either a local Ollama instance or the direct Ollama Cloud API. Cloud requests are sent from the server, not the browser, so the API key stays private.

### Local model

Set in `.env`:

```dotenv
OLLAMA_MODE=local
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llava:latest
OLLAMA_TIMEOUT_MS=45000
```

Run Ollama and ensure the selected vision model is installed. A local endpoint is suitable for development, but Vercel cannot reach Ollama running only on your laptop through `localhost`.

### Ollama Cloud

Create an API key from https://ollama.com/settings/keys and configure these environment variables in Vercel Project Settings → Environment Variables (and locally in `.env` when testing):

```dotenv
OLLAMA_MODE=cloud
OLLAMA_API_KEY=replace-with-your-secret-key
OLLAMA_CLOUD_BASE_URL=https://ollama.com/api
OLLAMA_MODEL=qwen3-vl:235b-cloud
OLLAMA_TIMEOUT_MS=45000
```

Choose a currently available **vision-capable** model from your Ollama Cloud account/model list. The example uses Ollama's documented Qwen3-VL 235B cloud model; confirm availability for your account before deploying. Never prefix the API key with `NEXT_PUBLIC_`, place it in client code, or commit it. After changing Vercel variables, redeploy.

The application expects a JSON object with `verified`, `confidence` (0–1), and `reason`. Review model output before relying on automated moderation; image verification can be wrong.

## Cloudflare Tunnel (optional)

A quick tunnel can expose the local app for testing:

```bash
npm run dev
cloudflared tunnel --url http://localhost:3000
```

Run those commands in separate terminals. The generated `trycloudflare.com` address is temporary and is not intended for production. For a persistent hostname, create a tunnel in Cloudflare Dashboard → Networking → Tunnels and follow [the official setup guide](https://developers.cloudflare.com/tunnel/get-started/). Store tunnel credentials only in the Cloudflare dashboard or the host's secret manager.

Cloudflare Tunnel is optional for the Vercel deployment. It can be useful to make a local API/model reachable by Vercel, but require authentication/Cloudflare Access and never publish an unprotected Ollama API.

## Deployment checklist

- Set `DATABASE_URL` to the dedicated Touch Grass database.
- Set a strong `ADMIN_SECRET`.
- Select local/cloud Ollama mode and configure the required endpoint/key.
- Do not add secrets to GitHub or expose them in client-side variables.
- Redeploy after updating Vercel environment variables.
- Test registration, dashboard, photo submission, and AI verification against the deployment.

## Data and security

- Admin endpoints use the server-side `ADMIN_SECRET`; send it in the `Authorization: Bearer …` header.
- Do not commit `.env` files, API keys, database URLs, or Cloudflare tunnel tokens.
- The student ID is an application identifier. Limit access to student records.
- Photo verification is not proof of identity or physical location.
- Reward fulfilment is handled by organisers and is not automatically guaranteed.

## License

See the repository's `LICENSE` file for reuse terms.
