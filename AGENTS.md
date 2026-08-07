# Ketarisentry Developer & AI Agent Guidelines

Welcome! This document defines the engineering standards, architecture rules, design invariants, and workflow conventions for developers and AI Coding Assistants (e.g. Antigravity, Claude, Cursor) working on **Ketarisentry**.

---

## 🏛️ System Architecture Invariants

1. **Pull Polling Only**:
   - Ketarisentry operates purely on **Pull Polling**. Do not add push-webhook ingestion endpoints or server listeners to the frontend SPA.
   - All HTTP requests to target health endpoints must handle CORS gracefully, enforce timeout boundaries, and support custom security headers (`Authorization`, `X-Ketari-Secret`).

2. **State Hierarchy & Immutability**:
   - Application state is managed via React Context (`AuthContext` and `HealthContext`).
   - State updates must remain immutable. Never mutate service objects or arrays in-place.
   - Component logic must rely on derived state rather than redundant local duplication.

3. **Authentication Strategy**:
   - Google OAuth 2.0 via Google Identity Services (GIS).
   - Must maintain a **Sandbox Demo Mode** fallback when `VITE_GOOGLE_CLIENT_ID` is missing, ensuring zero-friction local testing.

4. **Typescript Strictness & React Compiler Compatibility**:
   - Maintain 100% strict TypeScript types in `src/types/index.ts`. No `any` types allowed.
   - Code must comply with React Compiler rules: avoid direct hook mutations, pure renders, and memoization-safe callbacks.

---

## 🎨 UI/UX Invariants (Modern Minimalist Claymorphism)

1. **Claymorphic Visual Language**:
   - **Soft Tactile Shadows**: Use `shadow-clay-card` (`shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.8)]` in light mode and dark clay equivalents).
   - **Rounded Surfaces**: Use `rounded-2xl` for sub-cards and `rounded-3xl` for main panels.
   - **High Contrast Status Indicators**: Clear color hierarchy (`Operational` green, `Degraded` amber, `Outage` rose, `Maintenance` indigo).
   - **Micro-Interactions**: Use active scaling (`active:scale-[0.98]`) on buttons and interactive elements for tactile feedback.
   - **Zero Heavy Gloss / Blur Chaos**: Avoid blurry semi-transparent glass overlays; prefer clean, tactile, flat clay surfaces.

2. **Accessibility & Responsive Grid**:
   - Use semantic HTML tags (`<header>`, `<main>`, `<section>`, `<article>`, `<button>`).
   - Ensure explicit `aria-label` and `id` attributes on interactive elements.

---

## 📁 Repository Structure

```
ketarisentry/
├── public/               # Static assets & favicons
├── src/
│   ├── components/       # Reusable Claymorphic UI components
│   │   ├── Header.tsx            # Navigation, status stats, user menu
│   │   ├── ServiceCard.tsx       # Individual service health card
│   │   ├── QueueInspector.tsx    # Horizon & failed jobs inspector drawer
│   │   ├── ServiceModal.tsx      # Add/edit service endpoint modal
│   │   ├── LoginModal.tsx        # Google OAuth & Demo sign in modal
│   │   └── IncidentTimeline.tsx  # Chronological health event log
│   ├── context/          # Global application state
│   │   ├── AuthContext.tsx       # Google OAuth & session management
│   │   └── HealthContext.tsx     # Fleet services & polling state engine
│   ├── services/         # API & polling engine logic
│   │   └── pollingEngine.ts      # HTTP prober & mock data simulator
│   ├── types/            # TypeScript interfaces & enums
│   │   └── index.ts              # Core schemas (Service, Health, Queue, Auth)
│   ├── App.tsx           # Main application view container
│   ├── index.css         # Claymorphism CSS tokens & utility styles
│   └── main.tsx          # App entry point
├── AGENTS.md             # Developer & AI Agent instructions (This file)
├── DESIGN.md             # UI/UX Design System Specification
├── README.md             # Project documentation & Laravel setup guide
└── package.json          # Bun dependencies & build scripts
```

---

## 🔧 AI Agent Tooling & Commands

Before declaring any task completed:
- Run `bun run lint` (oxlint check).
- Run `bun run build` (TypeScript compilation & Vite build verification).

Never mark a task as resolved without executing verification commands.
