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
   - Email & Password + Magic Link authentication with a **Sandbox Demo Mode** fallback for 1-click local testing.

4. **TypeScript Strictness & React Compiler Compatibility**:
   - Maintain 100% strict TypeScript types in `src/types/index.ts`. No `any` types allowed.
   - Code must comply with React Compiler rules: avoid direct hook mutations, pure renders, and memoization-safe callbacks.

---

## 🎨 UI/UX Invariants (Linear & Vercel Sleek Dark Mode)

1. **Sleek High-Tech Visual Language**:
   - **Hairline Micro-Borders**: Use `border-slate-800/80` with hover transitions `hover:border-slate-700/80`.
   - **Pulsing Live Status Dots**: Clear color hierarchy (`Operational` emerald `.glow-dot-emerald`, `Degraded` amber `.glow-dot-amber`, `Outage` rose `.glow-dot-rose`, `Maintenance` indigo `.glow-dot-indigo`).
   - **Data Visualizations**: SVG path sparklines with smooth gradient masks under response latency curves.
   - **Micro-Interactions**: Use active scaling (`active:scale-[0.98]`) on buttons and interactive elements for tactile feedback.
   - **Z-Index Dropdown Elevation**: Ensure dropdown menus (`CustomSelect`, user profile menu) carry dynamic elevated z-index stacking (`z-50` / `z-[100]`) over sibling card blocks.

2. **Accessibility & Responsive Grid**:
   - Use semantic HTML tags (`<header>`, `<main>`, `<section>`, `<article>`, `<button>`).
   - Ensure explicit `aria-label` and `id` attributes on interactive elements.

---

## 📁 Repository Structure

```
ketarisentry/
├── public/               # Static assets & favicons
├── src/
│   ├── components/       # Reusable Linear/Vercel Dark UI components
│   │   ├── Header.tsx              # Top Appbar navigation, brand emblem & user menu
│   │   ├── ServiceCard.tsx         # Precision service health card (Grid & Table views)
│   │   ├── QueueInspectorModal.tsx # Horizon & failed jobs inspector drawer
│   │   ├── ServiceModal.tsx        # Add/edit target service endpoint modal
│   │   ├── LoginPage.tsx           # Email/password & demo sign in page
│   │   ├── IncidentTimeline.tsx    # Chronological health event log widget
│   │   ├── UserManagement.tsx      # User directory (Create, Edit, Delete, Activate/Deactivate)
│   │   ├── SettingsPage.tsx        # Global telemetry, SMTP email dispatcher & test verification
│   │   ├── AuditLogModal.tsx       # SQLite security & action audit logs drawer
│   │   └── CustomSelect.tsx        # High-z-index elevated dropdown select component
│   ├── context/          # Global application state
│   │   ├── AuthContext.tsx         # Session & user auth state
│   │   └── HealthContext.tsx       # Fleet services & polling state engine
│   ├── services/         # API & polling engine logic
│   │   └── pollingEngine.ts        # HTTP prober & mock data simulator
│   ├── types/            # TypeScript interfaces & enums
│   │   └── index.ts                # Core schemas (Service, Health, Queue, Auth, NavTab)
│   ├── App.tsx           # Main application view container (2-Column Command Layout)
│   ├── index.css         # Linear/Vercel dark CSS tokens & utility styles
│   └── main.tsx          # App entry point
├── AGENTS.md             # Developer & AI Agent instructions (This file)
├── DESIGN.md             # UI/UX Design System Specification
├── README.md             # Project documentation & setup guide
└── package.json          # Bun dependencies & build scripts
```

---

## 🔧 AI Agent Tooling & Verification Commands

Before declaring any task completed:
- Run `bun run lint` (oxlint check).
- Run `bun run build` (TypeScript compilation & Vite build verification).

Never mark a task as resolved without executing verification commands.
