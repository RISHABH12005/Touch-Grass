# Touch Grass — JUET Outdoor Challenge

Touch Grass is a web application designed to encourage students at JUET to spend more time outdoors. By completing one outdoor challenge per day, students build a streak and progress toward physical rewards (goodies).

## 🌿 What it is
A gamified outdoor challenge system where students submit photo proof of their daily outdoor activity. An AI Vision model (LLaVA) verifies the image to ensure the challenge was actually completed.

## 🎯 Why it exists
To combat excessive indoor screen time among students by making "touching grass" a daily habit through incentives and streaks.

## ✨ Features
- **Student Identity**: Simple onboarding via Name and Student ID.
- **Daily Challenges**: JUET-oriented outdoor tasks.
- **AI Verification**: Automated image analysis using Ollama + LLaVA.
- **Progress Tracking**: Real-time streak calculation and completion tracking.
- **Goodie Milestones**:
  - 3 Days $\rightarrow$ Digital Badge
  - 7 Days $\rightarrow$ JUET Sticker
  - 14 Days $\rightarrow$ JUET Merchandise
  - 30 Days $\rightarrow$ Special Goodie/Certificate
- **Admin Panel**: Management of challenges and verification logs.

## 🛠 Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon PostgreSQL
- **ORM**: Prisma
- **AI Engine**: Ollama (LLaVA Model)

## 🏗 Architecture
Student $\rightarrow$ Next.js App $\rightarrow$ API Route $\rightarrow$ Ollama (LLaVA) $\rightarrow$ Verification Result $\rightarrow$ Database Update

## 🚀 Local Setup
1. **Clone & Install**:
   \\\ash
   git clone https://github.com/RISHABH12005/Touch-Grass.git
   cd Touch-Grass
   npm install
   \\\
2. **Ollama Configuration**:
   - Install Ollama from [ollama.ai](https://ollama.ai).
   - Pull the vision model: \ollama pull llava\.
   - Ensure Ollama is running locally on \http://127.0.0.1:11434\.
3. **Database Setup**:
   - Create a \.env\ file (see below).
   - Run \
px prisma db push\ and \
px ts-node prisma/seed.ts\.
4. **Run**:
   \\\ash
   npm run dev
   \\\

## 🔑 Environment Variables
Create a \.env\ file:
- \DATABASE_URL\: Your PostgreSQL connection string.
- \OLLAMA_URL\: Your Ollama server endpoint (default: \http://127.0.0.1:11434\).
- \ADMIN_SECRET\: Secret key for admin access.

## 🤖 AI Model
The project uses **LLaVA (Large Language-and-Vision Assistant)** via Ollama. It processes base64 encoded images and a challenge-specific prompt to determine if the student has successfully completed the outdoor task.

## ☁️ Production Deployment
The app is deployed on **Vercel** with a **Neon PostgreSQL** database.

### ⚠️ Important Production Limitation
Vercel server-side functions cannot directly access Ollama running on a private local machine. For the AI verification to work in production, the \OLLAMA_URL\ environment variable must point to a **publicly reachable Ollama-compatible server**. 

Currently, the production deployment is configured for connectivity, but the AI verification requires an external public endpoint to be provided.

## 🛑 Known Limitations
- No GPS verification (relies solely on AI image analysis).
- No facial recognition to prevent photo reuse.
- No social feed or leaderboard.
- No native mobile app.

## 🎃 Hacktoberfest
This project was created for the **Hacktoberfest 2026 Week 1** challenge.
