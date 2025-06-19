import React from 'react'
import { CategoryPieChart } from './components/charts/CategoryPieChart'
import { TimeSeriesChart } from './components/charts/TimeSeriesChart'
import { MonthlyBarChart } from './components/charts/MonthlyBarChart'

// サンプルデータ
const sampleCategoryData = [
  { category: 'food' as any, categoryName: '食費', totalAmount: 120000, transactionCount: 45, percentage: 35.2 },
  { category: 'transportation' as any, categoryName: '交通費', totalAmount: 80000, transactionCount: 30, percentage: 23.5 },
  { category: 'utilities' as any, categoryName: '光熱費', totalAmount: 60000, transactionCount: 15, percentage: 17.6 },
  { category: 'entertainment' as any, categoryName: '娯楽費', totalAmount: 40000, transactionCount: 20, percentage: 11.8 },
  { category: 'other' as any, categoryName: 'その他', totalAmount: 40000, transactionCount: 25, percentage: 11.8 }
];

const sampleTimeSeriesData = [
  { date: new Date('2024-01-01'), expenses: 50000, income: 300000, netAmount: 250000 },
  { date: new Date('2024-01-02'), expenses: 30000, income: 0, netAmount: -30000 },
  { date: new Date('2024-01-03'), expenses: 25000, income: 0, netAmount: -25000 },
  { date: new Date('2024-01-04'), expenses: 40000, income: 50000, netAmount: 10000 },
  { date: new Date('2024-01-05'), expenses: 35000, income: 0, netAmount: -35000 }
];

const sampleMonthlyData = [
  { 
    yearMonth: '2024-01', 
    expenses: 340000, 
    income: 450000, 
    transactionCount: 120, 
    monthlyChange: 5.2,
    categoryBreakdown: { food: 120000, transportation: 80000, utilities: 60000, other: 80000 } as any
  },
  { 
    yearMonth: '2024-02', 
    expenses: 320000, 
    income: 450000, 
    transactionCount: 110, 
    monthlyChange: -5.9,
    categoryBreakdown: { food: 110000, transportation: 75000, utilities: 65000, other: 70000 } as any
  },
  { 
    yearMonth: '2024-03', 
    expenses: 380000, 
    income: 450000, 
    transactionCount: 135, 
    monthlyChange: 18.8,
    categoryBreakdown: { food: 130000, transportation: 90000, utilities: 70000, other: 90000 } as any
  }
];

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            銀行取引履歴AI分析ツール
          </h1>
          <p className="text-gray-600">
            個人の家計管理を支援するデータ分析ダッシュボード
          </p>
        </header>

        <div className="space-y-8">
          {/* カテゴリ別円グラフ */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">カテゴリ別支出分析</h2>
            <CategoryPieChart data={sampleCategoryData} />
          </section>

          {/* 時系列グラフ */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">支出推移</h2>
            <TimeSeriesChart timeSeriesData={sampleTimeSeriesData} />
          </section>

          {/* 月別棒グラフ */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">月別収支</h2>
            <MonthlyBarChart monthlyData={sampleMonthlyData} targetAmount={350000} />
          </section>
        </div>
      </div>
    </div>
  )
}

export default App