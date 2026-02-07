# 📦 SubscKeeper

サブスクリプション管理Webアプリ。毎月の固定費を一元管理し、「意図しない更新」を防ぎます。

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## ✨ 特徴

- 🚀 **サーバー不要** - LocalStorageでデータ保存、ブラウザだけで動作
- 💰 **コスト可視化** - 月額/年額の総額を自動計算
- 🔔 **更新通知** - 更新日が近づくとアラート表示
- 🌙 **ダークモード** - 目に優しいテーマ切替
- 📱 **レスポンシブ** - PC/スマホ両対応

## 🚀 使い方

### 起動

```bash
# リポジトリをクローン（または直接ファイルをダウンロード）
cd SubscriptionManagementProject

# 開発サーバー起動
npx http-server -p 3000

# ブラウザで開く
# http://localhost:3000
```

> **Note**: `index.html`を直接ブラウザで開いても動作します

### 基本操作

| 操作 | 方法 |
|-----|------|
| サブスク追加 | 右下の「+」ボタン |
| 編集 | カードをクリック |
| 削除 | カードの🗑️ボタン |
| 設定 | 右上の⚙️ボタン |

## 📁 ファイル構成

```
SubscriptionManagementProject/
├── index.html   # メインHTML
├── style.css    # スタイル（ダークモード対応）
├── app.js       # アプリロジック
└── README.md    # このファイル
```

## 🎯 機能一覧

### メイン機能
- ✅ サブスク登録・編集・削除
- ✅ 月額換算の総額表示（年額÷12で自動計算）
- ✅ 年額総額表示
- ✅ カテゴリ分類（エンタメ/仕事/生活/その他）
- ✅ 更新日順・金額順ソート

### 通知機能
- ✅ 更新日X日前にアラート表示
- ✅ お試し期間終了の警告

### 便利機能
- ✅ 解約ページURLの保存
- ✅ USD/JPY通貨対応（換算レート設定可）
- ✅ データエクスポート（JSON形式）
- ✅ データインポート（マージモード：重複スキップ）

## 🛠️ 技術スタック

| 項目 | 技術 |
|-----|------|
| マークアップ | HTML5 |
| スタイリング | CSS3（CSS Variables, Flexbox/Grid） |
| ロジック | Vanilla JavaScript (ES6+) |
| データ保存 | LocalStorage |

## 📝 データ形式

```javascript
// LocalStorage キー: subsckeeper_subscriptions
{
  id: "uuid",
  name: "Netflix",
  price: 1490,
  currency: "JPY",
  cycle: "monthly",      // monthly | yearly
  nextDate: "2026-02-15",
  category: "entertainment",
  cancelUrl: "https://...",
  trialEndDate: ""
}
```

## 🔮 今後の拡張案

- [ ] Web Push通知
- [ ] PWA化（オフライン対応）
- [ ] CSV入出力
- [ ] クラウド同期（Firebase等）

## 📄 ライセンス

MIT License
