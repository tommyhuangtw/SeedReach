# SeedReach

KOL 社群行銷管理系統 — 從發掘、管理到開發信，一站完成。

## Features

- **KOL 管理** — CRUD、狀態追蹤（潛在→已聯繫→洽談中→合作中→結案）、活動紀錄、CSV 批量匯入
- **KOL 發掘** — 透過 Hashtag 搜尋 Instagram KOL，自動爬取個人檔案、頭貼、聯絡資訊
- **AI 資料提取** — 用 LLM（OpenRouter + Gemini Flash）從 Bio 自動辨識 Email、LINE ID、電話、內容類別
- **開發信管理** — 信件模板（支援 `{{kol_name}}` 變數）、批量 1:1 寄送、寄送紀錄追蹤

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5, React 19 |
| Database | PostgreSQL + Prisma 7 |
| Auth | NextAuth.js 4 (Credentials + JWT) |
| UI | Tailwind CSS 4 + shadcn/ui 4 (base-ui) |
| Scraping | Apify (Instagram Hashtag & Profile Scraper) |
| LLM | OpenRouter API (Gemini Flash) |
| Email | Nodemailer (Gmail SMTP) |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- [Apify](https://apify.com/) account (for KOL discovery)
- Gmail App Password (for outreach emails)
- [OpenRouter](https://openrouter.ai/) API key (optional, for AI extraction)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Run database migration & seed
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

Open http://localhost:3000 — login with `admin@phargoods.com` / `admin123`

### Environment Variables

See `.env.example` for all required variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing |
| `NEXTAUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `APIFY_API_TOKEN` | Yes | Apify API token for Instagram scraping |
| `GMAIL_USER` | For outreach | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | For outreach | Gmail App Password (not regular password) |
| `OPENROUTER_API_KEY` | Optional | OpenRouter API key for LLM extraction |

## Project Structure

```
src/
├── app/
│   ├── (app)/                  # Authenticated routes
│   │   ├── dashboard/          # Dashboard with stats
│   │   ├── discover/           # KOL discovery (Apify)
│   │   ├── kols/               # KOL CRUD + detail pages
│   │   ├── outreach/           # Email outreach management
│   │   └── settings/           # Settings
│   ├── (auth)/login/           # Login page
│   └── api/                    # API routes
│       ├── auth/               # NextAuth handler
│       ├── discover/           # Search & profile scraping
│       └── kols/               # Profile scrape endpoint
├── components/
│   ├── discover/               # Discovery UI components
│   ├── kols/                   # KOL management components
│   ├── outreach/               # Outreach components
│   ├── layout/                 # Sidebar, Topbar
│   └── ui/                     # shadcn/ui components
└── lib/
    ├── actions/                # Server actions
    ├── apify.ts                # Apify API helpers
    ├── auth.ts                 # NextAuth config
    ├── download-avatar.ts      # Avatar download → base64
    ├── llm-extract.ts          # LLM contact extraction
    ├── mailer.ts               # Gmail SMTP sender
    └── prisma.ts               # Prisma client
```

## Scripts

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```
