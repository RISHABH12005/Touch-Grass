# Touch Grass — JUET Outdoor Challenge

A responsive web application that encourages students at **Jaypee University of Engineering and Technology (JUET), Guna** to spend time outdoors by completing one campus-focused challenge each day.

**Live app:** https://touch-grass-vert.vercel.app  
**Repository:** https://github.com/RISHABH12005/Touch-Grass

## Overview

Students identify themselves with their name and student ID, view the daily outdoor challenge, and submit a photo as evidence. The app tracks submissions, completions, streaks, and progress toward milestone rewards.

The project is built with Next.js App Router and TypeScript. Prisma provides database access to PostgreSQL. Image verification uses an Ollama-compatible vision model when a reachable model endpoint is configured.

## Features

- **Student onboarding** using a full name and student ID.
- **Daily outdoor challenge** with a title and description.
- **Photo submission** for challenge evidence.
- **AI-assisted image verification** through Ollama and a vision model such as LLaVA, when the model endpoint is reachable from the server.
- **Progress tracking** for completions and streaks.
- **Milestone rewards** at 3, 7, 14, and 30 consecutive days.
- **Admin interface** for challenge-related management and verification workflows.
- **Responsive UI** for mobile and desktop screens.

### Milestone rewards

| Consecutive days | Milestone |
| ---: | --- |
| 3 | Digital badge |
| 7 | JUET sticker |
| 14 | JUET merchandise |
| 30 | Special goodie or certificate |

Reward fulfilment depends on the organisers and is not automatically guaranteed by the application.

## Technology stack

| Area | Technology |
| --- | --- |
| Framework | Next.js App Router |
| Language | TypeScript |
| UI styling | Tailwind CSS |
| Database | PostgreSQL (Neon in production) |
| ORM | Prisma |
| Image verification | Ollama + a vision model (for example, LLaVA) |
| Deployment | Vercel |

## Repository structure

The main application code follows the Next.js `src/` convention:

```text
Touch-Grass/
├── prisma/
│   ├── schema.prisma       # Database models and relations
│   └── seed.ts             # Idempotent initial challenge/milestone data
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── api/            # App Router API endpoints
│   │   ├── admin/          # Admin interface
│   │   ├── challenge/      # Daily challenge and photo submission
│   │   ├── dashboard/      # Student progress dashboard
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Student entry/onboarding page
│   ├── components/
│   │   └── ui/             # Shared UI components
│   └── lib/
│       ├── ai/             # Ollama/image-verification integration
│       ├── challenges/     # Daily challenge selection logic
│       └── db/             # Prisma client/database access
├── .env.example            # Documented environment-variable template, if present
├── next.config.ts
├── package.json
├── prisma.config.ts        # If used by the checked-out Prisma setup
├── tsconfig.json
└── README.md
```

> This is a guide to the main areas, not an exhaustive file listing. Check the repository for the exact current filenames and API route names.

## How the application works

1. A student enters their name and student ID.
2. The app loads the daily challenge.
3. The student selects and submits a photo.
4. The server sends the image and challenge context to the configured vision model for verification.
5. The application records the submission and, when accepted, the completion.
6. The dashboard reflects completion history, streaks, and milestone progress.

## Requirements

- Node.js compatible with the project's Next.js version (Node.js 20.9+ is a baseline for Next.js 16; use the version configured for deployment).
- npm.
- A PostgreSQL database.
- Ollama and a compatible vision model for AI verification during local development.

## Local development

### 1. Clone the repository

```bash
git clone https://github.com/RISHABH12005/Touch-Grass.git
cd Touch-Grass
npm install
```

### 2. Configure environment variables

Create a local `.env` file in the project root. Do not commit it.

At minimum, configure the PostgreSQL connection string:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

Set any additional variables required by the current implementation, such as the Ollama endpoint or admin secret, only after checking the code for the exact variable names. Keep credentials private and never paste them into issues or commits.

For local Ollama, the endpoint is commonly:

```dotenv
OLLAMA_URL="http://127.0.0.1:11434"
```

Use the exact variable name expected by the code. The database URL above is an example format, not a working credential.

### 3. Set up the database

Review `prisma/schema.prisma` and confirm that `DATABASE_URL` points to the **dedicated Touch Grass database**, never another project's database.

Generate the Prisma client and apply the schema:

```bash
npx prisma generate
npx prisma db push
```

Seed the initial challenge and milestone records:

```bash
npx ts-node prisma/seed.ts
```

The seed script is intended to be idempotent and add missing initial records. Still, verify the database target before running it. Do not run seeding against a database you have not positively identified.

### 4. Configure Ollama (optional for UI development)

Install Ollama from https://ollama.com and pull a vision model supported by the application. For LLaVA:

```bash
ollama pull llava
ollama serve
```

Keep Ollama running while testing locally. Confirm that the model name and endpoint match the values expected by the code.

### 5. Run the development server

```bash
npm run dev
```

Open http://localhost:3000.

## Useful commands

```bash
npm run dev          # Start the local development server
npm run build        # Generate Prisma client and build the Next.js app
npm run start        # Start the built app
npm run lint         # Run ESLint
npx tsc --noEmit     # Type-check TypeScript
```

Run these commands from the repository root. The available scripts are defined in `package.json`.

## Production deployment

The production app is hosted on Vercel and uses a dedicated Neon PostgreSQL database.

Before deploying:

1. Confirm Vercel is connected to `RISHABH12005/Touch-Grass` and the intended production branch.
2. Confirm the Vercel **Root Directory** points to the directory containing this project's `package.json` and `src/app/`.
3. Configure production environment variables in Vercel's Project Settings; do not commit production `.env` files.
4. Ensure `DATABASE_URL` points to the dedicated Touch Grass Neon database.
5. Run a fresh deployment and inspect the build logs. A deployment is successful only when Vercel reports **Ready**.
6. Test the homepage, onboarding, daily challenge API, dashboard, and submission workflow against production.

### Production AI limitation

Vercel functions cannot reach Ollama running only on a developer's private computer or localhost. AI verification in production requires an Ollama-compatible endpoint that the deployed server can reach. If no such endpoint is configured, treat production AI verification as unavailable; do not report the full submission workflow as verified.

## Data and security notes

- Never commit `.env`, `.env.local`, `.env.production`, API keys, database URLs, or other secrets.
- Use a dedicated database for this project. Never run Prisma schema or seed commands against an unrelated project's database.
- The student ID is used as an application identifier; do not expose student data unnecessarily.
- Photo-based AI verification is not proof of physical location or identity.
- Review admin access controls and validation before exposing administrative endpoints publicly.

## Current limitations

- No GPS-based location verification is described as part of the current workflow.
- AI image checks may be inaccurate and depend on model availability.
- Production AI verification requires a server-reachable model endpoint.
- Reward distribution is handled by the organisers.
- This is a web app, not a native mobile application.

## Contributing

1. Create a feature branch.
2. Make a focused change.
3. Run TypeScript checks, linting, and a production build where possible.
4. Describe what changed and how it was tested in the pull request.
5. Never include credentials, private student data, or unrelated generated files.

## Project context

Created for the **Hacktoberfest 2026 Week 1** challenge.

## License

No license is declared here unless a license file is present in the repository. Check the repository's `LICENSE` file before reusing or redistributing the code.
