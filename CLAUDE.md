# 福岡大学ラグビー部 選手管理システム — プロジェクト引き継ぎ書

このファイルはClaude Codeが作業する際の最重要ガイドです。**作業を始める前に必ず全部読んでください。**

## このプロジェクトは何か
福岡大学ラグビー部の選手管理システム。Firebase Firestore + GitHub Pages で動く、4つの独立したHTMLサイト構成。各HTMLは1ファイル完結（HTML/CSS/JSが全部入り）。ビルド工程なし。GitHubに上げればそのまま公開される。

公開URL: https://rinto1129.github.io/rugby-manager/

## ⚠️ 最重要ルール（これを破ると本番データが消える・壊れる）

### 1. Firestoreのデータは「短いキー」で保存されている
- データは `db.collection('appdata').doc('p')` のように **短いキー**（`'p'`,`'i'`,`'ph'`,`'f'` 等）で保存・読み込みされる。
- コード内の `SK={p:'rm_players',...}` という**長い名前（rm_players等）は実際には使われていない**。飾りなので惑わされないこと。
- 新しくデータを読み書きするコードを書くときは、必ず**短いキー**（`doc(k)` の k）を使う。
- 過去に「長いキーで読もうとしてデータが0になる」事故が複数回あった。絶対に短いキーを使う。

### 2. データ保存は必ず svSafe / svSafeUpdate を使う（直接 sv しない）
- **svSafe(k, newRec, onDone)**: 新規レコード追加用。保存直前にサーバーから最新を取得→追加→保存。複数端末の同時保存でもデータを失わない。
- **svSafeUpdate(k, updateFn, onDone)**: 既存レコードの更新・削除用。最新取得→updateFn(latest)→保存。
- **古い sv(k) は使わない**（メモリ上のDを丸ごと上書きするので、他端末の変更を巻き戻す危険がある）。
- 過去に「svSafeUpdateを呼んでいるのに関数本体が未定義」でボタンが無反応になるバグがあった。新しいファイルや関数を作るときは、使う関数が定義されているか必ず確認すること。

### 3. Firestoreルールは `if true`（誰でも読み書き可）
- 過去に日付指定のルールが期限切れして全データ消失事件があった。ルールに日付指定を入れてはいけない。

## ファイル構成（4サイト + ランディング）
| ローカルのファイル | GitHubのパス | 役割 | テーマ（現状） |
|---|---|---|---|
| `index.html` | リポジトリ直下 `index.html` | ランディングページ（4サイトへのリンク） | ライト（マルーン基調） |
| `player/index.html` | `player/index.html` | 選手用（コンディション入力・トレーニング実施・怪我報告） | ライト（白カード＋クリーム地・マルーン/ゴールドアクセント） |
| `staff/index.html` | `staff/index.html` | スタッフ用（凛人が入力。選手管理・怪我管理・メニュー作成・分析） | ライト（FUKUDAI RED） |
| `trainer/index.html` | `trainer/index.html` | 専門学生トレーナー用（テーピング枠・リハビリ記録・復帰テスト） | ダーク（ネイビー＋青アクセント） |
| `coach/index.html` | `coach/index.html` | 監督・コーチ用（**閲覧専用**。怪我/フィジカル/トレーニングの可視化ダッシュボード） | ダーク（黒＋ネオン緑・グラスモーフィズム） |

※ アクティブプラン（`dev/audit/PLAN_zesty-fluttering-kitten.md`）のP3で**全サイトをマルーン×ゴールド基調のダークテーマに統一予定**（trainer=青/coach=緑は差し色維持）。テーマ列は移行完了時に更新すること。
※ ローカルの絶対パスは `/Users/nakayamarinnin/Documents/個人開発プロジェクト/rugby-manager`（2026-07-13にDocuments直下から移動。**パスに日本語を含むためjscに絶対パスを渡せない** → dev/run_tests.py はcwd固定＋相対パスで回避している）。

- 各サイトは別々のHTMLファイルだが、**同じFirebaseの同じデータ**を見ている。
- 共通の定数・ヘルパー関数（後述）は各ファイルにコピーされている。**1つを直したら、関係する他ファイルも揃える**のが鉄則。

## Firebase設定（全ファイル共通）
```
projectId: fukuokauniv-rug
authDomain: fukuokauniv-rug.firebaseapp.com
storageBucket: fukuokauniv-rug.firebasestorage.app
messagingSenderId: 314514138275
appId: 1:314514138275:web:b1b93406813ebaba75cb16
apiKey: AIzaSyBNBxVywJmZVb7wmWlZkppB0ESf02IPTls
データ場所: asia-northeast1 / Spark（無料）プラン
```

## データキー一覧（短いキー → 中身）
4ファイルで一致が鉄則。主要なもの:
- `p` 選手 / `i` 怪我 / `r` リハビリ / `ph` フィジカル測定（正式な1RM等）/ `a` 欠席 / `f` コンディション（疲労・睡眠。フィールドは rpe/sleep/duration/note）
- `chart` カルテ（怪我ごとの評価・SOAP・RTPレベル）/ `tape` テーピング予約 / `tapeslot` テーピング枠 / `trainers` トレーナー
- `tmenu` トレーニングメニュー / `tlog` トレーニング実施記録 / `texlist` 種目名履歴 / `e1rm` 推定1RM（正式な1RMとは別管理）/ `tdraft` トレーニング入力途中の下書き（選手ごと1件）

## 主要な共通ヘルパー関数（各ファイルにコピーされている）
- `idEq(a,b)` ID比較 / `toDateStr(d)` Date→'YYYY-MM-DD' / `todayStr()` 今日 / `escapeHtml(s)` / `fmt(date)` 日付表示
- `big3(r)`, `getBest(pid,field)`, `getBestBIG3(pid)` フィジカル系
- `getChart(injId)` 怪我のカルテ取得
- `avH(p,sz)`（staff/player）/ `ava(p,sz)`（coach）アバター表示
- トレーニング系: `RPECHART`（reps×RPE→%1RMの表）, `EST_BASES`（squat/bench/deadlift）, `estimateWeight(oneRM,reps,rir)`, `estimateOneRM(weight,reps,rir)`, `getPlayer1RM(pid,estBase)`
- 定数: `STG`（リハビリ7段階）, `RTP_LEVELS`（練習参加6段階）, `PARTS`, `POS`, `RCATS`, `PAIN_TYPES`

## メイン要素のID（画面描画先）
- staff: `main-ct`（`$m()` が返す）
- player: `main`（`$m()`）。サブ画面は `showSub(h)`
- trainer: `main-ct`（`$m()`）
- coach: `main`（`$M()`）

## 開発の進め方（ユーザーの強い希望）
- **1機能ずつ → 構文チェック → 動作確認（模擬実行）→ 次へ**。まとめて変更しない。
- 「妥協せず突き詰めて」「確実な方法で」「時間がかかってもいい」。エラーの再発は嫌う → 根本対策をする。
- デザイン重視。ネオン/グロー＋リッチなグラデーション系を好む。可視化は見た目と面白みが大事。
- ユーザーはトレーニング科学に本格的に詳しい（漸進性過負荷・RIR・ボリューム管理を理解）。専門用語はそのまま使ってよい。
- 日本語でやりとりする。

## 必須: 変更後の構文チェック・テスト方法
**このマシンに node は無い。** JavaScriptCoreの `jsc` を使う（PATHにも無い。実パス: `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`）。
**⚠️ jscは日本語を含むパスの引数を開けない** → 必ずリポジトリルートをcwdにして相対パスで渡すか、`dev/run_tests.py` を使う。

```bash
# ① 全テスト一括（構文チェック込み・38本を対象サイト別に実行）
python3 dev/run_tests.py                       # 全部
python3 dev/run_tests.py test_cond             # 名前部分一致で絞る
# ② 単発の構文＋ロードチェック（SyntaxErrorが出なければ健全）
python3 dev/extract.py player/index.html /tmp/player.js
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc dev/prelude.js /tmp/player.js
# ③ 4ファイル同期照合（共通関数のコピー揃え忘れ検出＋new Chart数チェック）
python3 dev/sync_check.py                      # 台帳=dev/sync_manifest.json。毎フェーズ実行
python3 dev/sync_check.py --residue            # 生hex/rgba残渣レポート（ダーク化以降）
```
- 模擬実行テストは `dev/test_*.js`（firebase/document/window/Chartをモック=dev/prelude.js）。新規テストは先頭15行に `// 実行: jsc dev/prelude.js /tmp/<site>.js dev/test_xxx.js` を必ず書く（run_tests.pyが対象サイトを判別する）。
- 共通関数を触ったら `sync_check.py` が緑になるまで他ファイルも揃える。新しい共通関数を作ったら `dev/sync_manifest.json` に登録する。

### よく出るバグ（要注意）
- **Chart.js の `new Chart(e,{...})` で閉じ波括弧が1つ足りない**ことが頻発する（末尾 `}}}});` を `}}}}});` に直す）。括弧バランスは、文字列リテラルを除去してから `{` `}` `(` `)` `[` `]` を数えて検証する。
- 関数を定義より前で使うとエラー。特に `var V={}`（staff）や `var T={}`（player）の定義より後に `V.xxx=` `T.xxx=` を書く。

## デプロイ方法（Claude Code移行後）
git で直接 push する。ユーザーはgit未経験なので、Claude Codeが git add / commit / push を代行してよい（ユーザーに確認を取ってから）。
- 4つのHTMLはサブフォルダ（player/staff/trainer/coach の index.html）。
- 変更したファイルだけ commit & push すれば、GitHub Pages が数十秒〜数分で反映する。
- 反映後はブラウザで Cmd+Shift+R（強制リロード）して確認。

## これまでに実装済みの主な機能
- 選手・スタッフ・トレーナー・コーチの4サイト
- 怪我管理（受傷記録・カルテ・SOAP・評価・リハビリ段階・RTPレベル・復帰予定・タイムライン表示）
- フィジカル測定（BIG3グラフ・ランキング表彰台・ポジション別平均）
- テーピング枠予約システム
- トレーニング機能（スタッフがメニュー作成→選手が出欠確認→実施記録。推定重量表示・RIR/回数のリアルタイムアラート・ボリュームの前回比/先週比・休憩タイマー3分カウントダウン・推定1RM自動記録・コンディション連動ヒント・入力途中の下書き自動保存/復元・できない種目の代替記録）
- コンディション記録（rpe/sleep/duration）
- コーチ閲覧ダッシュボード（怪我・フィジカル・トレーニング・コンディション・個人レポート）

## 次にやりたいこと（ユーザーが今後やる可能性）
継続的に機能追加・修正をしていく。実機（選手・スタッフの実利用）からのフィードバックで細かい改善を重ねるスタイル。

---
**繰り返し: データは短いキーで読む。保存は svSafe/svSafeUpdate を使う。1機能ずつ確認しながら進める。これを守れば事故は起きない。**
