/**
 * 時系列支出推移グラフコンポーネント
 * Rechartsを使用した折れ線グラフ実装
 */

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  AreaChart,
  Area
} from 'recharts';
import { TimeSeriesData, CategoryType, AggregationPeriod } from '@/types';
import { formatCurrency, formatDate } from '@/utils/dataFormatter';

// ===============================
// 型定義
// ===============================

interface TimeSeriesChartProps {
  /** 時系列データ配列 */
  timeSeriesData: TimeSeriesData[];
  /** 表示期間 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 集計単位（日・週・月） */
  aggregationLevel?: AggregationPeriod;
  /** 表示カテゴリ */
  selectedCategories?: CategoryType[];
  /** 期間変更コールバック */
  onRangeChange?: (start: Date, end: Date) => void;
  /** グラフタイプ */
  chartType?: 'line' | 'area';
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

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  timeSeriesData,
  dateRange,
  aggregationLevel = 'daily',
  selectedCategories,
  onRangeChange,
  chartType = 'line'
}) => {
  // ===============================
  // 状態管理
  // ===============================

  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(['expenses', 'income'])
  );

  // ===============================
  // データ処理
  // ===============================

  const chartData = useMemo(() => {
    let filteredData = timeSeriesData;

    // 期間フィルタリング
    if (dateRange) {
      filteredData = timeSeriesData.filter(
        item => item.date >= dateRange.start && item.date <= dateRange.end
      );
    }

    // データ形式変換
    return filteredData.map(item => {
      const result: any = {
        date: item.date,
        formattedDate: formatDateForChart(item.date, aggregationLevel),
        expenses: item.expenses,
        income: item.income,
        netAmount: item.netAmount
      };

      // カテゴリ別データを追加
      if (item.categoryBreakdown && showCategories) {
        Object.entries(item.categoryBreakdown).forEach(([category, amount]) => {
          if (!selectedCategories || selectedCategories.includes(category as CategoryType)) {
            result[category] = amount;
          }
        });
      }

      return result;
    });
  }, [timeSeriesData, dateRange, aggregationLevel, showCategories, selectedCategories]);

  // 移動平均データ
  const movingAverageData = useMemo(() => {
    const window = aggregationLevel === 'daily' ? 7 : aggregationLevel === 'weekly' ? 4 : 3;
    return calculateMovingAverage(chartData, 'expenses', window);
  }, [chartData, aggregationLevel]);

  // ===============================
  // イベントハンドラー
  // ===============================

  const handleLegendClick = (dataKey: string) => {
    const newVisibleLines = new Set(visibleLines);
    if (newVisibleLines.has(dataKey)) {
      newVisibleLines.delete(dataKey);
    } else {
      newVisibleLines.add(dataKey);
    }
    setVisibleLines(newVisibleLines);
  };

  const handleBrushChange = (brushData: any) => {
    if (onRangeChange && brushData && chartData.length > 0) {
      const { startIndex, endIndex } = brushData;
      const start = chartData[startIndex]?.date;
      const end = chartData[endIndex]?.date;
      if (start && end) {
        onRangeChange(start, end);
      }
    }
  };

  // ===============================
  // カスタムツールチップ
  // ===============================

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {getDisplayName(entry.dataKey)}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // ===============================
  // カスタム凡例
  // ===============================

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className={`flex items-center gap-2 cursor-pointer hover:opacity-80 ${
              !visibleLines.has(entry.dataKey) ? 'opacity-50' : ''
            }`}
            onClick={() => handleLegendClick(entry.dataKey)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">
              {getDisplayName(entry.dataKey)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // ===============================
  // レンダリング関数
  // ===============================

  const renderChart = () => {
    const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
    const DataComponent = chartType === 'area' ? Area : Line;

    return (
      <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#e0e0e0' }}
        />
        <YAxis
          tickFormatter={(value) => formatCurrencyShort(value)}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#e0e0e0' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />

        {/* 支出線 */}
        {visibleLines.has('expenses') && (
          <DataComponent
            type="monotone"
            dataKey="expenses"
            stroke="#ff6b6b"
            strokeWidth={2}
            dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#ff6b6b', strokeWidth: 2 }}
            {...(chartType === 'area' && { fill: '#ff6b6b', fillOpacity: 0.1 })}
          />
        )}

        {/* 収入線 */}
        {visibleLines.has('income') && (
          <DataComponent
            type="monotone"
            dataKey="income"
            stroke="#00cec9"
            strokeWidth={2}
            dot={{ fill: '#00cec9', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#00cec9', strokeWidth: 2 }}
            {...(chartType === 'area' && { fill: '#00cec9', fillOpacity: 0.1 })}
          />
        )}

        {/* 純額線 */}
        {visibleLines.has('netAmount') && (
          <DataComponent
            type="monotone"
            dataKey="netAmount"
            stroke="#8e44ad"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#8e44ad', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#8e44ad', strokeWidth: 2 }}
            {...(chartType === 'area' && { fill: '#8e44ad', fillOpacity: 0.1 })}
          />
        )}

        {/* カテゴリ別表示 */}
        {showCategories && selectedCategories && selectedCategories.map((category) => (
          visibleLines.has(category) && (
            <DataComponent
              key={category}
              type="monotone"
              dataKey={category}
              stroke={CATEGORY_COLORS[category]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
              {...(chartType === 'area' && { 
                fill: CATEGORY_COLORS[category], 
                fillOpacity: 0.1 
              })}
            />
          )
        ))}

        {/* ブラシ（期間選択） */}
        <Brush
          dataKey="formattedDate"
          height={30}
          stroke="#8884d8"
          onChange={handleBrushChange}
        />
      </ChartComponent>
    );
  };

  // ===============================
  // メインレンダリング
  // ===============================

  if (!timeSeriesData || timeSeriesData.length === 0) {
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
          <button
            onClick={() => setShowCategories(!showCategories)}
            className={`px-3 py-1 rounded text-sm ${
              showCategories
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            カテゴリ別表示
          </button>
          
          <select
            value={chartType}
            onChange={(e) => {/* chartType変更処理 */}}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="line">折れ線グラフ</option>
            <option value="area">エリアグラフ</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          期間: {chartData.length > 0 && (
            <>
              {formatDate(chartData[0].date)} ～ {formatDate(chartData[chartData.length - 1].date)}
            </>
          )}
        </div>
      </div>

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={400}>
        {renderChart()}
      </ResponsiveContainer>

      {/* 統計情報 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-sm text-red-600">平均支出</div>
          <div className="text-lg font-semibold text-red-800">
            {formatCurrency(
              chartData.reduce((sum, item) => sum + item.expenses, 0) / chartData.length
            )}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-green-600">平均収入</div>
          <div className="text-lg font-semibold text-green-800">
            {formatCurrency(
              chartData.reduce((sum, item) => sum + item.income, 0) / chartData.length
            )}
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-600">平均純額</div>
          <div className="text-lg font-semibold text-blue-800">
            {formatCurrency(
              chartData.reduce((sum, item) => sum + item.netAmount, 0) / chartData.length
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================
// ヘルパー関数
// ===============================

const formatDateForChart = (date: Date, aggregationLevel: AggregationPeriod): string => {
  switch (aggregationLevel) {
    case 'daily':
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case 'weekly':
      return `${date.getMonth() + 1}/${date.getDate()}週`;
    case 'monthly':
      return `${date.getFullYear()}/${date.getMonth() + 1}`;
    case 'yearly':
      return `${date.getFullYear()}年`;
    default:
      return formatDate(date);
  }
};

const formatCurrencyShort = (value: number): string => {
  if (value >= 10000) {
    return `${Math.round(value / 1000)}k`;
  }
  return value.toLocaleString();
};

const getDisplayName = (dataKey: string): string => {
  const names: Record<string, string> = {
    expenses: '支出',
    income: '収入',
    netAmount: '純額',
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
  return names[dataKey] || dataKey;
};

const calculateMovingAverage = (data: any[], key: string, window: number): any[] => {
  return data.map((item, index) => {
    if (index < window - 1) return { ...item, [`${key}MA`]: item[key] };
    
    const sum = data
      .slice(index - window + 1, index + 1)
      .reduce((acc, curr) => acc + (curr[key] || 0), 0);
    
    return { ...item, [`${key}MA`]: sum / window };
  });
};