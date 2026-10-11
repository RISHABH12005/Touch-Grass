# Touch Grass — JUET Outdoor Challenge

**Touch Grass** is a campus-focused web app for the **Jaypee University of Engineering and Technology (JUET), Guna** community. It encourages students to step away from their screens, explore campus, and take part in a simple outdoor challenge each day.

**Live app:** https://touch-grass-vert.vercel.app  
**Demo video:** https://youtu.be/ot_mVIVPSqs  
**Source code:** https://github.com/RISHABH12005/Touch-Grass

## What the project does

Students can register with their name, roll number, and JUET student email, view the daily challenge, and upload a photo as evidence of their attempt. The app brings the challenge and progress-tracking experience into one place.

Key capabilities:

- **Daily outdoor challenges** designed around campus life.
- **Photo submissions** so students can share evidence of completing a challenge.
- **AI-assisted image verification** using a vision-capable Ollama model.
- **Progress tracking** for submissions, completions, streaks, and milestones.
- **Student registration** with roll-number and official email-domain validation.
- **Web deployment** for students to access the app without running it locally.

> Image verification is an automated aid, not definitive proof that a student completed a challenge, is the person in a photo, or was physically at a particular location.

## Why I built it

The idea is straightforward: encourage students to spend more time outdoors and make small campus activities easier to participate in. Daily challenges provide a simple prompt, while submissions and progress tracking help students keep their momentum.

## Technology stack

| Area | Technology |
| --- | --- |
| Application | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL, Neon in production |
| Database toolkit | Prisma |
| Image verification | Ollama local or Ollama Cloud with a vision-capable model |
| Deployment | Vercel |
| Optional local-service access | Cloudflare Tunnel |

## How the flow works

1. A student registers using their name, roll number, and JUET student email.
2. The student views the available daily outdoor challenge.
3. The student completes the activity and submits a photo.
4. The server sends the image for AI-assisted verification when configured.
5. The application records submissions and tracks progress, streaks, and milestones.

## Live demo

Try the deployed application: **https://touch-grass-vert.vercel.app**

Watch the walkthrough: **https://youtu.be/ot_mVIVPSqs**

## Run locally

### Prerequisites

Install Node.js and npm, and make sure you have access to a PostgreSQL database. If you want to test image verification locally, install Ollama and a supported vision model as well.

### Installation

```bash
git clone https://github.com/RISHABH12005/Touch-Grass.git
cd Touch-Grass
npm install
```

Create a local `.env` file based on `.env.example` and configure `DATABASE_URL` to point to your dedicated Touch Grass PostgreSQL database.

Then run:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Never commit `.env` files, production secrets, database credentials, API keys, or tunnel tokens.

## Student email validation

The application normalizes email addresses to lowercase and validates the official `@juetguna.in` domain. It also prevents one student email from being associated with multiple roll numbers.

**Important:** this is domain/format validation only. The app does not currently send an OTP or verify mailbox ownership. Do not describe registration as email-verified until an email provider and verification-token flow have been implemented.

## Configure AI image verification with Ollama

The server supports a local Ollama instance or the Ollama Cloud API. Cloud requests are made server-side so that the API key does not need to be exposed to the browser.

### Option A: Local Ollama

Add the following to your local `.env` file:

```dotenv
OLLAMA_MODE=local
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llava:latest
OLLAMA_TIMEOUT_MS=45000
```

Start Ollama and ensure the selected vision model is installed. A local endpoint is useful for development, but a Vercel deployment cannot access Ollama running only on your computer through `localhost`.

### Option B: Ollama Cloud

Create an API key at [Ollama settings](https://ollama.com/settings/keys). Configure these variables in Vercel Project Settings → Environment Variables, and locally in `.env` when testing:

```dotenv
OLLAMA_MODE=cloud
OLLAMA_API_KEY=replace-with-your-secret-key
OLLAMA_CLOUD_BASE_URL=https://ollama.com/api
OLLAMA_MODEL=gemma4:cloud
OLLAMA_TIMEOUT_MS=45000
```

Choose a currently available **vision-capable** model shown in your Ollama Cloud account. The example model may not be available to every account; confirm model availability and usage/billing requirements before deploying. An HTTP 402 response commonly indicates a billing or model-access limitation. An HTTP 410 response can indicate that a model has been retired.

The application expects a JSON object containing `verified`, `confidence` (from 0 to 1), and `reason`; the parser also accepts several common alternative verdict fields. Review model output before relying on automated moderation because image verification can be incorrect.

**Security:** never prefix the API key with `NEXT_PUBLIC_`, put it in browser-side code, or commit it to the repository. After changing Vercel environment variables, redeploy the application.

## Optional: Cloudflare Tunnel

A quick tunnel can expose a locally running app for temporary testing:

```bash
npm run dev
cloudflared tunnel --url http://localhost:3000
```

Run the commands in separate terminals. The generated `trycloudflare.com` address is temporary and is not intended as a production hostname.

For a persistent hostname, create a tunnel in the Cloudflare dashboard and follow the [Cloudflare Tunnel setup guide](https://developers.cloudflare.com/tunnel/get-started/). Keep tunnel credentials in Cloudflare or your host's secret manager. Cloudflare Tunnel is optional for the Vercel deployment. If using a tunnel to expose a local API or Ollama service, protect it with authentication/Cloudflare Access and never expose an unprotected Ollama API publicly.

## Deployment checklist

Before deploying or testing a production environment:

- [ ] Configure `DATABASE_URL` to use the dedicated Touch Grass PostgreSQL database.
- [ ] Set a strong `ADMIN_SECRET`.
- [ ] Configure the appropriate local or cloud Ollama mode and its required endpoint/key.
- [ ] Keep secrets out of GitHub and client-side environment variables.
- [ ] Redeploy after changing Vercel environment variables.
- [ ] Test student registration, dashboard access, photo submission, and image verification in the deployed environment.

## Data and security notes

- Admin endpoints use the server-side `ADMIN_SECRET`; send it using the `Authorization: Bearer …` header.
- Do not commit `.env` files, API keys, database URLs, or Cloudflare tunnel tokens.
- A student ID is an application identifier; restrict access to student records.
- Photo verification does not establish a student's identity or physical location.
- Reward fulfilment is managed by the organisers and is not automatically guaranteed by the application.
- Review data access and retention practices before using the app with real student submissions.

## Contributing

Contributions, bug reports, and suggestions are welcome. Open an issue in the [GitHub repository](https://github.com/RISHABH12005/Touch-Grass) with clear steps to reproduce a bug or a description of the proposed improvement.

## License

See the repository's [LICENSE](https://github.com/RISHABH12005/Touch-Grass/blob/main/LICENSE) file for reuse terms.
