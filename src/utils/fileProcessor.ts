/**
 * ファイル処理ユーティリティ関数群
 * CSV処理、画像処理、データ正規化機能
 */

import {
  Transaction,
  BankTransaction,
  ProcessResult,
  RawTransactionData,
  TransactionType,
  CategoryType,
  FileProcessError
} from '@/types';

// ===============================
// 文字エンコーディング検出
// ===============================

/**
 * 文字エンコーディングの自動判定
 * @param buffer ファイルバッファ
 * @returns 推定エンコーディング
 */
const detectEncoding = (buffer: ArrayBuffer): string => {
  const uint8Array = new Uint8Array(buffer);
  const sampleSize = Math.min(1024, uint8Array.length);
  
  // BOM検出
  if (uint8Array.length >= 3 &&
      uint8Array[0] === 0xEF &&
      uint8Array[1] === 0xBB &&
      uint8Array[2] === 0xBF) {
    return 'utf-8';
  }
  
  // Shift_JIS文字の検出（簡易版）
  let shiftJisCount = 0;
  for (let i = 0; i < sampleSize - 1; i++) {
    const byte1 = uint8Array[i];
    const byte2 = uint8Array[i + 1];
    
    // Shift_JISの1バイト目の範囲
    if ((byte1 >= 0x81 && byte1 <= 0x9F) || (byte1 >= 0xE0 && byte1 <= 0xFC)) {
      // Shift_JISの2バイト目の範囲
      if ((byte2 >= 0x40 && byte2 <= 0x7E) || (byte2 >= 0x80 && byte2 <= 0xFC)) {
        shiftJisCount++;
        i++; // 2バイト文字なので次をスキップ
      }
    }
  }
  
  // Shift_JIS文字が多い場合はShift_JISと判定
  return shiftJisCount > sampleSize * 0.1 ? 'shift_jis' : 'utf-8';
};

/**
 * テキストデコード
 * @param buffer ファイルバッファ
 * @param encoding エンコーディング
 * @returns デコード済みテキスト
 */
const decodeText = (buffer: ArrayBuffer, encoding: string): string => {
  try {
    if (encoding === 'shift_jis') {
      // Shift_JISのデコード（簡易実装）
      // 実際のプロダクションでは iconv-lite や text-encoding-polyfill を使用
      const decoder = new TextDecoder('shift_jis');
      return decoder.decode(buffer);
    } else {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    }
  } catch (error) {
    // フォールバック: UTF-8で再試行
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(buffer);
  }
};

// ===============================
// CSV処理機能
// ===============================

/**
 * CSVファイルの読み込みと解析
 * @param file CSVファイル
 * @returns 処理結果
 */
export const parseCSVFile = async (file: File): Promise<ProcessResult<Transaction[]>> => {
  try {
    const buffer = await file.arrayBuffer();
    const encoding = detectEncoding(buffer);
    const text = decodeText(buffer, encoding);
    
    const rawData = parseCSVText(text);
    const bankFormat = detectBankFormat(rawData.headers);
    const transactions = convertToTransactions(rawData, bankFormat);
    
    return {
      success: true,
      data: transactions,
      processedCount: transactions.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
};

/**
 * CSVテキストの解析
 * @param text CSVテキスト
 * @returns 生データ
 */
const parseCSVText = (text: string): RawTransactionData => {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    throw new FileProcessError('CSVファイルにデータが含まれていません', 'EMPTY_CSV');
  }
  
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);
  
  return {
    raw: rows,
    headers,
    detectedFormat: 'unknown'
  };
};

/**
 * CSV行の解析
 * @param line CSV行
 * @returns 解析済み配列
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // エスケープされた引用符をスキップ
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// ===============================
// 銀行フォーマット検出
// ===============================

/**
 * 銀行フォーマットの自動検出
 * @param headers ヘッダー配列
 * @returns 検出された銀行フォーマット
 */
const detectBankFormat = (headers: string[]): string => {
  const headerStr = headers.join(',').toLowerCase();
  
  // 主要銀行のフォーマット検出
  if (headerStr.includes('取引日') && headerStr.includes('摘要') && headerStr.includes('出金')) {
    return 'mizuho';
  } else if (headerStr.includes('年月日') && headerStr.includes('内容') && headerStr.includes('支払い')) {
    return 'mufg';
  } else if (headerStr.includes('日付') && headerStr.includes('取引内容') && headerStr.includes('金額')) {
    return 'sumitomo';
  } else if (headerStr.includes('処理日') && headerStr.includes('摘要') && headerStr.includes('出金額')) {
    return 'resona';
  }
  
  return 'generic';
};

/**
 * 銀行取引データへの変換
 * @param rawData 生データ
 * @param bankFormat 銀行フォーマット
 * @returns 取引データ配列
 */
const convertToTransactions = (rawData: RawTransactionData, bankFormat: string): Transaction[] => {
  const columnMapping = getColumnMapping(bankFormat, rawData.headers);
  
  return rawData.raw
    .map((row, index) => {
      try {
        return convertRowToTransaction(row, columnMapping, index);
      } catch (error) {
        console.warn(`行 ${index + 2} の処理でエラー:`, error);
        return null;
      }
    })
    .filter((transaction): transaction is Transaction => transaction !== null);
};

/**
 * カラムマッピングの取得
 * @param bankFormat 銀行フォーマット
 * @param headers ヘッダー配列
 * @returns カラムマッピング
 */
const getColumnMapping = (bankFormat: string, headers: string[]): Record<string, number> => {
  const mapping: Record<string, number> = {};
  
  switch (bankFormat) {
    case 'mizuho':
      mapping.date = findColumnIndex(headers, ['取引日', '日付']);
      mapping.description = findColumnIndex(headers, ['摘要', '内容']);
      mapping.withdrawal = findColumnIndex(headers, ['出金', '支払金額']);
      mapping.deposit = findColumnIndex(headers, ['入金', '預入金額']);
      mapping.balance = findColumnIndex(headers, ['残高']);
      break;
      
    case 'mufg':
      mapping.date = findColumnIndex(headers, ['年月日', '取引日']);
      mapping.description = findColumnIndex(headers, ['内容', '摘要']);
      mapping.withdrawal = findColumnIndex(headers, ['支払い', '出金']);
      mapping.deposit = findColumnIndex(headers, ['預かり', '入金']);
      mapping.balance = findColumnIndex(headers, ['差引残高', '残高']);
      break;
      
    default:
      // 汎用的なマッピング
      mapping.date = findColumnIndex(headers, ['日付', '取引日', '年月日', 'date']);
      mapping.description = findColumnIndex(headers, ['摘要', '内容', '取引内容', 'description']);
      mapping.withdrawal = findColumnIndex(headers, ['出金', '支払', '支出', 'withdrawal']);
      mapping.deposit = findColumnIndex(headers, ['入金', '預入', '収入', 'deposit']);
      mapping.balance = findColumnIndex(headers, ['残高', 'balance']);
      break;
  }
  
  return mapping;
};

/**
 * カラムインデックスの検索
 * @param headers ヘッダー配列
 * @param candidates 候補キーワード
 * @returns カラムインデックス
 */
const findColumnIndex = (headers: string[], candidates: string[]): number => {
  for (const candidate of candidates) {
    const index = headers.findIndex(header => 
      header.toLowerCase().includes(candidate.toLowerCase())
    );
    if (index !== -1) return index;
  }
  return -1;
};

/**
 * 行データを取引データに変換
 * @param row 行データ
 * @param mapping カラムマッピング
 * @param index 行インデックス
 * @returns 取引データ
 */
const convertRowToTransaction = (
  row: string[],
  mapping: Record<string, number>,
  index: number
): Transaction => {
  const dateStr = mapping.date >= 0 ? row[mapping.date] : '';
  const description = mapping.description >= 0 ? row[mapping.description] : '';
  const withdrawalStr = mapping.withdrawal >= 0 ? row[mapping.withdrawal] : '';
  const depositStr = mapping.deposit >= 0 ? row[mapping.deposit] : '';
  const balanceStr = mapping.balance >= 0 ? row[mapping.balance] : '';
  
  // 日付の解析
  const date = parseDate(dateStr);
  if (!date) {
    throw new FileProcessError(`無効な日付: ${dateStr}`, 'INVALID_DATE');
  }
  
  // 金額の解析
  const withdrawal = parseAmount(withdrawalStr);
  const deposit = parseAmount(depositStr);
  const amount = deposit > 0 ? deposit : -withdrawal;
  
  if (amount === 0) {
    throw new FileProcessError('金額が0です', 'ZERO_AMOUNT');
  }
  
  return {
    id: `transaction_${Date.now()}_${index}`,
    date,
    description: description.trim(),
    amount,
    type: amount > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
    category: CategoryType.OTHER, // 初期値（後でLLMで分類）
    balance: parseAmount(balanceStr),
    isAutoClassified: false,
    isExcluded: false
  };
};

// ===============================
// 画像処理機能
// ===============================

/**
 * 画像ファイルの処理
 * @param file 画像ファイル
 * @returns 処理結果
 */
export const processImageFile = async (file: File): Promise<ProcessResult<string>> => {
  try {
    // 画像の前処理
    const processedImage = await preprocessImage(file);
    
    return {
      success: true,
      data: processedImage,
      processedCount: 1
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '画像処理でエラーが発生しました'
    };
  }
};

/**
 * 画像の前処理（コントラスト調整・ノイズ除去）
 * @param file 画像ファイル
 * @returns 処理済み画像のDataURL
 */
const preprocessImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new FileProcessError('Canvas context を取得できません', 'CANVAS_ERROR'));
      return;
    }
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 画像を描画
      ctx.drawImage(img, 0, 0);
      
      // 画像データを取得
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // コントラストとガンマ補正を適用
      for (let i = 0; i < data.length; i += 4) {
        // RGB値を取得
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        // グレースケール変換（OCR精度向上のため）
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        
        // コントラスト調整
        const contrast = 1.5;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const adjustedGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        
        data[i] = adjustedGray;     // R
        data[i + 1] = adjustedGray; // G
        data[i + 2] = adjustedGray; // B
        // アルファ値はそのまま
      }
      
      // 処理済み画像データを適用
      ctx.putImageData(imageData, 0, 0);
      
      // DataURLとして出力
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new FileProcessError('画像の読み込みに失敗しました', 'IMAGE_LOAD_ERROR'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// ===============================
// データ正規化機能
// ===============================

/**
 * 取引データの標準化
 * @param transactions 取引データ配列
 * @returns 正規化済み取引データ配列
 */
export const normalizeTransactionData = (transactions: Transaction[]): Transaction[] => {
  // 重複取引の除去
  const deduplicatedTransactions = removeDuplicateTransactions(transactions);
  
  // データの検証と修正
  return deduplicatedTransactions.map(transaction => ({
    ...transaction,
    description: normalizeDescription(transaction.description),
    amount: Math.round(transaction.amount * 100) / 100, // 小数点以下2桁に丸め
    date: new Date(transaction.date) // 日付オブジェクトに確実に変換
  }));
};

/**
 * 重複取引の検出・除去
 * @param transactions 取引データ配列
 * @returns 重複除去済み配列
 */
const removeDuplicateTransactions = (transactions: Transaction[]): Transaction[] => {
  const seen = new Set<string>();
  
  return transactions.filter(transaction => {
    // 日付、金額、摘要を基準にユニークキーを生成
    const key = `${transaction.date.toISOString().split('T')[0]}_${transaction.amount}_${transaction.description}`;
    
    if (seen.has(key)) {
      return false;
    }
    
    seen.add(key);
    return true;
  });
};

/**
 * 摘要の正規化
 * @param description 摘要
 * @returns 正規化済み摘要
 */
const normalizeDescription = (description: string): string => {
  return description
    .trim()
    .replace(/\s+/g, ' ') // 連続する空白を1つにまとめる
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, char => // 全角英数字を半角に変換
      String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
    );
};

// ===============================
// ヘルパー関数
// ===============================

/**
 * 日付文字列の解析
 * @param dateStr 日付文字列
 * @returns 日付オブジェクト
 */
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // 各種日付フォーマットに対応
  const dateFormats = [
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/, // YYYY/MM/DD, YYYY-MM-DD
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/, // MM/DD/YYYY, DD/MM/YYYY
    /^(\d{4})(\d{2})(\d{2})$/,              // YYYYMMDD
    /^([Hh]?\d{1,2})[.年](\d{1,2})[.月](\d{1,2})[日]?$/ // H30.12.25, 令和2年12月25日
  ];
  
  for (const format of dateFormats) {
    const match = dateStr.match(format);
    if (match) {
      let year: number, month: number, day: number;
      
      if (format === dateFormats[0] || format === dateFormats[2]) {
        // YYYY/MM/DD format
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1; // monthは0ベース
        day = parseInt(match[3]);
      } else if (format === dateFormats[3]) {
        // 和暦対応（簡易版）
        year = parseInt(match[1]);
        if (year < 100) {
          year += 2018; // 平成30年以降は令和として計算（簡易）
        }
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else {
        // MM/DD/YYYY format (仮にDD/MM/YYYYとして処理)
        day = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        year = parseInt(match[3]);
      }
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // 標準的なDate.parseも試行
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * 金額文字列の解析
 * @param amountStr 金額文字列
 * @returns 数値
 */
const parseAmount = (amountStr: string): number => {
  if (!amountStr || amountStr.trim() === '') return 0;
  
  // 金額文字列の正規化
  const normalized = amountStr
    .replace(/[,，]/g, '') // カンマ除去
    .replace(/[円¥]/g, '') // 通貨記号除去
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, char => // 全角数字を半角に変換
      String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
    )
    .trim();
  
  const amount = parseFloat(normalized);
  return isNaN(amount) ? 0 : amount;
};