# Ketarisentry Design System Spec (DESIGN.md)

This document specifies the **Linear & Vercel-inspired Sleek High-Tech Dark Mode** design system used throughout **Ketarisentry**.

---

## 🎨 Visual Philosophy: Sleek High-Tech Dark Mode

Ketarisentry utilizes an ultra-refined, high-precision dark aesthetic engineered for instant incident triage and telemetry clarity. Moving away from generic bulky cards or distracting glass blurs, the interface relies on sharp geometry, hairline borders, pitch-dark surfaces, and vibrant glowing status indicators.

### Core Principles
1. **Precision Hierarchy & Hairline Micro-Borders**: 1px subtle hairline borders (`border-slate-800/80` transitioning to `border-slate-700` or glowing accent borders on hover) provide crisp separation between containers.
2. **Telemetry-First Typography**: Clean Inter typography for headers and metadata, paired with JetBrains Mono tabular figures for latency, queue counts, memory usage, and timestamps.
3. **Vibrant Status Glow Indicators**: Pulsing live dots with glowing aura shadows (`Operational` emerald `#10b981`, `Degraded` amber `#f59e0b`, `Outage` rose `#f43f5e`, `Maintenance` indigo `#6366f1`).
4. **Data Visualizations**: SVG path sparklines with smooth gradient masks under response latency curves.
5. **Tactile Micro-Interactions**: Tactile button press feedback (`active:scale-[0.98]`), hover ambient glows, and clean backdrop blur drawers.

---

## 🎨 Color Palette & Tokens

### Background & Surface Tokens
| Token | Dark Mode Value | Usage |
| :--- | :--- | :--- |
| `--bg-app` | `#030712` (Zinc 950) | Deep pitch canvas |
| `--bg-surface` | `#090d16` (Slate 950) | Main container cards & sections |
| `--bg-surface-elevated` | `#0f172a` (Slate 900) | Raised buttons, inputs & popups |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Hairline container borders |

### Health Status Token Palette
| Status | Accent Color | Glow Aura | Text Color | Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Operational** | `#10b981` (Emerald 500) | `0 0 12px rgba(16,185,129,0.4)` | `#34d399` (Emerald 400) | All checks passing, low queue backlog |
| **Degraded** | `#f59e0b` (Amber 500) | `0 0 12px rgba(245,158,11,0.4)` | `#fbbf24` (Amber 400) | High latency or queue backlog spike |
| **Outage** | `#f43f5e` (Rose 500) | `0 0 12px rgba(244,63,94,0.4)` | `#fb7185` (Rose 400) | Endpoint down or job execution failure |
| **Maintenance** | `#6366f1` (Indigo 500) | `0 0 12px rgba(99,102,241,0.4)` | `#818cf8` (Indigo 400) | Service muted during deployment |

---

## ⚡ Micro-Interactions & Styling Tokens

```css
/* Card Container */
.linear-card {
  background-color: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem; /* rounded-2xl */
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.linear-card:hover {
  border-color: rgba(255, 255, 255, 0.16);
}

/* Button & Interactive Surfaces */
.linear-btn {
  background-color: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem; /* rounded-xl */
  transition: all 0.15s ease;
}

.linear-btn:active {
  transform: scale(0.98);
}
```

