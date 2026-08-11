# Ketarisentry 🛡️

**Ketarisentry** is a high-precision, sleek Linear & Vercel-inspired central health & queue monitoring telemetry hub built for multi-tenant service infrastructure with first-class support for **Laravel applications**.

Built with **Bun + Vite + React 19 + TypeScript + React Compiler**, Ketarisentry offers real-time pull polling, queue job failure inspection, SSL cert expiry tracking, Email/Password & Magic Link authentication, User Access Control (Create, Edit, Delete, Activate, Deactivate), SMTP Email Outage Dispatcher with live test verification, SQLite audit logging, and a **Sleek High-Tech Dark Mode** interface.

---

## ⚡ Features

- 🖥️ **Sleek High-Tech Dark Interface**: Precision dark theme (`#030712`), hairline micro-borders, live glowing status dots, SVG response latency sparklines, andInter + JetBrains Mono typography.
- 🗺️ **Multi-View Command Dashboard & Navigation Tabs**:
  - **Dashboard**: 2-Column layout with Environment grouping (`Production`, `Staging`, `Local`), View Mode toggle (`Grid Cards` vs `Compact Microservice List`), and sticky telemetry sidebar.
  - **User Management**: Complete user access control allowing Superadmins & Admins to Create, Edit, Delete, Activate, and Deactivate team members.
  - **Settings**: Centralized configuration for Pull Polling frequency, `X-Ketari-Secret` security keys, SMTP email alert dispatcher, test verification, alert thresholds, and log retention.
- 📧 **SMTP Email Alert Dispatcher with Live Testing**: Send instant outage alerts to on-call engineers via SMTP with an interactive `[ Send Test Email ]` verification button.
- 🗄️ **Native Bun + SQLite Database**: Permanent telemetry log storage (`ketarisentry.db`), failed job exception archives, user profiles, and security audit logs.
- 🔐 **Email & Password + Magic Link Authentication**: Secure authentication alongside sandbox demo fallback for 1-click local testing.
- 🛡️ **Sliding Window Rate Limiter & Fail2ban Logging**: Prevents credential brute-forcing by capping auth attempts and emitting Fail2ban-ready logs.
- 🐳 **Docker & Compose Ready**: Production-optimized container deployment (`Dockerfile` & `docker-compose.yml`) with volume mounts for `database/` and `logs/`.
- 🎯 **Pure Pull Polling Strategy**: Periodically probes HTTP `/ketari/health` endpoints with strict CORS bounds, timeout guards, and custom security headers.
- 🐘 **Laravel Queue & Horizon Telemetry**: Deep visibility into Redis queue backlogs, pending job counts, active Horizon workers, and failed job stack trace viewports.

---

## 🚀 Quick Start

### Local Bun Setup

```bash
# Clone the repository
git clone https://github.com/your-username/ketarisentry.git
cd ketarisentry

# Install dependencies with Bun
bun install

# Initialize SQLite Database & Seed Initial Superadmin Account
bun run db:init

# Start the Vite development server
bun dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗺️ Application Navigation & Modules

| Module | Navigation Link | Key Capabilities |
| :--- | :--- | :--- |
| **Dashboard** | `Dashboard` | Fleet summary metrics, Environment segmented filters (`All`, `Production`, `Staging`, `Local`), Grid/List view toggle, SVG sparkline telemetry, and sticky Incident Timeline feed. |
| **User Management** | `Users` | Directory listing of all system users, Role badges (`Superadmin`, `Admin`, `Operator`, `Viewer`), Create/Edit user modal, Account Activation/Deactivation toggles, and safe Delete actions. |
| **Settings** | `Settings` | Polling intervals (15s-300s), HTTP timeout limit (2s-10s), Global `X-Ketari-Secret` key, SMTP server configuration, Live `[ Send Test Email ]` verification button, and log retention. |

---

## 🔒 Security & Fail2ban Configuration

### 1. Sliding Window Rate Limiter
- **Limit**: 5 attempts per 15-minute window per IP address on auth endpoints.
- **Response**: Rejects excess requests with HTTP 429 (`Too Many Requests`) and sets `Retry-After` headers.

### 2. Fail2ban Log Integration
Ketarisentry writes structured logs to `logs/auth.log`:
```log
2026-08-11 15:30:00 [FAIL2BAN] AUTH_FAIL IP=192.168.1.50 EMAIL=user@domain.com REASON="Invalid credentials"
```

---

## 📡 Target Laravel Health Endpoint Setup

Ketarisentry polls standard JSON health endpoints on your target services. Below is the expected JSON response payload format (`/api/ketari/health`):

```json
{
  "service": "E-Commerce Orders API",
  "environment": "production",
  "status": "operational",
  "latency_ms": 42,
  "checks": {
    "database": { "status": "ok", "latency_ms": 4 },
    "redis": { "status": "ok", "latency_ms": 2 },
    "storage": { "status": "ok", "free_gb": 120 }
  },
  "queue": {
    "horizon_active": true,
    "pending_jobs": 14,
    "failed_jobs_24h": 2,
    "queues": {
      "default": 10,
      "high-priority": 4
    },
    "recent_failed_jobs": [
      {
        "id": "job_99812",
        "job_name": "App\\Jobs\\ProcessPayment",
        "queue": "high-priority",
        "failed_at": "2026-08-11 15:00:10",
        "exception_class": "Illuminate\\Http\\Client\\ConnectionException",
        "message": "cURL error 28: Connection timed out after 5000 milliseconds",
        "trace": "App\\Jobs\\ProcessPayment->handle() at /app/Jobs/ProcessPayment.php:45..."
      }
    ]
  },
  "ssl": {
    "valid": true,
    "days_remaining": 64
  }
}
```

---

## 🛠️ Scripts & Verification Tooling

```bash
bun dev        # Start local Vite dev server (port 5173 with /api proxy)
bun run server # Start high-performance Bun + SQLite API server (port 3001)
bun run db:init # Initialize SQLite schema & seed initial superadmin account
bun run build  # Build production bundle with React Compiler (tsc -b && vite build)
bun run lint   # Run oxlint checks
bun preview    # Preview production build locally
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
