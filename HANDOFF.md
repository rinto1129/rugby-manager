# 引き継ぎ書 (HANDOFF)

> このファイルは「会話をクリアしても作業を引き継ぐ」ための申し送り。
> SessionStartフックで新セッション開始時に自動で読み込まれる。
> **作業の区切りごとにClaudeが更新する。** 古い情報は上書きしてよい。

---

## 最終更新
- 日時: 2026-06-27
- 更新者: Claude

## いま何をしているか（現在地）
- **🆕 TimeTree連携プロジェクト進行中（下の「TimeTree連携」節に全体設計）。フェーズ2の第一歩＝「予定の一括インポート」完成＆実機確認済み（ローカルでユーザーがテスト→OK）。** このコミットでpush。次はフェーズ1（プッシュ/プル表示）。
  - **背景の重要事実**: TimeTreeは開発者API終了(2023/12)・購読iCal URL無し＝自動連携手段が無い。そこで「スクショ→LLMで予定テキスト化→サイトに貼り付けインポート」方式（＝案A・インフラ追加ゼロ）を採用。ユーザーは案Aで合意。
  - **今回の実装**: staffカレンダー画面に「📋 一括インポート」新設（`goImportCal`/`parseCalImport`/`renderCalImportPreview`/`doCalImport`＋`detectCalType`/`_normCalDate`、staff:postAnnounceFromCalendar直後）。形式 `日付 | 種別 | タイトル | 時間`（種別・時間省略可、空ならタイトルから自動判定）。プレビュー表で種別修正・行ごと登録ON/OFF・**日付+タイトルで重複排除（再取り込み安全）**。`cal`へ`svSafeUpdate`。
  - **`weight`(ウエイト)種別を新設**: staff色分け(1345/1353=`#F97316`)・ラベル(1354/4680)・フォーム選択肢(calEventFormHTML)・お知らせ(postAnnounceFromCalendar)、player週スケジュールに🏋️(852)。
  - **検証で潰したバグ2件**(JXAモック): ①3カラムの誤読(`date|title|time`を`date|type|title`扱い)→中央が既知種別かつ右にタイトルがある時のみ種別扱いに分岐。②"OFF"がタイトルなのに種別語と一致して空タイトルERR→ガード追加。最終: 6月実データ56件を全て正分類・重複除外・エラー0。
  - **trainer/coachは`cal`表示UIが無い**(grep確認)＝カレンダー反映はstaff(入力)＋player(週表示)のみ。必要なら別途追加。
- **実機スモーク用ローカルサーバ**（必要時）: `python3 -m http.server 8765 --bind 127.0.0.1`（リポジトリ直下で・Bash権限必要）→ Chromeで `http://127.0.0.1:8765/<site>/index.html`。本番Firebaseに繋がり実データで確認できる。
- **（完了）新機能「トレーニング内容の把握」＝staff(`085ea04`)・coach(`4fca6d5`)両方push済み＝完成。** 以下はその実装メモ（履歴）。
- **staff実装内容（push済み `085ea04`）**: `goPlayerDetail` に6つ目のタブ「トレーニング」dt5を新設。
  - 段階1: `goPlayerDetail(pid,openTab)` 2引数化＋冒頭で `_dtPid/_trEx/_trMetric` リセット。`dtTab(5)`→`renderTrainTab()` 描画フック（display:none回避）。`renderTrainingStatus` 行クリック4箇所を `goPlayerDetail(pid,5)` に。
  - 段階2: セッション履歴の折りたたみ展開（`toggleTrSess`/`trSessDetail`）。全セット`重量×回数(RIR)`＋目標差色付け（未達=赤/RIR余裕=黄）＋スキップ理由（痛み怪我=赤）＋当日コンディション。
  - 段階3: 種目セレクタ＋推移グラフ（canvas `ch-tr1rm`/charts key `tr1rm`）。`getCompareVolume`を`_curTLog`非依存に引数化移植→`getCompareEx`。同日集約（トップ=最大/推定1RM=最大/ボリューム=合算）`getExSeries`/`exMetrics`。
  - 段階4: 指標トグル3種（トップセット重量[既定]/推定1RM/ボリューム、estBase無し種目は推定1RM無効）。推定1RMはtlog再計算（候補=RIR記録あり&reps≤6&w>0&rp>0の最大e1RM、候補無し日は点なし）。信頼度マーカー（≤3rep濃radius5/4〜6淡radius4、pointRadius配列）。ph実測1RM水平線（borderDash・軸maxに含める）。実効強度%（トップ÷getBest×100、0除算ガード、100%超=ph更新推奨、測定日併記）。一行サマリー＋前回比/7日比（実日付併記、判断軸=トップ重量＞推定1RM＞＞ボリューム）。
  - staff追加関数（`renderTrainTab`周辺, staff:2652以降）: `renderTrainTab`/`toggleTrSess`/`trSessDetail`/`setTrEx`/`setTrMetric`/`exMetrics`/`getExSeries`/`getCompareEx`/`getExEstBase`/`getBestPh`/`diffArrow`/`trCmpLine`/`drawTrChart`。
- **coach実装内容（未push・検証済み）**: タブ無し縦スクロール構成に合わせて書き直し移植。
  - 既存トレ節（旧coach:580-588「🏋️トレーニング（直近）」）を `buildTrendCoach(pid)`＋`buildHistCoach(pid)` の2カードに差し替え。
  - 入口 `openPlayer(pid)`(coach:346) で `window._trEx=null;window._trMetric='top'` リセット（renderPlayerReportは再描画先でもあるのでここでリセット）。セレクタ/トグル変更は `setTrExC`/`setTrMetricC` が `renderPlayerReport(_detailPid)` 全再構築＋スクロール位置復元。グラフは `renderPlayerReport` 末尾に追加した `setTimeout(...,60)` で `drawTrChartC` 描画（常時表示＝display:none問題なし）。
  - coach配色（青ライン`#4D9FFF`/ph破線`#5E708A`/軸`#93A4BC`/凡例usePointStyle）。当日コンディションは`rpeColor`がcoachに無いため色なしtxt表示。
  - coach追加関数（`backFromReport`直前, coach:640付近）: `exMetrics`/`getExSeries`/`getCompareEx`/`getExEstBase`/`getBestPh`/`diffArrow`/`trCmpLine`/`toggleTrSess`/`setTrExC`/`setTrMetricC`/`buildTrendCoach`/`buildHistCoach`/`trSessDetailC`/`drawTrChartC`。名前衝突なしを確認済み。
- **検証手法**: 当環境にnodeが無いため JXA(`osascript -l JavaScript`)で構文チェック＋実関数をPythonでbrace抽出→Chart/document/Dをモックしてエンドツーエンド実行。staff・coach両方で3指標・estBase無し種目・同日集約・e1RM候補フィルタ・信頼度radii・ph水平線・実効強度・前回比/7日比 すべて期待通り。
- リポジトリ: 最新コミット `085ea04`(staffトレーニングタブ), 2026-06-27。`main`はorigin同期済み。**作業ツリーに coach/index.html（未コミット・本機能の移植）＋このHANDOFF更新＋未追跡`.DS_Store`**。
- （前フェーズ）**一連の信頼性改善＋UIバグ修正は一区切り済み**。
- **直近: 「明日のリハビリ予定が永遠に残る」バグを修正（`78ebfbd`）**。`rplan.tomorrowCats`に対象日が無く、設定すると怪我が回復済になるまで毎日「明日の予定」に出続けていた（リハビリ記録とは別データなので記録削除でも消えない）。staff `saveNextMenu`/trainer `saveNextMenuT` に対象日`tomorrowDate`(設定日の翌日)を付与し、staffダッシュボードのパネルを「本日分/明日分」に振り分け＋対象日を過ぎた分・日付の無い旧データは非表示に。旧データは無害に非表示、再設定で正常化。
- 完了サマリ（すべてpush＋実機確認済み）:
  - **player の主要入力4画面に共通の安全土台を適用**（トレーニング実施 / コンディション / 怪我報告 / フィジカル・体組成）。`guardSubmit`(二重送信ガード)＋`svSafeSeq`/`svSafeUpdate(onError)`(失敗時ボタン復帰＆内容温存)＋`isFilled`(0を弾かない必須チェック)。
  - **0誤検知バグの掃討**: 全サイト調査の結果、数値必須入力を0で誤検知する保存は staff `doAddFatigue` の RPE 1箇所のみ→修正（`commit e54949e`）。trainer/coachは該当なし。
  - **デッドコード削除**: player `doBIG3` / staff `svAll`（全キーblind上書きの火種）（`commit 2f6fd48`）。
  - 過去フェーズ: 素の`sv()`掃討（saveChart, `dd4d415`）／トレーニング入力ツール刷新（`4517acf`/`74c44d0`）。
  - 検証手法: 当環境にnodeが無いため `osascript -l JavaScript`（JXA）で実コード抽出→モック模擬実行＋テスト選手で実機スモーク。
- テスト用選手「テスト選手」(CTB/1年, note=動作確認用) を本番に1名追加済み（削除可）。

---

## 🆕 TimeTree連携プロジェクト（全体設計）— 進行中

> 「部の予定はTimeTreeに入っている。二重入力せずサイトに反映したい」が出発点。grillingで方向確定。

### 確定した前提（調査結果）
- **TimeTreeから自動でデータを出す手段は実質無い**: 開発者API終了(2023/12/22)・更新される購読iCal URL無し・アプリの外部カレンダー連携はGoogle"取り込み表示"向きで書き出しは不安定/Web版は不可・出回ってる自動同期はDOMスクレイパー(壊れやすい)。
- なので**案A=スクショ起点の貼り付けインポート**を採用（ユーザー合意）。スクショ→LLM(私 or スマホのClaude/ChatGPT)で予定テキスト化→サイトに貼って取り込み。**インフラ追加ゼロ・静的構成のまま・壊れる要素なし**。案B(Googleカレンダーを主管理にして自動)はワークフロー変更が要るので保留。
- **サイトには既に自前カレンダー`cal`がある**（種別: match/practice/off/phys_measure/bronco_measure/other＋今回`weight`追加）。手入力が大変で実質使われていなかった→インポートで起こす。**試合後チェック催促・測定日催促はplayerに実装済み**で、`cal`に試合(match)が入れば自動稼働。

### フェーズ構成
- **フェーズ2（連携の本体）= 予定一括インポート → ✅完成・push済み**（このコミット。現在地節に詳細）。毎月: スクショ→私に渡す→出た予定テキストをstaffの「📋一括インポート」に貼る、で運用。
- **フェーズ1（次にやる）= チーム共通プッシュ/プル表示**【未着手】
  - 確定仕様: **厳密に交互・チーム全員共通(グローバル1列)**。実施日はバラバラ(予定次第)。
  - 実装案: 新短キー(例`pp`)にグローバル状態1件`{type,date}`を`svSafeUpdate`。player/staff/trainerに「次のウエイト: 🟦PUSH」バッジ表示。進行はstaff/trainerの1タップ反転＋「1つ戻す」。
  - **`cal`にウエイト(weight)種別が入った今、発展形**: その日に`cal`のweightイベントがあれば「今日はPUSH」と断定表示、weight日のカウントで自動反転も可能（フル自動化）。プッシュ/プル自体はTimeTreeに書かれてない(「ウエイト①②」のみ)＝サイト側ロジックで持つ、で確定。
- 後フェーズ候補: 画像直アップ全自動(案B/AIキー+サーバーレス必要なので保留)、trainer/coachへのカレンダー表示追加。

---

## 🆕 （完了）新機能：トレーニング内容の把握（staff/coach）— ✅両方push済み

> grilling＋サブエージェント2巡レビューで確定。**この通りに作れば事故らない。** 進め方は「staff先行で5-6段に刻む → 各段で構文チェック＋JXAモック模擬実行 → テスト選手で実機スモーク → push前にユーザー確認 → 最後にcoachへ書き直し移植」。

### 目的
- **主**: 漸進性過負荷の管理（種目ごとに前回/先週から伸びているかを時系列で）。**入口**: 1セッションの中身レビュー（何を何kg×何回×RIRいくつでやったか）。
- 現状 staff/coach は「総ボリューム何kg」しか見えず、中身が一切見えない。そこを埋める。**閲覧のみ・保存処理なし**。

### 重要な前提（実コードの事実 — ここを外すと破綻）
- **player に既に同等の簡易版がある**: `showTrainingHistory`(player:2864)＝種目セレクタ＋ボリューム推移＋20件履歴。新機能はこれの**リッチ版を staff/coach に作る**イメージ。
- **集計の正準ロジックは player にある**: `getCompareVolume`(player:2510)＝前回比/先週比の定義（先週比は「対象日の6日前以前の直近セッション」）。**これを移植して3ファイルで定義一致させる**（CLAUDE.md「1つ直したら揃える」）。
  - ⚠️ ただし `getCompareVolume` は `_curTLog`（入力中の下書きグローバル, 2511-2512）に依存している。staff/coach に `_curTLog` は無い。**ロジックは同一に保ったまま、対象tlogの ts/id/beforeDate を引数で受け取る純関数に書き換えて移植する**（丸コピーは `_curTLog is not defined` で落ちる）。
- **`getE1RMTrend`(player:2927)はコピー禁止**。`D.e1rm`レコード依存で、これは「自己ベスト更新時だけ記録」＝単調増加で後退が見えない。**新機能の推定1RMは tlog から毎回再計算する**（後述）。
- `estimateOneRM`/`RPECHART`/`EST_BASES`/`getBest`/`getPlayer1RM` は**3ファイルにコピー済み**＝移植不要（staff:196-244, coach:158-244）。
- **annotationプラグインは3ファイルとも未ロード**（Chart.js 4.4.1 umdのみ）。水平線は annotation ではなく**通常dataset**で描く。
- player `drawTrainingCharts`(2911)は `dC` 無しで `new Chart` する**悪い手本**。staff/coach は必ず `charts`登録＋`dC()`先行。

### 置き場所
- **staff**: `goPlayerDetail`(2580) に6つ目のタブ「トレーニング」を新設。`goPlayerDetail(pid, openTab)` の2引数化（openTab未指定→基本情報=0にフォールバック。既存の全呼び出しは1引数なので安全）。実施状況一覧(`renderTrainingStatus`:3231)の行クリックはこのトレーニングタブを開いて飛ぶ。
- **coach**: タブ機構が無い（`renderPlayerReport` は1枚の縦スクロール）。**既存トレーニングセクション(coach:580-588)を、グラフ＋折りたたみ履歴に差し替え/拡張（書き直し）**。`$M()`/`ava`/`setTimeout(...,60)`/ダーク配色(ハードコード `#9FB0C8`等)に合わせる。`goPlayerDetail` はcoachに持ち込まない。

### タブ構成（上下2セクション）
**上＝種目推移（漸進性過負荷）**
- 種目セレクタ: その選手が実施した全 `exName` を `trim()` 正規化して集約。初期表示はBIG3(estBaseあり)、無ければ実施最多種目。状態は `window._trEx`/`window._trMetric`。**`goPlayerDetail` 冒頭で必ずリセット**（前選手の種目が残ると空グラフ）。セレクタは `selected` 復元。
- 指標トグル**3種**: 【**トップセット重量(初期表示)** / 推定1RM / ボリューム】。estBase無し種目はトップセット重量＋ボリュームのみ（推定1RM不可）。
- グラフ: カテゴリ軸＋日付ラベル（既存パターン、`date.slice(5)`）。**同日集約**＝トップセット重量:最大／推定1RM:最大／ボリューム:合算。canvas id=`ch-tr1rm`／charts key=`tr1rm`（既存と非衝突）。**指標/種目トグルは毎回 `dC('tr1rm')`→`new Chart` で作り直す**（`.data.datasets` 部分updateは禁止＝累積バグ源）。Y軸は指標で自動レンジ（kg系とボリュームを混ぜない）。
- **推定1RM**: tlog から再計算。候補セット=「`rir!=null` かつ `reps<=6` かつ `weight>0 && reps>0`」の中の**最大e1RM**（`estimateOneRM`）。**候補が無い日は点を打たない**（`spanGaps:true` で線をつなぐ or 点のみ。全null時は「記録なし」フォールバック）。理由: `estimateOneRM` は rir=null を RIR0(限界)扱いし過大評価する／高レップは推定が不安定。reps≤6に確定（≤8に緩めない）。
- **e1RM信頼度マーカー**: 採用セットのレップ数で区別（`reps<=3`=濃/通常、`4..6`=淡）。`pointRadius`/`pointBackgroundColor` を**配列**で渡す（Chart.js 4.x可）。
- **実測1RM(ph)水平線重畳**: 重量/推定1RM指標の時のみ、その種目の実測1RM(`getBest(pid,estBase)`)を**全ラベル同値の通常dataset**（`pointRadius:0`,`borderDash:[6,4]`）で重ねる。**その時は軸maxにph値を含める**（見切れ防止）。
- **実効強度%**: `トップセット重量 ÷ getBest(pid,estBase) × 100`。**`getBest` の null/0 ガード必須（0除算回避）**。phの**測定日を併記**。**100%超は異常値**＝グレー＋「ph更新推奨」表示（古いph由来の嘘を防ぐ）。ph無しは非表示。
- **種目別一行サマリー**: 「種目名: トップセット±Xkg / 推定1RM±Xkg / ボリューム傾向」。
- **前回比/7日比**: 前回比＝同一種目の直近過去セッション比。7日比＝6日前以前の直近（`getCompareVolume`のweekロジック）。**比較対象の実日付を併記**「7日比 +5kg(6/19比)」。
- **判断軸の優先順位を明示**: トップセット重量差 ＞ 推定1RM差 ＞＞ ボリューム傾向。**ボリューム傾向は矢印(↑↓→)のみ・数値を強調しない＋「※ウォームアップ込み参考値」明示**（アップ増減でボリュームが±数百kg動き偽トレンドになるため。トップセット重量はアップの影響ゼロ＝一次情報）。

**下＝セッション履歴（入口B）**
- 折りたたみ式。各行: 日付・メニュー名・種目数・総ボリューム・怪我バッジ。欠席ログは「欠席」表示（既存踏襲）。直近20件＋「もっと見る」。
- 展開で: 種目ごとに全セット `重量×回数 (RIR)`＋目標差（目標回数未達=赤／設定RIRより余裕=黄。`finishTraining`のアラート計算を踏襲）＋スキップ種目はグレー＋理由（「痛み・怪我」は赤強調）＋当日コンディション(RPE/睡眠 from `D.f`)を小さく添える。
- ボリューム表示に「※ウォームアップ込み」注釈。

### 共通の防御・作法（エンジニアレビュー反映）
- pid比較は `idEq` 統一（`===` 混在を避ける）。
- 集計から **skippedセット・absentセッションを除外**。`menuId` null（削除済みメニュー）は `mn?...:'メニュー'` でガード（coach:584手本）。
- 空配列／null値（weight・reps が 0 になり得る）／0除算／単一データ点（点表示で見せる）／`exName` の `trim()` 正規化、をすべてガード。
- staff: **dt5(トレーニングタブ)は pushView の fn 一括描画に入れない**。`dtTab(5)` が呼ばれた瞬間に `dC('tr1rm')`→描画する（display:none中の0高さ描画を回避）。`openTab`指定時は pushView の fn(setTimeout後) 内で `dtTab(openTab)` を呼ぶ。dt5を離れて戻った時も `dC`先行で毎回描画。
- coach: 常時表示の縦積み（display:none問題なし）。`renderPlayerReport` 末尾の `setTimeout(...,60)` に新チャート描画を追加。セレクタ変更は `renderPlayerReport(pid)` 全再構築 or `dC('tr1rm')`+該当canvasのみ、どちらも可。

### スコープ（初版に入れる／後フェーズ）
- **初版に入れる**: 上記すべて（3指標トグル・tlog再計算e1RM・信頼度マーカー・ph水平線・実効強度%・一行サマリー・前回比/7日比＋実日付・折りたたみ履歴・ウォームアップ注釈）。
- **後フェーズ（確定）**: working set volume集計（トップ重量90%以上のセットのみ）、本格ACWR/週ボリューム急増フラグ、停滞/後退の自動判定、種目名エイリアス統合、コンディション相関、種目別ボリュームの週次集計。

### レビュー結論
- プロトレーナー役: **最終Go**（漸進性過負荷の管理に必要な最小を満たし、数値が読み手を誤誘導する経路は塞がれた／科学的な嘘なし）。
- シニアエンジニア役: **着手OK**（🔴×3・🟠×2 すべてコードと整合する形で反映済み。残るは`getCompareVolume`移植時の`_curTLog`引数化という実装手順の留意のみ）。

---

## 完了タスクの記録（このフェーズの足跡）
- ~~素の `sv()` 掃討~~ → **完了（dd4d415）**。task_c3a91936 のチップは解消済み。
- ~~実機スモーク（フェーズ1）~~ → **完了（2026-06-26）**。テスト選手でA〜E全項目パス（プリセット入力・0kg/0回保存・連打ガード・通信断時の温存＆ボタン復帰・端末跨ぎ下書き復元）。
- ~~他入力画面の刷新~~ → **完了**。同じ安全土台で コンディション入力 → 怪我報告 → フィジカル/体組成 を順次適用（下記✅群）。共通ヘルパー(`isFilled`/`svSafeSeq`/`guardSubmit`)はplayerに整備済み。staff/trainer/coachへのフルセット横展開はユーザー判断で**保留**。
   - ✅ **コンディション入力（player）完了・push済み（commit b9fb119, 2026-06-26）**: `doCondition`(新規)・`doEditCondition`(修正)に guardSubmit＋失敗時ボタン復帰＆内容温存＋`isFilled`範囲(1〜10)チェックを適用。`svSafeUpdate`に後方互換のオプション第4引数`onError`を追加（既存3引数呼び出しは挙動不変）。`delCondition`は既に安全。モック新規16/16・修正12/12パス。
   - ✅ **怪我報告（player）完了・push済み（commit f3c3569, 2026-06-26）**: `doInjuryReport`(player:2124)の `if(!pain)` を `isFilled+範囲(1〜10)`チェックへ（0/空の誤検知を解消）。guardSubmit/releaseSubmitで二重送信ガード、`svSafe`ネスト→`svSafeSeq([i,r])`で失敗捕捉＆ボタン復帰＆内容温存。ボタンは`doInjuryReport(this)`。JXAモック6ケース全パス（空/0/11弾く・1/5成功でi→r保存・失敗でボタン復帰＆温存）。**実機スモーク未実施**。
   - ✅ **フィジカル/体組成入力（player）完了・push済み（commit ec3c2f5, 2026-06-26）**: 新規保存`doPhys`/`doBronco`/`doBCInput`を`svSafe`→`svSafeSeq`＋guardSubmit＋失敗onError(ボタン復帰＆温存)へ。編集`doEditPhysRec`/`doEditBC`の`svSafeUpdate`にguardSubmit＋onError追加（doEditPhysRecの記録不在分岐もボタン復帰）。`doBCInput`の`if(!w)`→`isFilled(w)&&w>0`。全ボタンに`this`付与。JXAモック14/14パス。**実機スモーク未実施**。
     - 補足: `doBIG3`(player:1346, svSafe残存)はonclickの無い**デッドコード**。今回未着手＝掃除候補。
   - ✅ **4サイト横展開＝0誤検知バグのみ修正で完了・push済み（commit e54949e, 2026-06-26）**。**ユーザー判断でフルセット横展開（guardSubmit/svSafeSeq/onError）は保留**、0誤検知バグのみピンポイント修正する方針に決定。
     - 調査結論: 数値必須入力を0で誤検知する保存バリデーションは **staff `doAddFatigue`(2533) の RPE 1箇所のみ**。`if(!rpe)`→`if(Number.isNaN(rpe)||rpe<1||rpe>10)`（staffにisFilled無いためNumber.isNaNでインライン）。JXAモック6/6パス。**実機スモーク未実施**。
     - trainer/coachには該当0誤検知なし。coachは保存処理ゼロ＝閲覧専用で対象外。staffの他`if(!x)`はpid/date/name等の文字列・ID系で誤検知ではない。
     - 保留メモ: staff(保存74箇所)/trainer(15箇所)に共通安全土台(guardSubmit等)を入れる横展開は未着手。必要になれば再開（trainer→staffの順、機能グループ単位推奨）。
   - ✅ **デッドコード削除・push済み（commit 2f6fd48, 2026-06-26）**: player `doBIG3`（onclick参照ゼロ）／staff `svAll`（全キーblind上書きの事故の火種・呼び出し元ゼロ）を削除。両ファイル構文OK。staff:2665のコメントにsvAll廃止理由が残る（履歴として温存）。

## ⚠️ 重大バグを発見・修正（2026-06-25）— 選手名簿の全消し事故
- 症状: REST APIでテスト選手を追加(74名)→約2分後に72名へ巻き戻り（既存「確認用」も巻き添え）。
- 原因: `staff/index.html` 起動処理。Firestoreの`p`取得が失敗/空/キャッシュミスだと `D.p` がINIT(72)のままになり、`if(D.p===INIT)sv('p')` が名簿をINIT(72)で**丸ごと上書き**していた。`sv()`は素の全上書きなので、読み込み失敗した端末がこれを実行すると本番名簿が消える。
- 修正(commit 3c3bc82): 取得成功フラグ `pDocPresent` を追加し、`if(D.p===INIT&&pDocPresent===false)sv('p')` に変更。**docが本当に不在の初回だけ種まき。読み込み失敗(null)や既存(true)では絶対に書かない。** JXAで4/4検証。
- 同種の危険が残存（別タスク化済み task_c3a91936）: `staff:1594` と `trainer:398` の saveChart に `injId` 無し時フォールバックの素の `sv('chart')`。svSafeUpdateへ要置換。
- 教訓: 素の `sv(k)` はどこにあっても全消しの火種。CLAUDE.md「保存は必ずsvSafe/svSafeUpdate」を全ファイルで徹底すべき（残りの素sv呼び出しを掃討する価値あり）。
- 復旧: テスト選手は修正push後に再追加し73名で安定確認済み。本番72名は無傷だった（消えたのはテスト用2件のみ）。

## ⚠️ 上書き事故の二次被害＝PIN消失と部分復旧（2026-06-25）
- PINは選手レコード内 `p.pin` に保存（player/index.html `doSetupPIN` が `latest[idx].pin` を svSafeUpdate）。INIT72名にはpin無し→**全上書きで全員PINが消えた**。
- バックアップ機構は手動JSONダウンロードのみ（`staff` の「CSV出力」画面下部 `exportAllJSON`）。**自動サーバーバックアップ無し／無料プランに版履歴無し**＝自動復元不可。
- 私が事故前(07:47)に取得していたスナップショット `/tmp/p_doc.json` から、当時PIN設定済みだった実在3名を復元: 前原 泰生(4649)/片島 大悟(1149)/森 泰造(0810)。確認用(1129)はテスト選手で消滅済み。
- 復元は「現在データをGET→該当3名にpin付与（既にpin有りなら尊重して上書きしない）→PATCH」の安全マージで実施。橋本 拓也(0425、事故後に本人が新規設定)は保持。現在PIN保持4名で安定。
- **未復旧の可能性**: 07:47〜22:30の間に他選手がPIN設定していた分はスナップショットに無く復元不可。ユーザーに手動バックアップ有無を確認中→ユーザーが今バックアップ取得予定。
- 再発防止: ユーザーへ「定期的に手動JSONバックアップ」を推奨済み。

## 実装済み（フェーズ1・player/index.html）
- **ステップ1 共通安全土台**（svSafeUpdate直後 446付近）: `isFilled()`(0を弾かない) / `svSafeSeq()`(複数レコード順次安全保存・部分成功通知) / `guardSubmit()`/`releaseSubmit()`(二重送信ガード)。純関数で後で他3サイトへ横展開可。
- **ステップ3 finishTraining堅牢化**: `_curTLog`非破壊（クリーンコピー保存）／片側だけ入力セットは確認ダイアログ・全空は無言除外／実質空は確認／`guardSubmit`＋`svSafeSeq(tlog→e1rm)`／tlog成功時のみ`clearTDraft`／失敗時は`_curTLog`・下書き温存＋ボタン復帰＋平易なalert。0kg/0回も有効値として保存可に。記録ボタンは`finishTraining(this)`。
- **ステップ2 下書き二層化**: localStorage即時＋Firestore`tdraft`間引き同期(3sデバウンス＋visibilitychangeでflush)。`tdraft`は選手ごと1件・`{pid,draft,updatedAt}`配列。**リスナーは張らない**（入力中の他端末上書き防止）。同期失敗は静かに無視（localStorageが信頼層）。`beginTrainingExec`はローカル優先→無ければクラウドfallbackで端末跨ぎ復元（📡別端末から引き継ぎ表示）。`clearTDraft`はローカル＋クラウド両方から自分を削除（他選手温存）。

## 計画フェーズ1の確定方針（grillingで決定）
1. 既存ファイルを段階的に作り替え（データ層=短いキー/svSafe/Firestoreスキーマは維持）。最優先は信頼性。
2. 先に共通の安全土台を整備: `isFilled()`(0を弾かない必須チェック) / `svSafeSeq()`(複数レコード順次安全保存) / `guardSubmit()`(二重送信ガード)。
3. 最初の対象画面 = トレーニング実施記録。
4. 未入力セットは保存前に確認ダイアログ（黙って捨てない）。
5. 下書きは localStorage＋Firestore(`tdraft`)併用（書込は間引き）。
6. UIは全種目1画面スクロール維持＋入力部品(±ステッパー/前回値ワンタップ)とデザイン刷新。
7. 検証 = 模擬実行＋テスト用選手1名で実機スモーク（本番データに触れない）。

## アスリートレビューの結論（条件付きGo）— 実装前に計画へ反映を検討
- 🔴 **計画の事実誤り**: 「`numStep`/`numStepHTML`(1217)を重量ステッパーに再利用」は不正確。
  `numStep`は`parseInt`＋整数`±dir`で **2.5kg刻み・小数に非対応**。step対応の改修が必須。
- 🔴 **オフライン耐性が最優先（計画に未定義）**: ジムWi-Fi弱前提なのに`svSafe`の圏外挙動が未定義。
  「保存中…」で固まり未保存→離脱が最悪。タイムアウト＋失敗時ローカル確定＋復帰時自動同期＋「未同期N件」可視化を
  ステップ1に格上げすべき。
- 🟠 確認ダイアログは「片方だけ入力」限定に（全空は黙って除外＋結果に注記）。初期セット行を減らし空セット自体を作らない。
- 🟠 重量は±ステッパーをやめ「前回値／+2.5／+5」ワンタッププリセット（`prevEx` 2304活用）。回数・RIRのみステッパー。タップ領域44px+。
- 🟠 下書きに `updatedAt` を持たせる: 同日同メニュー2回(実コード2203の日付+menuId判定)/古い下書き/複数端末 での誤復元・無言上書きを防ぐ。
- 🟠 ウォームアップセットの扱い未定義（推定1RM/ボリュームが汚れる）。
- 🟠 リマインド/通知ゼロ＝そもそも開かない問題。LINE運用等で別途明記。
- ◎ 良い点: 信頼性＞見た目の明言／データ層不触／破壊的変換をやめてクリーンコピー保存(2545地雷を撃ち抜く)／段階反映。

## 現状調査で判明した実コードの不具合源（player/index.html）→ **全て対応済み**
- かつての不具合源（`finishTraining`連打でtlog重複／片側入力セットの無言破棄＋`_curTLog`破壊／下書きlocalStorageのみ＋`tdraft`未使用／`if(!rpe)`/`if(!pain)`/`if(!w)`の0誤検知）は、上記✅群（フェーズ1＋安全土台適用＋0誤検知掃討）で**すべて修正済み**。
- 残す教訓: 数値必須入力は `if(!x)` ではなく `isFilled`（player）/ `Number.isNaN`＋範囲チェック（staff）で判定する。リスナーは入力中フォーム/サブビュー保護(447-464)を壊さないこと。

## 直近で完了したこと（新しい順）
- `78ebfbd` 「明日のリハビリ予定が永遠に残る」バグ修正（staff/trainer、tomorrowDateで日付振り分け）。
- `2f6fd48` デッドコード削除（player `doBIG3` / staff `svAll`）。
- `e54949e` staff `doAddFatigue` の RPE 0誤検知バグ修正。
- `ec3c2f5` フィジカル/体組成入力（player）に安全土台適用。
- `f3c3569` 怪我報告（player）に安全土台適用（pain0誤検知修正含む）。
- `b9fb119` コンディション入力（player）に安全土台適用。
- `dd4d415` 素の `sv()` 掃討（saveChart）＋PreCompactフック追加。
- `4517acf`/`74c44d0` フェーズ1（トレーニング入力ツール刷新）。

## リポジトリの状態
- ブランチ: main（origin/main と同期済み）。
- 作業ツリー: クリーン（未追跡の `.DS_Store` のみ。無視してよい）。
- 直近push: `085ea04`(staffトレーニングタブ) → `4fca6d5`(coach移植) → 予定一括インポート＋weight種別(TimeTree連携フェーズ2)。

## 次の一手
- **最優先＝TimeTree連携フェーズ1「チーム共通プッシュ/プル表示」**（仕様は上の「TimeTree連携」節）。厳密交互・チーム共通・新キー`pp`・player/staff/trainerにバッジ＋1タップ反転。`cal`のweightイベントで「今日は」自動表示も狙える。
- 一括インポートの運用: 毎月スクショを私に渡す→出た予定テキストをstaff「📋一括インポート」に貼る。形式は `日付 | 種別 | タイトル | 時間`。
- その他（任意・保留中の候補）:
  - TimeTree連携の発展: 画像直アップ全自動(案B・AIキー+無料サーバーレス必要)、trainer/coachにカレンダー表示追加。
  - （任意・保留中）フルセット横展開 — player で固めた `guardSubmit`/`svSafeSeq`/`svSafeUpdate(onError)` を staff/trainer に反映。trainer(15箇所)→staff(74箇所)の順。**ユーザー判断で現在は保留**。
  - 定期的な手動JSONバックアップの継続（staff「CSV出力」画面下部 `exportAllJSON`。PIN消失事故の再発防止）。
- 着手時の作法: 1機能ずつ → 構文チェック → JXAモック模擬実行 → ユーザー確認の上で git push。
- 残課題メモ（明日のリハビリ予定バグ `78ebfbd` 関連、任意）:
  - **選手ごとの表示**（staff:1036 の「次回:」/ trainer:845「本日のメニュー」等）は今も `tomorrowCats` を日付フィルタ無しで表示する。単一選手の文脈なので実害は小さく今回はスコープ外。気になれば対象日表示や期限切れ非表示を検討。
  - 旧 `rplan`（`tomorrowDate` 無し）はDBに残るが**非表示なだけで無害**。実際に予定を出したい選手は「次回メニュー」を再設定すれば翌日分として正しく出る。

## 運用ルール（このプロジェクト固有）
- データは「短いキー」で読む。保存は `svSafe` / `svSafeUpdate` を使う。
- 1機能ずつ → 構文チェック → 動作確認 → 次へ。まとめて変更しない。
- git push の前は必ずユーザーに確認。それ以外の局所的・可逆な作業は確認不要で進める。
- 詳細は `CLAUDE.md` を参照（最重要ガイド）。
