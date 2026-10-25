# GDG Peer Learning

**A gamified peer-learning web app for a GDG (Google Developer Groups) student chapter.**
Members learn through curated sessions and quizzes, ask and answer doubts that mentors verify, and earn points that feed a leaderboard and an activity heatmap.

Built with React, TypeScript and Firebase, with a bottom navigation bar for moving between sections.

## Features

- **Sign up and profile:** email and password accounts. After signing up, each member sets their name, semester, branch, the domains they follow, and an optional GitHub username.
- **Seven domains:** AI/ML, Web Development, App Development, Cloud Computing, DSA & CP, Cybersecurity and IoT. Doubts also have an "Others" category.
- **Learn:** each domain has learning sessions with curated resource links and a short quiz. Passing with 70% or more earns **+20 points**, once per session. Sessions are seeded automatically the first time a domain is opened, so the app is usable immediately.
- **Doubts:** members post questions by domain, anyone can reply, and a doubt moves through `open` → `answered` → `verified`.
- **Mentor verification:** mentors get a review queue of doubts with unverified replies. Verifying a reply awards **+30 points** to the reply's author.
- **Perform:** shows a member's public GitHub profile as supporting evidence. GitHub activity never earns points.
- **Heatmap:** a contribution heatmap built from each member's point-earning activity.
- **Leaderboard:** all members ranked by total points.
- **Team page:** a roster of leads, co-leads and core members.
- **Demo data:** on a freshly deployed instance with no doubts yet, the dashboard offers a button that adds three sample doubts with replies.

### How points work

| Action | Points | Who awards it |
| --- | --- | --- |
| Pass a session quiz (score of 70% or more) | +20 | The member, on their own attempt |
| Have a doubt reply verified by a mentor | +30 | A mentor, to the reply's author |

Awards go through a Firestore transaction that checks an immutable `pointAwards` ledger first, so the same quiz or reply can never be paid out twice.

## Tech stack

- React 18, TypeScript, Vite 5
- Tailwind CSS, lucide-react icons
- React Router 7
- Firebase: Authentication (email/password) and Cloud Firestore

## Getting started

### Prerequisites

- Node.js 18 or newer and npm
- A Firebase project

### 1. Set up Firebase

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Create a **Cloud Firestore** database.
4. Add a **Web app** to the project and copy its configuration values.
5. Publish the security rules from [`firestore.rules`](firestore.rules): paste them into **Firestore → Rules**, or deploy them with the Firebase CLI.

### 2. Run the app

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Firebase web app config:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Then start the dev server:

```bash
npm run dev
```

If a page fails with a "query requires an index" error, Firestore needs a composite index for that query. The error message in the browser console includes a link that creates it in one click.

### 3. Create a mentor account

Roles can't be set from the UI, on purpose: that is what stops a student from promoting themselves. Making a mentor is a one-time manual step in the Firebase console. Follow [`MENTOR_SETUP.md`](MENTOR_SETUP.md).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check the project |

## Project structure

```
src/
├── pages/         Login, SignUp, ProfileSetup, Dashboard, DomainDetail,
│                  Doubts, DoubtDetail, Leaderboard, Profile, Team
├── components/    LearnTab, DoubtTab, PerformTab, MentorPanel, QuizModal,
│                  Heatmap, BottomNav, ProtectedRoute, shared UI
├── context/       AuthContext, ToastContext
├── lib/           points, sessions (quizzes), doubts, activities, github, seed
├── firebase.ts    Firebase initialisation from env vars
└── types.ts       Domains, roles, points values and shared types
firestore.rules    Security rules
MENTOR_SETUP.md    How to create a mentor account
```

## Security model, and its limits

There is no backend server and no Cloud Functions, so points are computed in the browser. The Firestore rules block the obvious ways a member could cheat from the console: setting their own points to an arbitrary value, editing someone else's profile, promoting themselves to mentor, or verifying their own reply. They only accept the two exact point amounts (20 and 30), and quiz attempts must be passing and cannot be edited afterwards.

This is a reasonable tradeoff for a community project, but it is not tamper-proof: someone determined enough to script repeated calls could still game the ledger. Truly trusted scoring would need server-side code such as Cloud Functions.

Firebase web config values are not secrets, but your Firestore rules are what protect your data, so make sure they are published before sharing the app.
