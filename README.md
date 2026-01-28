# autolab.cloud 網站

AI峰哥官方網站克隆版，部署於 autolab.cloud

## 技術架構

- **前端**: React 19 + TailwindCSS 4 + shadcn/ui + Framer Motion
- **後端**: Express 4 + tRPC 11
- **資料庫**: PlanetScale (MySQL)
- **認證**: Clerk
- **儲存**: Cloudflare R2
- **金流**: 藍新金流 (Newebpay)
- **部署**: Vercel

## 快速開始

### 1. 安裝依賴

```bash
pnpm install
```

### 2. 設定環境變數

複製環境變數範本：

```bash
cp .env.example .env
```

然後填入實際的值（見下方「環境變數設定」章節）。

### 3. 設定資料庫

```bash
# 生成 migration 檔案
pnpm db:generate

# 推送到資料庫
pnpm db:push

# 開啟 Drizzle Studio 查看資料
pnpm db:studio
```

### 4. 啟動開發伺服器

```bash
pnpm dev
```

開啟 http://localhost:5173 查看網站。

## 環境變數設定

### 必要服務申請清單

| 服務 | 用途 | 申請連結 |
|------|------|---------|
| PlanetScale | 資料庫 | https://planetscale.com |
| Clerk | 使用者認證 | https://clerk.com |
| Cloudflare R2 | 檔案儲存 | https://cloudflare.com |
| Resend | Email 發送 | https://resend.com |
| Google AI Studio | Gemini API | https://aistudio.google.com |
| 藍新金流 | 付款 | https://www.newebpay.com |
| Cloudflare Turnstile | 驗證碼 | https://cloudflare.com |

### 環境變數說明

#### PlanetScale 資料庫

1. 前往 https://app.planetscale.com/ 建立帳號
2. 建立新的 Database
3. 點擊 "Connect" 取得連線字串
4. 設定 `DATABASE_URL`

#### Clerk 認證

1. 前往 https://dashboard.clerk.com/ 建立帳號
2. 建立新的 Application
3. 在 API Keys 頁面取得：
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. 設定 `VITE_CLERK_PUBLISHABLE_KEY`（同 CLERK_PUBLISHABLE_KEY）

#### Cloudflare R2 儲存

1. 前往 https://dash.cloudflare.com/
2. 選擇 R2 Object Storage
3. 建立新的 Bucket（如 `autolab-assets`）
4. 在 Manage R2 API Tokens 建立 API Token
5. 取得：
   - `R2_ACCOUNT_ID`：在 Overview 頁面
   - `R2_ACCESS_KEY_ID` 和 `R2_SECRET_ACCESS_KEY`：API Token 頁面
6. 設定公開存取（Optional）：
   - 在 Bucket 設定中啟用 Public Access
   - 取得 `R2_PUBLIC_URL`

#### 藍新金流

1. 申請藍新金流商店帳號
2. 取得：
   - `NEWEBPAY_MERCHANT_ID`：商店代號
   - `NEWEBPAY_HASH_KEY`：32 字元
   - `NEWEBPAY_HASH_IV`：16 字元
3. 測試環境使用 `https://ccore.newebpay.com/MPG/mpg_gateway`
4. 正式環境使用 `https://core.newebpay.com/MPG/mpg_gateway`

## 部署到 Vercel

### 方法一：透過 Vercel CLI

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 部署
vercel
```

### 方法二：透過 GitHub

1. 將專案推送到 GitHub
2. 在 Vercel Dashboard 匯入專案
3. 設定環境變數
4. 部署

### 網域設定

1. 在 Vercel 專案設定中，前往 Domains
2. 新增 `autolab.cloud`
3. 在 Cloudflare DNS 設定：
   - CNAME `@` → `cname.vercel-dns.com`
   - 或 A 記錄指向 Vercel 的 IP

## 專案結構

```
autolab-cloud/
├── client/                 # 前端 React 應用
│   ├── src/
│   │   ├── components/     # UI 元件
│   │   ├── pages/          # 頁面元件
│   │   ├── hooks/          # React Hooks
│   │   └── lib/            # 工具函式
│   └── public/             # 靜態資源
├── server/                 # 後端 Express 應用
│   ├── _core/              # 核心功能模組
│   ├── routes/             # Express 路由
│   ├── routers.ts          # tRPC 路由定義
│   ├── db.ts               # 資料庫操作
│   ├── storage.ts          # R2 儲存操作
│   └── translation.ts      # 翻譯功能
├── drizzle/                # 資料庫 Schema 和 Migration
│   └── schema.ts           # Drizzle ORM Schema
├── shared/                 # 前後端共用程式碼
├── .env.example            # 環境變數範本
├── package.json            # 專案依賴
├── vite.config.ts          # Vite 設定
├── drizzle.config.ts       # Drizzle 設定
└── vercel.json             # Vercel 部署設定
```

## 常用指令

```bash
# 開發
pnpm dev              # 啟動開發伺服器
pnpm check            # TypeScript 類型檢查
pnpm format           # 程式碼格式化
pnpm test             # 執行測試

# 資料庫
pnpm db:generate      # 生成 migration
pnpm db:push          # 推送 schema 到資料庫
pnpm db:studio        # 開啟 Drizzle Studio

# 部署
pnpm build            # 建置生產版本
pnpm start            # 啟動生產伺服器
```

## 管理員設定

在環境變數中設定 `ADMIN_USER_IDS`，用逗號分隔多個 Clerk User ID：

```
ADMIN_USER_IDS=user_xxxxx,user_yyyyy
```

管理員可以存取 `/admin/*` 路徑下的所有頁面。

## 授權

MIT License
