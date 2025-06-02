# Yosemite Camp Sniper ⛺️

> **Automate Yosemite campground reservations** with NestJS + Prisma + Puppeteer. Runs locally on a Raspberry Pi or any Node-20 host.

---

## ✨ Features

| Category             | Capability                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **Task API**         | CRUD for reservation tasks (`create / edit / fetch / delete`) via REST/Swagger                 |
| **Release-Day Bot**  | 06:59:50 PT on the 15th of each month, auto-books campsites that open exactly **5 months out** |
| **Cancel-Watch**     | 5-minute polling of Recreation.gov API; instantly books a cancelled site when it appears       |
| **Persistent Login** | Re-uses Recreation.gov cookies stored on disk for speed and security                           |
| **SQLite storage**   | Lightweight DB managed by Prisma; one command to migrate or swap to Postgres                   |
| **Swagger UI**       | Live API documentation at `http://localhost:3000/api`                                          |
| **Pluggable Notify** | Hook in Telegram/Slack/SMS/email after success or failure                                      |

---

## 🖼 Tech Stack

* **Language:** TypeScript (ES2022)
* **Framework:** [NestJS](https://nestjs.com/) 10
* **ORM:** [Prisma](https://www.prisma.io/) 5 → SQLite 3 (file-based)
* **Browser Automation:** [Puppeteer](https://pptr.dev/) 21 (Chromium-headless)
* **Scheduler:** `@nestjs/schedule` (Cron)
* **Container/Service:** Works in Docker, PM2, or bare Node

---

## 📂 Monorepo Layout

```text
.
├── prisma/            # schema.prisma & migrations
├── src/
│   ├── app.module.ts
│   ├── task/          # Task CRUD + scheduler
│   ├── recgov/        # Puppeteer wrapper + REST availability
│   └── prisma/        # PrismaService wrapper
├── .env.example       # copy → .env and fill secrets
└── README.md          # you are here
```

---

## ⚡️ Quick Start

> Tested with **Node 20 LTS** on macOS & Raspberry Pi OS (64-bit). Chromium is automatically downloaded by Puppeteer.

```bash
# 1. Clone
$ git clone https://github.com/<you>/yosemite-camp-sniper.git
$ cd yosemite-camp-sniper

# 2. Install deps (≈ 150 MB w/ Chromium)
$ yarn install

# 3. Prep DB & Prisma Client
$ npx prisma migrate dev --name init

# 4. Copy env template & add your Rec.gov creds
$ cp .env.example .env
# ➜  edit in editor

# 5. Run dev server (Swagger + hot-reload)
$ yarn run start:dev
# Swagger ➜  http://localhost:3000/api
```

### `.env.example`

```env
# Recreation.gov credentials (kept local)
RECGOV_EMAIL=you@example.com
RECGOV_PASSWORD=superSecret!

# Optional: use system chromium instead of Puppeteer bundle
# PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

---

## 🔌 API Cheatsheet

All endpoints are prefixed with `/tasks`.

| Method | Path         | Description               |
| ------ | ------------ | ------------------------- |
| POST   | `/tasks`     | Create a reservation task |
| GET    | `/tasks`     | List all tasks            |
| GET    | `/tasks/:id` | Get one task              |
| PATCH  | `/tasks/:id` | Update task (partial)     |
| DELETE | `/tasks/:id` | Delete task               |

Example create-task payload:

```json
{
  "name": "Upper Pines Thanksgiving Trip",
  "campGround": "Upper Pines",
  "startDate": "2025-11-27T00:00:00.000Z",
  "endDate": "2025-11-30T00:00:00.000Z",
  "autoBook": true
}
```

Use Swagger UI or curl:

```bash
curl -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d @task.json
```

---

## ⏰ Cron Timeline

| Cron Expression (PT) | Frequency       | Action                                  |
| -------------------- | --------------- | --------------------------------------- |
| `50 59 6 * * *`      | Daily 06:59:50  | Release-Day booking (15th guard inside) |
| `*/5 * * * *`        | Every 5 minutes | Cancel-watch monitor                    |

> **Why 06:59:50?** Gives Puppeteer \~10 s to load page & click as reservations open at 07:00:00.

---

## 🚀 Deploy to Raspberry Pi

```bash
sudo apt update && sudo apt install -y chromium-browser sqlite3

# build & run
npm run build
pm install -g pm2
pm2 start dist/main.js --name yosemite-sniper

# persist PM2 on reboot
pm2 startup
pm2 save
```

*Pro-Tip:* keep the Pi clock synced:

```bash
sudo timedatectl set-ntp true
```

---

## 🛠 Customization

| Task field   | Purpose                           | Example                  |
| ------------ | --------------------------------- | ------------------------ |
| `campGround` | Human-readable name; mapped to ID | `Upper Pines` → `232450` |
| `autoBook`   | `false` to disable after success  | —                        |
| `startDate`  | ISO date of **first night**       | `2025-11-27T00:00:00Z`   |

Add or modify campground IDs in `RecGovService.mapGround2Id()`.

---

## 🧪 Testing

```bash
# unit tests (Jest)
$ yarn test
```

* Mocked Puppeteer with `jest-mock-extended` for CI safety
* Integration tests spin up in-memory SQLite (`sqlite://:memory:`)

---

## 🤝 Contributing

1. Fork → Branch → PR
2. Run `yarn lint` & `yarn test`
3. Ensure README & Swagger examples stay current

Looking for help on:

* Payment auto-checkout (Stripe?)
* Multi-park support (Sequoia, Zion…)
* WebSocket live dashboard

---

## 📜 License

MIT © 2025 Chris Yao
# yosemite-sniper
