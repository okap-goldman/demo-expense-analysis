import { CategoryPieChart } from './components/charts/CategoryPieChart'
import { TimeSeriesChart } from './components/charts/TimeSeriesChart'

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

        </div>
      </div>
    </div>
  )
}

export default App