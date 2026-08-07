# Ketarisentry 🛡️

**Ketarisentry** is a modern, minimalist, central health & queue monitoring hub built for multi-tenant service infrastructure with first-class support for **Laravel applications**.

Built with **Bun + Vite + React 19 + TypeScript + React Compiler**, Ketarisentry offers real-time pull polling, queue job failure inspection, SSL cert expiry tracking, Email/Password & Magic Link authentication, Fail2ban logging, Docker containerization, and a clean **Claymorphic UI** design system.

---

## ⚡ Features

- 🗄️ **Native Bun + SQLite Database**: Permanent telemetry log storage (`ketarisentry.db`), failed job exception archives, and user profiles powered by `bun:sqlite`.
- 🔐 **Email & Password + Magic Link Authentication**: Native password hashing using `Bun.password.hash` & `Bun.password.verify`, alongside Magic Link authorization for verified accounts.
- 🛡️ **Sliding Window Rate Limiter & Fail2ban Logging**: Prevents credential brute-forcing by capping auth attempts (5 max / 15 min per IP) and emitting Fail2ban-ready logs to `logs/auth.log`.
- 🐳 **Docker & Docker Compose Ready**: Production-optimized container deployment (`Dockerfile` & `docker-compose.yml`) with volume mounts for `database/` and `logs/`.
- 📋 **Security & Configuration Audit Logs**: Chronological audit trail tracking all service registrations, updates, muting, deletions, and user login events.
- 🎯 **Automated Pull Polling**: Periodically probes HTTP `/healthz` endpoints with custom polling intervals (15s - 300s) and timeout management.
- 🐘 **Laravel Queue & Horizon Telemetry**: Deep visibility into Redis queue backlogs, pending job counts, active Horizon workers, and failed job stack traces.
- 📖 **Dedicated Laravel Integration Guide**: Step-by-step guide in [LARAVEL_INTEGRATION.md](file:///c:/Users/ammar/Desktop/ketarisentry/LARAVEL_INTEGRATION.md) for quick copy-paste setup.
- 🎨 **Minimalist Claymorphic UI**: High-contrast, tactile design system with soft drop-shadows, pill badges, and responsive layouts.
- 📦 **Fleet Config Export/Import**: Easily backup and transfer service health configurations as JSON.

---

## 🚀 Quick Start

### Option A: Local Bun Setup

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

### Option B: Docker Compose Deployment 🐳

```bash
# Build and launch Ketarisentry container in background
docker compose up -d

# Check running container status
docker compose ps

# View Fail2ban auth logs inside container
docker compose exec ketarisentry tail -f logs/auth.log
```

---

## 🔒 Security & Fail2ban Configuration

### 1. Sliding Window Rate Limiter
- **Limit**: 5 attempts per 15-minute window per IP address on `/api/auth/login` and `/api/auth/magic-link`.
- **Response**: Rejects excess requests with HTTP 429 (`Too Many Requests`) and sets `Retry-After` headers.

### 2. Linux Fail2ban Integration
Ketarisentry writes structured logs to `logs/auth.log`.

**Sample Log Format**:
```log
2026-08-07 23:32:00 [FAIL2BAN] AUTH_FAIL IP=192.168.1.50 EMAIL=user@domain.com REASON="Invalid credentials"
2026-08-07 23:32:05 [FAIL2BAN] RATE_LIMIT IP=192.168.1.50 EMAIL=user@domain.com REASON="Rate limit exceeded"
```

**Filter Setup (`/etc/fail2ban/filter.d/ketarisentry.conf`)**:
```ini
[Definition]
failregex = ^.* \[FAIL2BAN\] (AUTH_FAIL|RATE_LIMIT) IP=<HOST>
ignoreregex =
```

---

## 🔑 Initial Superadmin Account

- Running `bun run db:init` (or starting via Docker) seeds the initial superadmin account into SQLite:
  - **Email**: `superadmin@ketarisentry.io`
  - **Role**: `admin`
  - **Email Verified**: `1`

- **Development Sandbox Demo**:
  - In non-production environments (`VITE_APP_ENV="development"`), guest users can click **"Enter Sandbox as Superadmin"** for instant 1-click testing without credentials.

---

## 📡 Target Laravel Health Endpoint Setup

Ketarisentry polls standard JSON health endpoints on your target services. Below is the expected JSON response payload format:

### Standard Response Payload (`/api/ketari/health`)

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
        "failed_at": "2026-08-07 19:42:10",
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

## 🛠️ Scripts & Tooling

```bash
bun dev        # Start local Vite dev server (port 5173 with /api proxy)
bun run server # Start high-performance Bun + SQLite API server (port 3001)
bun run db:init # Initialize SQLite schema & seed initial superadmin account
bun run build  # Build production bundle with React Compiler
bun run lint   # Run oxlint checks
bun preview    # Preview production build locally
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
