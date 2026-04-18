# SeedReach — 產品規格書

## 產品概述

SeedReach 是一個 KOL 社群行銷管理系統，整合 KOL 發掘、名單管理、AI 資料提取與開發信自動化。
目標客戶為社群行銷團隊，取代 Google Sheet + LINE 的手動管理流程。

## 客戶業務流程

```
名單蒐集 → 開發信寄送 → 報價分析與預算管理 → 版本與廣告分析 → 社群監控 → 業績數據
```

### MVP 範圍（已完成）

| 模組 | 功能 | 狀態 |
|------|------|------|
| Auth & Layout | Email/Password 登入、Sidebar 導航 | ✅ |
| KOL 管理 | CRUD、狀態追蹤、活動紀錄、CSV 匯入 | ✅ |
| KOL 發掘 | Hashtag 搜尋、IG Profile 爬取、AI 提取 | ✅ |
| 開發信管理 | 模板 CRUD、批量 1:1 寄送、紀錄追蹤 | ✅ |

### 未來擴展

| Phase | 模組 | 說明 |
|-------|------|------|
| 2 | 報價分析與預算管理 | 公關品表單自動填寫、預算內的合作 KOL 篩選 |
| 2 | 社群監控 | 定期爬取合作 KOL 貼文數據，Dashboard 呈現 |
| 2 | 業績數據 | Shopline API 串接，KOL ROI 報表 |
| 3 | 團購報價單工具 | 整合現有報價流程 |
| 3 | 庫存監測工具 | 串 Shopline/ERP |

---

## 技術架構

```
┌─ Frontend ──────────────────────────────┐
│  Next.js 16 (App Router, Turbopack)     │
│  React 19, TypeScript 5                 │
│  Tailwind CSS 4 + shadcn/ui 4 (base-ui) │
└────────────────┬────────────────────────┘
                 │
┌─ Backend ──────┴────────────────────────┐
│  Next.js Server Actions / API Routes    │
│  NextAuth.js 4 (Credentials + JWT)      │
│  Prisma 7 ORM                           │
│  PostgreSQL                             │
└────────────────┬────────────────────────┘
                 │
┌─ External ─────┴────────────────────────┐
│  Apify (IG Hashtag & Profile Scraper)   │
│  OpenRouter + Gemini Flash (AI 提取)    │
│  Gmail SMTP / Nodemailer (開發信寄送)   │
└─────────────────────────────────────────┘
```

---

## 功能模組細節

### 1. KOL 管理

- **列表頁**：表格呈現，支援搜尋、篩選（狀態/分類）、分頁
- **新增 KOL**：輸入 IG 帳號 → 自動爬取 Profile（Apify）→ AI 提取聯絡資訊 → 編輯確認 → 儲存
- **詳細頁**：基本資料、聯絡方式、狀態管理、活動紀錄 Timeline、備註
- **狀態流程**：`潛在` → `已聯繫` → `洽談中` → `合作中` → `結案`
- **批量匯入**：CSV 上傳匯入

### 2. KOL 發掘

- **搜尋方式**：輸入 Hashtag 關鍵字
- **爬取流程**：Hashtag 搜尋（貼文 + Reels）→ 篩選 likes > 200 → 爬取 Profile → AI 提取
- **AI 提取**（OpenRouter + Gemini Flash）：
  - Email、LINE ID、電話
  - 內容類別（母嬰、美妝、健康等）
  - 內容類型（部落客、營養師、醫師等）
  - 合作資訊（合作請私訊等）
- **頭貼持久化**：Instagram CDN URL 會過期，爬取時轉為 base64 data URI 存入 DB
- **搜尋歷史**：可展開查看每次搜尋的 KOL 結果，支援篩選（已加入/未加入/有 Email/有 LINE）
- **重複處理**：已存在的 KOL 會更新資料而非重複建立

### 3. 開發信管理

- **模板管理**：建立/編輯/刪除信件模板，支援 `{{kol_name}}` 變數
- **寄送流程**：選模板 → 勾選 KOL（僅顯示有 Email 者）→ 預覽 → 確認寄送
- **寄送方式**：Gmail SMTP，1:1 個別寄送（非 BCC），每封間隔 1 秒避免限速
- **自動化**：寄送後自動更新 KOL 狀態為「已聯繫」、建立活動紀錄
- **紀錄追蹤**：寄送紀錄頁，可篩選已寄送/失敗

---

## 資料模型

| Model | 用途 |
|-------|------|
| User | 系統使用者（Email/Password 登入） |
| Kol | KOL 基本資料、聯絡方式、狀態 |
| KolActivity | KOL 活動紀錄（狀態變更、寄信、備註等） |
| DiscoverySearch | 發掘搜尋紀錄 |
| DiscoveryResult | 搜尋結果（含 rawData） |
| EmailTemplate | 開發信模板 |
| OutreachEmail | 開發信寄送紀錄 |

---

## 頁面結構

```
/login              — 登入
/dashboard          — Dashboard（KOL 統計總覽）
/kols               — KOL 列表（搜尋、篩選、分頁）
/kols/new           — 新增 KOL（輸入 IG → 自動爬取）
/kols/[id]          — KOL 詳細頁
/kols/[id]/edit     — 編輯 KOL
/discover           — KOL 發掘（Hashtag 搜尋 + 搜尋歷史）
/outreach           — 開發信（寄送 | 模板管理 | 寄送紀錄）
/settings           — 設定
```

---

## 外部服務依賴

| 服務 | 用途 | 費用 |
|------|------|------|
| Apify | Instagram Hashtag & Profile 爬取 | ~$5-25/月 (pay-per-use) |
| OpenRouter | AI 提取聯絡資訊（Gemini Flash） | 極低（每次 < $0.01） |
| Gmail | 開發信寄送（App Password） | 免費（每日上限 500 封） |
