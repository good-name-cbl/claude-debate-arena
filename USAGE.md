# 討論会リアルタイムビューワー 使い方ガイド

Claude Code のチーム機能で行う討論会を、Web ブラウザでリアルタイム視聴するためのシステムです。

## 仕組み

```
[Claude Code サブエージェント]
    ↓ Bash で log-direct.js を実行
[debate-data/current.jsonl]
    ↓ ファイル変更を検知
[Next.js SSE ストリーム]
    ↓ リアルタイム配信
[ブラウザ UI]
```

> **注意**: PostToolUse Hook（`log-message.js`）はメインプロセスの `SendMessage` のみで発火し、Task ツールで起動したサブエージェントでは動作しません。そのため、サブエージェントでは `log-direct.js` を Bash 経由で呼び出す方式を正式手順としています。

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd debate-viewer
npm install
```

### 2. 討論設定の編集

`debate-data/config.json` を編集して、トピックや参加者を設定します。

```json
{
  "topic": "分譲マンション vs 一軒家",
  "duration": 180,
  "participants": [
    { "name": "moderator", "displayName": "司会者", "role": "moderator", "color": "#EAB308" },
    { "name": "condo-advocate", "displayName": "マンション派", "role": "advocate", "color": "#3B82F6" },
    { "name": "house-advocate", "displayName": "一軒家派", "role": "advocate", "color": "#EF4444" },
    { "name": "timekeeper", "displayName": "タイムキーパー", "role": "timekeeper", "color": "#8B5CF6" }
  ]
}
```

#### 設定項目

| フィールド | 説明 |
|---|---|
| `topic` | 討論テーマ（ヘッダーに表示） |
| `duration` | 制限時間（秒） |
| `participants` | 参加者リスト |

#### 参加者の設定

| フィールド | 説明 |
|---|---|
| `name` | Claude Code チームのエージェント名と一致させる |
| `displayName` | 画面に表示される名前 |
| `role` | `moderator` / `advocate` / `timekeeper` |
| `color` | 表示色（HEX） |

## 使い方

### 1. ビューワーを起動

```bash
cd debate-viewer
npm run dev
```

### 2. ブラウザでアクセス

- トップページ: http://localhost:3000
  - 討論設定と参加者一覧が確認できます
  - 「討論を視聴する」ボタンで視聴画面へ
- 視聴画面: http://localhost:3000/debate

### 3. 討論を開始

別ターミナルで Claude Code のチーム討論を開始します。

各サブエージェントのプロンプトに、以下の Bash コマンドによるメッセージ送信手順を含めてください。

```bash
# broadcast（全員向け）
cat <<'LOGEOF' | node /path/to/claude-debate-arena/scripts/log-direct.js
{"sender":"エージェント名","recipient":"all","content":"メッセージ内容","summary":"要約","messageType":"broadcast"}
LOGEOF

# DM（特定の相手向け）
cat <<'LOGEOF' | node /path/to/claude-debate-arena/scripts/log-direct.js
{"sender":"エージェント名","recipient":"相手名","content":"メッセージ内容","summary":"要約","messageType":"message"}
LOGEOF
```

> **注意**: `SendMessage` ツールではなく、必ず Bash で `log-direct.js` を呼び出してください。サブエージェントでは PostToolUse Hook が発火しないため、`SendMessage` ではメッセージがビューワーに表示されません。

### 4. 討論をリセット

新しいセッションを始めたい場合は、ログファイルを削除します。

```bash
rm debate-data/current.jsonl
```

## 画面構成

```
┌─────────────────────────────────────────┐
│  [トピック表示]              [タイマー]  │
├──────────┬──────────────────────────────┤
│ 参加者   │                              │
│ サイド   │   チャットフィード            │
│ バー     │   (全メッセージ時系列表示)    │
│          │                              │
│ 名前     │   [司会者] 開会宣言          │
│ 役割     │   [弁論者A] 主張             │
│ 発言数   │   [弁論者B] 反論             │
│          │   [計時] 残り時間通知         │
│          │   ...                        │
└──────────┴──────────────────────────────┘
```

全参加者のメッセージが Slack/Discord 風のチャット形式で時系列に表示されます。各メッセージは送信者のカラーで色分けされます。

### UI 機能

- **チャットフィード**: 全参加者のメッセージを時系列で一つのストリームに表示
- **参加者サイドバー**: 各参加者の名前・役割・発言数をコンパクトに表示
- **タイマー**: ▶（開始）/ ⏸（停止）/ ↺（リセット）を手動操作。制限時間超過で赤く点滅
- **メッセージ**: 新着メッセージはフェードインアニメーション付きで表示
- **自動スクロール**: チャットフィードは新着メッセージで自動的に最下部へスクロール
- **接続状態**: ヘッダー左下に緑（接続中）/ 赤（再接続中）で表示

## ディレクトリ構成

```
claude-debate-arena/
├── .claude/
│   └── hooks.json                 # PostToolUse hook 設定
├── scripts/
│   ├── log-direct.js              # メッセージ記録スクリプト（正式手順）
│   ├── log-message.js             # PostToolUse Hook 用（メインプロセスのみ）
│   └── log-debate.sh              # シェルラッパー
├── debate-data/
│   ├── config.json                # 討論設定
│   └── current.jsonl              # メッセージログ（自動生成）
└── debate-viewer/                 # Next.js アプリ
    ├── app/
    │   ├── page.tsx               # トップページ
    │   ├── debate/page.tsx        # 視聴画面
    │   └── api/
    │       ├── messages/route.ts  # REST API（初期ロード用）
    │       └── stream/route.ts    # SSE ストリーム
    ├── components/                # UI コンポーネント
    └── lib/                       # 共通ロジック・型定義
```

## トラブルシューティング

| 問題 | 対処法 |
|---|---|
| メッセージが表示されない | エージェントが Bash で `log-direct.js` を呼び出しているか確認 |
| SSE 接続が切れる | ブラウザをリロード（EventSource は自動再接続します） |
| 参加者が「unknown」と表示される | `config.json` の `name` が `log-direct.js` に渡す `sender` と一致しているか確認 |
