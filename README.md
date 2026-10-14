# Touch Grass — Turning Screen Time into Outdoor Time

*Submission for the [Hacktoberfest Open-Source AI Challenge — Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

## Project Overview

**Touch Grass** is an AI-assisted outdoor challenge platform created for students at Jaypee University of Engineering and Technology (JUET), Guna. The project encourages students to take breaks from screens, spend more time outdoors, and explore their campus through small, achievable daily activities.

Students can discover a campus-focused challenge, upload a photo showing their attempt, and track their participation through a personalized dashboard. AI-assisted image verification helps review photo submissions, while progress tracking supports consistency and achievement.

## Features

- **Daily outdoor challenges:** Discover activities that encourage students to step outside and engage with campus life.
- **Photo-based submissions:** Submit a photo as evidence of attempting a challenge.
- **AI-assisted image review:** Use a vision-capable model to help assess submitted images.
- **Activity tracking:** Keep track of submissions, completed challenges, and personal progress.
- **Streaks and milestones:** Highlight consistency and achievements.
- **Personalized dashboard:** View challenge details and activity progress in one place.

Touch Grass is designed around the JUET student experience, but the concept can be adapted for other campuses, schools, and communities.

## Live Demo

- **Website / Student Dashboard:** [https://touch-grass-vert.vercel.app/dashboard](https://touch-grass-vert.vercel.app/dashboard)
- **Demo Video:** [Watch the project walkthrough](https://youtu.be/ot_mVlVPSqs)

The live application demonstrates the deployed experience, while the demo video provides a walkthrough of the project.

## How It Works

1. A student registers and opens their dashboard.
2. The student views the available daily outdoor challenge.
3. The student attempts the activity and submits a photo.
4. A vision-capable AI model helps assess the submitted image.
5. The application records participation and updates progress information, including streaks and milestones where applicable.

AI image verification is intended to assist submission review. It is not definitive proof of a student's identity or physical location, and model results can be mistaken.

## Student Email Verification

Student registration uses a one-time email code before creating a session:

1. Enter the JUET roll number, name, and official `@juetguna.in` email address.
2. Touch Grass emails a 6-digit verification code to that address.
3. Enter the code to finish registration and sign in.
4. The code expires after **5 minutes**. A new code can be requested after a short resend cooldown, and repeated incorrect attempts are limited.

Email delivery uses [Resend](https://resend.com/). Configure these server-side environment variables in Vercel (Production and Preview as needed), or in your local `.env`:

```dotenv
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Touch Grass <verify@your-verified-domain.com>
SESSION_SECRET=your_long_random_secret
```

Verify the sender domain in Resend before sending to student email addresses. Never expose these values through `NEXT_PUBLIC_*` variables or commit them to Git. If these variables are missing or the sender is not authorized, registration will not be able to send verification codes.

## Technology Stack

- **Next.js App Router, React, and TypeScript** — application structure, interactive UI, and server-side functionality.
- **Tailwind CSS** — responsive styling.
- **PostgreSQL and Prisma** — persistent data storage and database access.
- **Ollama and vision-capable models** — AI-assisted review of submitted photos, using a local or cloud configuration.
- **Vercel** — web application deployment.

## Why I Built It

Students spend a significant part of their day using laptops and phones for study, communication, and entertainment. I wanted to explore how technology could encourage a healthier balance rather than demand more screen time for its own sake.

Touch Grass uses daily prompts to make stepping outdoors feel approachable. Photo submissions provide a lightweight way to participate, and progress tracking can help students build a habit over time. The aim is not to replace real-world experiences with an app; it is to use the app as a prompt to get outside.

## Why Open Innovation Matters

Open innovation gives developers and communities the opportunity to inspect, adapt, and improve ideas together. By using open-source technologies and an adaptable AI integration, Touch Grass can be explored and extended by other contributors rather than being limited to a single fixed implementation.

Ollama supports experimentation with vision-capable models in local or cloud environments, depending on configuration and model availability. This flexibility makes it possible to evaluate different options as the project evolves. Other developers can contribute interface improvements, challenge ideas, verification safeguards, accessibility enhancements, and adaptations for their own communities.

For me, open source is more than publishing code: it is an invitation for other people to learn from a project, suggest improvements, and build on the idea.

## AI Use and Limitations

The application uses a vision-capable model to help assess submitted challenge photos. The result is an aid to review, not a guarantee that a challenge was completed. Image analysis cannot reliably establish identity or confirm a person's precise location from a photo alone. AI output may be inaccurate, so the result should be interpreted with appropriate caution.

## Development Session

No agent-session or DevRelay recording link is included in this submission.

## Challenge Categories

This project includes an Ollama-based, vision-capable model integration for AI-assisted image review. Select prize or partner categories only where the project meets the official eligibility and integration requirements.

---

**Built around one simple thought: technology can sometimes help us spend less time on our screens and more time in the real world.**

**Let's touch grass.**
