/**
 * 月別支出棒グラフコンポーネント
 * Rechartsを使用した棒グラフ実装
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { MonthlyData, CategoryType } from '@/types';
import { formatCurrency } from '@/utils/dataFormatter';

// ===============================
// 型定義
// ===============================

interface MonthlyBarChartProps {
  /** 月別データ配列 */
  monthlyData: MonthlyData[];
  /** スタック表示フラグ */
  isStacked?: boolean;
  /** 前年比表示フラグ */
  showComparison?: boolean;
  /** 目標支出額 */
  targetAmount?: number;
  /** 月クリック処理 */
  onMonthClick?: (yearMonth: string) => void;
}

// ===============================
// カラーパレット
// ===============================

const CATEGORY_COLORS: Record<CategoryType, string> = {
  [CategoryType.FOOD]: '#ff6b6b',
  [CategoryType.DAILY_GOODS]: '#4ecdc4',
  [CategoryType.TRANSPORTATION]: '#45b7d1',
  [CategoryType.UTILITIES]: '#f9ca24',
  [CategoryType.ENTERTAINMENT]: '#8e44ad',
  [CategoryType.HEALTHCARE]: '#e17055',
  [CategoryType.EDUCATION]: '#00b894',
  [CategoryType.SHOPPING]: '#a29bfe',
  [CategoryType.INCOME]: '#00cec9',
  [CategoryType.OTHER]: '#636e72'
};

// ===============================
// メインコンポーネント
// ===============================

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({
  monthlyData,
  isStacked = false,
  showComparison = false,
  targetAmount,
  onMonthClick
}) => {
  // ===============================
  // 状態管理
  // ===============================

  const [selectedCategories, setSelectedCategories] = useState<Set<CategoryType>>(
    new Set(Object.values(CategoryType))
  );

  // ===============================
  // データ処理
  // ===============================

  const chartData = useMemo(() => {
    return monthlyData.map((data, index) => {
      const result: any = {
        ...data,
        displayMonth: formatMonthDisplay(data.yearMonth),
        expensesColor: getExpenseColor(data.expenses, targetAmount),
        previousYearExpenses: index >= 12 ? monthlyData[index - 12]?.expenses : undefined,
        previousYearIncome: index >= 12 ? monthlyData[index - 12]?.income : undefined
      };

      // カテゴリ別データを追加（スタック表示用）
      if (isStacked) {
        Object.entries(data.categoryBreakdown).forEach(([category, amount]) => {
          if (selectedCategories.has(category as CategoryType)) {
            result[category] = amount;
          }
        });
      }

      return result;
    });
  }, [monthlyData, isStacked, selectedCategories, targetAmount]);

  // 統計情報
  const statistics = useMemo(() => {
    const expenses = chartData.map(d => d.expenses);
    const income = chartData.map(d => d.income);
    
    return {
      avgExpenses: expenses.reduce((sum, val) => sum + val, 0) / expenses.length,
      maxExpenses: Math.max(...expenses),
      minExpenses: Math.min(...expenses),
      avgIncome: income.reduce((sum, val) => sum + val, 0) / income.length,
      totalExpenses: expenses.reduce((sum, val) => sum + val, 0),
      totalIncome: income.reduce((sum, val) => sum + val, 0)
    };
  }, [chartData]);

  // ===============================
  // イベントハンドラー
  // ===============================

  const handleBarClick = (data: any) => {
    if (onMonthClick && data.yearMonth) {
      onMonthClick(data.yearMonth);
    }
  };

  const handleCategoryToggle = (category: CategoryType) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  // ===============================
  // カスタムツールチップ
  // ===============================

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          
          {/* 基本情報 */}
          <div className="space-y-1">
            <p className="text-sm text-red-600">
              支出: {formatCurrency(data.expenses)}
            </p>
            <p className="text-sm text-green-600">
              収入: {formatCurrency(data.income)}
            </p>
            <p className="text-sm text-blue-600">
              純額: {formatCurrency(data.income - data.expenses)}
            </p>
            <p className="text-sm text-gray-600">
              取引件数: {data.transactionCount}件
            </p>
          </div>

          {/* 前年比較 */}
          {showComparison && data.previousYearExpenses && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">前年同月比</p>
              <p className={`text-sm ${data.monthlyChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {data.monthlyChange >= 0 ? '+' : ''}{data.monthlyChange.toFixed(1)}%
              </p>
            </div>
          )}

          {/* スタック表示時のカテゴリ別内訳 */}
          {isStacked && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">カテゴリ別内訳</p>
              {Object.entries(data.categoryBreakdown)
                .filter(([category]) => selectedCategories.has(category as CategoryType))
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([category, amount]) => (
                  <p key={category} className="text-xs" style={{ color: CATEGORY_COLORS[category as CategoryType] }}>
                    {getCategoryDisplayName(category as CategoryType)}: {formatCurrency(amount as number)}
                  </p>
                ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // ===============================
  // レンダリング関数
  // ===============================

  const renderBars = () => {
    if (isStacked) {
      return Object.values(CategoryType)
        .filter(category => selectedCategories.has(category))
        .map(category => (
          <Bar
            key={category}
            dataKey={category}
            stackId="expenses"
            fill={CATEGORY_COLORS[category]}
            onClick={handleBarClick}
            className="cursor-pointer hover:opacity-80"
          />
        ));
    } else {
      return (
        <>
          <Bar
            dataKey="expenses"
            fill="#ff6b6b"
            onClick={handleBarClick}
            className="cursor-pointer hover:opacity-80"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.expensesColor} />
            ))}
          </Bar>
          
          {showComparison && (
            <Bar
              dataKey="previousYearExpenses"
              fill="#ffcccb"
              onClick={handleBarClick}
              className="cursor-pointer hover:opacity-80"
            />
          )}
        </>
      );
    }
  };

  // ===============================
  // メインレンダリング
  // ===============================

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">表示するデータがありません</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* コントロールパネル */}
      <div className="flex flex-wrap items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isStacked}
              onChange={(e) => {/* isStacked変更処理 */}}
              className="rounded"
            />
            <span className="text-sm">スタック表示</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => {/* showComparison変更処理 */}}
              className="rounded"
            />
            <span className="text-sm">前年比較</span>
          </label>
        </div>

        <div className="text-sm text-gray-600">
          {targetAmount && `目標: ${formatCurrency(targetAmount)}`}
        </div>
      </div>

      {/* カテゴリ選択（スタック表示時） */}
      {isStacked && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">表示カテゴリ</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(CategoryType).map(category => (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`px-2 py-1 text-xs rounded ${
                  selectedCategories.has(category)
                    ? 'text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                style={{
                  backgroundColor: selectedCategories.has(category) 
                    ? CATEGORY_COLORS[category] 
                    : undefined
                }}
              >
                {getCategoryDisplayName(category)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="displayMonth"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis
            tickFormatter={formatCurrencyShort}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* 目標値ライン */}
          {targetAmount && (
            <ReferenceLine 
              y={targetAmount} 
              stroke="#ff7c7c" 
              strokeDasharray="5 5"
              label={{ value: "目標", position: "top" }}
            />
          )}
          
          {/* 平均値ライン */}
          <ReferenceLine 
            y={statistics.avgExpenses} 
            stroke="#8884d8" 
            strokeDasharray="3 3"
            label={{ value: "平均", position: "topRight" }}
          />
          
          {renderBars()}
        </BarChart>
      </ResponsiveContainer>

      {/* 統計情報 */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-sm text-red-600">平均支出</div>
          <div className="text-lg font-semibold text-red-800">
            {formatCurrency(statistics.avgExpenses)}
          </div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-sm text-orange-600">最大支出</div>
          <div className="text-lg font-semibold text-orange-800">
            {formatCurrency(statistics.maxExpenses)}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-green-600">総収入</div>
          <div className="text-lg font-semibold text-green-800">
            {formatCurrency(statistics.totalIncome)}
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-600">収支差額</div>
          <div className={`text-lg font-semibold ${
            statistics.totalIncome - statistics.totalExpenses >= 0 
              ? 'text-blue-800' 
              : 'text-red-800'
          }`}>
            {formatCurrency(statistics.totalIncome - statistics.totalExpenses)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================
// ヘルパー関数
// ===============================

const formatMonthDisplay = (yearMonth: string): string => {
  const [year, month] = yearMonth.split('-');
  return `${year}/${month}`;
};

const formatCurrencyShort = (value: number): string => {
  if (value >= 10000) {
    return `${Math.round(value / 1000)}k`;
  }
  return value.toLocaleString();
};

const getExpenseColor = (expenses: number, targetAmount?: number): string => {
  if (!targetAmount) return '#ff6b6b';
  
  if (expenses > targetAmount * 1.2) return '#dc2626'; // 目標の120%超で濃い赤
  if (expenses > targetAmount) return '#ef4444';       // 目標超過で赤
  if (expenses > targetAmount * 0.8) return '#f59e0b'; // 目標の80%超で黄色
  return '#10b981'; // 目標の80%以下で緑
};

const getCategoryDisplayName = (category: CategoryType): string => {
  const displayNames: Record<CategoryType, string> = {
    [CategoryType.FOOD]: '食費',
    [CategoryType.DAILY_GOODS]: '日用品',
    [CategoryType.TRANSPORTATION]: '交通費',
    [CategoryType.UTILITIES]: '光熱費',
    [CategoryType.ENTERTAINMENT]: '娯楽費',
    [CategoryType.HEALTHCARE]: '医療費',
    [CategoryType.EDUCATION]: '教育費',
    [CategoryType.SHOPPING]: '買い物',
    [CategoryType.INCOME]: '収入',
    [CategoryType.OTHER]: 'その他'
  };
  
  return displayNames[category] || 'その他';
};