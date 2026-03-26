# 🚀 デプロイ手順書（GitHub + Render）

## 前提
- GitHub アカウント: halvia-creator
- Render アカウント: halvia88@gmail.com
- リポジトリ名: million-yoyaku
- DB名: million-db

---

## STEP 1: GitHubリポジトリ作成 & プッシュ

### 1-1. GitHubでリポジトリを作成

1. https://github.com/new を開く
2. 以下を入力：
   - **Repository name**: `million-yoyaku`
   - **Visibility**: Private（または Public）
   - **Initialize this repository**: ✅ チェックしない（空で作成）
3. **「Create repository」** をクリック

### 1-2. ターミナルでプッシュ

「Narrow予約システム」フォルダで以下を実行：

```bash
# GitHubの認証を更新（既存の認証情報と競合する場合）
git config --global credential.helper manager

# リモートを追加
git remote add origin https://github.com/halvia-creator/million-yoyaku.git

# プッシュ
git push -u origin master
```

> ⚠️ **「Permission denied to miya38-design」エラーが出る場合**
>
> Windowsの資格情報マネージャーに別アカウントが保存されています。
> 以下の手順で解消：
> 1. Windowsの「スタート」→「資格情報マネージャー」を開く
> 2. 「Windows 資格情報」タブ
> 3. `git:https://github.com` を見つけて削除
> 4. 再度 `git push -u origin master` を実行
> 5. halvia-creator のID/パスワードを入力

### または GitHub Personal Access Token を使う方法

```bash
# PAT（Personal Access Token）を使う場合
git remote add origin https://halvia-creator:YOUR_PAT_HERE@github.com/halvia-creator/million-yoyaku.git
git push -u origin master
```

PAT の取得: https://github.com/settings/tokens/new
- Note: million-yoyaku deploy
- Expiration: 90 days
- Scope: ✅ repo

---

## STEP 2: Render で PostgreSQL を作成

1. https://dashboard.render.com にログイン（halvia88@gmail.com）
2. 右上の **「New +」** → **「PostgreSQL」** をクリック
3. 以下を設定：
   | 項目 | 値 |
   |---|---|
   | Name | `million-db` |
   | Database | `million_yoyaku` |
   | User | （自動生成でOK） |
   | Region | Singapore（または Oregon） |
   | Plan | **Free** |
4. **「Create Database」** をクリック
5. 作成完了後、**「Connections」** セクションの **「Internal Database URL」** をコピーして手元に保存

---

## STEP 3: Render で Web Service を作成

1. **「New +」** → **「Web Service」** をクリック
2. **「Build and deploy from a Git repository」** → 「Next」
3. GitHubアカウントを連携 → `million-yoyaku` リポジトリを選択
4. 以下を設定：

   | 項目 | 値 |
   |---|---|
   | Name | `million-yoyaku` |
   | Region | PostgreSQLと同じリージョン |
   | Branch | `master` |
   | Runtime | **Node** |
   | Build Command | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
   | Start Command | `npm start` |
   | Plan | **Free** |

5. 下部の **「Advanced」** を開いて **環境変数を追加**：

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | STEP 2 でコピーした Internal Database URL |
   | `ADMIN_PASSWORD` | 管理画面用パスワード（例: `admin1234`） |
   | `LINE_CHANNEL_ACCESS_TOKEN` | （LINEを設定したら追加） |
   | `LINE_USER_ID` | （LINEを設定したら追加） |

6. **「Create Web Service」** をクリック → デプロイ開始！

---

## STEP 4: デプロイ完了後の確認

デプロイが完了すると `https://million-yoyaku.onrender.com` でアクセスできます。

| URL | 内容 |
|---|---|
| `https://million-yoyaku.onrender.com` | 予約フォーム |
| `https://million-yoyaku.onrender.com/admin` | 管理画面 |
| `https://million-yoyaku.onrender.com/admin/login` | ログイン |

> 💡 **Render無料プランの注意点**
> - 15分間アクセスがないとスリープします
> - 初回アクセスは起動に30〜60秒かかります
> - PostgreSQLは90日後に期限切れになります（無料プラン）

---

## STEP 5: LINE通知を設定する場合

### LINE Developers Console
1. https://developers.line.biz/ にログイン
2. **「プロバイダー作成」** → Messaging API チャネル作成
3. **「Messaging API設定」** タブ → **「チャネルアクセストークン（長期）」** を発行
4. **「あなたのユーザーID」** を確認（基本設定タブ）

### Renderの環境変数に追加
Renderダッシュボード → Web Service → **「Environment」** タブ：
- `LINE_CHANNEL_ACCESS_TOKEN` = 発行したトークン
- `LINE_USER_ID` = 自分のユーザーID（`U` から始まる文字列）

→ 保存すると自動的に再デプロイされます

---

## トラブルシューティング

### ビルドエラー: `prisma migrate deploy` が失敗する
- `DATABASE_URL` が正しく設定されているか確認
- Render の PostgreSQL と Web Service が同じリージョンか確認

### 「DATABASE_URL 環境変数が設定されていません」
- Render の Environment タブで `DATABASE_URL` を設定したか確認

### 管理画面にアクセスできない
- `/admin/login` に直接アクセス
- `ADMIN_PASSWORD` に設定した値を入力
