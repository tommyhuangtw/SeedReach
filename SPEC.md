# KOL 社群行銷管理系統 — MVP Spec

## Context

客戶是做 KOL 社群行銷的團隊，目前用 Google Sheet + Line 手動管理所有流程。
目標是建一個輕量 Web App 整合 KOL 發掘、名單管理、開發信自動化。
開發者同時希望用這個案子累積 Forward Deployed Engineer 的 portfolio。

- **Timeline:** 1-2 個月（MVP）
- **Tech Stack:** Next.js (App Router) + Local PostgreSQL + Prisma + Apify
- **MVP 範圍:** KOL 資料庫 + KOL 發掘 + 開發信管理
- **MVP 不做:** Line 通知、社群監控、業績報表、庫存/團購工具整合

---

## 技術架構

```
┌─ Frontend ──────────────────────────────┐
│  Next.js 14+ (App Router)               │
│  UI: shadcn/ui + Tailwind CSS           │
│  Charts: Recharts (未來用)               │
│  Deploy: Vercel (之後)                   │
└────────────────┬────────────────────────┘
                 │
┌─ Backend ──────┴────────────────────────┐
│  Next.js Server Actions / API Routes    │
│  NextAuth.js (email/password 登入)      │
│  Prisma ORM                              │
│  Local PostgreSQL                        │
│  Local file storage (文件上傳)           │
└────────────────┬────────────────────────┘
                 │
┌─ External ─────┴────────────────────────┐
│  Apify (IG/Threads KOL 發掘爬蟲)       │
│  Gmail API 或 SMTP (開發信寄送)         │
└─────────────────────────────────────────┘
```

**為什麼用 Prisma：**
- 比直接寫 SQL 更安全（type-safe）
- Schema migration 管理方便
- 之後要遷移到 Supabase/雲端 PostgreSQL 只需改 connection string

---

## MVP 模組細節

### Module 1: Auth & Layout（Week 1）

**功能：**
- NextAuth.js email/password 登入（credentials provider）
- 單一角色（管理員），暫不做多角色權限
- App Layout：左側 Sidebar + 頂部導航
  - Dashboard（首頁，顯示簡單統計）
  - KOL 管理
  - KOL 發掘
  - 開發信

**頁面結構：**
```
/login
/dashboard
/kols            — KOL 列表
/kols/[id]       — KOL 詳細頁
/discover        — KOL 發掘
/outreach        — 開發信管理
/outreach/templates — Email 模板
/settings        — 基本設定
```

---

### Module 2: KOL 資料庫 & 名單管理（Week 1-2）

**功能：**
- KOL 列表頁：表格呈現，支援搜尋、篩選（狀態/分類/標籤）、排序
- KOL 新增：手動填表 + CSV 批次匯入
- KOL 詳細頁：
  - 基本資料（IG handle、粉絲數、互動率、分類、標籤、聯絡方式）
  - 狀態管理：`潛在` → `已聯繫` → `洽談中` → `合作中` → `結案`
  - 活動紀錄 timeline（誰在什麼時候做了什麼）
  - 備註
- KOL 刪除 / 封存

---

### Module 3: KOL 發掘 — Apify 整合（Week 3-4）

**功能：**
- 搜尋介面：輸入關鍵字 / hashtag / 競品帳號
- 呼叫 Apify Actor（Instagram Scraper）取得相關帳號
- 結果列表：帳號、粉絲數、互動率、Bio、近期貼文預覽
- 篩選結果：按粉絲數範圍、互動率篩選
- 一鍵「加入 KOL 資料庫」
- 搜尋歷史紀錄（避免重複搜尋浪費 Apify credits）

**Apify 整合流程：**
```
1. 前端發送搜尋請求 → Next.js API Route
2. API Route 呼叫 Apify API 啟動 Actor run
3. 等待 run 完成（polling 或 webhook）
4. 取得結果 → 回傳前端顯示
5. 用戶選擇要加入的 KOL → 寫入 PostgreSQL (via Prisma)
```

**使用的 Apify Actor：**
- `apify/instagram-scraper` — 搜尋 hashtag、地點
- `apify/instagram-profile-scraper` — 取得帳號詳細資料

**Apify 評估：**
- 優點：有現成 IG Actor、不需 Meta API 審核、處理 proxy/rate limiting、pay-per-use（~$5-25/月）
- 風險：依賴第三方、IG 改版可能暫時失效
- 結論：MVP 階段最務實的選擇，之後有需要再遷移到官方 API

---

### Module 4: 開發信管理（Week 4-6）

**功能：**
- Email 模板 CRUD
  - 支援變數插值：`{{kol_name}}`、`{{brand_name}}`、`{{product_name}}` 等
  - 預覽功能
- 發信流程：
  - 從 KOL 列表勾選多個 KOL
  - 選擇模板 → 預覽每封信的內容 → 確認發送
  - 支援排程（設定發送時間）
- 發信紀錄：
  - 狀態追蹤：`草稿` / `已排程` / `已發送` / `發送失敗`
  - 發送後自動更新 KOL 狀態為「已聯繫」
  - 發送後自動在 KOL 的活動紀錄新增一筆

**Email 發送方式（待確認）：**
- 方案 A：Gmail API + OAuth（用客戶自己的 Gmail 帳號）
- 方案 B：SMTP（用客戶公司的 email server）
- 方案 C：Resend / SendGrid（第三方 email service，最簡單但寄件人不是客戶的 email）
- **建議先用方案 C（Resend）開發**，MVP 先跑起來，之後再換成客戶自己的 email

---

## 資料庫 Schema

```sql
-- 使用者
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text,
  created_at timestamptz default now()
);

-- KOL 資料
create table kols (
  id uuid primary key default gen_random_uuid(),
  ig_handle text unique not null,
  name text,
  avatar_url text,
  followers_count integer,
  engagement_rate decimal,
  category text,                    -- e.g. 美妝、母嬰、健康
  tags text[] default '{}',
  contact_email text,
  contact_line text,
  contact_phone text,
  status text default '潛在',       -- 潛在/已聯繫/洽談中/合作中/結案
  notes text,
  source text,                      -- 來源：手動新增/Apify發掘/CSV匯入
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- KOL 活動紀錄
create table kol_activities (
  id uuid primary key default gen_random_uuid(),
  kol_id uuid references kols(id) on delete cascade,
  action text not null,             -- e.g. 狀態變更、發送開發信、新增備註
  description text,
  created_at timestamptz default now()
);

-- 發掘搜尋紀錄
create table discovery_searches (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  search_type text,                 -- hashtag / username / keyword
  results_count integer,
  apify_run_id text,
  created_at timestamptz default now()
);

-- 發掘搜尋結果
create table discovery_results (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references discovery_searches(id),
  ig_handle text,
  name text,
  followers_count integer,
  engagement_rate decimal,
  bio text,
  avatar_url text,
  is_added boolean default false,
  raw_data jsonb,
  created_at timestamptz default now()
);

-- Email 模板
create table email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,               -- 支援 {{variable}} 語法
  variables text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 開發信紀錄
create table outreach_emails (
  id uuid primary key default gen_random_uuid(),
  kol_id uuid references kols(id),
  template_id uuid references email_templates(id),
  to_email text not null,
  subject text not null,
  body text not null,
  status text default '草稿',       -- 草稿/已排程/已發送/發送失敗
  scheduled_at timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);
```

---

## 未來擴展（MVP 後）

| Phase | 模組 | 說明 |
|-------|------|------|
| 2 | 社群監控 | Apify 定期爬取合作 KOL 的貼文數據，Dashboard 呈現 |
| 2 | 業績數據 | Shopline API 串接，KOL ROI 報表 |
| 2 | Line 通知 | KOL 回信通知、進度提醒、業績摘要推播 |
| 3 | 團購報價單 | 整合現有工具到系統內 |
| 3 | 庫存監測 | 整合現有工具，串 Shopline/ERP |
| 3 | 多角色權限 | 不同團隊成員不同權限 |

---

## 需要跟客戶確認的事項

開工前必須確認：

1. **Email 發送方式**：客戶目前用什麼 email 發開發信？Gmail？公司 email？
2. **已完成工具**：團購報價單 & 庫存監測是用什麼做的？未來要不要整合？
3. **Shopline 方案**：用哪個等級？有沒有 API 權限？（Phase 2 用）
4. **使用人數**：幾個人會用這個系統？
5. **KOL 分類方式**：他們怎麼分類 KOL？按產業？按粉絲數？按合作類型？
