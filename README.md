# WEAR — Smart Wardrobe Organizer

> AI-powered outfit generator & digital wardrobe management app  
> **COMP6100001 — Software Engineering AOL Project | BINUS University, Semester 4**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://wear-wardrobeorganizer-s-eproject.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/Rafifdiya/wear_wardrobeorganizer_SEproject)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)

---

## Overview

WEAR is a smart wardrobe organizer web application that helps users digitize their clothing collection and generate outfit recommendations. It features a **dual-mode outfit generator** — AI-powered suggestions via Google Gemini, with automatic fallback to a rule-based offline engine when AI is unavailable.

**Problem:** People often struggle with deciding what to wear, forgetting what clothes they own, and building cohesive outfits from their existing wardrobe.

**Solution:** WEAR provides a centralized digital wardrobe with intelligent outfit generation, style tracking, and personal statistics — all in a clean, intuitive interface.

---

## Live Demo

**[https://wear-wardrobeorganizer-s-eproject.vercel.app](https://wear-wardrobeorganizer-s-eproject.vercel.app)**

---

## Features

### Wardrobe Management
- Add, edit, and delete clothing items with photo uploads
- Categorize by type, color, season, occasion, and style tag
- Visual grid layout with color-coded categories
- Create and save outfit combinations

### Dual-Mode Outfit Generator
| Mode | Description |
|------|-------------|
| **AI Mode** | Sends wardrobe context to Google Gemini API — returns outfit recommendation with style reasoning, color analysis, and personalized tips |
| **Offline Mode** | Rule-based engine (`lib/engine.ts`) — scores items by occasion/season/color harmony match, works with zero internet dependency |

The app auto-detects AI availability and falls back to Offline Mode gracefully if the API is unreachable.

### User System
- Register & login with secure authentication
- bcrypt password hashing (cost factor 12)
- httpOnly session cookie (`wear_session`) with Remember Me support
- Onboarding tour for new users (5-step animated modal)

### Profile & Style Stats
- Edit personal info, upload avatar, change password
- Set default style preferences (occasion, season, mood)
- Track AI vs. offline outfit generation counts
- Delete account with full data cleanup

### Security
- Rate limiting on login endpoint (5 attempts / 15 min per IP)
- XSS sanitization on all user string inputs
- Password validation (min 5 chars, must contain letter + number)
- Supabase Row Level Security (RLS) on all tables

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 + Tailwind CSS 4 + shadcn/ui |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |
| **Fonts** | Playfair Display (headings) + DM Sans (body) |
| **Database** | Supabase (PostgreSQL) + Drizzle ORM |
| **File Storage** | Supabase Storage (clothing-images, avatars buckets) |
| **Auth** | Custom session auth + bcrypt |
| **AI** | Google Gemini API (via `/api/generate` server-side proxy) |
| **Deployment** | Vercel |

---

## Project Structure

```
wear-smart-wardrobe-organizer/
├── app/
│   ├── page.tsx                  # Auth page (login/register)
│   ├── (main)/
│   │   ├── dashboard/            # Dashboard with wardrobe overview
│   │   ├── wardrobe/             # Clothing items + saved outfits
│   │   ├── generator/            # Dual-mode outfit generator
│   │   ├── profile/              # User profile management
│   │   └── stats/                # Style statistics
│   └── api/
│       ├── auth/                 # register, login, logout, me
│       ├── items/                # CRUD clothing items + image upload
│       ├── outfits/              # CRUD saved outfits
│       ├── profile/              # profile, password, avatar, counts
│       ├── onboarding/           # onboarding completion
│       └── generate/             # AI outfit generation proxy
├── components/
│   ├── auth/                     # Auth card (login/register form)
│   ├── wardrobe/                 # Clothing modals, outfit detail
│   ├── onboarding/               # OnboardingTour component
│   └── shared/                   # Toast, sidebar, shared UI
├── lib/
│   ├── store.tsx                 # Global state (WearProvider + useWear)
│   ├── engine.ts                 # Offline outfit generation engine
│   ├── auth.ts                   # Session management
│   ├── sanitize.ts               # XSS input sanitization
│   ├── rate-limit.ts             # Login rate limiter
│   ├── supabase-server.ts        # Server-side Supabase client
│   └── types.ts                  # TypeScript interfaces
├── docs/
│   ├── UML_DIAGRAMS.md           # Use Case, Class, ER, Sequence diagrams
│   ├── RISK_ANALYSIS.md          # 12-item risk register + severity matrix
│   └── GANTT.md                  # Project timeline (Mermaid)
└── drizzle/
    └── schema.ts                 # Database schema
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key *(optional — app works without it)*

### Installation

```bash
# Clone repository
git clone https://github.com/Rafifdiya/wear_wardrobeorganizer_SEproject.git
cd wear_wardrobeorganizer_SEproject/wear-smart-wardrobe-organizer

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create `.env.local` with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_PROJECT_REF=your_project_ref

# Database (Direct connection)
DATABASE_URL=postgresql://postgres:password@db.your-ref.supabase.co:5432/postgres

# AI (optional — app falls back to Offline Mode if empty)
GEMINI_API_KEY=your_gemini_api_key
```

> **Note:** The app is fully functional without `GEMINI_API_KEY`. The Offline Mode rule-based engine handles all outfit generation locally.

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Authenticate user, set session cookie |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Get current authenticated user |
| GET/POST | `/api/items` | List all / add clothing item |
| PATCH/DELETE | `/api/items/[id]` | Edit / delete clothing item |
| POST | `/api/items/upload` | Upload clothing photo to Supabase Storage |
| GET/POST | `/api/outfits` | List all / save new outfit |
| DELETE | `/api/outfits/[id]` | Delete saved outfit |
| GET/PATCH | `/api/profile` | Get / update profile info |
| PATCH | `/api/profile/password` | Change password |
| POST | `/api/profile/avatar` | Upload avatar photo |
| POST | `/api/profile/counts` | Increment outfit generation counters |
| PATCH | `/api/onboarding` | Mark onboarding as completed |
| POST | `/api/generate` | AI outfit generation (proxies to Gemini API) |

---

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | User accounts (id, username, email, password_hash, profile info, style prefs) |
| `sessions` | Auth sessions (id, user_id, expires_at) |
| `clothing_items` | Wardrobe items (id, user_id, name, category, color, season, occasion, image_url) |
| `outfits` | Saved outfits (id, user_id, name, occasion, season, mode) |
| `outfit_items` | Junction table linking outfits to clothing items |

Row Level Security (RLS) enabled on all tables — users can only access their own data.

---

## Documentation

Full project documentation is available in the `/docs` folder:

- **[UML Diagrams](docs/UML_DIAGRAMS.md)** — Use Case Diagram, Class Diagram, ER Diagram, and 4 Sequence Diagrams (with PNG exports)
- **[Risk Analysis](docs/RISK_ANALYSIS.md)** — 12-item risk register with probability/impact matrix
- **[Gantt Chart](docs/GANTT.md)** — Full project timeline visualization

Additional docs: `WEAR_SRS.txt`, `WEAR_UseCase.txt`, `WEAR_ERD.txt`, `WEAR_SystemArchitecture.txt`, `WEAR_Wireframe.txt`

---

## Team

| Name | Role |
|------|------|
| Rafifdiya | Full-stack Developer |
| Kevano Christiawan | Full-stack Developer |
| Jason Firenze Trianto | Full-stack Developer |
| Ahmad Daffa Hidayatullah | Full-stack Developer |

**Course:** COMP6100001 — Software Engineering  
**Institution:** BINUS University  
**Semester:** 4 — Academic Year 2025/2026

---

## Security Notes

- Never commit `.env.local` to version control
- Session cookies are `httpOnly` and `sameSite: lax`
- All user inputs are sanitized against XSS before database write
- Passwords are hashed with bcrypt (cost 12) and never stored in plaintext
