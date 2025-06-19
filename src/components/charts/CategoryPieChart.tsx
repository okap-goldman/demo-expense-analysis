/**
 * カテゴリ別支出円グラフコンポーネント
 * Rechartsを使用した円グラフ実装
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryBreakdown, CategoryType } from '@/types';
import { formatCurrency } from '@/utils/dataFormatter';

// ===============================
// 型定義
// ===============================

interface CategoryPieChartProps {
  /** カテゴリ別データ配列 */
  data: CategoryBreakdown[];
  /** グラフ幅 */
  width?: number;
  /** グラフ高さ */
  height?: number;
  /** カラーパレット */
  colors?: string[];
  /** カテゴリクリック処理 */
  onCategoryClick?: (category: CategoryType) => void;
}

// ===============================
// カラーパレット定義
// ===============================

const DEFAULT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
  '#d084d0', '#87d68a', '#ffb347', '#ff6b6b', '#4ecdc4',
  '#95e1d3', '#fce38a', '#f8b195', '#c06c84', '#6c5b7b'
];

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

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  width,
  height,
  colors = DEFAULT_COLORS,
  onCategoryClick
}) => {
  // ===============================
  // データ処理
  // ===============================

  const chartData = useMemo(() => {
    // 少額カテゴリを「その他」に統合（5%未満）
    const threshold = 5;
    const mainCategories = data.filter(item => item.percentage >= threshold);
    const otherCategories = data.filter(item => item.percentage < threshold);
    
    let processedData = [...mainCategories];
    
    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce((sum, item) => sum + item.totalAmount, 0);
      const otherPercentage = otherCategories.reduce((sum, item) => sum + item.percentage, 0);
      
      processedData.push({
        category: CategoryType.OTHER,
        categoryName: 'その他',
        totalAmount: otherTotal,
        transactionCount: otherCategories.reduce((sum, item) => sum + item.transactionCount, 0),
        percentage: otherPercentage
      });
    }
    
    // データにカラーを割り当て
    return processedData.map((item, index) => ({
      ...item,
      color: CATEGORY_COLORS[item.category] || colors[index % colors.length],
      displayName: `${item.categoryName} (${item.percentage.toFixed(1)}%)`
    }));
  }, [data, colors]);

  // ===============================
  // イベントハンドラー
  // ===============================

  const handlePieClick = (entry: any) => {
    if (onCategoryClick && entry.category) {
      onCategoryClick(entry.category);
    }
  };

  // ===============================
  // カスタムツールチップ
  // ===============================

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{data.categoryName}</p>
          <p className="text-sm text-gray-600">
            金額: {formatCurrency(data.totalAmount)}
          </p>
          <p className="text-sm text-gray-600">
            割合: {data.percentage.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">
            取引件数: {data.transactionCount}件
          </p>
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
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-1 text-sm cursor-pointer hover:opacity-80"
            onClick={() => handlePieClick(entry.payload)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700">{entry.payload.categoryName}</span>
          </div>
        ))}
      </div>
    );
  };

  // ===============================
  // カスタムラベル
  // ===============================

  const renderLabel = (entry: any) => {
    if (entry.percentage < 5) return ''; // 5%未満はラベル非表示
    return `${entry.percentage.toFixed(1)}%`;
  };

  // ===============================
  // レンダリング
  // ===============================

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width: width || '100%', height: height || 400 }}
      >
        <p className="text-gray-500">表示するデータがありません</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width={width || '100%'} height={height || 400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="totalAmount"
            onClick={handlePieClick}
            className="cursor-pointer"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="#fff"
                strokeWidth={2}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* 詳細情報表示 */}
      <div className="mt-4 space-y-2">
        {chartData.slice(0, 5).map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => handlePieClick(item)}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-gray-800">{item.categoryName}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-800">
                {formatCurrency(item.totalAmount)}
              </div>
              <div className="text-sm text-gray-600">
                {item.transactionCount}件 ({item.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};