# BetterUptime ⚡

A high-performance, distributed website uptime and latency monitoring platform inspired by Better Uptime. Built as a TypeScript monorepo with **Turborepo**, powered by **Redis Streams**, **Consumer Groups**, **PostgreSQL**, and **Prisma**.

---

## 📌 About The Project

BetterUptime is architected to perform high-frequency, multi-region health checks at scale without dropped tasks, race conditions, or duplicate pings.

Rather than relying on naive polling or ephemeral message brokers, the engine leverages **Redis Streams** with **Consumer Groups** and **Message Acknowledgements (`XACK`)** to deliver resilient, fault-tolerant job distribution across distributed regional probe workers.

### 🏗️ Why Redis Streams?

Traditional message queues often introduce heavy operational overhead, while lightweight solutions (like standard Redis Pub/Sub) lack persistence and crash resilience—if a worker drops offline during a check, the job is lost forever.

Redis Streams provides a persistent, append-only log with high-throughput in-memory performance and disk-backed durability:
* **Decoupled Producers & Consumers**: The `pusher` service schedules and appends targets into the stream without needing to know which workers are alive or where they are located.
* **Persistent Event Log**: Jobs remain buffered in memory with disk-backed durability, allowing workers to catch up seamlessly after restarts.
* **Batch Ingestion (`XADD`)**: Hundreds or thousands of website verification requests are batched and queued via timestamped stream entries (`betteruptime:website`).

---

## 🔄 How It Works (Architecture)

```
                     ┌──────────────────┐
                     │   Next.js Web    │
                     │    Dashboard     │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │   Express API    │
                     │  (Auth & Sites)  │
                     └────────┬─────────┘
                              │
                    [PostgreSQL (Prisma)]
                     ▲                 ▲
                     │ (read sites)    │ (save websiteTick)
                     │                 │
              ┌──────┴──────┐          │
              │ apps/pusher │          │
              └──────┬──────┘          │
                     │ XADD            │
                     ▼                 │
          =======================      │
           Redis Stream (Events)       │
           `betteruptime:website`      │
          =======================      │
             │               │         │
   (us-east-1 group)   (eu-west-1 group)
             │               │         │
      ┌──────┴──────┐        └────┬────┘
      │             │             │
┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
│ Worker 1  │ │ Worker 2  │ │ Worker 1  │
│ (XREADGRP)│ │ (XREADGRP)│ │ (XREADGRP)│
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘
      │ XACK        │ XACK        │ XACK
      └─────────────┴──────┬──────┘
                           │
             (Persist Uptime & Latency)
```

---

## 👥 Consumer Groups & Acknowledgements Deep Dive

The core monitoring pipeline is powered by `packages/redisstreams`:

### 1. Multi-Region Fan-Out (Independent Consumer Groups)
Every geographic monitoring region (e.g., `us-east-1`, `eu-central-1`, `ap-south-1`) acts as an independent **Consumer Group**.
* Each consumer group receives a full, independent copy of the website stream.
* This enables the system to measure availability and latency from multiple continents concurrently.

### 2. In-Region Load Balancing (Competing Consumers)
Within any given region, multiple worker instances (`WORKER_ID`) read from the same consumer group using `XREADGROUP`:
* Workers pull batches with ID `>` (only new messages never delivered to any other consumer in this group).
* Workers in the same group cooperatively divide the workload without collisions or duplicate pings.

### 3. Fault-Tolerant Delivery (`XACK` & Pending Entries List)
* **Pending Entries List (PEL)**: When a worker fetches an event via `XREADGROUP`, Redis marks it as pending. The message is temporarily locked to that worker.
* **Network Execution**: The worker fires HTTP requests via Axios, measures latency (`response_time_ms`), and records the status (`Up` or `Down`).
* **Safe Acknowledgment**: Only after the HTTP ping completes and the `websiteTick` record is committed to PostgreSQL does the worker invoke `xAckBulk`.
* **Zero Lost Ticks**: If a worker crashes or encounters a network partition mid-check, the unacknowledged message remains in the PEL to be claimed or reprocessed.

### Stream Commands Reference

| Operation | Redis Command | Monorepo Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Publish** | `XADD betteruptime:website * url <url> id <id>` | `xAddBulk()` | Queues website checks on a schedule |
| **Consume** | `XREADGROUP GROUP <region> <worker> COUNT 5 STREAMS betteruptime:website >` | `xReadGroup()` | Distributes unread check tasks to regional workers |
| **Acknowledge** | `XACK betteruptime:website <region> <eventId>` | `xAckBulk()` | Confirms check completion and purges message from PEL |

---

## 📂 Monorepo Structure

```
betteruptime/
├── apps/
│   ├── api/            # Express REST API (User auth, website registration, status checks)
│   ├── pusher/         # Scheduled poller querying DB & publishing checks to Redis Stream
│   ├── web/            # Next.js frontend dashboard
│   └── worker /        # Regional probe worker (consumes stream, pings sites, commits ticks)
│
├── packages/
│   ├── redisstreams/   # Redis Streams client library (xAdd, xReadGroup, xAck)
│   ├── store/          # Database package (Prisma schema, client, migrations)
│   ├── ui/             # Shared UI component library
│   ├── eslint-config/  # ESLint configurations
│   └── typescript-config/ # Shared tsconfig bases
│
├── docker-compose.yml  # Local Redis and PostgreSQL containers
├── turbo.json          # Turborepo task pipeline configuration
└── package.json        # Workspace configuration (Bun / Turborepo)
```

---

## 🛠️ Tech Stack

* **Monorepo Orchestration**: [Turborepo](https://turbo.build/)
* **Package Manager & Runtime**: [Bun](https://bun.sh/)
* **Event Broker / Queue**: [Redis Streams](https://redis.io/docs/data-types/streams/)
* **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) & [Prisma](https://www.prisma.io/)
* **Backend Services**: Node.js, Express, Axios
* **Frontend**: [Next.js](https://nextjs.org/) (App Router), React
* **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites

* [Bun](https://bun.sh/) (v1.3+ recommended) or [Node.js](https://nodejs.org/) (>= 24)
* [Docker & Docker Compose](https://www.docker.com/)

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/betteruptime.git
cd betteruptime
bun install
```

---

### 2. Start Infrastructure (Postgres & Redis)

Start the local PostgreSQL and Redis instances using Docker Compose:

```bash
docker compose up -d
```

This spins up:
* **Redis**: `localhost:6379`
* **PostgreSQL**: `localhost:5432` (`postgres:root`)

---

### 3. Setup Database & Prisma

Configure your database connection in `packages/store/.env`:

```env
DATABASE_URL="postgres://postgres:root@localhost:5432/postgres"
```

Push the Prisma schema to the database:

```bash
cd packages/store
bunx prisma db push
cd ../..
```

---

### 4. Configure Environment Variables

Create `.env` files in the respective application directories:

#### `apps/api/.env`
```env
PORT=3000
DATABASE_URL="postgres://postgres:root@localhost:5432/postgres"
JWT_SECRET="your_jwt_secret_key"
```

#### `apps/pusher/.env`
```env
DATABASE_URL="postgres://postgres:root@localhost:5432/postgres"
```

#### `apps/worker /.env`
```env
DATABASE_URL="postgres://postgres:root@localhost:5432/postgres"
REGION_ID="us-east-1"
WORKER_ID="worker-1"
```

---

### 5. Running the Monorepo

You can run all services simultaneously via Turborepo:

```bash
bun dev
```

Or run individual apps independently:

```bash
# Run API service
bun --filter api dev

# Run Pusher service
bun --filter pusher dev

# Run Worker service
bun --filter "worker-" dev

# Run Next.js Web Dashboard
bun --filter web dev
```

---

## 📡 API Reference

Base URL: `http://localhost:3000/api/v1`

### Authentication
* `POST /user/signup` — Create a new user account (`{ "username": "...", "password": "..." }`)
* `POST /user/signin` — Login and receive JWT token (`{ "username": "...", "password": "..." }`)

### Websites
* `POST /website` *(Auth required)* — Register a new website URL to monitor (`{ "url": "https://example.com" }`)
* `GET /website/status/:websiteId` *(Auth required)* — Fetch latest status and latency metrics

### Health
* `GET /health` — Check API service status

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
