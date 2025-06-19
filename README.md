## 概要
このプロジェクトは2025/6/19時点のVibe Codingのデモ用リポジトリです。

## セットアップ
### .claude/settings.local.jsonの設定
```json
全ツール許可
{
  "permissions": {
    "allow": [
      "Agent",
      "Bash",
      "Edit",
      "Glob",
      "Grep",
      "LS",
      "MultiEdit",
      "NotebookEdit",
      "NotebookRead",
      "Read",
      "TodoRead",
      "TodoWrite",
      "WebFetch",
      "WebSearch",
      "Write",
      "Perplexity",
      "Playwright"
    ],
    "deny": []
  }
}
```

### Claude Squadのインストール
- [claude-squad](https://github.com/smtg-ai/claude-squad)

### MCPの設定
- [context7](https://zenn.dev/spacemarket/articles/21c4df0b7795f9)
- [playwright](https://zenn.dev/aldagram_tech/articles/3614dbabbf2f5d)
- DBドライバ(必要なら)
  - ローカルならDB接続情報直接指定もあり
- その他必要に応じて

### package.jsonの整理
- すぐに制御を返さないコマンドを返すようにする(特にdev, log)
- 不要や類似コマンドの削除

### Claude.mdの更新
- 開発中に使用するコマンド
- コード変更後の反映方法
- アーキテクチャ
- ディレクトリ構成
- 各種ドキュメントへのリンク
- Claude Code 通知ルール

### Aqua Voiceのインストール
- [Aqua Voice](https://withaqua.com/)
- ルールに下記を追加
  - あなたはAIエンジニアです。コマンドは英語で記入してください。

## 開発フロー
1. `cs -y`で開発用セッション起動
2. nでセッション作成→ブランチ名を入力(例： add-doc)
3. enterでセッションに入り、指示を入力
4. 指示の末尾に下記を追加し、送信（作業開始）
　　- `ultrathink, web & context7(if necessary), use multipul subagent`
5. 通知が来たら作業内容を確認
6. p でpush
7. Claude Code Actionでレビュー
8. セッションで修正
