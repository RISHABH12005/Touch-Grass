# Touch Grass — Turning Screen Time into Outdoor Time

*Submission for the [Hacktoberfest Open-Source AI Challenge — Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

## What I Built

**Touch Grass** is an AI-powered outdoor challenge platform built for students at Jaypee University of Engineering and Technology (JUET), Guna.

Students spend a significant amount of time in front of screens for study, communication, and entertainment. I wanted to build something that encourages them to step outside, explore their campus, and reconnect with the world around them.

The platform turns going outdoors into a simple daily challenge. Students can:

- Discover daily, campus-focused outdoor challenges.
- Submit photos as evidence of attempting challenges.
- Use AI-assisted image verification to help assess submissions.
- Track daily activity, completed challenges, and streaks.
- Earn milestones and celebrate their progress.
- View their activity through a personalized dashboard.

The goal is simple: make spending time outdoors more engaging through small, achievable actions and a sense of community.

Touch Grass is designed for JUET students, but the underlying idea can be adapted for other campuses, schools, and communities.

## Demo

- **Live application:** [https://touch-grass-vert.vercel.app](https://touch-grass-vert.vercel.app)
- **Demo video:** [Watch the project walkthrough](https://youtu.be/ot_mVlVPSqs)
- **Source code:** [GitHub repository](https://github.com/RISHABH12005/Touch-Grass)

The application uses a responsive interface so students can access challenges and submit photos from their devices.

## How It Works

1. A student registers and opens their dashboard.
2. The student views the available daily outdoor challenge.
3. They complete the activity outdoors and submit a photo.
4. The server uses a vision-capable AI model to help assess the submitted image.
5. The application records the submission and updates progress, streaks, and milestones.

AI verification assists the review workflow; it does not guarantee that a challenge was completed or prove a student's identity or physical location. Model results may be inaccurate and should be interpreted with appropriate caution.

## Technology Stack

- **Next.js App Router, React, and TypeScript:** Application architecture, interactive interfaces, and server-side functionality.
- **Tailwind CSS:** Responsive UI styling.
- **PostgreSQL and Prisma:** Persistent storage for student records, challenges, submissions, and progress.
- **Ollama and vision-capable models:** AI-assisted image review for submitted challenge photos.
- **Vercel:** Deployment of the web application.

## How I Built It

I built Touch Grass using a modern full-stack web architecture, combining web technologies, database-backed progress tracking, and open-source AI tooling.

The core workflow connects the student-facing dashboard to server-side submission handling, image assessment, and persistent progress records. Ollama provides an adaptable integration for running a vision-capable model locally or through Ollama Cloud, depending on the deployment configuration and model availability.

This setup gives the project room to experiment with different models and deployment approaches without making the entire AI workflow dependent on a single proprietary provider.

## Why Open Innovation Matters

Open innovation matters because useful technology should be something people can understand, adapt, improve, and build upon.

For Touch Grass, using open-source technologies and an adaptable AI integration makes experimentation more accessible. Ollama provides flexibility to explore vision-capable models locally or through its cloud service, evaluate their results, and choose an approach that fits the application's needs and available resources.

Open source also makes collaboration possible. Other developers can inspect the implementation, suggest improvements, contribute features, and adapt the platform for their own campuses.

Most importantly, the idea itself is reusable. A university, school, or local community could build on Touch Grass to encourage outdoor activities, environmental awareness, and healthier digital habits.

I believe open innovation is not just about making code available. It is about giving more people the opportunity to learn, experiment, and turn an idea into something useful.

## My Agent Session

An agent-session or DevRelay recording link is not included in this submission.

## Prize Categories

Open-source AI is a core part of this project through its Ollama-based, vision-capable model integration for image assessment.

Prize and partner categories should be selected in accordance with the official challenge rules and the integrations that qualify.

---

**Built with the idea that sometimes the best thing technology can do is help us spend less time on our screens and more time in the real world.**

**Let's touch grass.**
