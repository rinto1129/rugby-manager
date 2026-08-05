# 引き継ぎ書 (HANDOFF)

> このファイルは「会話をクリアしても作業を引き継ぐ」ための申し送り。
> SessionStartフックで新セッション開始時に自動で読み込まれる。
> **作業の区切りごとにClaudeが更新する。** 古い情報は上書きしてよい（旧版はgit履歴に全て残っている）。

---

## 最終更新
- 日時: 2026-08-05
- 更新者: Claude
- **✅ v2プラン「全面見直し＋デザイン再構築」が全フェーズ(P0〜P9c)完了・push済み `8dae0f6`**。各フェーズの詳細な実装ログ・設計判断・敵対的レビュー結果はgit履歴（各コミットメッセージ）を参照。要点のみ:
  - **横断基盤**: `chartUpdate`(P1・カルテの操作単位更新)／CRUD雛形v2(`guardSubmit`+Undoトースト・confirm/prompt全廃)／`roleGate`・`ROLE_MODE`(P4・リハビリ役割分担="soft"=日次記録は両者可・確定操作はstaff専任)／承認ルール(P7c・trainer/staff起票=即approved、player/match起票=要承認)／リハビリ1画面化(P7d)／選手側動的タブ(P8・怪我中は3タブ目がリハビリに切替)／生hex/rgba一掃(P9a・`sync_check.py --residue`でゲート化・残渣0維持)／`pitchProgressHtml`等ラグビーモチーフ統一(P9b)
  - **却下した設計（今後も再提案しない）**: ダークテーマ全面化(P3・ユーザーが実機で「みにくい」と却下→ライト維持。メモリ`feedback_prefers_light_theme`)／二次記録を正典ストアへ書く設計＝cond-bc materialize・休む→a書き込み(P7a/P7b・体組成/欠席が汚染されるため不採用。二次記録は「追加読み」で解く。メモリ`project_secondary_record_pollution`)
  - **検証基盤**: `dev/run_tests.py`(64本・76実行)／`dev/sync_check.py`(identical123+variant15+chart_counts+`--residue`)／`dev/hex_ledger.py`
  - 各フェーズの成果物一覧は下記「✅完了プラン」節のフェーズ表を参照

## 🔴 アクティブプラン: 怪我×リハ連携の高度化（再設計フェーズ・着手前）

- **経緯**: 旧プラン`rom-rom-tender-sundae.md`のPhase0-2は実装済み・push済み。Phase3-6は未着手のまま「v2プラン完了後に再開」として保留していたが、**プランファイル自体が`~/.claude/plans/`から消失**しており、かつユーザー本人の要望・考えがv2プラン期間（P0〜P9c）中に変化しているため、**旧Phase3-6をそのまま再開せず、ゼロから再設計する**（2026-08-05ユーザー指示）。
- **次のセッションで最初にすべきこと**: ユーザーに「怪我×リハ連携で今やりたいこと」を改めてヒアリングし、Planモードで新プランを作成する。下記の旧Phase概要は再設計の出発点となる参考情報であり、そのまま採用すると決まったものではない。
- **旧プランのPhase3-6概要（参考・要再検証）**:
  - Phase3: リハビリ種目の提案機能＋安全ゲート＋医師clearance連携＋脳震盪対応
  - Phase4: trainer向けpre/post記録（施術前後）
  - Phase5:「やれていない」の検出（未実施アラート）
  - Phase6: player/coachへの薄い反映
- **新設計で前提にすべきv2の新基盤**（旧プランPhase0-2実装時にはまだ無かったもの）: `chartUpdate`（カルテの操作単位更新）・リハビリ1画面化（P7d・受傷/リハ記録/痛み記録が1シートに統合済み）・`roleGate`/`ROLE_MODE`（P4・リハビリ役割分担フレーム）・承認ルール（P7c・起票元による自動承認/要承認の分岐）・CRUD雛形v2（Undoトースト・confirm/prompt不使用）・`pitchProgressHtml`等のモチーフ（P9b・RTPフィールドマップ等で使用中）
- **関連する未着手の細部**（P6から積み残し・怪我×リハ再設計と合わせて拾える）: staffのテーピング代理変更／週次怪我チェック・試合日記録の「新規」代理入力／trainer側の復帰テスト結果編集・削除／復帰テスト結果の編集フォーム／リハビリ実施記録の種目単位編集／脳震盪チェックの編集（詳細は下記フェーズ表P6の行を参照）

## ✅ 完了プラン: 全面見直し＋デザイン再構築 v2（ハイブリッド順序）

- **プラン本文**: `/Users/nakayamarinnin/.claude/plans/zesty-fluttering-kitten.md`（コピー: `dev/audit/PLAN_zesty-fluttering-kitten.md`）
- **ユーザー4決定**（2026-07-13）: ①ハイブリッド順序（tlog編集即納→デザイン基盤前倒し）②リハビリ=緩やか分担（確定操作のみstaff限定）③選手ナビ=動的タブ切替（怪我中は3タブ目がリハビリに）④新機能4セット全採用（PWA/Undo+週間振り返り/staff業務3点/coach強化+検索）

### フェーズ進捗（全完了）

| # | 内容 | 状態 |
|---|---|---|
| P0 | 基線記録＋検証基盤新設＋文書訂正 | ✅ push済み `2b008a4`（基線47実行全PASS） |
| P1 | 整合性バグ修正＋chartUpdate安全化（+ppCardHtml trainer同期） | ✅ push済み `65886da` |
| P2a | player: tlog編集/削除＋rebuildE1rmFrom（リプレイ方式）＋CRUD雛形v2（Undoトースト） | ✅ push済み |
| P2b | staff: tlog代理編集（tla_も可）＋共有関数移植（identical登録） | ✅ push済み `099337f` |
| P3 | ~~デザイン基盤前倒し（ダーク化）~~ | 🚫 **不採用・撤回**（ユーザーがダーク却下→ライト維持。実装は完了したがpushせず全revert） |
| P4 | リハビリ役割分担フレーム（緩やか分担・roleGate・trainer確定ボタン撤去） | ✅ push済み `2d82102` |
| P5 | player CRUD残り（怪我/rlog/痛み/wc/md/bc/tape/欠席/PIN） | ✅ push済み `585b926` |
| P6 | staff/trainer CRUD残り＋prompt()7箇所（staff6+trainer1）撲滅 | ✅ push済み `1b25310`。残: tape代理変更/wc・md新規代理入力/trainer rtest編集削除/rtest結果編集/rlog種目編集/preCheck編集（**未着手のまま・上記アクティブプランで再考予定**） |
| P7a | 体重dedup＋sRPE実測化（durMin/effDur/sLoad） | ✅ push済み `6aa9713` |
| P7b | 欠席統一（今日は休む↔欠席a・coach追加読み） | ✅ push済み `ee08429` |
| P7c | 復帰フロー＋coach根拠＋承認ルール明文化＋トレーナー新規登録チップ | ✅ push済み `bf58d90` |
| P7d | 1フォーム化（受傷=軽量版・リハ1画面・選手側1シート・saveQuickEval廃止・pp編集staff集約・ブロンコ統合） | ✅ push済み `d1f8eaf` |
| P8 | IA再編＋新機能（player動的タブ/ホーム7ブロック/NO SIDE測定シート/staff6グループ+キュー+マトリクス/coach週報+検索） | ✅ push済み `2ae7860` |
| P9a | 生hex/rgba残渣一掃 | ✅ push済み `a7ef001` |
| P9b | モチーフ・アニメ仕上げ（pitchProgressHtml汎用化+RTPフィールドマップ+trainer移植） | ✅ push済み `c4de533` |
| P9c | 総回帰（P0基線比較・sync全量照合＝identical123/variant15・確定ドリフト7群修正・全サイト目視巡回・文書最終更新） | ✅ push済み `8dae0f6` |

### P0で新設した検証基盤（今後の開発でも使う）

| ツール | 用途 |
|---|---|
| `dev/run_tests.py` | 全64テスト・76実行を一括（対象サイト自動判別。新テストは先頭に`// 実行: jsc ... /tmp/<site>.js`必須）。基線: `dev/audit/baseline_tests.json` |
| `dev/sync_check.py` | 4ファイル同期照合（`dev/sync_manifest.json`=台帳。identical123/variant15/chart_counts）。共通関数を触ったら毎回実行。`--update`=variantの意図的変更の確定、`--residue`=生hex/rgba残渣ゲート（違反>0でexit 1・残渣0維持） |
| `dev/hex_ledger.py` | 生hex/rgba/グラデ台帳の再生成 → `dev/audit/hex_ledger.json`（P9aで残渣一掃済み。許可リスト=dev/audit/residue_allow.json 67値） |

### 検証テンプレ（今後のフェーズでも踏襲）
1. `python3 dev/run_tests.py`（全回帰・新規失敗ゼロ）＋新規テスト追加
2. `python3 dev/sync_check.py`（同期・new Chart数）
3. ブラウザは**読み取り専用巡回のみ**（プレビューは本番Firestore直結！保存ボタンを押さない）
4. push前に `git diff --stat` で対象外変更ゼロ確認→**ユーザー確認→push**→Cmd+Shift+R確認依頼

### v2プランで確立した実装上の制約（今後も適用）
- 保存は svSafe/svSafeUpdate/svSafeSeq のみ。**staff:1235付近の初回シード `sv('p')` は不可侵**（素のsv呼出はリポジトリ全体でこの1箇所のみ）
- スキーマは**追加フィールドのみ**（editedAt/source/durMin/deleted等）。既存データの移行処理はしない
- 単一HTMLファイル構成維持。共通関数・トークンは各ファイルへコピー＋sync_check.pyで照合
- 新規マークアップは**生hex禁止・var()のみ**
- 削除は論理削除優先＋Undoトースト。confirm()は新規コードで使わない（雛形v2）
- tlog編集はレコードの所在（D.tlog or tla_）を特定してからそのdocだけ触る

## 保留中の別プラン
- ~~TimeTree連携フェーズ1(pp)~~ → **実装済み・完了扱い**（ppCardHtml/ppFlip/ppUndo=staff:4431/trainer:923、ppAutoFlipもfinishTraining 4837に導入済み）

## 過去の重大事故と教訓（要点のみ・詳細はgit履歴の旧HANDOFF）
- **名簿全消し事故(2026-06-25)**: 読み込み失敗時に `sv('p')` がINIT72名で全上書き→修正済み(`3c3bc82`, pDocPresentガード)。素のsv(k)は全消しの火種。**定期的な手動JSONバックアップ**（staff「CSV出力」のexportAllJSON）をユーザーに推奨継続
- **プレビュー=本番Firestore**: ブラウザ検証で保存系を絶対に呼ばない（メモリ`project_preview_is_production_firestore`）
- **並行セッションの同時編集**でtrainerに関数重複・ppCardHtml取り残しが発生した前歴→着手前に`git log`確認＋sync_check.pyを習慣化
- 数値必須入力は `if(!x)` 禁止（0誤検知）→ isFilled / Number.isNaN＋範囲チェック
- guardSubmit(二重送信ガード)はplayerに導入済み。新規フォームには必ず適用（雛形v2に含む）

## リポジトリの状態
- ブランチ: main。origin/main=`8dae0f6`（P9c一式=player/staff/trainer+CLAUDE.md+HANDOFF+sync_manifest+test_pitch.js、7ファイル。v2プラン全フェーズ完了。ユーザー承認2026-08-05でpush済み）。**v2プランはこれで完了。この上に怪我×リハ連携の高度化を積む**
- テスト用選手「テスト選手」(CTB/1年, note=動作確認用)が本番に1名存在（削除可）
- ⚠️ 検証はjsc模擬実行で完結（本番Firestore直結のためブラウザで代理編集/削除の保存ボタンは押さない）。最終目視はユーザーのCmd+Shift+R確認に委ねる
- **現在`run_tests.py`=76 run/0 fail（全緑）**。worktree(`claude/keen-kowalevski-01e4c2`)はP9cで整理済み（`git worktree remove`+`branch -D`済み）

## 運用ルール（このプロジェクト固有）
- データは「短いキー」で読む。保存は `svSafe` / `svSafeUpdate` を使う。
- 1機能ずつ → jsc構文チェック → 模擬実行 → 次へ。まとめて変更しない。
- git push の前は必ずユーザーに確認。それ以外の局所的・可逆な作業は確認不要で進める。
- 詳細は `CLAUDE.md` を参照（最重要ガイド）。
