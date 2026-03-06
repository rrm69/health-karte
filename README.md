# 🏥 自己健康管理カルテ

病院カルテ風UIの自己管理アプリ。Grok AIによるキャラクターコメント付き。

## キャラクター

| キャラ | 役職 | 性格 |
|--------|------|------|
| 🌸 夜空メル | 担当ナース | 甘やかしママ系・溺愛 |
| 💙 橘ひなの | 担当医師 | 彼氏持ち・見下し・嘲笑 |
| 🔴 八雲べに | 搾精管理官 | ドS・女王様・調教系 |

---

## 🚀 セットアップ（GitHub + Vercel）

### 1. リポジトリ作成

```bash
git init
git add .
git commit -m "initial commit"
```

GitHubで新しいリポジトリを作成し、プッシュ：

```bash
git remote add origin https://github.com/あなたのユーザー名/health-karte.git
git branch -M main
git push -u origin main
```

---

### 2. Vercelにデプロイ

1. [vercel.com](https://vercel.com) にアクセスしてGitHubでログイン
2. **「Add New Project」** → GitHubリポジトリを選択
3. **Environment Variables** に以下を追加：

   | Name | Value |
   |------|-------|
   | `GROK_API_KEY` | `xai-xxxxxxxxxx...` |

4. **「Deploy」** ボタンをクリック

デプロイ完了後、`https://your-project.vercel.app` でアクセス可能になります。

---

### 3. ローカル開発

```bash
# Vercel CLIのインストール
npm i -g vercel

# 環境変数ファイルを作成
cp .env.example .env
# .env を編集して実際のAPIキーを入力

# ローカルサーバー起動（http://localhost:3000）
vercel dev
```

---

## 📁 ファイル構成

```
health-karte/
├── api/
│   └── chat.js          # Vercel Serverless Function（Grok APIプロキシ）
├── public/
│   └── index.html       # フロントエンド（全UI）
├── .env.example         # 環境変数テンプレート
├── .gitignore
├── package.json
├── vercel.json          # Vercelルーティング設定
└── README.md
```

---

## 🔒 セキュリティ

- APIキーは `api/chat.js` のサーバー側でのみ使用（ブラウザには公開されない）
- `.env` ファイルは `.gitignore` に含まれているためGitHubにはアップロードされない
- 本番のAPIキーはVercelダッシュボードの環境変数で管理

---

## ✏️ カスタマイズ

### キャラクターを追加・変更する

`public/index.html` の `CHARS` 配列を編集：

```js
const CHARS=[
  {
    id:'新キャラのID',
    name:'キャラ名',
    emoji:'😊',
    role:'役職名',
    cls:'CSSクラス名',  // ← 対応するCSSも追加すること
    sys:'キャラクターの性格・口調の指示文（システムプロンプト）'
  },
  // ...
];
```

### シチュエーションタグを追加する

`public/index.html` の `SITS` 配列に文字列を追加するだけ。

---

## 📱 対応環境

- Windows / macOS / iOS / Android のモダンブラウザ
- PWA対応予定（ホーム画面への追加）
