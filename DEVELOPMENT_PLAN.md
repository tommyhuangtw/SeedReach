# 開發計畫

## 開發順序

### Phase 1: 專案初始化（Week 1 前半）
- [ ] 建立 Next.js 專案（App Router + TypeScript + Tailwind）
- [ ] 安裝 Prisma、NextAuth.js、shadcn/ui
- [ ] 設定 Local PostgreSQL + 建立資料庫
- [ ] 定義 Prisma schema（所有資料表）
- [ ] 執行第一次 migration
- [ ] 設定 NextAuth.js（credentials provider）
- [ ] 建立登入頁面

### Phase 2: Layout & KOL 管理（Week 1 後半 - Week 2）
- [ ] 建立 App Layout（Sidebar + 頂部導航）
- [ ] Dashboard 首頁（簡單統計卡片）
- [ ] KOL 列表頁（表格 + 搜尋 + 篩選 + 排序）
- [ ] KOL 新增表單
- [ ] KOL 詳細頁（基本資料 + 狀態管理）
- [ ] KOL 活動紀錄 timeline
- [ ] CSV 批次匯入功能
- [ ] KOL 編輯 / 刪除 / 封存

### Phase 3: KOL 發掘 — Apify 整合（Week 3-4）
- [ ] Apify API 串接（API Route）
- [ ] 搜尋介面（關鍵字 / hashtag / 競品帳號輸入）
- [ ] 搜尋結果列表（帳號、粉絲數、互動率、Bio）
- [ ] 結果篩選（粉絲數範圍、互動率）
- [ ] 一鍵加入 KOL 資料庫
- [ ] 搜尋歷史紀錄頁面

### Phase 4: 開發信管理（Week 5-6）
- [ ] Email 模板 CRUD
- [ ] 模板變數插值（{{kol_name}} 等）
- [ ] 模板預覽功能
- [ ] 批次選 KOL → 套用模板 → 預覽 → 發送
- [ ] Email 發送整合（先用 Resend，之後可換 Gmail API/SMTP）
- [ ] 發信紀錄追蹤（狀態管理）
- [ ] 發信後自動更新 KOL 狀態 + 活動紀錄

### Phase 5: 收尾（Week 7-8）
- [ ] E2E 流程測試
- [ ] UI/UX 調整
- [ ] 部署設定（Vercel + 雲端 PostgreSQL）
- [ ] 客戶教學 / 文件

---

## 開發啟動指令

```bash
# 1. 初始化專案
npx create-next-app@latest phargoods --typescript --tailwind --app --src-dir

# 2. 安裝核心依賴
npm install prisma @prisma/client next-auth bcryptjs
npm install -D @types/bcryptjs
npx prisma init
npx shadcn-ui@latest init

# 3. PostgreSQL 設定
# 確保本地 PostgreSQL 已啟動
createdb phargoods
# 設定 .env 中的 DATABASE_URL
npx prisma migrate dev --name init

# 4. 環境變數 (.env)
# DATABASE_URL=postgresql://username:password@localhost:5432/phargoods
# NEXTAUTH_SECRET=（用 openssl rand -base64 32 產生）
# NEXTAUTH_URL=http://localhost:3000
# APIFY_API_TOKEN=（從 Apify 後台取得）
```

---

## 驗證方式

1. **DB**: `npx prisma studio` 確認 schema 正確、可 CRUD
2. **Auth**: 註冊/登入/登出流程正常
3. **KOL 管理**: 新增 → 編輯 → 狀態變更 → 搜尋篩選 → CSV 匯入
4. **KOL 發掘**: 輸入關鍵字 → Apify 回傳結果 → 篩選 → 加入資料庫
5. **開發信**: 建模板 → 選 KOL → 套用模板 → 發送 → 紀錄追蹤
6. **E2E 流程**: 發掘 KOL → 加入資料庫 → 發開發信 → 追蹤狀態

---

## 技術決策紀錄

| 決策 | 選擇 | 原因 |
|------|------|------|
| 前端框架 | Next.js (App Router) | Full-stack、SSR、FDE portfolio 加分 |
| ORM | Prisma | Type-safe、migration 管理、易遷移 |
| Auth | NextAuth.js | 成熟穩定、支援多種 provider |
| UI | shadcn/ui + Tailwind | 高品質元件、可客製化、開發速度快 |
| 爬蟲 | Apify | 現成 IG Actor、免 Meta API 審核、pay-per-use |
| Email | Resend（MVP）| 最簡單、之後可換 Gmail API/SMTP |
| DB | Local PostgreSQL | 開發方便、之後改 connection string 即可上雲 |
