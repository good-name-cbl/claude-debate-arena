# 討論会リアルタイムビューワー 使い方ガイド

Claude Code のチーム機能で行う討論会を、Web ブラウザでリアルタイム視聴するためのシステムです。

## 仕組み

```
[Claude Code チームエージェント]
    ↓ SendMessage ツール呼び出し
[PostToolUse Hook]
    ↓ log-message.js がメッセージを記録
[debate-data/current.jsonl]
    ↓ ファイル変更を検知
[Next.js SSE ストリーム]
    ↓ リアルタイム配信
[ブラウザ UI]
```

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
    { "name": "condo-advocate", "displayName": "マンション派", "role": "advocate", "side": "left", "color": "#3B82F6" },
    { "name": "house-advocate", "displayName": "一軒家派", "role": "advocate", "side": "right", "color": "#EF4444" },
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
| `side` | `left` または `right`（`advocate` のみ） |
| `color` | 表示色（HEX） |

#### 役割（role）による表示位置

- **`moderator`** → 画面上部のバナーに最新発言を表示
- **`advocate`** → 左右のパネルに発言が時系列で流れる（`side` で配置を決定）
- **`timekeeper`** → タイマーに統合（メッセージは表示しない）

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

エージェント同士が `SendMessage` を呼び出すたびに、PostToolUse hook が自動的にメッセージを `debate-data/current.jsonl` に記録し、ブラウザにリアルタイムで表示されます。

### 4. 討論をリセット

新しいセッションを始めたい場合は、ログファイルを削除します。

```bash
rm debate-data/current.jsonl
```

## 画面構成

```
┌─────────────────────────────────────────┐
│  [トピック表示]              [タイマー]  │
├─────────────────────────────────────────┤
│          [司会者バナー]                  │
├────────────┬────────────┬───────────────┤
│  左側参加者 │ タイムライン │  右側参加者   │
│  の発言     │  (時系列)   │  の発言       │
│             │            │               │
│  メッセージ │  全発言の   │  メッセージ   │
│  が下に     │  時系列     │  が下に       │
│  流れる     │  表示       │  流れる       │
└────────────┴────────────┴───────────────┘
```

### UI 機能

- **タイマー**: ▶（開始）/ ⏸（停止）/ ↺（リセット）を手動操作。制限時間超過で赤く点滅
- **メッセージ**: 新着メッセージはフェードインアニメーション付きで表示
- **自動スクロール**: 各パネルは新着メッセージで自動的に最下部へスクロール
- **接続状態**: ヘッダー左下に緑（接続中）/ 赤（再接続中）で表示
- **タイムライン**: 中央パネルに全参加者の発言を時系列で一覧表示

## ディレクトリ構成

```
claude_code_test/
├── .claude/
│   └── hooks.json                 # PostToolUse hook 設定
├── scripts/
│   └── log-message.js             # メッセージキャプチャスクリプト
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
| メッセージが表示されない | `.claude/hooks.json` が正しく配置されているか確認 |
| SSE 接続が切れる | ブラウザをリロード（EventSource は自動再接続します） |
| 参加者が「unknown」と表示される | `config.json` の `name` がエージェント名と一致しているか確認 |
| hook がサブエージェントで動かない | エージェントプロンプトに Bash でのログ出力を含める（フォールバック） |
