# Ketarisentry Design System Spec (DESIGN.md)

This document specifies the **Minimalist Modern Claymorphism** design system used throughout **Ketarisentry**.

---

## 🎨 Visual Philosophy: Modern Claymorphism

Ketarisentry utilizes a modern, clean, tactile **Claymorphism** design aesthetic. Unlike heavy glassy blurs or flat 2D designs, Claymorphism provides soft, rounded, 3D-like tactile surfaces using dual drop-shadows (light top-left highlights + soft bottom-right shadow) combined with high-contrast typography.

### Core Principles
1. **Tactile & Soft**: Heavy border radii (`rounded-2xl`, `rounded-3xl`) and soft dual shadows give elements a touchable, physical clay feel.
2. **Minimalist & Clean**: Neutral, warm, off-white backdrops in light mode (`#f8fafc`) and deep slate backdrops in dark mode (`#0f172a`), allowing status accents to pop.
3. **Pill Badges & Metrics**: Status indicators use rounded pill shapes with inner shadows and high-contrast text.
4. **High Contrast & Readability**: Inter / System sans-serif typography with strict hierarchy for instant readability during incident triage.

---

## 🎨 Color Palette & Tokens

### Background & Surface Tokens
| Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-app` | `#f8fafc` (Slate 50) | `#0f172a` (Slate 900) | App backdrop |
| `--bg-surface` | `#ffffff` | `#1e293b` (Slate 800) | Clay Cards & Containers |
| `--bg-surface-subtle` | `#f1f5f9` (Slate 100) | `#334155` (Slate 700) | Sub-cards, Inputs, Hover states |

### Health Status Token Palette
| Status | Accent Color | Pill Background | Text Color | State Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Operational** | `#22c55e` (Emerald 500) | `#dcfce7` (Emerald 100) | `#15803d` (Emerald 700) | All checks passing, low queue backlog |
| **Degraded** | `#f59e0b` (Amber 500) | `#fef3c7` (Amber 100) | `#b45309` (Amber 700) | High latency, queue delay, or minor DB spike |
| **Outage** | `#f43f5e` (Rose 500) | `#ffe4e6` (Rose 100) | `#be123c` (Rose 700) | Endpoint down, DB failed, or job spike |
| **Maintenance** | `#6366f1` (Indigo 500) | `#e0e7ff` (Indigo 100) | `#4338ca` (Indigo 700) | Service muted during planned deploy |

---

## 🌓 Claymorphic Shadow Specs

### Light Mode Clay Shadows
```css
/* Card Surface */
.clay-card {
  background-color: #ffffff;
  border-radius: 1.5rem; /* rounded-3xl */
  box-shadow: 
    8px 8px 16px rgba(15, 23, 42, 0.06),
    -8px -8px 16px rgba(255, 255, 255, 0.9);
}

/* Button & Interactive Surfaces */
.clay-btn {
  background-color: #f8fafc;
  border-radius: 1rem;
  box-shadow: 
    4px 4px 8px rgba(15, 23, 42, 0.08),
    -4px -4px 8px rgba(255, 255, 255, 0.9);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.clay-btn:active {
  transform: scale(0.97);
  box-shadow: 
    inset 3px 3px 6px rgba(15, 23, 42, 0.1),
    inset -3px -3px 6px rgba(255, 255, 255, 0.9);
}

/* Inset Soft Clay Wells (for inputs and sub-boxes) */
.clay-inset {
  box-shadow: 
    inset 3px 3px 6px rgba(15, 23, 42, 0.06),
    inset -3px -3px 6px rgba(255, 255, 255, 0.8);
}
```

### Dark Mode Clay Shadows
```css
/* Dark Clay Card Surface */
.dark .clay-card {
  background-color: #1e293b;
  border-radius: 1.5rem;
  box-shadow: 
    8px 8px 20px rgba(0, 0, 0, 0.35),
    -6px -6px 16px rgba(255, 255, 255, 0.03);
}

.dark .clay-inset {
  box-shadow: 
    inset 4px 4px 8px rgba(0, 0, 0, 0.4),
    inset -4px -4px 8px rgba(255, 255, 255, 0.02);
}
```

---

## 📐 Component Specs & States

### 1. Service Fleet Card
- **Header**: Service Title + Environment badge (`production` / `staging`) + Operational Status Pill.
- **Body**: 
  - Latency Sparkline (`42ms` avg).
  - Health Metric Pills: Database, Redis, Queue Backlog.
  - SSL Certificate status badge (`SSL 45d left`).
- **Footer**: Last polled timestamp, Manual Re-poll button, and Horizon/Failed Jobs Inspector trigger.

### 2. Status Pill Badge
- **Shape**: `rounded-full` with padding `px-3 py-1`.
- **Icon**: Pulsing live indicator dot (`w-2 h-2 rounded-full animate-pulse`).

### 3. Horizon & Failed Jobs Inspector Drawer
- **Title**: Service Name + Failed Job Count counter badge.
- **Content**: Expandable accordion list of failed jobs with exception class, message snippet, and copyable full stack trace.

---

## ⚡ Micro-Interactions

- **Hover Lift**: Cards lift slightly (`-translate-y-0.5`) on mouse hover.
- **Tactile Press**: Buttons scale down to `0.98` with inset shadow shift when clicked.
- **Status Pulse**: Live health dots pulse softly every 2 seconds.
