# 引き継ぎ書 (HANDOFF)

> このファイルは「会話をクリアしても作業を引き継ぐ」ための申し送り。
> SessionStartフックで新セッション開始時に自動で読み込まれる。
> **作業の区切りごとにClaudeが更新する。** 古い情報は上書きしてよい（旧版はgit履歴に全て残っている）。

---

## 最終更新
- 日時: 2026-07-13（**🔴v2プラン進行中: P0・P1完了/push済み。次=P2（tlog編集+rebuildE1rmFrom+CRUD雛形v2＝最重要ペイン）**。旧プランtingly-munching-auroraは廃止済み）
- 更新者: Claude
- **次セッションの最初の一手**: `dev/audit/PLAN_zesty-fluttering-kitten.md` のP2節を読む → player showTrainingHistory(4909付近)から着手。検証は `python3 dev/run_tests.py` と `python3 dev/sync_check.py`
- ⚠️ **プロジェクトパスが移動**: `/Users/nakayamarinnin/Documents/個人開発プロジェクト/rugby-manager`（旧 Documents/rugby-manager は消滅）。**パスに日本語を含むためjscに絶対パスを渡せない** → dev/run_tests.py がcwd固定で回避。

## 🔴 アクティブプラン: 全面見直し＋デザイン再構築 v2（ハイブリッド順序）

- **プラン本文（必読）**: `/Users/nakayamarinnin/.claude/plans/zesty-fluttering-kitten.md`（コピー: `dev/audit/PLAN_zesty-fluttering-kitten.md`）
- **成り立ち**: 旧プラン（tingly-munching-aurora）を3体のレビューエージェント（選手UX/スタッフ系UX/デザイン・技術実現性）で徹底批評→設計エージェント再設計→コード裏取り→ユーザー4決定（2026-07-13）を経てv2化。**旧プランには技術的誤りが複数あった**（e1rm同日再生成では誤値を戻せない/bc重複チェック×体重統合の衝突/トークン前景コントラスト不合格/prompt()数え漏れ等）ため、旧プラン・旧フェーズ表は参照しないこと。
- **ユーザー4決定**: ①ハイブリッド順序（tlog編集即納→デザイン基盤前倒し）②リハビリ=緩やか分担（確定操作のみstaff限定）③選手ナビ=動的タブ切替（怪我中は3タブ目がリハビリに）④新機能4セット全採用（PWA/Undo+週間振り返り/staff業務3点/coach強化+検索）

### フェーズ進捗（着手したらここを更新）

| # | 内容 | 状態 |
|---|---|---|
| P0 | 基線記録＋検証基盤新設＋文書訂正 | ✅ push済み `2b008a4`（基線47実行全PASS） |
| P1 | 整合性バグ修正＋chartUpdate安全化（+ppCardHtml trainer同期） | ✅ push済み `65886da`（coach死にコード削除/getBest・getLatest idEq化/escapeHtml5箇所/trainerにic+SVGシンボル移植しppCardHtml正典同期/chartUpdate新設・生saveChart8箇所を操作単位化/test_chart_safe.js両サイトPASS。※trainerのsaveSOAP/delSOAPは既に操作単位化済みだった=rom-rom P0-bの成果） |
| P2 | tlog編集/削除＋rebuildE1rmFrom（リプレイ方式）＋CRUD雛形v2（Undoトースト） | ⬜ |
| P3 | デザイン基盤前倒し（ダークトークン+コンポーネント+meta/PWA+グラデ集約+一次ダーク化）4push | ⬜ |
| P4 | リハビリ役割分担フレーム（緩やか分担・roleGate・trainer確定ボタン撤去） | ⬜ |
| P5 | player CRUD残り（怪我/rlog/痛み/wc/md/bc/tape/PIN） | ⬜ |
| P6 | staff/trainer CRUD残り＋prompt()7箇所（staff6+trainer1）撲滅 | ⬜ |
| P7 | 機能統合（体重bc正典+durMin事後更新/欠席a正典・双方向/復帰一括+coach根拠フル/1フォーム化） | ⬜ |
| P8 | IA再編＋新機能（player動的タブ/ホーム7ブロック/NO SIDE測定シート/staff6グループ+キュー+マトリクス/coach週報+検索） | ⬜ |
| P9a-c | 生hex残渣一掃→モチーフ仕上げ（pitchProgressHtml汎用化+RTPフィールドマップ）→総回帰 | ⬜ |

### P0で新設した検証基盤（以後の全フェーズで使う）

| ツール | 用途 |
|---|---|
| `dev/run_tests.py` | 全38テスト一括実行（対象サイト自動判別。旧テストはLEGACY_TARGETS表、新テストは先頭に`// 実行: jsc ... /tmp/<site>.js`必須）。基線: `dev/audit/baseline_tests.json`（47実行・全PASS・2026-07-13） |
| `dev/sync_check.py` | 4ファイル同期照合（`dev/sync_manifest.json`=台帳。identical/variant/chart_counts）。共通関数を触ったら毎回実行。`--update`=意図的変更の確定、`--residue`=生hex/rgba残渣レポート |
| `dev/hex_ledger.py` | 生hex/rgba/グラデ台帳の再生成 → `dev/audit/hex_ledger.json`（現状: hex634箇所/rgba276箇所/グラデ76定義。P3の変換対象リスト） |

- **既に検出済みの同期ズレ**: ppCardHtmlのtrainer版が旧絵文字版のまま（player/staffはSVGアイコン版に更新済み）。trainerに`ic()`とi-push/i-pull等シンボルが無いため、P1aで移植して同期→manifestでidenticalへ昇格する（台帳のvariant._todoに記録済み）

### 検証テンプレ（毎フェーズ）
1. `python3 dev/run_tests.py`（全回帰・新規失敗ゼロ）＋新規テスト追加
2. `python3 dev/sync_check.py`（同期・new Chart数）
3. ブラウザは**読み取り専用巡回のみ**（プレビューは本番Firestore直結！保存ボタンを押さない）
4. push前に `git diff --stat` で対象外変更ゼロ確認→**ユーザー確認→push**→Cmd+Shift+R確認依頼

### 実装上の絶対制約（v2プランより）
- 保存は svSafe/svSafeUpdate/svSafeSeq のみ。**staff:1135付近の初回シード `sv('p')` は不可侵**
- スキーマは**追加フィールドのみ**（editedAt/source/durMin/deleted等）。既存データの移行処理はしない
- 単一HTMLファイル構成維持。共通関数・トークンは各ファイルへコピー＋sync_check.pyで照合
- 新規マークアップは**生hex禁止・var()のみ**（P3以降のトークンで書く）
- 削除は論理削除優先＋Undoトースト。confirm()は新規コードで使わない（雛形v2）
- tlog編集はレコードの所在（D.tlog or tla_）を特定してからそのdocだけ触る

## 保留中の別プラン

- **怪我×リハ連携の残り**（プラン `rom-rom-tender-sundae.md`）: Phase 0-2完了・push済み。残=Phase 3(提案+安全ゲート+医師clearance+脳震盪)/4(trainer pre/post)/5(やれてない検出)/6(player/coach薄く)。**v2プラン完了後に再開**。再開時はchartUpdate(P1b)+リハ1画面(P7d)+roleGate(P4)+承認ルール(P7c)を前提に書く
- ~~TimeTree連携フェーズ1(pp)~~ → **実装済み・完了扱い**（ppCardHtml/ppFlip/ppUndo=staff:4431/trainer:923、ppAutoFlipもfinishTraining 4837に導入済み。旧HANDOFFの「未着手」は誤り）。残件の「pp編集をstaffに集約」はv2プランP7dで吸収

## 過去の重大事故と教訓（要点のみ・詳細はgit履歴の旧HANDOFF）
- **名簿全消し事故(2026-06-25)**: 読み込み失敗時に `sv('p')` がINIT72名で全上書き→修正済み(`3c3bc82`, pDocPresentガード)。素のsv(k)は全消しの火種。**定期的な手動JSONバックアップ**（staff「CSV出力」のexportAllJSON）をユーザーに推奨継続
- **プレビュー=本番Firestore**: ブラウザ検証で保存系を絶対に呼ばない（メモリ`project_preview_is_production_firestore`）
- **並行セッションの同時編集**でtrainerに関数重複・ppCardHtml取り残しが発生した前歴→着手前に`git log`確認＋sync_check.pyを習慣化
- 数値必須入力は `if(!x)` 禁止（0誤検知）→ isFilled / Number.isNaN＋範囲チェック
- guardSubmit(二重送信ガード)はplayerに導入済み。新規フォームには必ず適用（雛形v2に含む）

## リポジトリの状態
- ブランチ: main（origin/main=`9b21e6b` と同期）
- 作業ツリー: **P0成果物が未コミット**= dev/run_tests.py・sync_check.py・sync_manifest.json・hex_ledger.py・audit/（baseline_tests.json・hex_ledger.json・PLAN_zesty*.md・監査6json）・CLAUDE.md・HANDOFF.md。**サイト本体4ファイル＋index.htmlは無変更**
- テスト用選手「テスト選手」(CTB/1年, note=動作確認用)が本番に1名存在（削除可）

## 運用ルール（このプロジェクト固有）
- データは「短いキー」で読む。保存は `svSafe` / `svSafeUpdate` を使う。
- 1機能ずつ → jsc構文チェック → 模擬実行 → 次へ。まとめて変更しない。
- git push の前は必ずユーザーに確認。それ以外の局所的・可逆な作業は確認不要で進める。
- 詳細は `CLAUDE.md` を参照（最重要ガイド）。
