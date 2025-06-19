# Better Auth 設定ガイド

## Better Auth とは

Better Auth は Next.js プロジェクト向けの現代的な認証ライブラリで、TypeScript ファーストな設計と優れた開発者体験を提供します。

## インストール

```bash
npm install better-auth
npm install @better-auth/drizzle-adapter  # Drizzle ORM アダプター
```

## 設定ファイル

### 1. Better Auth 設定 (`src/lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { db } from "./db"
import * as schema from "../db/schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7日間
    updateAge: 60 * 60 * 24, // 1日
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5分
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      requireEmailVerification: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.User
```

### 2. クライアントサイド設定 (`src/lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
})

export const {
  useSession,
  signIn,
  signOut,
  signUp,
  useUser,
} = authClient
```

### 3. API ルート (`src/app/api/auth/[...all]/route.ts`)

```typescript
import { auth } from "@/lib/auth"

export const { GET, POST } = auth.handler
```

### 4. データベーススキーマ (`src/db/schema.ts`)

```typescript
import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// アプリケーション固有のテーブル
export const analysisSessions = pgTable("analysis_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // 'csv' | 'image'
  status: text("status").notNull().default("processing"), // 'processing' | 'completed' | 'failed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const analysisResults = pgTable("analysis_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => analysisSessions.id, { onDelete: "cascade" }),
  summaryData: text("summary_data").notNull(), // JSON文字列
  categoryBreakdown: text("category_breakdown").notNull(), // JSON文字列
  timeSeriesData: text("time_series_data").notNull(), // JSON文字列
  monthlyData: text("monthly_data").notNull(), // JSON文字列
  aiInsights: text("ai_insights").notNull(), // JSON文字列
  chartConfig: text("chart_config").notNull(), // JSON文字列
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => analysisSessions.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  amount: text("amount").notNull(), // Decimal as text
  category: text("category").notNull(),
  type: text("type").notNull(), // 'income' | 'expense' | 'transfer'
  balance: text("balance"), // Decimal as text, optional
  isAutoClassified: boolean("is_auto_classified").notNull().default(true),
  isExcluded: boolean("is_excluded").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  defaultCategories: text("default_categories").notNull(), // JSON文字列
  chartPreferences: text("chart_preferences").notNull(), // JSON文字列
  notificationSettings: text("notification_settings").notNull(), // JSON文字列
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
```

### 5. ミドルウェア (`src/middleware.ts`)

```typescript
import { betterFetch } from "@better-auth/fetch"
import type { Session } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export default async function authMiddleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  })

  // 認証が必要なページの保護
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }
  }

  // 認証済みユーザーをサインインページからリダイレクト
  if (request.nextUrl.pathname.startsWith("/auth/signin")) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
}
```

### 6. 環境変数 (`.env.local`)

```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=your-postgres-connection-string

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 使用方法

### コンポーネントでの使用

```typescript
"use client"

import { useSession, signIn, signOut } from "@/lib/auth-client"

export function AuthButton() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <div>Loading...</div>
  }

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user.name}!</p>
        <button onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => signIn.social({ provider: "google" })}>
      Sign In with Google
    </button>
  )
}
```

### サーバーサイドでの使用

```typescript
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: headers(), // Next.js App Router
  })
  
  return session
}
```

## セキュリティ機能

1. **セッション管理**: 自動的なセッション更新とセキュアなクッキー
2. **CSRF保護**: 内蔵のCSRF攻撃対策
3. **パスワードハッシュ化**: Argon2による安全なパスワードハッシュ
4. **レート制限**: 内蔵のレート制限機能
5. **メール検証**: メールアドレス検証の自動化

## Next Steps

1. データベースマイグレーションの実行
2. 認証UI コンポーネントの作成
3. 保護されたルートの実装
4. ユーザープロフィール管理機能の追加