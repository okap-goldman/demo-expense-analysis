# ユースケース別シーケンス図

## 1. 初回ログイン・認証シーケンス

```mermaid
sequenceDiagram
    participant User as 👤 ユーザー
    participant SPA as React SPA
    participant Auth as Better Auth
    participant Session as セッション管理
    participant Memory as メモリストレージ

    User->>SPA: アプリケーションにアクセス
    SPA->>Auth: 認証状態確認
    Auth-->>SPA: 未認証ステータス
    SPA->>User: ログイン画面表示

    User->>SPA: ログイン操作
    SPA->>Auth: 認証リクエスト
    Auth->>Auth: 認証処理
    Auth-->>SPA: 認証成功
    SPA->>Session: 一時セッション作成
    Session->>Memory: セッション情報保存
    Memory-->>Session: 保存完了
    Session-->>SPA: セッション確立
    SPA->>User: メインダッシュボード表示

    Note over User, Memory: 認証完了、分析機能利用可能
```

## 2. CSVファイルアップロード・分析シーケンス

```mermaid
sequenceDiagram
    participant User as 👤 ユーザー
    participant SPA as React SPA
    participant API as API Server
    participant FileProc as ファイル処理エンジン
    participant AI as AI分析エンジン
    participant DataAnalyzer as データ分析
    participant Memory as メモリストレージ
    participant Charts as チャート表示

    User->>SPA: CSVファイルをドラッグ&ドロップ
    SPA->>SPA: ファイル形式検証
    SPA->>API: ファイルアップロード（CSV）
    
    API->>FileProc: CSV解析要求
    FileProc->>FileProc: Papa Parseでデータ解析
    FileProc->>Memory: 解析済みデータ一時保存
    FileProc-->>API: 解析完了

    API->>AI: 取引データ分析要求
    AI->>AI: OpenAI GPT-4で取引分析
    AI->>AI: カテゴライゼーション実行
    AI->>Memory: 分析結果保存
    AI-->>API: AI分析完了

    API->>DataAnalyzer: 統計分析要求
    DataAnalyzer->>Memory: 解析済みデータ取得
    DataAnalyzer->>DataAnalyzer: 支出パターン分析
    DataAnalyzer->>DataAnalyzer: 統計処理実行
    DataAnalyzer->>Memory: 分析結果更新
    DataAnalyzer-->>API: 統計分析完了

    API-->>SPA: 分析結果送信
    SPA->>Charts: グラフ・チャート生成
    Charts->>Charts: Chart.js/Rechartsで可視化
    Charts-->>SPA: 可視化完了
    SPA->>User: 分析結果とグラフ表示

    Note over User, Memory: CSV分析完了、可視化表示
```

## 3. 画像ファイル（通帳等）OCR・分析シーケンス

```mermaid
sequenceDiagram
    participant User as 👤 ユーザー
    participant SPA as React SPA
    participant API as API Server
    participant FileProc as ファイル処理エンジン
    participant OCR as OCRエンジン
    participant GoogleVision as Google Vision API
    participant AI as AI分析エンジン
    participant DataAnalyzer as データ分析
    participant Memory as メモリストレージ
    participant Charts as チャート表示

    User->>SPA: 画像ファイル（通帳画像）アップロード
    SPA->>SPA: 画像形式検証
    SPA->>API: 画像ファイル送信

    API->>FileProc: 画像前処理要求
    FileProc->>FileProc: Sharpで画像最適化
    FileProc->>Memory: 処理済み画像一時保存
    FileProc-->>API: 前処理完了

    API->>OCR: OCR処理要求
    OCR->>GoogleVision: テキスト抽出API呼び出し
    GoogleVision-->>OCR: 抽出テキスト返却
    OCR->>OCR: テキスト後処理・整形
    OCR->>Memory: 抽出テキスト保存
    OCR-->>API: OCR処理完了

    API->>AI: 取引データ分析要求
    AI->>Memory: OCR結果取得
    AI->>AI: OpenAI GPT-4で取引解析
    AI->>AI: 取引内容カテゴライゼーション
    AI->>Memory: 分析結果保存
    AI-->>API: AI分析完了

    API->>DataAnalyzer: 統計分析要求
    DataAnalyzer->>Memory: 分析済みデータ取得
    DataAnalyzer->>DataAnalyzer: 支出パターン分析
    DataAnalyzer->>Memory: 分析結果更新
    DataAnalyzer-->>API: 統計分析完了

    API-->>SPA: 分析結果送信
    SPA->>Charts: グラフ・チャート生成
    Charts-->>SPA: 可視化完了
    SPA->>User: 分析結果とグラフ表示

    Note over User, Memory: 画像OCR・分析完了
```

## 4. PDFレポート生成・ダウンロードシーケンス

```mermaid
sequenceDiagram
    participant User as 👤 ユーザー
    participant SPA as React SPA
    participant API as API Server
    participant PDFGen as PDF生成エンジン
    participant Memory as メモリストレージ
    participant FileStorage as 一時ファイル保存
    participant PDFViewer as PDF表示

    User->>SPA: PDFレポート生成要求
    SPA->>API: PDF生成リクエスト

    API->>Memory: 分析結果データ取得
    Memory-->>API: 全分析データ返却

    API->>PDFGen: PDF生成要求（データ付き）
    PDFGen->>PDFGen: jsPDF/Puppeteerでレポート生成
    PDFGen->>PDFGen: グラフ・チャート埋め込み
    PDFGen->>PDFGen: 分析結果テキスト整形
    PDFGen->>FileStorage: 生成PDFファイル一時保存
    PDFGen-->>API: PDF生成完了（ファイルパス）

    API-->>SPA: PDF生成完了通知
    SPA->>PDFViewer: PDFプレビュー表示
    PDFViewer->>FileStorage: PDFファイル取得
    FileStorage-->>PDFViewer: PDFデータ返却
    PDFViewer-->>SPA: プレビュー表示完了
    SPA->>User: PDFプレビュー表示

    User->>SPA: ダウンロード要求
    SPA->>FileStorage: PDFファイル取得
    FileStorage-->>SPA: PDFファイル送信
    SPA->>User: ブラウザダウンロード開始

    Note over User, FileStorage: PDFレポート生成・ダウンロード完了
```

## 5. セッション終了・データ完全削除シーケンス

```mermaid
sequenceDiagram
    participant User as 👤 ユーザー
    participant SPA as React SPA
    participant API as API Server
    participant Session as セッション管理
    participant Memory as メモリストレージ
    participant FileStorage as 一時ファイル保存
    participant Auth as Better Auth

    User->>SPA: ログアウト または ブラウザ閉じる
    SPA->>API: セッション終了通知

    API->>Memory: 保存データ確認
    Memory-->>API: データ一覧返却

    par 並列データ削除処理
        API->>Memory: 分析データ完全削除
        Memory->>Memory: メモリクリアランス
        Memory-->>API: メモリ削除完了
    and
        API->>FileStorage: 一時ファイル削除
        FileStorage->>FileStorage: PDFファイル削除
        FileStorage->>FileStorage: 画像ファイル削除
        FileStorage-->>API: ファイル削除完了
    end

    API->>Session: セッション無効化
    Session->>Session: セッションデータ削除
    Session-->>API: セッション削除完了

    API-->>SPA: 全データ削除完了
    SPA->>Auth: 認証状態クリア
    Auth->>Auth: 認証トークン無効化
    Auth-->>SPA: 認証クリア完了

    SPA->>User: ログアウト完了（ログイン画面表示）

    Note over User, Auth: 全データ完全削除、プライバシー保護完了
```

## 6. エラーハンドリング・復旧シーケンス

```mermaid
sequenceDiagram
    participant User as 👤 ユーザー
    participant SPA as React SPA
    participant API as API Server
    participant Service as 各種サービス
    participant Memory as メモリストレージ
    participant ErrorHandler as エラーハンドラー

    User->>SPA: 操作実行
    SPA->>API: API要求
    API->>Service: サービス処理要求

    Service-->>API: エラー発生 ❌
    API->>ErrorHandler: エラーキャッチ
    
    ErrorHandler->>ErrorHandler: エラー種別判定
    
    alt 一時的エラー（ネットワーク等）
        ErrorHandler->>API: リトライ指示
        API->>Service: 再試行
        Service-->>API: 処理成功 ✅
        API-->>SPA: 結果返却
        SPA->>User: 成功結果表示
    else 致命的エラー（認証失効等）
        ErrorHandler->>Memory: 関連データ削除
        Memory-->>ErrorHandler: 削除完了
        ErrorHandler->>API: エラー応答生成
        API-->>SPA: エラー情報送信
        SPA->>User: エラーメッセージ表示
        SPA->>User: 再ログイン要求
    else ファイル形式エラー
        ErrorHandler->>API: バリデーションエラー
        API-->>SPA: 形式エラー通知
        SPA->>User: ファイル形式エラー表示
        SPA->>User: 正しい形式での再アップロード要求
    end

    Note over User, ErrorHandler: エラー種別に応じた適切な処理実行
```

## シーケンス図の説明

### 設計原則
1. **ステートレス**: 各処理でデータの永続化を避け、メモリベース処理
2. **セキュリティファースト**: 処理完了後の即座データ削除
3. **並列処理**: パフォーマンス向上のための並列実行
4. **エラー耐性**: 各段階でのエラーハンドリングと復旧

### 主要な特徴
- **データプライバシー**: セッション終了時の完全データ削除
- **リアルタイム処理**: OCR、AI分析の非同期処理
- **ユーザビリティ**: プログレス表示とエラーフィードバック
- **スケーラビリティ**: 並列処理による高速化 