# 全面見直し＋デザイン再構築 v2（ハイブリッド順序・3レビュー完全吸収版）

> 旧プラン `tingly-munching-aurora.md` の徹底見直し版。3体のレビューエージェント（選手UX/スタッフ系UX/デザイン・技術）＋設計エージェント＋親エージェントのコード裏取りを経て再設計。**本ファイルが唯一のアクティブプラン**（旧プランとdev/audit/PLAN_*.mdは廃止扱い）。
> ⚠️ プロジェクトパスは `/Users/nakayamarinnin/Documents/個人開発プロジェクト/rugby-manager` に移動済み（旧 Documents/rugby-manager は消滅）。

## Context（なぜ作り直すか）

旧プランは方向性（CRUD充実・統合・ダーク化・IA再編）は正しいが、徹底レビューで以下の欠陥が判明した:

1. **技術的誤り**: P2aの`rebuildE1rmForDate`（同日再生成）では推定1RMの誤値を戻せない。finishTraining 4824-4826は「日付最新値を超えた時だけ」e1rmを記録するため、**誤高値日X以降の正しい記録はレコード自体が作られず恒久抑圧される**（コードで裏取り済み）。同日削除では抑圧分が復元されない。
2. **フェーズ間衝突**: P2cのbc同日重複チェックが、P5aのコンディション→bc upsert(source:'cond')を「入力済み」と誤検知して本測定を弾く確定バグ。
3. **順序の二重手間**: CRUD→統合で新画面~2900行をライトテーマで書き、P6で再変換する構造的無駄。
4. **デザイントークンの不合格**: --accent:#c1121f前景=2.95:1、--maroon前景=1.86:1でWCAG不合格（実測）。glow/shadowトークン欠落（ネオン/グロー志向なのに）。
5. **検証基盤の過大評価**: md5照合スクリプトは存在せず、extract.pyは`<style>`を抽出できない。テストは38本（「40本」は誤り）。
6. **監査最上位指摘の未対応**: リハビリの「主体不在」（staff⇔trainerで記録・段階変更・カルテが完全重複）が役割設計として拾われていない。
7. **選手IAの欠陥**: 5タブ案に怪我人（常時1-2割）の毎日タスクが無い。prompt()は4箇所でなく7箇所。他多数。

## ユーザー決定事項（2026-07-13 AskUserQuestionで確定）

1. **フェーズ順序=ハイブリッド**: バグ修正→tlog編集（最重要ペイン即納）→デザイン基盤前倒し→以降の新画面は全て新デザインで一度だけ書く
2. **リハビリ役割=緩やか分担**: 日次記録=トレーナー主体/承認・回復判定=スタッフ専任。両者操作可のまま役割バッジ＋最終編集者表示＋依頼ボタン。**確定操作（回復済み・削除・RTP/rtest承認）だけスタッフ限定**
3. **選手ナビ=動的タブ切替**: 怪我離脱中は3タブ目がトレーニング→リハビリに自動切替
4. **新機能=4セット全採用**: PWA化／削除Undo＋週間振り返り／staff業務3点セット（実施マトリクス・要対応キュー・伸びサマリ）／coach強化＋検索（週報・カルテ根拠フル・選手名検索）
5. （旧決定の継続）マルーン×ゴールド基調・全サイトダーク化・trainer青/coach緑差し色・大胆再編OK

## 不変制約

- 短キー読み書き・保存はsvSafe/svSafeUpdate/svSafeSeqのみ（素のsv禁止。staff:1135の初回シード`sv('p')`不可侵）
- 単一HTMLファイル×4＋LP維持。共通部は各ファイルへコピー＋md5照合
- jscで構文チェック（node不在・dev/prelude.js）。ブラウザ検証は本番Firestore直結=**読み取り専用限定**
- スキーマは追加フィールドのみ（editedAt/source/durMin/deleted等）。既存データ移行なし
- 1機能ずつ→jsc→模擬実行→次へ。pushはフェーズ単位・ユーザー確認後

## フェーズ構成表

| # | 内容 | 規模 | push | 順序の理由 |
|---|---|---|---|---|
| P0 | 基線記録＋検証基盤新設＋文書訂正 | dev/のみ 200-300行 | 1 | md5照合・残渣grepの道具が無いと以降が検証不能 |
| P1 | 整合性バグ修正＋chartUpdate安全化 | ~380行 | 2 | 全フェーズの複製元。chartUpdateはP5/P7の前提 |
| P2 | tlog編集/削除＋rebuildE1rmFrom＋CRUD雛形v2 | ~600行 | 2 | 「誰も直せない誤値」を最短解消【最重要ペイン即納】 |
| P3 | デザイン基盤前倒し（ダークトークン＋コンポーネント＋meta/PWA＋グラデ集約＋一次ダーク化） | 1600-2000行 | 4 | 以降の新画面~2900行をダーク・トークン済みで一度だけ書く |
| P4 | リハビリ役割分担フレーム（緩やか分担） | ~250行 | 1 | 役割設計はCRUD追加の前提。以降の新ボタンは全てこの枠内で書く |
| P5 | player CRUD残り（怪我/rlog/痛み/wc/md/bc/tape/PIN） | ~550行 | 2 | 新デザイン＋雛形v2で一度だけ書く |
| P6 | staff/trainer CRUD残り＋prompt()7箇所撲滅 | ~950行 | 3 | 役割枠確立後に書き権限分岐の後付けを回避 |
| P7 | 機能統合（体重/durMin→欠席双方向→復帰フロー+coach根拠→1フォーム化） | ~900行 | 4 | 統合は正典データの編集UI(P5/P6)が前提 |
| P8 | IA再編＋新機能（player動的タブ→ホーム→測定結果→staff→trainer/coach） | ~1400行 | 5 | 全新画面の最後＝デザイン・役割・統合済みで一度だけ書く |
| P9a | 旧画面の生hex/rgba残渣一掃 | 300-500行 | 2 | 新画面が出揃った後に1回で締める |
| P9b | モチーフ・アニメ仕上げ（ピッチ汎用化・RTPフィールドマップ・rv移植） | 900-1100行 | 3 | 最終マークアップに一度で済ませる |
| P9c | 総回帰・md5全照合・全画面巡回・文書最終更新 | ~50行 | 1 | 締め |

計 約8,000-8,500行・push約30回。ダーク化push(P3)とIA push(P8)は別日。

## 各フェーズ要点

### P0 基線＋検証基盤＋文書訂正（サイト本体無変更）
- テスト**38本**全実行→dev/audit/baseline_tests.jsonに合否記録。new Chart出現数記録（player14/staff13/trainer2/coach5）
- **新設**: `dev/sync_manifest.json`（同期台帳。identical=全ファイルmd5一致必須／variant=ファイル別md5+許容差分）＋`dev/sync_check.py`（マニフェスト照合＋`/* THEME-TOKENS */`CSSブロック抽出md5＋残渣grepモード=許可リスト外の`#hex`/`rgba(`検出）。extract.pyはmd5もCSS抽出もできないため必須
- **生hex台帳を5分類で確定**→dev/audit/hex_ledger.json: ①ブランド定数=残置 ②ステータス直書き→var() ③ライトサーフェス→ダーク値 ④Chart.js内JS文字列→CHT参照 ⑤**rgba 264箇所**（rgba(60,10,12,..)系ライトボーダーはダーク地で沈む）。グラデ約74定義も台帳化
- **CLAUDE.md訂正**: 「node --check」→jsc手順へ・テーマ実態（player/staff/LP=ライト）・テスト38本・新プロジェクトパス
- **HANDOFF訂正**: TimeTree/ppは実装済み（ppCardHtml=staff:4431/trainer:923、**ppAutoFlipがfinishTraining 4837に導入済み**）→sleepy-spinning-stardustは完了扱い。残件「pp編集のstaff集約」のみP7dへ。フェーズ表を本プランに差替

### P1 整合性バグ＋chart安全化
- **P1a（~80行・push1）**: coach 1236-1237の死にコードsetTrExC/setTrMetricC削除（本物は2013-2014）／getBest・getLatestの`x.pid===pid`→idEq（player1246/staff1374/coach321、identical登録）／escapeHtml漏れ4箇所（player2216・staff1763・staff2638・staff6341・trainer1409）
- **P1b（~300行・push1）**: `chartUpdate(injId,fn)`ヘルパー（staff/trainer同一実装・identical登録）。saveChartDiagnosis/setRtpLevel/toggleReturnCriteria/changeStage系/saveEval/saveSOAPを経由化。**rom-rom-tender-sundae P0-b（操作単位保存）の拡張として整合**
- 新テスト: dev/test_chart_safe.js（2端末同時書換で後勝ち上書きが起きない）

### P2 tlog編集【最重要】＋CRUD雛形v2
- **P2a player（~380行・push1）**: showTrainingHistory(4909)各行→詳細→編集/削除（対象=メインD.tlogの直近15日。tla_は閲覧＋「古い記録はスタッフへ」）。finishTraining計算部(4786-4811)→`computeTlogVolumes(log)`抽出（新規/編集が同一経路）
- **`rebuildE1rmFrom(pid,fromDate)`新設**（同日再生成では不足）: 当該pidのe1rmを date>=fromDate で全削除→tlogを日付昇順リプレイして再生成。getLatestE1RM(3922)/getE1RMTrend(4985)は無改修で追従。lastVolumeスナップショットは追わない（表示専用と仕様コメント明記）
- **CRUD雛形v2確立**（以降の全CRUDの鉄則）: showSub→guardSubmit→svSafeUpdate(idx検索→書換+editedAt)→**toast(1274)にaction引数を追加したUndoトースト**（削除=即実行+5秒Undo復元）→**confirm()不使用**。新規マークアップは**生hex禁止・var()のみ**
- **P2b staff（~220行・push1）**: tlog代理編集（tla_も可）。computeTlogVolumes/rebuildE1rmFromをstaffへコピー（identical登録）。所在特定（D.tlog or tlaキー）後にそのdocのみ更新（idマージ復活バグ防止）
- 新テスト: dev/test_tlog_edit.js（**誤高値による抑圧レコードの復元ケース必須**）

### P3 デザイン基盤（前倒しダーク化）— player→staff→trainer→coach+LP の4push
**確定トークン（THEME-TOKENSブロックとして各ファイル複製・variant登録）**:
```
--bg-app:#140A0B --bg-primary:#1E1113 --bg-secondary:#28181A --bg-tertiary:#332022
--text-primary:#F5E9E9 --text-secondary:#C7B0B2 --text-tertiary:#A78E91（微明化済）
--border-secondary:rgba(245,233,233,.20) --border-tertiary:rgba(245,233,233,.09)
--accent:#c1121f --accent-text:#EA6B72【新設・on-dark前景専用】 --gold-deep:#D9A82E
--blue:#6C9BF2 --green:#3DDC97 --red:#F27B7B --amber:#F2B950 --purple:#B39DF5
--blue-bg:rgba(108,155,242,.15) --green-bg:rgba(61,220,151,.14) --red-bg:rgba(242,123,123,.15)
--amber-bg:rgba(242,185,80,.15) --purple-bg:rgba(179,157,245,.15)
--shadow-md:0 8px 28px rgba(0,0,0,.5) --glow-accent:0 0 20px rgba(193,18,31,.35) --glow-gold:0 0 18px rgba(217,168,46,.30)
```
- **--accent-text必須の根拠**: --accent前景2.95:1・--maroon前景1.86:1で不合格（実測）。`color:var(--accent)`/`var(--maroon)`の前景用途**45箇所（player25+staff20）を機械置換**。.header h1は--text-primaryか--gold-hot。ボタン背景--accent+白文字(6.23:1)は温存。glowはcoachの--accent-glow語彙を4サイト共通化
- **コンポーネントブロック**: .btn/.ipt/.card統一（**.iptはfont-size:16px**=iOSズーム防止。staff現行13pxのバグを新フォームに持ち込まない）。トークン参照のみ→4サイトmd5一致。trainer/coach差し色はトークン側（--accent:#4C8DF5／緑系）で吸収
- **グラデ74→3定義**（maroonヒーロー/goldアクセント/ダーク芝）
- **meta/PWA（全5ファイル）**: `theme-color`＋`color-scheme:dark`＋apple-mobile-web-app-capable/status-bar-style（無いとselect/日付ピッカー/スクロールバーが白のまま）。viewport-fit=coverをstaff/trainerへ。playerに最小manifest.webmanifest（新規1ファイル）+apple-touch-icon
- **一次ダーク化（push時点で全画面可読を保証）**: Chart.defaultsダーク化（player381/staff356。JS文字列色は`CHT`オブジェクト新設参照）／darkenForLight→**liftForDark同名差替**（定義2=player/staff・呼出7箇所無傷・identical登録）／**RCAT_BG残hex #E0F2FE・#D1FAE5→ダーク透過値（player387/trainer148/coach241の3ファイル）**／painColorsは**trainer2220のみ**／RTP_LEVELS色2系統→1系統（鮮やか系へ）／rgba(60,10,12,..)ボーダー／background:#fff各1箇所／**notice-item回転テープ::before廃止を同時実施**（中間不整合回避）
- coachにGoogle Fonts link（Overpass/Zen Kaku）明示追加・trainerにも同link＋ブランドトークン。player下部ナビ境界に--gold-hot 1px border-top。本文font-weight 400→500は目視判断
- 検証: jsc＋全回帰＋sync_check＋残渣grep＋**全画面読み取り専用目視（jscは視覚を検証できない=ここが唯一の砦）**。サイト単位1コミット=1発revert。夜間push推奨

### P4 リハビリ役割分担フレーム（緩やか分担・~250行・push1）
- 原則: **日次記録（rlog/評価/SOAP/次回メニュー）=トレーナー主体／承認・回復判定・削除=スタッフ専任**。段階変更は両者可のまま
- 完全重複対象: rlog（staff6952⇔trainer3627）/段階変更（staff7025・7034⇔trainer2383）/受傷診断（staff2744⇔trainer1817）/評価（staff2899⇔trainer2152）/次回メニュー（staff7006⇔trainer3685）
- 実装: `ROLE_MODE`定数（現値'soft'。将来'strict'へ1行切替可能な構造）＋`roleGate(action)`＋役割バッジ（🔵トレーナー記録/🟤スタッフ）＋**最終編集者・日時の常時表示**＋**「依頼」ボタン**（injcomm自動投稿＋相手ダッシュボードに新着チップ）
- **trainerの確定操作ボタンを撤去**: resolveInj/deleteInjuryのalertスタブ(427-428)を呼ぶボタンを非表示化、**unresolveInj(2404)のボタンも非表示化**で非対称解消（「実装」ではなく撤去が正解）
- 新テスト: dev/test_rolegate.js。横断ルール: P5以降のリハ関連新ボタンは全てroleGate経由

### P5 player CRUD残り（~550行・push2・雛形v2+新トークンで記述）
- 怪我報告(i): approved==nullの自己編集/取消を**source:'player'と'match'の両方**に適用（pendingInj判定2569はmatch由来を含む）。承認後は「修正はスタッフへ」
- rlog: injuryタブに自分の実施履歴一覧新設（現在「書けるが読めない」）＋当日分編集/削除
- 痛み自己記録（chart.evals bySelf）: 当日分修正/削除（chartUpdate経由）
- wc/md編集。condition過去一覧(2459-2466)各行に編集/削除（showEditCondition 2861流用）
- bc: doBCInput(3846)に同日重複チェック——**source:'cond'は重複対象外＋本測定時は昇格（上書き）分岐を先行実装**（P7a衝突の予防。P7a前はsource:'cond'が存在しないだけで無害）
- changeTapeBooking（svSafeUpdate1回で旧削除+新追加）・欠席の種別/理由編集・PIN変更UI
- 新テスト: dev/test_bc_dup.js（cond除外+昇格分岐）

### P6 staff/trainer CRUD残り（~950行・push3）
- **P6a staff（~550行）**: f/bc/a/cal/ann編集フォーム（削除ボタン横）。md/wc代理入力・修正。**prompt()フォーム化=staff6箇所**: editStageDate(2232)/次段階目標日(4337)/段階目標日(4354)/markSkip理由(6521)/テンプレ名(7062)/却下理由(7392)。trainers改名・rtest_tpl編集・tapeslot個別削除・tape代理変更・phskip取消/理由修正。任意: V.gps行編集/gmap修正・V.standards一括保存改善・卒業選手一括削除・V.export復元導線。**怪我承認のV.injury配置はしない**（P8dの要対応キューで一元化＝二重化回避）
- **P6b trainer（~400行）**: rlog種目編集（goRehabPlayer＋staffのgoEditRehabLogStaff 7082を同時改修・roleGate下）。rtest編集/削除（両サイト）。テーピング枠個別編集/削除＋過去日枠削除。preCheck編集・コメント編集・PIN変更。**prompt()=trainer1箇所**: goSaveAsTemplateT(3676)。SOAP/テーピング記録者を「name文字列」→**ログイン中trainerId参照**（表示はtrainersから解決。既存レコードは温存）。任意: 自動ログインにPIN確認オプション

### P7 機能統合（~900行・push4）
- **P7a 体重+sRPE（~200行）**: 正典=bc。コンディション体重欄保存で同日bcをupsert（source:'cond'。P5の分岐が受ける）。**durMinはプリフィルでなくfinishTraining事後更新**（朝入力運用ではプリフィル空振り）: 完了時に当日fへdurMin追記＋sRPE表示はdurMin優先。当日f未提出なら読み側フォールバック（tlogから拾う）
- **P7b 欠席統一（~200行）**: 正典=a。「今日は休む」でaをupsert（src:'tlog'+tlogId参照）。coach集計をa基準へ。**a取消→対応tlogは確認ダイアログ+論理削除（deleted:true）**。**逆方向=トレタブで「休む」取消→a側も取消**を実装
- **P7c 復帰フロー+coach根拠（~250行）**: approveRTest(6781)成功後にチェックボックス「□RTP完全復帰 □怪我resolved □リハ段階完了」→svSafeSeqで一括反映。coach怪我詳細に**returnCriteria達成状況＋最新eval要約＋injDetail機転・診断名・最新SOAPのA/P・画像有無**（購読済みcoach:547-556、描画のみ追加）。承認ルール明文化: trainer/staff起票=即approved+approvedBy、player/match起票=要承認、trainer起票時staffへ新着チップ
- **P7d 1フォーム化（~250行）**: 受傷情報1フォーム（i→chartをsvSafeSeqで2キー更新、旧2画面リダイレクト）。リハビリ記録1画面=trainer/staff側（rlog保存に「臨床評価も記録」折りたたみ→1保存でrlog+chart.evals）＋**選手側も1シート化**（showRehabForm 3729⇔showPainSelfForm 3693の分離解消。doInjuryReport 3884のi+r同時保存=svSafeSeqが見本）。saveQuickEval廃止→フル評価「クイックモード」トグル。**trainerのpp編集ボタン除去（staff集約。ppAutoFlipとの共存を確認）**。ブロンコ入力をshowPhysForm(mode)へ統合
- 新テスト: test_bc_upsert.js／test_absence_sync.js（双方向）／test_rehab_oneform.js

### P8 IA再編＋新機能（~1400行・push5・P3と別日push）
- **P8a player動的タブ（~350行）**: 5タブ[ホーム/コンディション/トレーニング/マイデータ/マイページ]。**未resolved怪我あり→3タブ目がトレーニング→リハビリに自動切替**（リハビリタブ=[今日のリハ記録(P7dの1画面)/RTPピッチ/痛み推移/週次チェック/カルテ]）。go()はonclick属性判定(1857-1861)なので**ナビHTML(374-377)を動的生成関数化**すれば安全。復帰時「タブが戻った」一度きり案内（localStorage）。コンディションタブ=1タップ入力/入力済なら当日サマリ+編集+過去一覧（過去日修正導線を内蔵）。**IA原則: 見る系=マイデータ/入力系=マイページ**。マイデータ先頭NOW（ランク/ベスト/推定1RM/体組成の正典）→期間セレクタ→推移→バッジ→ランキング入口。T.mystatus=go('mydata')+NOWへアンカースクロール。**マイページ数値ブロック2326-2364撤去**・移設物は「◯◯はこちら」1行リンク残置・タブアイコン差別化
- **P8b ホーム再構成（~300行）**: 13→7ブロック（ヒーロー/今日やること/RTPカード/個人未入力アラート/今週予定/お知らせ/ランキング・バッジリンク）。myPhysCard→マイデータNOW、pp→トレーニングタブ、チーム未入力一覧・測定会あとN名→staffのみ。**怪我クイック報告**（ホーム常設赤ボタン+ヘッダー小アイコン=全タブ2タップ以内。既存怪我持ちはカルテ直行に切替）。**週間振り返りサマリ**（getMyInsights 5525の計算済み値を週初ホームに1枚）。任意: ストリーク（~60行・連続入力日数🔥）。表示重複解消: ベスト5→2箇所/推定1RM3→2/最新コンディション→タブのみ/本日リハメニュー→リハタブのみ
- **P8c 測定結果シート（~200行）**: doPhys成功CB(3590-3595)とdoBronco(2756)→showMeasureResult()。**「NO SIDE」演出**（FULL TIME=showTrainingResult 4854と対）。**resultHero(kicker,bigNum,unit,caption)+resultStatRows(rows)共通骨格抽出**（前回比ロジック4870-4877流用・showTrainingResultも同骨格へ）。中身=各種目前回比チップ/getLiftRankInfoでランク変動演出/BIG3 CLUB到達/復帰中はbroncoTarget達成表示。開始ゲート「今日はしますか?」初回のみ化
- **P8d staff IA（~350行）**: **サイドバー6グループ再編（nav(pg)キー・項目名・アイコン温存、見出しと並びのみ変更）**: 【今日】dash・calendar/【選手】players・rank/【メディカル】injury・rehab・rtest・tape・injstats・trainer/【トレーニング】training・tgroup/【コンディション・出欠】fatigue・absence・matchview/【測定・分析】physical・msess・bodycomp・gps/【運用】standards・export・help。**要対応キュー一元化**（怪我承認+rtest承認+レッドフラグ+未提出督促を1キュー+ヘッダーバッジ）。**当日メニュー実施/未実施マトリクス**（renderTrainingStatus 5968置換・未実施セル→代理入力直行）。**今週の伸びサマリ**（renderPhysAlerts 3894をdashへ集約）。**選手名検索**（ヘッダー常設）
- **P8e trainer/coach IA（~200行）**: trainer=ホーム「担当リハビリ選手」導線カード化・コメント欄一本化。coach=概況を「件数+先頭数件+タブジャンプ」に圧縮・ポジションマトリクス→選手タップ遷移・**選手名検索**・個人レポート分割・未使用キー購読削減・tla_遅延取得。**coach週報カード**（今週vs先週の稼働率/怪我/提出率/BIG3平均デルタ。既存考察エンジン集約）
- 新テスト: test_dyn_tabs.js/test_queue.js/test_measure_result.js

### P9a 生hex/rgba残渣一掃（300-500行・push2）
- P0台帳（hex523+rgba264+グラデ74+Chart118）からP3変換済み分を差引いた残渣をゼロへ（分類①ブランド定数のみ残置許可）。sync_check.py残渣モードで機械確認＋目視巡回

### P9b モチーフ・アニメ仕上げ（900-1100行・push3）
- **pitchProgressHtml(idx,total,labels,opts)汎用化**: rtpPitchHtml(3605)のpos配列をtotalから動的生成＋ナイター芝(#0F2318→#132B1E)。rtpPitchHtmlは薄いラッパ温存（呼出=showMyChart 3657の1箇所）
- 適用: playerランク進捗(5段階)/測定結果シート/週間ボリューム達成率/staff提出率（提出人数分ボール前進）/**coach「RTPフィールドマップ」**（1枚のピッチに離脱中全選手を背番号ドットでRTP段階配置=目玉・単体100-150行）。player/staff/coach identical登録
- trainerにpitch-lines背景+ghost-num導入。全サイトghost背番号・kicker斜体英字・Overpass斜体ナンバー統一
- playerのrv/rv-armed一式（CSS126-131+JS1296-1340）→trainer移植。タップフィードバック共通化。絵文字装飾→SVGシンボル化。prefers-reduced-motionガード維持

### P9c 総回帰（push1）
- 38本+新規約10本をP0基線比較で全回帰・sync_check.py全量照合（identical+variant+THEME-TOKENS）・new Chart数比較・読み取り専用で全サイト全タブ目視巡回・CLAUDE.md/HANDOFF最終更新（ダークトークン正典・liftForDark・ROLE_MODE・雛形v2・pitchProgressHtml・新パス）

## 保留プランとの合流

- **rom-rom-tender-sundae（怪我×リハ連携）Phase3-6**: 本プラン完了後に別実施。P1bのchartUpdateは同プランP0-bの拡張として整合。再開時はchartUpdate＋P7dリハ1画面＋P4役割枠＋P7c承認ルールを前提に書く
- **sleepy-spinning-stardust（TimeTree/pp）**: 実装済み=完了扱い（P0でHANDOFF訂正）。残件のpp編集staff集約はP7dで吸収

## 検証テンプレ（毎フェーズ）

1. script抽出→`jsc dev/prelude.js <抽出js>`＋括弧バランス検査（Chart.js `}}}});`事故対策）
2. フェーズ対応の新規テスト＋既存38本全回帰（P0基線比較・新規失敗ゼロ）
3. `dev/sync_check.py`（同期関数md5＋THEME-TOKENS＋残渣grep）
4. new Chart出現数のP0比較
5. ブラウザは読み取り専用巡回のみ（保存ボタンは押さない。書き込み検証は模擬実行が代替）
6. push前に`git diff --stat`で対象外変更ゼロ確認→ユーザー確認→push→Cmd+Shift+R確認依頼

## リスクと回避策

1. **本番データ破壊**: svSafe系厳守・追加フィールドのみ・シードsv不可侵・ブラウザ読み取り専用・削除は論理削除優先+Undoトースト
2. **e1rmリプレイの誤り**: test_tlog_edit.jsに抑圧レコード復元ケース必須。対象pid×fromDate以降のみに限定
3. **P5×P7a衝突**: source:'cond'除外+昇格分岐をP5で先行実装（予防）
4. **中間pushの壊れたダーク画面**: P3各pushに可読性クリティカル一次変換を必ず含め、push時点で全画面可読保証。サイト単位1コミット=1発revert
5. **役割強制度の手戻り**: ROLE_MODE定数1行で切替できる実装（現値soft。依頼ボタン/チップは最初から実装）
6. **構文事故**: 1機能=1編集=即jsc。アンカー文字列確認後に編集
7. **同期漏れ**: sync_manifest+sync_check.pyを毎フェーズ実行・P9cで全量照合（variant差分=trainer青/coach緑は許容行として台帳管理）
8. **ユーザー混乱**: 旧タブリダイレクト温存・T.help/V.help同時更新（「各記録は修正・削除できる」の記述をCRUD実態に同期）・P3とP8のpushは別日・夜間push・動的タブは一度きり案内・staffサイドバーは項目名/アイコン据え置き

## 重要ファイル（新パス基準・行番号は2026-07-13時点）

- [player/index.html](player/index.html): nav374-377・toast1274・go1857・mypage数値2326-2364・showRehabForm3729/showPainSelfForm3693・rtpPitchHtml3605・doBCInput3846・getLatestE1RM3922・finishTraining e1rm4824-4826/ppAutoFlip4837・showTrainingResult4854・showTrainingHistory4909・getMyInsights5525
- [staff/index.html](staff/index.html): サイドバー320-345・Chart.defaults356・darkenForLight361・シード1135（不可侵）・prompt()6箇所2232/4337/4354/6521/7062/7392・renderPhysAlerts3894・renderTrainingStatus5968・approveRTest6781・goEditRehabLogStaff7082・approveInjury7379
- [trainer/index.html](trainer/index.html): 空振りスタブ427-428・RCAT_BG148・renderChartOverview1714・painColors2220・unresolveInj2404・goRehabPlayer・prompt()3676
- [coach/index.html](coach/index.html): RCAT_BG241・購読547-556・二重定義1236-1237
- dev/: prelude.js・extract.py・test_*.js38本（P0でsync_manifest.json/sync_check.py/hex_ledger.json新設）・audit/*.json6本
