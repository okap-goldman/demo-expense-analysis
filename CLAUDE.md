# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは**銀行取引履歴AI分析ツール**です - 個人の家計管理を支援するシングルページReactアプリケーションで、CSVファイルやスクリーンショット画像から銀行取引データを分析し、LLMを活用した分析とデータ可視化を提供します。

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# コードの構文チェック
npm run lint

# プロダクションビルドのプレビュー
npm run preview

# ログの閲覧
npm run log

# 型チェック
npm run typecheck

# データベース操作

```



## アーキテクチャ

### 技術スタック
- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS + shadcn/ui コンポーネント
- **チャート**: Recharts（データ可視化）
- **ファイル処理**: react-dropzone（ファイルアップロード）
- **OCR**: Tesseract.js（画像テキスト抽出）
- **LLM統合**: OpenAI GPT-4o-mini（取引分析）

### プロジェクト構造
```
src/
├── components/
│   ├── charts/           # チャートコンポーネント（CategoryPieChart, TimeSeriesChart, MonthlyBarChart）
│   └── {charts}/         # 追加のチャートコンポーネント
├── lib/
│   └── utils.ts         # ユーティリティ関数
├── types/
│   └── index.ts         # 包括的なTypeScript型定義
├── utils/
│   ├── dataFormatter.ts  # データフォーマット・集計ユーティリティ
│   ├── fileProcessor.ts  # CSV/画像ファイル処理ユーティリティ
│   └── llmAnalyzer.ts    # OCRとLLM分析機能
├── App.tsx              # メインアプリケーションコンポーネント
└── main.tsx             # アプリケーションエントリーポイント
```

### データフロー
```
ファイル入力（CSV/画像） → OCR処理 → LLM分析 → データ構造化 → チャート描画 → 結果表示
```

### 主要コンポーネント
- **ファイル処理**: 自動エンコーディング検出（UTF-8, Shift_JIS）と銀行フォーマット検出（みずほ、三菱UFJ、三井住友、りそな）によるCSV解析
- **OCR統合**: Tesseract.jsを使用した銀行明細書スクリーンショットからのテキスト抽出（前処理により精度向上）
- **LLM分析**: OpenAI GPT-4o-miniとの統合による取引の自動カテゴリ分類とインサイト生成
- **データ可視化**: Rechartsベースのインタラクティブチャート（カテゴリ別内訳、時系列、月別比較）

### 型システム
アプリケーションは`src/types/index.ts`で定義された包括的な型システムを使用：
- 取引データ構造
- カテゴリ管理（食費、交通費、光熱費など）
- 分析結果とインサイト
- ファイル処理インターフェース
- チャートデータフォーマット

### 設定
- **パスエイリアス**: `@/*`は`src/*`を指す（vite.config.tsとtsconfig.jsonで設定）
- **最適化**: Tesseract.jsはViteのoptimizeDepsに含まれてパフォーマンス向上
- **レスポンシブデザイン**: Tailwind CSSによるモバイルファースト設計

### LLM統合に関する注意事項
- 取引のカテゴリ分類とインサイト生成にはOpenAI APIキーが必要
- LLMが利用できない場合はルールベースの分類にフォールバック
- API呼び出しのリトライロジックとエラーハンドリングを実装
- 銀行取引分析用の日本語特化プロンプトを使用

## 開発ガイドライン

- コンポーネントはhooksを使用した関数型React パターンを採用
- カスタムエラークラスによる包括的なエラーハンドリング
- ファイル処理は複数の銀行フォーマットに自動対応
- 全ての金額は日本円の慣例に従って一貫してフォーマット
- OCR処理では画像前処理により文字認識精度を向上

## ドキュメント

### 設計ドキュメント
- [システムアーキテクチャ](docs/system_architecture.md) - システム全体の設計と構成
- [アーキテクチャ概要](docs/arch.md) - プロジェクトアーキテクチャの詳細説明
- [要件定義](docs/requirements.yaml) - プロジェクト要件の詳細
- [更新された要件](docs/updated_requirements.yaml) - 最新の要件定義
- [ユースケースシーケンス](docs/use_case_sequences.md) - ユースケースフローの詳細

### API仕様
- [OpenAPI仕様](docs/openapi/api_specification.yaml) - REST API の詳細仕様

### セットアップガイド
- [Better Auth セットアップ](docs/better_auth_setup.md) - 認証システムのセットアップ手順

## Claude Code 通知ルール
**必須**: あらゆるタスク完了時は必ず通知を送信してください。例外はありません。単純な情報提供の完了時も必ず通知してください。通知内容は実行したタスクに応じて適切に記述すること。

```bash
osascript -e 'display notification "[作業内容]" with title "CC [ブランチ名]" sound name "Tink"'
```

**重要**: 通知内容は必ず具体的で分かりやすく記述すること

