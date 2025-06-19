/**
 * TypeScript型定義ファイル
 * 銀行取引履歴AI分析ツールの全型定義
 */

// ===============================
// 列挙型定義
// ===============================

/** 取引種別（収入・支出・振替） */
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

/** カテゴリ種別 */
export enum CategoryType {
  FOOD = 'food',
  DAILY_GOODS = 'daily_goods',
  TRANSPORTATION = 'transportation',
  UTILITIES = 'utilities',
  ENTERTAINMENT = 'entertainment',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  SHOPPING = 'shopping',
  INCOME = 'income',
  OTHER = 'other'
}

/** サポートファイル種別 */
export enum FileType {
  CSV = 'csv',
  PNG = 'png',
  JPG = 'jpg',
  JPEG = 'jpeg'
}

/** 分析状態 */
export enum AnalysisStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  OCR_PROCESSING = 'ocr_processing',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// ===============================
// 基本データ型
// ===============================

/** 取引データの型定義 */
export interface Transaction {
  /** 取引ID */
  id: string;
  /** 取引日 */
  date: Date;
  /** 摘要・店舗名 */
  description: string;
  /** 取引金額（正負含む） */
  amount: number;
  /** 取引種別 */
  type: TransactionType;
  /** カテゴリ */
  category: CategoryType;
  /** 残高（オプション） */
  balance?: number;
  /** 自動分類フラグ */
  isAutoClassified: boolean;
  /** 除外フラグ */
  isExcluded: boolean;
}

/** カテゴリ情報の型定義 */
export interface Category {
  /** カテゴリID */
  id: CategoryType;
  /** カテゴリ名 */
  name: string;
  /** カテゴリ色 */
  color: string;
  /** アイコン */
  icon: string;
  /** 説明 */
  description?: string;
}

/** 分析結果の型定義 */
export interface AnalysisResult {
  /** 総支出額 */
  totalExpenses: number;
  /** 総収入額 */
  totalIncome: number;
  /** 取引件数 */
  transactionCount: number;
  /** カテゴリ別集計 */
  categoryBreakdown: CategoryBreakdown[];
  /** 時系列データ */
  timeSeriesData: TimeSeriesData[];
  /** 月別データ */
  monthlyData: MonthlyData[];
  /** 分析期間 */
  dateRange: {
    start: Date;
    end: Date;
  };
  /** 分析インサイト */
  insights: InsightData[];
}

/** グラフデータの型定義 */
export interface ChartData {
  /** ラベル */
  label: string;
  /** 値 */
  value: number;
  /** 色 */
  color?: string;
  /** 追加データ */
  metadata?: Record<string, any>;
}

// ===============================
// インターフェース定義
// ===============================

/** 銀行取引の標準インターフェース */
export interface BankTransaction {
  /** 取引日（文字列形式） */
  date: string;
  /** 摘要 */
  description: string;
  /** 支出額 */
  withdrawal?: string;
  /** 入金額 */
  deposit?: string;
  /** 残高 */
  balance?: string;
  /** その他のフィールド */
  [key: string]: string | undefined;
}

/** 分析オプションの設定 */
export interface AnalysisOptions {
  /** 分析対象期間 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 除外カテゴリ */
  excludeCategories?: CategoryType[];
  /** 最小金額フィルタ */
  minAmount?: number;
  /** 自動分類の使用 */
  useAutoClassification: boolean;
  /** LLM分析の使用 */
  useLLMAnalysis: boolean;
}

/** フィルタリング設定 */
export interface FilterOptions {
  /** 期間フィルタ */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** カテゴリフィルタ */
  categories?: CategoryType[];
  /** 金額範囲フィルタ */
  amountRange?: {
    min: number;
    max: number;
  };
  /** 検索キーワード */
  searchQuery?: string;
  /** 取引種別フィルタ */
  transactionTypes?: TransactionType[];
}

/** エクスポート設定 */
export interface ExportOptions {
  /** エクスポート形式 */
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  /** エクスポート対象期間 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 含めるフィールド */
  includeFields: string[];
  /** エクスポートファイル名 */
  filename?: string;
}

// ===============================
// データ構造型
// ===============================

/** カテゴリ別集計データ */
export interface CategoryBreakdown {
  /** カテゴリ */
  category: CategoryType;
  /** カテゴリ名 */
  categoryName: string;
  /** 合計金額 */
  totalAmount: number;
  /** 取引件数 */
  transactionCount: number;
  /** 割合（%） */
  percentage: number;
  /** 前月比 */
  monthlyChange?: number;
}

/** 時系列データ */
export interface TimeSeriesData {
  /** 日付 */
  date: Date;
  /** 支出額 */
  expenses: number;
  /** 収入額 */
  income: number;
  /** 純額（収入-支出） */
  netAmount: number;
  /** カテゴリ別内訳 */
  categoryBreakdown?: Record<CategoryType, number>;
}

/** 月別データ */
export interface MonthlyData {
  /** 年月 */
  yearMonth: string;
  /** 支出額 */
  expenses: number;
  /** 収入額 */
  income: number;
  /** 取引件数 */
  transactionCount: number;
  /** 前月比 */
  monthlyChange: number;
  /** カテゴリ別内訳 */
  categoryBreakdown: Record<CategoryType, number>;
}

/** 分析インサイト */
export interface InsightData {
  /** インサイトタイプ */
  type: 'trend' | 'anomaly' | 'suggestion' | 'warning';
  /** タイトル */
  title: string;
  /** 説明 */
  description: string;
  /** 重要度（1-5） */
  severity: number;
  /** 関連データ */
  relatedData?: any;
}

// ===============================
// ファイル処理関連型
// ===============================

/** ファイル処理結果 */
export interface ProcessResult<T = any> {
  /** 成功フラグ */
  success: boolean;
  /** 処理結果データ */
  data?: T;
  /** エラーメッセージ */
  error?: string;
  /** 処理済み件数 */
  processedCount?: number;
}

/** 生の取引データ */
export interface RawTransactionData {
  /** 元データ */
  raw: string[];
  /** ヘッダー情報 */
  headers: string[];
  /** 検出されたフォーマット */
  detectedFormat?: string;
}

/** OCRオプション */
export interface OCROptions {
  /** 言語設定 */
  lang: string;
  /** PSM（Page Segmentation Mode） */
  psm: number;
  /** OEM（OCR Engine Mode） */
  oem: number;
  /** 前処理オプション */
  preprocess: boolean;
}

/** LLM設定 */
export interface LLMConfig {
  /** APIキー */
  apiKey?: string;
  /** モデル名 */
  model: string;
  /** 最大トークン数 */
  maxTokens: number;
  /** 温度パラメータ */
  temperature: number;
  /** リトライ回数 */
  retryCount: number;
}

// ===============================
// UI関連型
// ===============================

/** プログレス情報 */
export interface ProgressInfo {
  /** 現在のステップ */
  currentStep: number;
  /** 総ステップ数 */
  totalSteps: number;
  /** 進行率（0-100） */
  progress: number;
  /** 処理内容 */
  description: string;
  /** 経過時間（秒） */
  elapsedTime: number;
}

/** サマリーデータ */
export interface SummaryData {
  /** 総支出額 */
  totalExpenses: number;
  /** 総収入額 */
  totalIncome: number;
  /** 取引件数 */
  transactionCount: number;
  /** 平均取引額 */
  averageAmount: number;
  /** 最高額取引 */
  maxTransaction: Transaction;
  /** 主要カテゴリ */
  topCategory: CategoryBreakdown;
  /** 前月比較データ */
  comparisonData?: {
    expensesChange: number;
    incomeChange: number;
    transactionCountChange: number;
  };
}

// ===============================
// ユーティリティ型
// ===============================

/** オプショナル型 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** 必須型 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/** 部分的必須型 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/** API応答の型定義 */
export interface ApiResponse<T = any> {
  /** 成功フラグ */
  success: boolean;
  /** レスポンスデータ */
  data?: T;
  /** エラーメッセージ */
  message?: string;
  /** ステータスコード */
  statusCode?: number;
}

/** エラー型の定義 */
export class FileProcessError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FileProcessError';
  }
}

export class AnalysisError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

// ===============================
// 集計とフォーマット関連型
// ===============================

/** 集計期間 */
export type AggregationPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** 統計データ */
export interface StatisticsData {
  /** 平均値 */
  mean: number;
  /** 中央値 */
  median: number;
  /** 最頻値 */
  mode: number;
  /** 標準偏差 */
  standardDeviation: number;
  /** 分散 */
  variance: number;
  /** 最小値 */
  min: number;
  /** 最大値 */
  max: number;
  /** 合計 */
  sum: number;
  /** データ数 */
  count: number;
}

/** カテゴリマッピング */
export interface CategoryMapping {
  /** キーワード */
  keywords: string[];
  /** カテゴリ */
  category: CategoryType;
  /** 信頼度 */
  confidence: number;
}

// ===============================
// 定数定義
// ===============================

/** 日付フォーマット */
export const DATE_FORMATS = {
  DISPLAY: 'YYYY/MM/DD',
  API: 'YYYY-MM-DD',
  JAPANESE: 'YYYY年MM月DD日'
} as const;

/** 通貨フォーマット */
export const CURRENCY_FORMATS = {
  JPY: '¥#,##0',
  DISPLAY: '#,##0円'
} as const;