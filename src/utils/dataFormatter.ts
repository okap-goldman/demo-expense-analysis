/**
 * データフォーマット変換ユーティリティ関数群
 * 銀行取引履歴AI分析ツール用のデータ変換・フォーマット機能
 */

import {
  Transaction,
  CategoryType,
  ChartData,
  AggregationPeriod,
  StatisticsData,
  CategoryBreakdown,
  TimeSeriesData,
  MonthlyData,
  DATE_FORMATS,
  CURRENCY_FORMATS
} from '@/types';

// ===============================
// 通貨フォーマット関数
// ===============================

/**
 * 金額を日本円形式でフォーマット
 * @param amount 金額
 * @param includeSymbol 円記号を含めるか
 * @returns フォーマット済み金額文字列
 */
export const formatCurrency = (amount: number, includeSymbol: boolean = true): string => {
  const formatted = new Intl.NumberFormat('ja-JP').format(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';
  return includeSymbol ? `${sign}¥${formatted}` : `${sign}${formatted}`;
};

/**
 * 千円・万円単位での表示
 * @param amount 金額
 * @param unit 単位（'thousand' | 'tenThousand'）
 * @returns フォーマット済み金額文字列
 */
export const formatCurrencyUnit = (
  amount: number,
  unit: 'thousand' | 'tenThousand' = 'tenThousand'
): string => {
  const divisor = unit === 'thousand' ? 1000 : 10000;
  const unitSymbol = unit === 'thousand' ? '千円' : '万円';
  const value = Math.round(amount / divisor * 10) / 10;
  return `${value}${unitSymbol}`;
};

/**
 * 収入・支出の表現
 * @param amount 金額
 * @returns 収入/支出ラベル付き金額
 */
export const formatIncomeExpense = (amount: number): string => {
  const label = amount >= 0 ? '収入' : '支出';
  return `${label}: ${formatCurrency(Math.abs(amount))}`;
};

// ===============================
// 日付処理関数
// ===============================

/**
 * 日付を指定フォーマットで表示
 * @param date 日付
 * @param format フォーマット種別
 * @returns フォーマット済み日付文字列
 */
export const formatDate = (
  date: Date,
  format: keyof typeof DATE_FORMATS = 'DISPLAY'
): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format) {
    case 'DISPLAY':
      return `${year}/${month}/${day}`;
    case 'API':
      return `${year}-${month}-${day}`;
    case 'JAPANESE':
      return `${year}年${month}月${day}日`;
    default:
      return `${year}/${month}/${day}`;
  }
};

/**
 * 日付範囲の計算
 * @param transactions 取引データ配列
 * @returns 開始日と終了日
 */
export const calculateDateRange = (transactions: Transaction[]): { start: Date; end: Date } => {
  if (transactions.length === 0) {
    const now = new Date();
    return { start: now, end: now };
  }

  const dates = transactions.map(t => t.date);
  return {
    start: new Date(Math.min(...dates.map(d => d.getTime()))),
    end: new Date(Math.max(...dates.map(d => d.getTime())))
  };
};

/**
 * 月別・週別・日別の集計期間取得
 * @param date 基準日
 * @param period 集計期間
 * @returns 期間の開始日と終了日
 */
export const getAggregationPeriod = (
  date: Date,
  period: AggregationPeriod
): { start: Date; end: Date } => {
  const start = new Date(date);
  const end = new Date(date);

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
};

/**
 * 営業日計算（土日祝日を除く）
 * @param startDate 開始日
 * @param endDate 終了日
 * @returns 営業日数
 */
export const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 日曜日(0)と土曜日(6)を除く
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

// ===============================
// グラフデータ変換関数
// ===============================

/**
 * カテゴリ別集計データの生成
 * @param transactions 取引データ配列
 * @returns カテゴリ別集計データ
 */
export const aggregateByCategory = (transactions: Transaction[]): CategoryBreakdown[] => {
  const categoryMap = new Map<CategoryType, {
    totalAmount: number;
    transactionCount: number;
  }>();

  // 支出のみを集計対象とする
  const expenses = transactions.filter(t => t.amount < 0 && !t.isExcluded);
  const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));

  expenses.forEach(transaction => {
    const category = transaction.category;
    const amount = Math.abs(transaction.amount);
    
    if (categoryMap.has(category)) {
      const existing = categoryMap.get(category)!;
      existing.totalAmount += amount;
      existing.transactionCount += 1;
    } else {
      categoryMap.set(category, {
        totalAmount: amount,
        transactionCount: 1
      });
    }
  });

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    categoryName: getCategoryName(category),
    totalAmount: data.totalAmount,
    transactionCount: data.transactionCount,
    percentage: totalExpenses > 0 ? (data.totalAmount / totalExpenses) * 100 : 0
  })).sort((a, b) => b.totalAmount - a.totalAmount);
};

/**
 * 時系列データの生成
 * @param transactions 取引データ配列
 * @param period 集計期間
 * @returns 時系列データ配列
 */
export const generateTimeSeriesData = (
  transactions: Transaction[],
  period: AggregationPeriod = 'daily'
): TimeSeriesData[] => {
  const dataMap = new Map<string, {
    expenses: number;
    income: number;
    categoryBreakdown: Map<CategoryType, number>;
  }>();

  transactions.filter(t => !t.isExcluded).forEach(transaction => {
    const periodKey = getPeriodKey(transaction.date, period);
    
    if (!dataMap.has(periodKey)) {
      dataMap.set(periodKey, {
        expenses: 0,
        income: 0,
        categoryBreakdown: new Map()
      });
    }

    const data = dataMap.get(periodKey)!;
    
    if (transaction.amount < 0) {
      data.expenses += Math.abs(transaction.amount);
    } else {
      data.income += transaction.amount;
    }

    // カテゴリ別内訳
    const categoryAmount = data.categoryBreakdown.get(transaction.category) || 0;
    data.categoryBreakdown.set(
      transaction.category,
      categoryAmount + Math.abs(transaction.amount)
    );
  });

  return Array.from(dataMap.entries())
    .map(([dateKey, data]) => ({
      date: parseKeyToDate(dateKey, period),
      expenses: data.expenses,
      income: data.income,
      netAmount: data.income - data.expenses,
      categoryBreakdown: Object.fromEntries(data.categoryBreakdown) as Record<CategoryType, number>
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

/**
 * 月別データの生成
 * @param transactions 取引データ配列
 * @returns 月別データ配列
 */
export const generateMonthlyData = (transactions: Transaction[]): MonthlyData[] => {
  const monthlyMap = new Map<string, {
    expenses: number;
    income: number;
    transactionCount: number;
    categoryBreakdown: Map<CategoryType, number>;
  }>();

  transactions.filter(t => !t.isExcluded).forEach(transaction => {
    const yearMonth = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyMap.has(yearMonth)) {
      monthlyMap.set(yearMonth, {
        expenses: 0,
        income: 0,
        transactionCount: 0,
        categoryBreakdown: new Map()
      });
    }

    const data = monthlyMap.get(yearMonth)!;
    data.transactionCount++;
    
    if (transaction.amount < 0) {
      data.expenses += Math.abs(transaction.amount);
    } else {
      data.income += transaction.amount;
    }

    const categoryAmount = data.categoryBreakdown.get(transaction.category) || 0;
    data.categoryBreakdown.set(
      transaction.category,
      categoryAmount + Math.abs(transaction.amount)
    );
  });

  const sortedEntries = Array.from(monthlyMap.entries()).sort();
  
  return sortedEntries.map(([yearMonth, data], index) => {
    const previousMonthData = index > 0 ? sortedEntries[index - 1][1] : null;
    const monthlyChange = previousMonthData
      ? ((data.expenses - previousMonthData.expenses) / previousMonthData.expenses) * 100
      : 0;

    return {
      yearMonth,
      expenses: data.expenses,
      income: data.income,
      transactionCount: data.transactionCount,
      monthlyChange,
      categoryBreakdown: Object.fromEntries(data.categoryBreakdown) as Record<CategoryType, number>
    };
  });
};

// ===============================
// 統計計算関数
// ===============================

/**
 * 統計データの算出
 * @param values 数値配列
 * @returns 統計データ
 */
export const calculateStatistics = (values: number[]): StatisticsData => {
  if (values.length === 0) {
    return {
      mean: 0, median: 0, mode: 0, standardDeviation: 0,
      variance: 0, min: 0, max: 0, sum: 0, count: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  // 中央値
  const median = values.length % 2 === 0
    ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
    : sorted[Math.floor(values.length / 2)];

  // 最頻値
  const frequency = new Map<number, number>();
  values.forEach(val => {
    frequency.set(val, (frequency.get(val) || 0) + 1);
  });
  const mode = Array.from(frequency.entries())
    .reduce((a, b) => a[1] > b[1] ? a : b)[0];

  // 分散と標準偏差
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    mean,
    median,
    mode,
    standardDeviation,
    variance,
    min: Math.min(...values),
    max: Math.max(...values),
    sum,
    count: values.length
  };
};

/**
 * 前月比・前年比の算出
 * @param current 現在の値
 * @param previous 前の値
 * @returns 変化率（%）
 */
export const calculateTrends = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * 移動平均の計算
 * @param values 数値配列
 * @param window ウィンドウサイズ
 * @returns 移動平均配列
 */
export const calculateMovingAverage = (values: number[], window: number): number[] => {
  if (window > values.length) return values;
  
  const result: number[] = [];
  for (let i = window - 1; i < values.length; i++) {
    const slice = values.slice(i - window + 1, i + 1);
    const average = slice.reduce((sum, val) => sum + val, 0) / window;
    result.push(average);
  }
  
  return result;
};

// ===============================
// ヘルパー関数
// ===============================

/**
 * カテゴリ名の取得
 * @param category カテゴリタイプ
 * @returns カテゴリ名
 */
const getCategoryName = (category: CategoryType): string => {
  const categoryNames: Record<CategoryType, string> = {
    [CategoryType.FOOD]: '食費',
    [CategoryType.DAILY_GOODS]: '日用品',
    [CategoryType.TRANSPORTATION]: '交通費',
    [CategoryType.UTILITIES]: '光熱費',
    [CategoryType.ENTERTAINMENT]: '娯楽',
    [CategoryType.HEALTHCARE]: '医療費',
    [CategoryType.EDUCATION]: '教育費',
    [CategoryType.SHOPPING]: '買い物',
    [CategoryType.INCOME]: '収入',
    [CategoryType.OTHER]: 'その他'
  };
  
  return categoryNames[category] || 'その他';
};

/**
 * 期間キーの生成
 * @param date 日付
 * @param period 集計期間
 * @returns 期間キー
 */
const getPeriodKey = (date: Date, period: AggregationPeriod): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (period) {
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'weekly':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekYear = weekStart.getFullYear();
      const weekMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
      const weekDay = String(weekStart.getDate()).padStart(2, '0');
      return `${weekYear}-${weekMonth}-${weekDay}`;
    case 'monthly':
      return `${year}-${month}`;
    case 'yearly':
      return `${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * キーから日付への変換
 * @param key 期間キー
 * @param period 集計期間
 * @returns 日付
 */
const parseKeyToDate = (key: string, period: AggregationPeriod): Date => {
  const parts = key.split('-');
  
  switch (period) {
    case 'daily':
    case 'weekly':
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    case 'monthly':
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    case 'yearly':
      return new Date(parseInt(parts[0]), 0, 1);
    default:
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
};