> ⚠️ **このプランは廃止（2026-07-13）**。徹底レビューで技術的誤りが複数見つかり、後継の `PLAN_zesty-fluttering-kitten.md`（v2）に全面差し替えた。参照しないこと。

# 全面見直し＋デザイン再構築プラン（使いやすさ・CRUD充実・統合・ダークテーマ化）

## Context（なぜやるか）

ユーザーの要望: ①使いやすさの徹底見直し（重複機能の解消・選手目線の導線改善）②連携すべき機能のデータ統合 ③修正・削除・編集機能の充実 ④洗練されたスポーティーでスタイリッシュなデザイン再構築（スクロール/タップアニメーション・ラグビーモチーフ展開。RTPピッチ図 `player/index.html:3605 rtpPitchHtml` が大好評）。

9エージェントによる全行監査（4サイト棚卸し＋デザイン＋整合性＋重複/統合＋選手UX＋スタッフ/トレーナーUX）を実施済み。主要な発見:

- **CRUDの逆転**: 毎日入る軽い記録ほど編集不可。tlog（トレーニング実施記録）は選手もスタッフも誰も修正できず、誤値がボリューム・推定1RMに恒久残存【最重要】。staff側は f/bc/a/cal/ann が全て「削除して作り直し」のみ
- **選手の自己訂正不能**: 怪我報告は承認待ちでも自己取消不可。rlogは「書けるが読めない」投げっぱなし。痛み自己記録も追記専用
- **二重入力/分断**: 体重がコンディションと体組成の2箇所。sRPEの練習時間が手入力でtlog非連動。欠席がa/tlogの2系統で集計食い違い。復帰フロー（テスト承認→RTP→怪我クローズ）が3画面手動。受傷情報が怪我編集とカルテ診断の2画面
- **表示重複**: フィジカルベストがplayer内5箇所、推定1RM 3箇所、本日リハメニュー2箇所。mystatus/mydataの役割重複。ホームが13ブロックの縦長でチーム管理情報が個人ダッシュボードに混在
- **導線**: 毎日使うコンディションが下部ナビに無く2タップ。怪我報告の入口が深い。測定記録後の結果演出なし（トレーニングのFULL TIME演出との逆転）
- **整合性バグ**: coachのsetTrExC/setTrMetricC二重定義、getBest/getLatestのpid厳密比較（他は全てidEq）、escapeHtml漏れ4箇所、RTP_LEVELS色の2系統分裂、素のsaveChartによるロストアップデート懸念
- **デザイン**: 実態はplayer/staff=ライト、trainer=別世界（フォント未統一・アニメ0・モチーフ0）、coach=ネオン緑。4サイトが3つのデザイン言語に分裂

## ユーザー決定事項

1. **マルーン×ゴールドをブランド基調に4サイト統一**。trainer=青／coach=緑は差し色として維持
2. **全サイトダークテーマに統一**（staffもダーク化）
3. **ナビ・画面構成の大胆な再編OK**

## 不変制約

- データは短キー読み書き・保存は svSafe/svSafeUpdate のみ（素のsv禁止。staff:1135の初回シード`sv('p')`は不可侵）
- 単一HTMLファイル構成維持（共有CSSファイル化しない。共通部は各ファイルへコピー＋dev/でmd5照合）
- 構文チェックは jsc（node不在）＋ dev/prelude.js。ブラウザ検証は本番Firestore直結のため**読み取り専用限定**
- スキーマ変更は**追加フィールドのみ**（editedAt/source/durMin等）。既存データの移行処理はしない
- 1機能ずつ→jsc→模擬実行→次へ。pushはフェーズ単位でユーザー確認後

## フェーズ構成（順序に依存関係あり）

| # | 内容 | 規模 | push |
|---|---|---|---|
| P0 | ベースライン記録（テスト40本の合否・md5スナップショット・生hex台帳・new Chart数） | 変更なし | - |
| P1a | 整合性バグ修正 | ~80行 | 1 |
| P1b | chart保存の安全化（素のsaveChart→操作単位svSafeUpdate） | ~300行 | 1 |
| P2a-c | player CRUD（tlog編集/削除＋e1rm再構築 → 怪我/rlog/痛み自己CRUD → 日次記録網羅） | ~900行 | 3 |
| P3a-b | staff CRUD（f/bc/a/cal/ann編集・tlog編集・prompt()撲滅・承認導線） | ~700行 | 2 |
| P4 | trainer CRUD（rlog種目編集・rtest編集削除・枠個別編集・空振りボタン実装・記録者名） | ~500行 | 2 |
| P5a-d | 機能統合（体重/sRPE → 欠席 → 復帰フロー＋coach根拠 → 受傷1フォーム・リハ1画面・pp集約・ブロンコ1本化） | ~800行 | 4 |
| P6a-d | ダークテーマ移行（player→staff→trainer→coach＋ランディング） | ~1200行 | 4 |
| P7a-d | IA再編（playerナビ5タブ＋mystatus統合 → ホーム/マイページ再構成＋怪我クイック報告 → 測定結果シート → staff/trainer/coach整理） | ~800行 | 3-4 |
| P8a-c | デザイン仕上げ（コンポーネント統一 → ピッチモチーフ展開 → アニメ標準化） | ~700行 | 3 |
| P9 | 総回帰・md5全照合・全画面巡回・CLAUDE.md/HANDOFF更新 | ~50行 | 1 |

順序の理由: バグ修正が全フェーズの複製元になるため最初。CRUD→統合（統合は正典データの編集UIが前提）→ダーク化→IA再編（新画面を最初からダークで書く）→意匠仕上げ（最終マークアップに一度で済む）。RTP_LEVELS色統一はP6内（全サイトダーク化で2系統の存在理由が消えるタイミング）。

## 各フェーズ要点

### P1a 整合性バグ（~80行）
- coach 1236-1237の旧 setTrExC/setTrMetricC（死にコード）削除
- getBest/getLatest（player 1246/staff 1374/coach 321）の `x.pid===pid` → `idEq` 統一（3ファイルmd5同期）
- escapeHtml漏れ: player 2216（p.name/p.note）、staff 1763/2638（ev.title/detail）、staff 6341（s.name）、trainer 1409（lastLog.comment）

### P1b chart安全化（~300行）
- trainer/staffの saveChartDiagnosis/setRtpLevel/toggleReturnCriteria/changeStage系/saveEval/saveSOAP を、`chartUpdate(injId, fn)` ヘルパー（svSafeUpdate('chart')で該当フィールドのみ書換。trainer/staff同一実装=md5同期）経由に置換
- dev/test_chart_safe.js 新設（2端末同時書換の後勝ち上書きが起きないこと）

### P2a tlog編集/削除【最重要】（~350行）
- showTrainingHistory(player 4909)の各行に詳細→編集/削除
- 編集範囲: player=メインdoc（直近15日）のみ。tla_アーカイブは閲覧＋「古い記録はスタッフへ」
- finishTrainingの計算部(4786-4811)を `computeTlogVolumes(log)` に関数抽出し、新規保存と編集保存が同一経路を通る
- `rebuildE1rmForDate(pid,date)` 新設: 編集/削除後に同日e1rmレコードを再生成/削除。後続tlogのlastVolumeスナップショットは追わない（表示専用・仕様としてコメント明記）
- レコードの所在（D.tlog or tlaKey）を特定してからそのdocだけ触る（idマージ復活バグ防止）
- dev/test_tlog_edit.js 新設

### P2b 怪我・リハ自己CRUD（~300行）
- 怪我報告(i): `approved==null` の自己報告に限り編集/取消。承認後は「修正はスタッフへ」
- rlog: injuryタブに自分の実施履歴一覧を新設（現在非表示）。当日分のみ編集/削除
- 痛み自己記録(chart.evals bySelf): 当日分の修正/削除（chartUpdate経由）

### P2c 日次記録網羅（~250行）
- wc/md に編集フォーム追加。condition過去一覧(2459-2466)の各行に編集/削除ボタン（既存showEditCondition流用）
- bc: doBCInput(3846)に同日重複チェック（doPhysのdupPh型）＋履歴一覧＋過去分編集
- テーピング予約変更 `changeTapeBooking`（svSafeUpdate 1回で旧削除+新追加）。欠席の種別/理由編集。PIN変更UI
- CRUD量産テンプレ: showEditCondition/doEditCondition/delCondition(player 2861-3043)の型（showSub→guardSubmit→svSafeUpdate(idx検索→書換+editedAt)→toast/notFoundガード）を鉄則化

### P3 staff CRUD（~700行）
- P3a: f/bc/a/cal/ann の編集フォーム（削除ボタン横に）。md/wcの代理入力・修正。tlog編集（アーカイブtla_も staff のみ可・rebuildE1rmForDate連動）
- P3b: trainers名前編集・rtest_tpl編集・tapeslot個別削除・tape代理キャンセル/変更・phskip取消/理由修正(6521)。怪我承認/却下を V.injury(1793) にも配置。prompt()4箇所（editStageDate 2232/markSkipForSess/goSaveAsTemplate 7062/rejectInjury却下理由）をフォーム化

### P4 trainer CRUD（~500行）
- rlog編集を実施種目まで可能に（goRehabPlayer 2696＋staffのgoEditRehabLogStaff 7082を同時改修）
- rtest編集/削除（trainer/staff両方）。テーピング枠の個別編集/個別削除＋過去日枠の削除
- renderChartOverview(1772-1776)の空振り「回復済みにする」「削除」を実装（staffの処理をsvSafeUpdate化して移植）
- preCheck編集・コメント編集・PIN変更。SOAP/テーピング記録者名をログイン中トレーナー自動セットに

### P5 機能統合（後方互換は「読み側がマージ済み or 追加フィールド」で移行処理ゼロ）
- **P5a 体重＋sRPE**: 正典=bc。コンディションの体重欄保存時に同日bcをupsert（source:'cond'）。finishTrainingで実測 durMin を保存→コンディションのcf-durへプリフィル（fへの自動書込はしない）
- **P5b 欠席統一**: 正典=a。トレーニング「今日は休む」でaもupsert（src:'tlog'＋tlogId参照）。coach集計をa基準へ。a取消で対応tlogも削除
- **P5c 復帰フロー**: approveRTest(staff 6781)成功後にチェックボックス確認「□RTP完全復帰 □怪我resolved □リハ段階完了」→選択分を一括反映。coach怪我詳細にreturnCriteria達成状況＋最新eval要約を読み取り表示。承認ルール明文化（trainer/staff起票=即approved＋approvedBy、player/match起票=要承認。trainer起票時にstaffダッシュボードへ新着チップ）
- **P5d**: 受傷情報1フォーム（i→chartをsvSafeSeqで2キー更新、旧2画面はリダイレクト化）。リハ記録1画面（rlog保存に「臨床評価も記録」折りたたみ→1保存でrlog+evals）。saveQuickEval廃止→フル評価の「クイックモード」トグル。trainerのpp編集ボタン除去（staffのみ編集）。ブロンコ入力をshowPhysForm(mode)に統合

### P6 ダークテーマ移行（player→staff→trainer→coach＋ランディングの順・各1push）
新トークン（player/staff共通・マルーン味ダーク。`/* THEME-TOKENS */`マーカーで囲みmd5照合対象化）:
```
--bg-app:#140A0B  --bg-primary:#1E1113(カード)  --bg-secondary:#28181A  --bg-tertiary:#332022
--text-primary:#F5E9E9  --text-secondary:#C7B0B2  --text-tertiary:#977F82
--border-secondary:rgba(245,233,233,.20)  --border-tertiary:rgba(245,233,233,.09)
--accent:#c1121f(vivid昇格)  --gold-deep:#D9A82E(明度UP)
ステータス色: --blue:#6C9BF2 --green:#3DDC97 --red:#F27B7B --amber:#F2B950 --purple:#B39DF5（bgは透過rgba）
```
- trainer: 同サーフェス＋--accent:#4C8DF5。ブランドトークン＋Google Fonts（Overpass/Zen Kaku）linkを新規追加
- coach: --bg-appを#0D0708系＋--accent緑維持。グラスモーフィズムは資産として残す。ランディングは下部ダーク化＋wave fill差し替え
- 手順（1サイト）: ①:root差し替え→②生hex台帳を4分類処理（ブランド定数=残置/ステータス直書き=var()化/ライト専用サーフェス=ダーク値/Chart.js内JS文字列色=新設`CHT`オブジェクト参照へ）→③darkenForLight を liftForDark 実装に同名差し替え（呼び出し9箇所無傷）・RTP_LEVELS/painColors/RCAT色をtrainer/coach系の値へ4ファイル統一→④残渣grepで機械確認→⑤全タブ読み取り巡回
- player下部ナビとbg-appの境界に--gold-hotの1px border-top

### P7 IA再編
- **P7a playerナビ5タブ化**: ホーム／コンディション（1タップ入力・入力済みなら当日サマリ+編集+過去一覧）／トレーニング／マイデータ（mystatus統合: 先頭NOWセクション=ランク・ベスト・推定1RM・体組成の正典→期間セレクタ→推移分析）／マイページ（プロフィール・設定・通知・入口グリッド）。T.mystatusはgo('mydata')リダイレクトで温存。go()はonclick属性判定(1857-1861)なのでナビHTML(374-377)書き換えで整合
- **P7b ホームのダイエット**（13→7ブロック）: 残す=ヒーロー/今日やること/RTPカード/個人未入力アラート/今週予定/お知らせ/ランキング・バッジリンク。移動=myPhysCard→マイデータNOW、pp→トレーニングタブ、チーム未入力者一覧・測定会あとN名→staffのみ。**怪我クイック報告**: ホーム常設の赤ボタン＋ヘッダー小アイコン（全タブから2タップ以内）
- **P7c**: 測定結果シート「NO SIDE」演出（保存後にランクピッチ＋前回比＋クラブ到達。showTrainingResult 4854「FULL TIME」と対）。トレーニング開始ゲート「今日はしますか?」を初回のみに
- **P7d**: staff=承認導線・ダッシュボード整理・サイドバー22項目グループ再編。trainer=ホーム「担当リハビリ選手」をリハビリタブ導線カード化・コメント欄一本化。coach=概況を「件数＋先頭数件＋タブジャンプ」に絞る・ポジションマトリクスから選手へタップ遷移・未使用キー購読の削減・tla_遅延取得
- 表示重複解消: フィジカルベスト5→2箇所（マイデータNOW正典＋physical入力文脈）、推定1RM 3→2、最新コンディション→コンディションタブのみ、本日リハメニュー→injuryタブのみ

### P8 デザイン仕上げ
- **P8a コンポーネント統一**: .btn/.ipt/.card のpadding・font-size(iptは16px=iOSズーム防止)・角丸・hover/activeを4サイト共通ブロック化。スペーシング4pxグリッド・タイポスケール整理。グラデ10種→3種（maroonヒーロー/goldアクセント/ダーク芝）
- **P8b ピッチモチーフ展開**: rtpPitchHtmlを `pitchProgressHtml(idx,total,labels,opts)` に汎用化＋ナイター芝化（#0F2318→#132B1E）。適用先=playerマイデータのランク進捗／測定結果シート／トレーニング週間ボリューム達成率／staff提出率（提出人数分ボールが進む）／**coach「RTPフィールドマップ」**（1枚のピッチに離脱中全選手を背番号ドットでRTP段階位置に配置=目玉）。trainerにpitch-lines背景＋ghost-num導入。全サイトにghost背番号・kicker斜体英字・Overpass斜体ナンバー統一
- **P8c アニメ標準化**: playerのrv/rv-armed一式(CSS 126-131＋JS 1296-1340)をtrainerへ移植。タップフィードバック共通化。notice-item回転テープ廃止・絵文字装飾→SVGシンボル化。prefers-reduced-motionガード維持

### P9 総仕上げ
- 全テスト（既存40本＋新規）をP0ベースライン比較で全回帰。md5全照合（同期関数＋THEME-TOKENSブロック）。読み取り専用で全サイト全タブ巡回。CLAUDE.md/HANDOFF.md更新（トークンはダーク値・darkenForLight廃止等の新ルール）

## 検証テンプレ（毎フェーズ）

1. script抽出→ `jsc dev/prelude.js <抽出js>`（構文＋ロード）＋括弧バランス検査（Chart.js閉じ括弧事故対策）
2. フェーズ対応の新規テスト＋既存テスト全回帰（P0ベースライン比較・新規失敗ゼロ）
3. 触った同期対象関数のmd5照合（dev/extract.py）
4. new Chart出現数のP0比較
5. ブラウザは読み取り専用巡回のみ（保存ボタンは押さない。書き込み検証は模擬実行が代替）
6. push前に `git diff --stat` で対象外変更ゼロ確認→ユーザー確認→push→Cmd+Shift+R確認依頼

## リスクと回避策

- **本番データ破壊**: svSafe系厳守・追加フィールドのみ・シードsv不可侵・ブラウザ読み取り専用
- **構文事故**: 1機能=1編集=即jsc。アンカー文字列確認後に編集
- **ダーク可読性**: サイト単位1コミット=1発revert可。生hex台帳4分類＋残渣grep機械確認＋全画面目視
- **ユーザー混乱**: 旧タブはリダイレクト温存・T.help同時更新・IA変更とダーク化のpushは別日・夜間push推奨
- **同期漏れ**: フェーズごとに同期対象チェックリスト→P9で全量md5照合

## 重要ファイル

- [player/index.html](player/index.html)（:root 13-28・ナビ374-377・T.home 1898・T.mypage 2200・CRUD雛形2861-3043・tlogアーカイブ4657-4753・finishTraining 4754・rtpPitchHtml 3605・rv 1296-1340）
- [staff/index.html](staff/index.html)（:root 14-28・sv/svSafe 1138-1164・approveInjury 7379・prompt()4箇所・darkenForLight 361）
- [trainer/index.html](trainer/index.html)（:root 10-18・T.tape 1330・goRehabPlayer 2696・Chart.defaults 136）
- [coach/index.html](coach/index.html)（:root 8-24・二重定義1236-1237/2013-2014）
- dev/prelude.js＋dev/test_*.js（検証基盤）、CLAUDE.md/HANDOFF.md（P9更新）

## 監査結果の保管場所

スクラッチパッド `audit_inventories.json / audit_designAudit.json / audit_consistencyAudit.json / audit_dupIntegration.json / audit_uxPlayerFlow.json / audit_uxStaffTrainerFlow.json`（セッション消滅に備え、着手時にHANDOFF.mdへ要点を転記すること）
