## Birdie Focus 🐦

Birdie Focus は、Obsidian 内で動作する「止まり木」のような作業タイマーです。
あなたが執筆や作業に集中している間、野生の鳥たちがあなたの作業スペースを訪れ、羽を休めていきます。

<img width="458" height="214" alt="スクリーンショット 2026-02-17 13 32 39" src="https://github.com/user-attachments/assets/91ebb904-e42f-4086-bccf-584bd17a6675" />


## 🌟 特徴
訪問者: 4分ごとに70%の確率で、登録した鳥たちが遊びに来ます。

リアクション: 鳥たちは「羽繕い」をしたり「居眠り」をしたり、思い思いに過ごします。

おやつタイム: 作業が終わったら、鳥たちにおやつをあげて親密度（friendship）を深めましょう。

自動ログ保存: 作業が完了すると、コードブロックが自動的に「テキストの作業ログ」に変換され、その日の頑張りがノートに刻まれます。

バックグラウンド動作: 他のノートに移動しても、タイマーは止まらずに鳥たちを待ち続けます。

## 🚀 使い方

1. 準備（図鑑の作成）
保管庫のルートに Birds フォルダを作成し、鳥の個別ノートを作ります。

例: Birds/スズメ.md

YAMLに以下を追加

friendship: 0

emoji: 🐦

reactions: ["羽繕いをしています", "こちらを観察しています", "居眠りを始めました"]


このリポジトリに含まれるBirdsフォルダをあなたのVaultに反映させれば、自動で複数種類の鳥たちが楽しめます。
リアクションは後からご自身で追加することもできます。

2. 計測の開始
計測ログを取りたいノートに以下のコードブロックを記述します。
「birdie-focus」というコードブロックを作成後、中にtaskとgoalを設定してください。

``` birdie-focus
task: 新作のプロット作成
goal: 25
```

goalにはカウントする時間（分）を記入してください。

## 🛠 インストール（開発者向け）
このリポジトリを YourVault/.obsidian/plugins/birdie-focus にクローンします。

フォルダ内で以下のコマンドを実行します。

npm install

npm run build

Obsidian の設定から Birdie Focus を有効にします。

上手くいかなかったら「npx esbuild main.ts --bundle --outfile=main.js --external:obsidian --format=cjs --platform=node」を試してみてください。

## ✒️ Author
Yo Fujii (藤井佯)

Novels & Obsidian Workflows

Organizing "Henkyo Yūkitai" (July 2026)

## 📄 License
MIT License
