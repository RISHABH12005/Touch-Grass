# Touch Grass 🌱 — Turning Screen Time into Outdoor Time

*Submission for the [Hacktoberfest Open-Source AI Challenge — Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

## Project Overview

**Touch Grass** is an AI-assisted outdoor challenge platform created for students at Jaypee University of Engineering and Technology (JUET), Guna. The project is built around a simple idea: encourage students to take breaks from screens, spend more time outdoors, and explore the world around their campus through small, achievable daily activities.

The platform turns that idea into a daily experience. Students can discover a campus-focused challenge, upload a photo showing their attempt, and follow their participation through a personalized dashboard. AI-assisted image verification helps review photo submissions, while progress tracking adds a sense of continuity and achievement.

## Features

- **Daily outdoor challenges:** Discover activities designed to encourage students to step outside and engage with campus life.
- **Photo-based submissions:** Submit a photo as evidence of attempting a challenge.
- **AI-assisted image review:** Use a vision-capable model to help assess submitted images.
- **Activity tracking:** Keep track of submissions, completed challenges, and personal progress.
- **Streaks and milestones:** Make participation more engaging by highlighting consistency and achievements.
- **Personalized dashboard:** View challenge details and activity progress in one place.

Touch Grass is designed around the JUET student experience, but the core concept can be adapted for other campuses, schools, and communities.

## Live Demo

- **Website / Student Dashboard:** [https://touch-grass-vert.vercel.app/dashboard](https://touch-grass-vert.vercel.app/dashboard)
- **Demo Video:** [Watch the project walkthrough](https://youtu.be/ot_mVlVPSqs)
- **Source Code:** [RISHABH12005/Touch-Grass on GitHub](https://github.com/RISHABH12005/Touch-Grass)

The live application lets visitors explore the deployed experience. The demo video provides a walkthrough of the project.

## How It Works

1. A student registers and opens their dashboard.
2. The student views the available daily outdoor challenge.
3. The student attempts the activity and submits a photo.
4. A vision-capable AI model helps assess the submitted image.
5. The application records participation and updates progress information, including streaks and milestones where applicable.

AI image verification is intended to assist submission review. It should not be treated as definitive proof of a student's identity or physical location, and model results can be mistaken.

## Technology Stack

- **Next.js App Router, React, and TypeScript** — application structure, interactive UI, and server-side functionality.
- **Tailwind CSS** — responsive styling.
- **PostgreSQL and Prisma** — persistent data storage and database access.
- **Ollama and vision-capable models** — AI-assisted review of submitted photos, using a local or cloud configuration.
- **Vercel** — web application deployment.

## Why I Built It

Students spend a significant amount of their day using laptops and phones for study, communication, and entertainment. I wanted to explore how technology could encourage a healthier balance rather than demand more screen time for its own sake.

Touch Grass uses simple daily prompts to make stepping outdoors feel approachable. Photo submissions provide a lightweight way to participate, and progress tracking can help students build a habit over time. The aim is not to replace real-world experiences with an app; it is to use the app as a prompt to get outside.

## Why Open Innovation Matters

Open innovation gives developers and communities the opportunity to inspect, adapt, and improve ideas together. By building with open-source technologies and an adaptable AI integration, Touch Grass can be explored and extended by other contributors rather than being limited to a single fixed implementation.

Ollama supports experimentation with vision-capable models in local or cloud environments, depending on configuration and model availability. This flexibility makes it possible to evaluate different options as the project evolves. Other developers can also contribute interface improvements, challenge ideas, verification safeguards, accessibility enhancements, and adaptations for their own communities.

For me, open source is more than publishing code: it is an invitation for other people to learn from a project, suggest improvements, and build on the idea.

## AI Use and Limitations

The application uses a vision-capable model to help assess submitted challenge photos. The result is an aid to review, not a guarantee that a challenge was completed. Image analysis cannot reliably establish identity or confirm a person's precise location from a photo alone. AI output may be inaccurate, so the result should be interpreted with appropriate caution.

## Development Session

No agent-session or DevRelay recording link is included in this submission. Add one here if you have a shareable session recording that documents the development workflow.

## Challenge Categories

This project includes an Ollama-based, vision-capable model integration for AI-assisted image review. Select prize or partner categories only where the project meets the official eligibility and integration requirements.

---

**Built around one simple thought: technology can sometimes help us spend less time on our screens and more time in the real world.**

**Let's touch grass. 🌱**
