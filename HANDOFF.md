# 引き継ぎ書 (HANDOFF)

> このファイルは「会話をクリアしても作業を引き継ぐ」ための申し送り。
> SessionStartフックで新セッション開始時に自動で読み込まれる。
> **作業の区切りごとにClaudeが更新する。** 古い情報は上書きしてよい（旧版はgit履歴に全て残っている）。

---

## 最終更新
- 日時: 2026-07-14（**🔴v2プラン: P0・P1・P2a・P2b・P4完了/push済み（P4=`2d82102`）。P3不採用。P5実装完了・敵対的レビュー(18エージェント)確定4バグ修正済・全検証緑＝push前（ユーザー確認待ち）。次=P6**）
- 更新者: Claude
- **✅ P5「player CRUD残り（怪我/rlog/痛み/wc/md/bc/tape/欠席/PIN）」実装完了（ライトのまま・push前）**。**player/index.htmlのみ変更**（+474/-16）＋新テスト2本（`dev/test_bc_dup.js`/`dev/test_p5_guards.js`）。検証: `python3 dev/run_tests.py`=**55 run/0 fail**＋`dev/sync_check.py`=ALL SYNC OK（共有関数不変=player固有UIのみ・manifest変更なし）＋敵対的レビュー(6視点find→11所見→18エージェント検証)=確定4バグ修正後**残バグ0**。**push単位=1（player+2新テスト）。ユーザー確認後にpush**。実装内容↓。
  - **P5-1 怪我報告(i)自己編集/取消**: injuryタブのpending怪我カード（`source∈{player,match}` かつ `approved==null`）に「報告を修正/取消」。`editInjury`/`doEditInjury`（フィールド編集＋noteを`【選手報告・修正】/【試合で受傷・修正】`で再構成・painLevel/canPractice更新・approved温存）／`cancelInjury`（i削除→対のr削除で孤児回避・**Undoで両方復元**）。**承認レース対策**=可否をサーバー最新の`approved/source`で**updateFn内で再判定**（doEditInjury/cancelInjury両方に`blocked`ガード）。承認後は「修正はスタッフへ」表示。
  - **P5-2 rlog閲覧+当日編集/削除**: injuryタブに「リハビリ実施履歴」（**rlogにpid無し→自分の怪我のinjId群で絞る**・content||comment両対応）。`showEditRlog`/`doEditRlog`/`delRlog`(Undo)/`undoDelRlog`。編集/削除は`by==='player'`かつ**当日のみ**（描画editable＋updateFn両方でゲート）。
  - **P5-3 痛み自己記録(chart.evals bySelf)当日編集/削除**: showMyChartに「あなたの痛み記録」一覧。`showEditPainSelf`/`doEditPainSelf`/`delPainSelf`(Undo)/`undoDelPainSelf`。**playerにchartUpdateは無い**→savePainSelf同様`svSafeUpdate('chart')`直書き。編集/削除は**`bySelf===true`かつ当日のみ**（trainer/staffの臨床評価=bySelf無しは触れない・updateFn内でも再ゲート）。
  - **P5-4 コンディション/wc/md編集**: condition過去一覧の各行に修正/削除（既存`showEditCondition`/`delCondition`を配線）。**wc/mdは削除のみ既存→編集を新設**：`showEditWeekCheck`/`doEditWeekCheck`、`showEditMatch`/`doEditMatch`。**md編集はmdフィールドのみ更新し、injured/crampフラグと怪我サブフィールドは触らない**（doMatchのi/r生成を再実行させない＝怪我重複防止）。
  - **P5-5 bc同日重複チェック（cond除外+昇格先行実装）**: `doBCInput`に同日重複チェック（**rec.date基準**・`source:'cond'`除外）。同日実測ありは追記ブロック→`showEditBC`誘導。同日cond由来は実測で**上書き昇格**（source除去・svSafeUpdateでin-place）。P7a前はcond不在で無害（実質フルブロック）。新テスト`test_bc_dup.js`(26アサーション)。
  - **P5-6 tape変更/欠席編集/PIN変更**: `doTapeChange`（1回のsvSafeUpdateで旧予約除去→新枠容量を旧予約抜き最新で再検証→push。doTapeBookの同日ガードを迂回。**旧が既消でも同日別予約があれば二重予約を作らないdupガード**）＋`showTapeBookForm(date,changeRid)`変更モード＋`updateTapeSlots`が旧予約を占有除外。`showEditAbsence`/`doEditAbsence`（reason=`種別：理由`全角コロンU+FF1Aで分割/再結合・pid===myPid且つsource==='player'のみ）。`doChangePIN`（現PIN平文照合→新PIN2回一致→svSafeUpdate('p')・showProfileSettingsに配置）。
  - **敵対的レビュー由来の確定修正4件（触る時に退行させない）**: ①`cancelInjury`のupdateFn内approved再判定（並行承認で承認済み怪我+rを消さない）②`selectedTapeSlot`を`showTapeBookForm`と`updateTapeSlots`先頭で**null化**（別日/別部位数の枠残留→不整合予約を防ぐ・変更フローで顕在化）③`doTapeChange`の旧予約既消フォールバックに同日dupガード ④rlog/痛み編集削除のupdateFnに**当日ゲート追加**（描画editableと対称・過去日レコード保護）。新テスト`test_p5_guards.js`(30アサーション)で①③④を回帰固定。
  - **横断（P6以降）**: 新規CRUDは雛形v2（`showSub`→`guardSubmit`→`svSafeUpdate`→**Undoトースト・confirm不使用**・`isFilled`で0安全・`idEq`）を踏襲。確定/削除操作は**updateFn内でサーバー最新を再判定**（クライアントD.*の楽観ゲートだけに頼らない＝承認/所有者/当日レースの根治）。生hex禁止・var()のみ（残渣はP9で一掃）。
- **🚫 P3「ダークテーマ統一」は不採用（2026-07-14）**: playerのダーク化を完全実装(本体+staff/trainer no-op・全検証緑)して実機スクショ提示→**ユーザーが「みにくい」と却下し『ライトのまま』を選択**。**pushせず全revert済み**。理由=選手はスマホを明るいジム/屋外で見るためダークは白飛びして読みにくい。→ **今後ダークを提案・再開しない**（メモリ`feedback_prefers_light_theme`）。
- **✅ P4「リハビリ役割分担フレーム（緩やか分担）」実装完了（ライトのまま・push前）**。staff+trainerのみ変更（player/coach無関係）。検証: `python3 dev/run_tests.py`=**53 run/0 fail**（新規 `test_rolegate.js`/`test_req.js` 含む）＋`python3 dev/sync_check.py`=ALL SYNC OK＋敵対的レビュー(3次元・検証付き)=**確定バグ0**。**push単位=1（staff+trainer+manifest+2新テスト）。ユーザー確認後にpush**。実装内容↓。
  - **共有identical関数/定数（7件・sync_manifest登録済み）**: `ROLE_ACL`(アクション→担当ロール表)／`roleGate(action)`(可否判定)／`roleGuard(action)`(不許可ならalert＋false)／`roleTag(role)`(🔵ﾄﾚｰﾅｰ/🟤ｽﾀｯﾌ バッジ)／`whoTag(role,name,at)`(最終編集者表示・重複名デデュープ)／`stampWho(rec)`(保存時に savedRole/savedBy/savedAt を追記)／`REQ_META`(依頼センチネル `🔔【依頼】`＋label表)。**per-file**: `var MY_ROLE`（staff='staff'/trainer='trainer'・**identicalブロック外**）／`reqStaffAction`(trainer専用)／staffダッシュボードの依頼チップスキャン。
  - **ROLE_MODE='soft'（出荷値）**: 確定操作(resolve/unresolve/delete/approveRtp/approveRtest)のみスタッフ専任。日次記録(rlog/eval/diagnosis/nextmenu)は両者可＝`roleGuard`は**完全素通り**（出荷挙動は不変）。段階変更(stage)は`ROLE_ACL.stage='both'`で常に両者可。**`ROLE_MODE='strict'`の1行変更**で日次記録がトレーナー専任化（staffは`roleGuard`でblock＝実効化テスト済み）。※strict時のstaff→trainer依頼UXは未実装＝将来strict有効化フェーズで追加。
  - **trainer確定ボタン撤去**: `renderChartOverview`(trainer)の回復/削除ボタンを`roleGate('resolve')?実操作:依頼`の三項に置換→trainerは常に「🔔 回復済みをスタッフに依頼」等（`reqStaffAction`）。resolveInj/deleteInjury(alertスタブ440-441)・unresolveInjの定義は残置（未呼出＝無害）。
  - **stampWho配線=5保存×2ファイル**: rlog(doSaveRehabLog{Staff,Trainer})・stage(advRehabStage/prevRehabStage⇔changeStage)・diagnosis(saveChartDiagnosis・`ch.injDetail`にstamp)・eval(saveEval・rec)・nextmenu(saveNextMenu{,T}・plan)。**追加フィールドのみ**。表示=`whoTag`をrlog履歴(trainer/staff)＋eval一覧カード(両)に配線（旧記録は implementer/by/inputAt へフォールバック）。
  - **依頼チップ（staffダッシュボード緊急レイヤー）**: injcommの最新がトレーナー発の`REQ_META.prefix`依頼なら「トレーナーからの依頼」チップを表示。**状態ベース自動クリア**=回復依頼はinj.resolved到達で／治療中依頼は!resolved到達で消える（コメント返信不要。自己レビューで発見しレビューが反証確認）。delete依頼は不提供＋削除でinjがD.iから消え自然消滅。
  - **横断ルール（P5以降）**: リハ関連の新しい確定操作ボタンは全て`roleGate`経由・日次保存は`roleGuard`入口ゲート＋`stampWho`＋表示に`whoTag`を踏襲すること。approve系(RTP/rtest)は`ROLE_ACL`に登録済み＝P7cでボタン化時に`roleGate('approveRtp')`等を使う（依頼チップのpend判定にもapprove分岐を足す）。
- **P2b完了メモ（staff代理編集・push済み `099337f`）**: staffの`trSessDetail`セッション展開内に「代理修正／代理削除」ボタン（fitnessは削除のみ）。playerから共有ヘルパーを移植し**10関数をidentical登録**（`newId`/`isFilled`/`guardSubmit`/`releaseSubmit`/`getCompareVolume`/`computeTlogVolumes`/`bestE1rmPerBase`/`rebuildE1rmFrom`/`slimTlogRec`/`toast`）。編集はインラインフォーム（pushViewは1階層で選手詳細を失うため不採用）。**所在特定=`tlogDocKeys(rec)`＝移送境界(TLOG_KEEP_DAYS)より古い記録は`['tlog', tlaKey]`両doc対象／新しい記録はメインdoc優先**。`tlogUpdateKeys`で全docへ順次適用→アーカイブdoc書換後は`_tlogArch`手動同期＋`_tlaCache=null`→`rebuildE1rmFrom(rec.pid, rec.date)`。新テスト`dev/test_tlog_edit_staff.js`（45アサーション・アーカイブdoc編集/削除/Undo/複数pid隔離/notFound/F1/F3含む）PASS。
- **P2bの敵対的レビュー由来の確定修正（重要・触る時に退行させない）**:
  - **F3/F4（rebuildE1rmFrom・player/staff両方＝identical）**: `_e1rmRebuildGen`/`_pendingRebuild`を**pid別マップ`{}`化**。旧スカラーは別pidのrebuildが互いのコールバックを握りつぶし、失敗が保留にも載らずe1rm恒久不整合になる欠陥だった。`retryPendingRebuild`（各ファイルvariant）は全pid分flush。**スカラーに戻さないこと**。
  - **F1（staff・tlogDocKeys）**: 起動時`archiveTlog`との競合で「D.tlogとtla_docに過渡的両在籍」した古い記録を削除しても復活しないよう両doc掃除。
  - **F2（staff・delTlogStaff）**: Undoは削除前`snapshot=slimTlogRec(rec)`を保持（Firestore tx再試行時のclosure latch陳腐化に非依存）。
- **P2a完了メモ（player・push済み）**: `computeTlogVolumes`/`bestE1rmPerBase`抽出→finishTraining/編集/rebuild同一経路化。`rebuildE1rmFrom(pid,fromDate)`=誤高値による抑圧e1rmをリプレイ再生成（**日付ごと1レコード=max集約**で同日タイ退行も根治）。`toast(msg,actionLabel,actionFn)`拡張＋`.toast-undo`。showTrainingHistory各行→`showTlogDetail`→`showEditTlog`/`delTlog`（confirm不使用・削除=即実行+5秒Undo・直近D.tlogのみ編集可）。**敵対的検証(ワークフロー)で判明した4必須修正を反映**: ①getCompareVolumeをid/ts引数化(編集時_curTLog=null対策) ②fromDate=min(旧,新) ③notFoundガード＋移送済み行はボタン非表示 ④in-place更新(ts/kind/menuId温存)+slimTlogRec。新テスト`dev/test_tlog_edit.js`39本PASS。
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
| P2a | player: tlog編集/削除＋rebuildE1rmFrom（リプレイ方式）＋CRUD雛形v2（Undoトースト） | ✅ push済み（test_tlog_edit 39本PASS/回帰50/50/sync OK。敵対的検証GO-WITH-FIXES反映） |
| P2b | staff: tlog代理編集（tla_も可）＋共有関数移植（identical登録） | ✅ push済み `099337f`（test 45本/回帰51・sync OK・敵対的レビュー4件F1-F4修正済） |
| P3 | ~~デザイン基盤前倒し（ダーク化）~~ | 🚫 **不採用・撤回**（ユーザーがダーク却下→ライト維持。実装は完了したがpushせず全revert） |
| P4 | リハビリ役割分担フレーム（緩やか分担・roleGate・trainer確定ボタン撤去） | ✅ push済み `2d82102`（53 run/0 fail・sync OK・敵対的レビュー確定バグ0） |
| P5 | player CRUD残り（怪我/rlog/痛み/wc/md/bc/tape/欠席/PIN） | ✅ 実装完了・**push前**（55 run/0 fail・sync OK・敵対的レビュー18体で確定4バグ修正済） |
| P6 | staff/trainer CRUD残り＋prompt()7箇所（staff6+trainer1）撲滅 | ⬜ **次はここ** |
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
- ブランチ: main（origin/main=`099337f` と同期・作業ツリーはこのHANDOFF更新のみ）。直近コミット=`099337f`(P2b)
- テスト用選手「テスト選手」(CTB/1年, note=動作確認用)が本番に1名存在（削除可）
- ⚠️ 検証はjsc模擬実行で完結（本番Firestore直結のためブラウザで代理編集/削除の保存ボタンは押さない）。最終目視はユーザーのCmd+Shift+R確認に委ねる

## 運用ルール（このプロジェクト固有）
- データは「短いキー」で読む。保存は `svSafe` / `svSafeUpdate` を使う。
- 1機能ずつ → jsc構文チェック → 模擬実行 → 次へ。まとめて変更しない。
- git push の前は必ずユーザーに確認。それ以外の局所的・可逆な作業は確認不要で進める。
- 詳細は `CLAUDE.md` を参照（最重要ガイド）。
