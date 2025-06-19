/**
 * LLM分析処理ユーティリティ関数群
 * OCR処理、LLM分析、カテゴリ分類機能
 */

import Tesseract from 'tesseract.js';
import {
  Transaction,
  CategoryType,
  AnalysisResult,
  InsightData,
  CategoryMapping,
  LLMConfig,
  OCROptions,
  ProcessResult,
  AnalysisError
} from '@/types';

// ===============================
// 設定定数
// ===============================

const DEFAULT_OCR_OPTIONS: OCROptions = {
  lang: 'jpn+eng',
  psm: 6, // Uniform block of text
  oem: 3, // Default
  preprocess: true
};

const DEFAULT_LLM_CONFIG: LLMConfig = {
  model: 'gpt-4o-mini',
  maxTokens: 1000,
  temperature: 0.1,
  retryCount: 3
};

// カテゴリマッピングのデフォルト設定
const CATEGORY_MAPPINGS: CategoryMapping[] = [
  { keywords: ['スーパー', 'コンビニ', '食品', 'イオン', 'セブン', 'ローソン', 'ファミマ'], category: CategoryType.FOOD, confidence: 0.8 },
  { keywords: ['ドラッグ', '薬局', '日用品', 'マツキヨ', 'ウエルシア'], category: CategoryType.DAILY_GOODS, confidence: 0.8 },
  { keywords: ['JR', '地下鉄', 'バス', 'タクシー', '交通', 'IC', 'Suica'], category: CategoryType.TRANSPORTATION, confidence: 0.9 },
  { keywords: ['電気', 'ガス', '水道', '東京電力', '東京ガス'], category: CategoryType.UTILITIES, confidence: 0.9 },
  { keywords: ['映画', 'ゲーム', 'カラオケ', '娯楽', 'Netflix', 'Amazon'], category: CategoryType.ENTERTAINMENT, confidence: 0.7 },
  { keywords: ['病院', '医療', '薬', 'クリニック', '歯科'], category: CategoryType.HEALTHCARE, confidence: 0.8 },
  { keywords: ['学校', '教育', '塾', '本', '書籍'], category: CategoryType.EDUCATION, confidence: 0.8 },
  { keywords: ['Amazon', '楽天', 'ショッピング', '百貨店', 'モール'], category: CategoryType.SHOPPING, confidence: 0.7 },
  { keywords: ['給与', '賞与', 'ボーナス', '手当', '振込'], category: CategoryType.INCOME, confidence: 0.9 }
];

// ===============================
// OCR処理機能
// ===============================

/**
 * 画像からテキスト抽出（Tesseract.js使用）
 * @param imageData 画像データ（DataURL）
 * @param options OCRオプション
 * @returns 抽出されたテキスト
 */
export const performOCR = async (
  imageData: string,
  options: Partial<OCROptions> = {}
): Promise<ProcessResult<string>> => {
  try {
    const config = { ...DEFAULT_OCR_OPTIONS, ...options };
    
    console.log('OCR処理を開始します...');
    
    const { data: { text } } = await Tesseract.recognize(
      imageData,
      config.lang,
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR進行状況: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_pageseg_mode: config.psm,
        tessedit_ocr_engine_mode: config.oem
      }
    );
    
    console.log('OCR処理が完了しました');
    
    return {
      success: true,
      data: text,
      processedCount: 1
    };
  } catch (error) {
    console.error('OCR処理でエラーが発生しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR処理でエラーが発生しました'
    };
  }
};

/**
 * 銀行明細書の構造解析
 * @param ocrText OCRで抽出されたテキスト
 * @returns 構造化された取引データ
 */
export const parseBankStatementStructure = (ocrText: string): ProcessResult<any[]> => {
  try {
    const lines = ocrText.split('\n').filter(line => line.trim());
    const transactions: any[] = [];
    
    // 日付パターンを検索
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/;
    // 金額パターンを検索
    const amountPattern = /[\d,]+円?/g;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateMatch = line.match(datePattern);
      
      if (dateMatch) {
        const amounts = line.match(amountPattern);
        const description = line.replace(datePattern, '').replace(/[\d,]+円?/g, '').trim();
        
        if (amounts && description) {
          transactions.push({
            date: dateMatch[0],
            description,
            amounts: amounts.map(a => a.replace(/[,円]/g, '')),
            originalLine: line
          });
        }
      }
    }
    
    return {
      success: true,
      data: transactions,
      processedCount: transactions.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '明細書の構造解析でエラーが発生しました'
    };
  }
};

// ===============================
// LLM分析機能
// ===============================

/**
 * 取引データのLLM分析（OpenAI GPT-4o-mini使用）
 * @param transactions 取引データ配列
 * @param config LLM設定
 * @returns 分析結果
 */
export const analyzeTransactions = async (
  transactions: Transaction[],
  config: Partial<LLMConfig> = {}
): Promise<ProcessResult<AnalysisResult>> => {
  try {
    const llmConfig = { ...DEFAULT_LLM_CONFIG, ...config };
    
    // カテゴリ分類を実行
    const categorizedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const category = await categorizeTransaction(transaction, llmConfig);
        return { ...transaction, category, isAutoClassified: true };
      })
    );
    
    // インサイト生成
    const insights = await generateInsights(categorizedTransactions, llmConfig);
    
    // 分析結果をまとめる
    const analysisResult: AnalysisResult = {
      totalExpenses: categorizedTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalIncome: categorizedTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
      transactionCount: categorizedTransactions.length,
      categoryBreakdown: [], // dataFormatterで生成
      timeSeriesData: [],    // dataFormatterで生成
      monthlyData: [],       // dataFormatterで生成
      dateRange: {
        start: new Date(Math.min(...categorizedTransactions.map(t => t.date.getTime()))),
        end: new Date(Math.max(...categorizedTransactions.map(t => t.date.getTime())))
      },
      insights
    };
    
    return {
      success: true,
      data: analysisResult,
      processedCount: categorizedTransactions.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'LLM分析でエラーが発生しました'
    };
  }
};

/**
 * 単一取引のカテゴリ自動分類
 * @param transaction 取引データ
 * @param config LLM設定
 * @returns 分類されたカテゴリ
 */
export const categorizeTransaction = async (
  transaction: Transaction,
  config: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<CategoryType> => {
  // まずルールベース分類を試行
  const ruleBasedCategory = categorizeByRules(transaction);
  if (ruleBasedCategory !== CategoryType.OTHER) {
    return ruleBasedCategory;
  }
  
  // LLMによる分類
  try {
    const prompt = createCategorizationPrompt(transaction);
    const category = await callLLMForCategorization(prompt, config);
    return category || CategoryType.OTHER;
  } catch (error) {
    console.warn('LLM分類でエラー、ルールベース分類にフォールバック:', error);
    return CategoryType.OTHER;
  }
};

/**
 * ルールベースのカテゴリ分類
 * @param transaction 取引データ
 * @returns カテゴリ
 */
const categorizeByRules = (transaction: Transaction): CategoryType => {
  const description = transaction.description.toLowerCase();
  
  for (const mapping of CATEGORY_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (description.includes(keyword.toLowerCase())) {
        return mapping.category;
      }
    }
  }
  
  return CategoryType.OTHER;
};

/**
 * カテゴリ分類用プロンプトの生成
 * @param transaction 取引データ
 * @returns プロンプト文字列
 */
const createCategorizationPrompt = (transaction: Transaction): string => {
  const categories = Object.values(CategoryType).join(', ');
  
  return `以下の取引データを適切なカテゴリに分類してください。

取引情報:
- 日付: ${transaction.date.toLocaleDateString('ja-JP')}
- 摘要: ${transaction.description}
- 金額: ${transaction.amount}円

利用可能なカテゴリ: ${categories}

回答は該当するカテゴリ名のみを返してください。例: food, transportation, utilities など`;
};

/**
 * LLM APIの呼び出し（カテゴリ分類）
 * @param prompt プロンプト
 * @param config LLM設定
 * @returns カテゴリ
 */
const callLLMForCategorization = async (
  prompt: string,
  config: LLMConfig
): Promise<CategoryType | null> => {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new AnalysisError('OpenAI API keyが設定されていません', 'MISSING_API_KEY');
  }
  
  for (let attempt = 0; attempt < config.retryCount; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: '日本の銀行取引データの分類専門アシスタントです。取引の摘要から適切なカテゴリを判定します。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const categoryText = data.choices[0]?.message?.content?.trim().toLowerCase();
      
      // カテゴリ名をenumに変換
      const category = Object.values(CategoryType).find(cat => 
        cat.toLowerCase() === categoryText
      );
      
      return category || null;
    } catch (error) {
      console.warn(`LLM API呼び出し失敗 (試行 ${attempt + 1}):`, error);
      if (attempt === config.retryCount - 1) {
        throw error;
      }
      // リトライ前に少し待機
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  return null;
};

/**
 * インサイト生成
 * @param transactions 分析済み取引データ
 * @param config LLM設定
 * @returns インサイト配列
 */
const generateInsights = async (
  transactions: Transaction[],
  config: LLMConfig
): Promise<InsightData[]> => {
  try {
    const insights: InsightData[] = [];
    
    // 基本的な統計情報から異常検知
    const expenses = transactions.filter(t => t.amount < 0);
    const amounts = expenses.map(t => Math.abs(t.amount));
    
    if (amounts.length > 0) {
      const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const maxAmount = Math.max(...amounts);
      
      // 高額取引の検出
      if (maxAmount > average * 3) {
        insights.push({
          type: 'anomaly',
          title: '高額な取引を検出',
          description: `平均的な支出額の3倍を超える取引（¥${maxAmount.toLocaleString()}）が見つかりました。`,
          severity: 3,
          relatedData: { amount: maxAmount, average }
        });
      }
      
      // カテゴリ別の傾向分析
      const categoryTotals = new Map<CategoryType, number>();
      expenses.forEach(t => {
        const current = categoryTotals.get(t.category) || 0;
        categoryTotals.set(t.category, current + Math.abs(t.amount));
      });
      
      const sortedCategories = Array.from(categoryTotals.entries())
        .sort(([,a], [,b]) => b - a);
      
      if (sortedCategories.length > 0) {
        const [topCategory, topAmount] = sortedCategories[0];
        const totalExpenses = Array.from(categoryTotals.values())
          .reduce((sum, amt) => sum + amt, 0);
        const percentage = (topAmount / totalExpenses) * 100;
        
        if (percentage > 40) {
          insights.push({
            type: 'warning',
            title: '特定カテゴリへの集中',
            description: `${getCategoryDisplayName(topCategory)}が支出の${percentage.toFixed(1)}%を占めています。`,
            severity: 2,
            relatedData: { category: topCategory, percentage }
          });
        }
      }
    }
    
    // LLMによる高度な分析（オプション）
    if (config.apiKey) {
      const llmInsights = await generateLLMInsights(transactions, config);
      insights.push(...llmInsights);
    }
    
    return insights;
  } catch (error) {
    console.warn('インサイト生成でエラー:', error);
    return [];
  }
};

/**
 * LLMによる高度なインサイト生成
 * @param transactions 取引データ
 * @param config LLM設定
 * @returns LLMインサイト
 */
const generateLLMInsights = async (
  transactions: Transaction[],
  config: LLMConfig
): Promise<InsightData[]> => {
  try {
    const prompt = createInsightPrompt(transactions);
    const response = await callLLMForInsights(prompt, config);
    
    if (response) {
      return [
        {
          type: 'suggestion',
          title: 'AI分析による提案',
          description: response,
          severity: 1,
          relatedData: { source: 'llm' }
        }
      ];
    }
    
    return [];
  } catch (error) {
    console.warn('LLMインサイト生成でエラー:', error);
    return [];
  }
};

/**
 * インサイト生成用プロンプトの作成
 * @param transactions 取引データ
 * @returns プロンプト
 */
const createInsightPrompt = (transactions: Transaction[]): string => {
  const summary = {
    totalExpenses: transactions.filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalIncome: transactions.filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    transactionCount: transactions.length,
    period: `${transactions[0]?.date.toLocaleDateString('ja-JP')} - ${transactions[transactions.length - 1]?.date.toLocaleDateString('ja-JP')}`
  };
  
  return `家計簿データを分析し、改善提案をしてください。

データサマリー:
- 期間: ${summary.period}
- 取引件数: ${summary.transactionCount}件
- 総支出: ¥${summary.totalExpenses.toLocaleString()}
- 総収入: ¥${summary.totalIncome.toLocaleString()}

2-3行で簡潔な改善提案をお願いします。`;
};

/**
 * LLM APIの呼び出し（インサイト生成）
 * @param prompt プロンプト
 * @param config LLM設定
 * @returns インサイト文字列
 */
const callLLMForInsights = async (
  prompt: string,
  config: LLMConfig
): Promise<string | null> => {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return null; // API keyがない場合は静かに失敗
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: '家計管理の専門アドバイザーです。データに基づいた実践的な提案をします。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.warn('LLMインサイト生成API呼び出し失敗:', error);
    return null;
  }
};

// ===============================
// ヘルパー関数
// ===============================

/**
 * カテゴリ表示名の取得
 * @param category カテゴリ
 * @returns 表示名
 */
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