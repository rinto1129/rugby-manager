# 引き継ぎ書 (HANDOFF)

> このファイルは「会話をクリアしても作業を引き継ぐ」ための申し送り。
> SessionStartフックで新セッション開始時に自動で読み込まれる。
> **作業の区切りごとにClaudeが更新する。** 古い情報は上書きしてよい。

---

## 最終更新
- 日時: 2026-07-05
- 更新者: Claude

## 🔴 次セッションが最初にやること（ユーザー指示・最優先）
- **🚨🚨🚨 最優先・このセッションで最初にやること＝push（ユーザー承認済み「pushしていいよ！」2026-07-05）。** ユーザーはこの直前に会話をクリアした。残っている未pushは**怪我×リハビリ連携 Phase2「不足ゲージ」の変更3ファイルだけ**（`staff/index.html` / `trainer/index.html` / `HANDOFF.md`）。`git log origin/main..HEAD` は空＝過去の全作業(trainer 9ステップ等)はコミット a320d54 で既にpush済み、今回のPhase2だけが作業ツリーに未コミットで残っている状態。
  - **手順**: `git add staff/index.html trainer/index.html HANDOFF.md` → commit（メッセージ例「怪我×リハビリ連携 Phase2: カルテ評価タブに不足ゲージ(純SVGネオンリング)追加・staff/trainer共通19関数バイト一致」）→ `git push`。**`.DS_Store` と `.claude/launch.json` はコミットしない**（macOSゴミ / ローカルのプレビュー設定）。git add に上記3ファイルだけを明示指定すれば混入しない。
  - **push後**: GitHub Pages反映（数十秒〜数分）を待ち、ユーザーに Cmd+Shift+R で staff/trainer のカルテ「📊評価」タブを開いて不足ゲージの実機確認を促す（このMacはsandbox制約でpreview不可＝Claude側では実機確認できない、既知の環境制約）。Phase2の実装内容・検証状況は下の「✅✅ 怪我×リハビリ連携 Phase2」ログ参照。
- **🆕 ユーザー方針が確定: 「実装は全部済ませてから、pushは最後に一気に行う」。実機確認・push・ユーザーへの逐一確認は全部保留したまま、こちらの判断で実装をどんどん進めてよい（「あなたの判断で続けていいよ」を明示承認済み）。次にやること・やる順序の選定もこちらに委ねられている。** push/実機確認だけは必ず最後にまとめて行う（それまでは作業ツリーが未コミットのまま積み上がる想定＝正常）。
- **🎉🎉 trainer「ガイド付き評価フロー」9ステップ＝①〜⑨全完走（planファイル`4-player-staff-trainer-coach-1-ux-merry-harbor.md`末尾「実装順序（3体統合・確定案）」参照）。全て実装完了・検証済み・未push・未実機確認。以下は各ステップの実装ログ（時系列）。⑨後半のsupervised二層化だけ「凛人がORTHO_SOLO_OKにテスト名を追記して単独可を仕分ける」臨床TODOが残るが、既定＝全テスト監督下で安全に動作する（詳細は⑨のログ参照）。次はplayer 3系デザイン等の他保留か、実機確認＋push（ユーザー判断）。**
- **✅✅ 怪我×リハビリ連携 Phase2「不足ゲージ」完了・検証済み・未push・未実機確認（2026-07-05・このセッション）。** プラン`/Users/nakayamarinnin/.claude/plans/wise-drifting-moonbeam.md`通りに実装。staff＋trainer両方のカルテ「📊評価」タブ冒頭に、`chart.metrics`(Phase1)の達成率%・「あと◯◯」を**Chart.js不使用の純SVGネオンリング**で可視化（読み取り＋描画のみ・書込ゼロ）。
  - **移植（staffへverbatim・バイト一致）**: `metricEvalRef`/`readEvalMetric`/`latestEvalForMetric`/`symPct`/`metricSeries`/`sparklineSVG`をtrainerから移植（staffの`toggleConcussion`直後に「追跡指標ヘルパー」ブロックとして追加）。
  - **新設（両ファイルにバイト一致で追加）12関数**: `fmtNum`(小数1桁末尾0除去)/`daysBetween`/`latestHealthyForMetric`(健側最新)/`oldestPatientForMetric`(受傷前=最古患側)/`normalForMetric`(EVAL_MASTER.rom引き)/`resolveMetricBase`(基準解決:🎯手動目標→baseMode→フォールバック健側→正常値→受傷前→null)/`gaugeCalc`(達成率+あと◯◯・direction補正・分母0/非有限/null全ガード)/`gaugeColor`(≧90緑/60-89青/<60アンバー)/`gaugeSVG`(円形ネオンリング・弧0-100クランプ・%は実数・drop-shadowグロー・色はCSS変数で両テーマ自動適応)/`renderMMTDots`(MMT段階ドット・最新mmt eval・健側マーカー)/`deficitGaugeCard`(1指標カード)/`renderDeficitGauges`(セクション本体)。**19関数すべてstaff/trainerでバイト一致をdiff確認済み**。
  - **配線**: staff`renderChartEval`(冒頭`renderChartMetrics`の直前に`h+=renderDeficitGauges(iid)`)／trainer`renderChartEval`(脳震盪/禁忌バナー直後・新規評価ボタンの前)。`renderDeficitGauges`は`ch.isConcussion`と`metrics`空で`''`返し。
  - **設計判断**: プランは「グラデ(accent→purple)」を指定していたが、gradientの`stop-color`にCSS変数を使うとブラウザ差でライト/ダーク非適応の恐れ→**リングは実績のある`stroke=var(--色)`単色＋drop-shadowグロー**にし、達成率の色分け(緑/青/アンバー)を優先（既存スパークラインの終点ドット`fill=var()`と同じ実績パターン）。数値差ROM/周径は向き不定なのでスパークラインは`m.direction`基準で色付け（up/down）。
  - **既知の限界（プラン記載どおり温存）**: circ指標(evalKey無し)はstaffフル評価の`ev.circ[名前]`ではなく`fit['m_'+id]`(trainerクイック評価経由)を読む＝Phase1からの既存挙動。e1rm/BIG3自動取込・mmtTargets/romLimit UIはPhase3。
  - **検証済み**: JXA構文チェック両ファイルOK。共有19関数バイト一致確認。JXAモック(`scratchpad/gauge_test.js`)**47アサート全パス**——gaugeCalc全ガード(up/down/分母0/cur0/base0/null/over100 reached)・resolveMetricBase全分岐(target優先/手動baseValue/健側/正常値EVAL_MASTER引き/受傷前oldest/モード失敗→フォールバック/全滅null)・direction=downで反転しない・symPct/normalForMetric/daysBetween/fmtNum・gaugeSVG(75%/null表示—)/gaugeColor帯・renderDeficitGauges(脳震盪''・metrics空''・フル生成でSVG/%/あと/出所ラベル/LSI/期限/MMT・XSS`<script>`無害化・未測定カード・基準未設定カード・oldget到達時「初回値に到達・手動目標推奨」)。実出力HTMLも目視で整形式・値整合を確認。**実機ブラウザ確認は未実施**（このMacのsandbox制約でpreview不可＝既知の環境制約、方針どおり最後にまとめる）。
  - **ステップ①「実バグバンチ」完了・未push・未実機確認（2026-07-05）：**
  - **T1-1** imgFindings.join crash（staff/trainer同時）: `ch.medical.imgFindings`はtextarea由来の文字列なのに`.join('・')`していた→`Array.isArray`分岐に修正（旧配列データ互換込み）。staff:1784/trainer:1280付近。
  - **T1-2** タイムラインdesc+title二重エスケージ（staff/trainer同時）: 組み立て時に既にescapeHtml済みのdesc/titleを描画時に再度escapeHtmlしタグが文字化けしていた→描画時のescapeHtmlを除去。staff:1868-1869/trainer:1364-1365。組み立て側が全項目escapeHtml済みであることをコード確認済み（SOAP著者名・note・rtpObj等）。
  - **T1-3** trainer「回復済みにする」の`popView()`未定義クラッシュ: AT役指摘の通り、popViewを実装する（＝見習いがワンタップで怪我を回復確定できる危険機能を完成させる）のではなく、`resolveInj`自体を`goEditInjury`/`deleteInjury`と同じstaff権限スタブ（alert）に変更。呼び出し側の`;popView()`も除去。trainer:417,1428。
  - **T1-12** trainer「痛み:undefined/10」表示: `lastLog.pain`（rlogにtop-levelでは存在しない）を参照していた→`lastLog.preCheck&&lastLog.preCheck.pain!=null`に修正。trainer:1079（リハビリ一覧カード）。
  - **T4-5** trainer復帰テストのデッドエンド: テンプレ未設定時に警告のみで戻るボタンが無かった→`goRehabPlayer(injId)`への戻るボタンを追加。trainer:2214付近。
  - **T4-6** trainer段階タイムラインの視認性: ラベル8px→10px、「本日のメニュー未設定」（ホーム画面, 唯一のTo-Do手がかり）を`--text-tertiary`11px→`--amber`太字12pxに変更。trainer:1969-1970,931。
  - **rlogの日付欠損ソートガード**（staff/trainer）: `b.date.localeCompare(a.date)`はdate欠損レコードでTypeError→`(b.date||"").localeCompare(a.date||"")`に統一。正規表現で「rlogをl.injIdでfilterした直後のsort」だけに絞って一括置換（trainer4箇所・staff5箇所、他コレクションのソートは対象外＝スコープ外の変更をしていない）。
  - **検証済み**: JXA構文チェック両ファイルOK。JXAモック12項目全パス（imgFindings文字列/配列両対応・二重エスケージ解消かつタグ意図通り描画・resolveInjスタブがD.iを変更しない・pain undefined解消かつpain=0も表示される・rlogソートがdate欠損でも例外なし）。**実機ブラウザ確認は未実施**（このMacのsandbox制約でpreview_start不可、既知の環境制約。ローカルサーバー`python3 -m http.server`で次回確認可）。
  - **ステップ②「安全土台の移植」完了・未push・未実機確認（2026-07-05・このセッション）**（trainer単独）:
    - `isFilled`/`guardSubmit`/`releaseSubmit`/`svSafeSeq`をplayerからそのまま移植（trainer:635-680付近）。`svSafeUpdate`に後方互換の第4引数`onError`を追加（player方式と同一、既存3引数呼び出しは挙動不変）。
    - **trDoAddInjury**（怪我+リハビリ登録）: `svSafe`ネスト→`svSafeSeq([i,r])`＋guardSubmit＋失敗時releaseSubmit。ボタンは`trDoAddInjury(this)`。
    - **doSaveRehabLogTrainer**（リハビリ実施記録）: guardSubmit追加。`svSafe`は失敗時にボタン固着するため`svSafeSeq([{k:'rlog',rec:...}])`に変更。ボタン2箇所とも`,this`追加。
    - **doSaveRTest**（復帰テスト結果）: 同様にguardSubmit＋`svSafe`→`svSafeSeq`。
    - **saveTapeRec**（テーピング記録）: guardSubmit＋`svSafeUpdate`の第4引数onErrorで失敗時releaseSubmit。
    - **doTapeSetup**（テーピング枠一括作成）: guardSubmit＋同上。合わせて成功時/キャンセル時の`T.tape()`直呼び2箇所を`go('tape')`に統一（T1-13と共通の理由）。
    - **T1-13**: `showTapeSetupForm`の先頭に`window._subViewActive=true`を追加（サブ画面11関数中これだけ保護漏れだった）。
    - **T1-14**: `SK`定義から`tmenu`/`tlog`/`texlist`/`e1rm`を除外（trainer内で一切読まれないことをgrep確認済み。`ld()`/`startListeners()`は`Object.keys(SK)`駆動なので両方から自動的に購読除外される）。
    - **検証済み**: JXA構文チェックOK。JXAモック18項目全パス（guardSubmit二重ブロック・releaseSubmit復帰・svSafeSeq成功時の順次コミット・svSafeSeq途中失敗時に後続が保存されずonErrorに正しい失敗アイテムが渡る・svSafeUpdateのonErrorでボタンが復帰する・連打で2回目のsvSafeSeqが起動しない、を確認）。**モック実行はJXA(osascript -l JavaScript)の非同期Promise未flush問題を回避するため、実際のFirestore Promiseの代わりに同期thenableで検証**（ロジックは実コードと同一、Promiseの非同期性のみ差し替え）。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
  - **ステップ③「即効UX」完了・未push・未実機確認（2026-07-05・このセッション）**（trainer単独）:
    - **T3-1**: `.ipt`のfont-size 13px→16px（iOS強制ズーム対策、trainer:35）。カルテ評価フォームのROM入力(`type="text"`、trainer:1626)に`inputmode="decimal"`を追加。
    - **T3-2**: `.btn-back`のCSS定義を新設（trainer:35付近。従来は未定義でホーム画面の「← ホーム」ボタンが完全に無装飾のプレーンテキストだった。カルテ評価/SOAPの`btn btn-back`は元々`.btn`にフォールバックし正常だったので実害なし・変更不要と確認）。
    - **T4-1**: trainerにログイン永続化を追加（player方式を移植）。`login(tid)`成功時に`localStorage.setItem('rm_my_trainer_id',tid)`、`logout()`で削除。新設`showAutoLoginConfirmT`/`confirmAutoLoginT`/`rejectAutoLoginT`で「あなたは○○さんですか？」の確認画面を経由し、**PINの再入力なしに**ログインできる（player同様、確認タップは必須＝他人の端末で誤って入力される事故を防止）。初期化フロー末尾の`ld().then(...)`で`showLogin()`直呼びだった箇所を、保存済みtrainer_idがあれば`showAutoLoginConfirmT`へ分岐するよう変更。
    - **検証済み**: JXA構文チェックOK。JXAモック17項目全パス（正しいPINでのログイン成功時にlocalStorage保存・誤PINでは保存も遷移もしない・logoutで削除・自動ログイン確認画面は対象トレーナー名を表示するだけでまだログインしない・確認タップでPIN無しログイン成功・「違うトレーナー」で保存クリア＋通常一覧に戻る・保存済みidが不明/削除済みトレーナーでもクラッシュせず通常一覧にフォールバック、を確認）。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
  - **ステップ④「安全ゲート」完了・未push・未実機確認（2026-07-05・このセッション）**（trainer単独）:
    - **脳震盪バナー**: `renderChartOverview`（概要タブ、開いて即目に入る場所）と`renderChartEval`（評価タブ）の両方に、`ch.isConcussion`時は「🧠脳震盪として登録されています。数値評価・整形外科的テストの対象外です。GRTP(症状ベース・24時間ルール)で管理してください」の警告バナーを追加（staffの追跡指標タブと同文言）。
    - **評価フォーム差し替え**: `showEvalForm`で`ch.isConcussion`時に整形外科的テスト欄(`em.ortho`。脳震盪SCAT評価/平衡感覚テスト等が「陰性/陽性/疑陽性」の二値プルダウンとして並んでいた)を丸ごと非表示に。頭部は元々ROM/MMT/周径が空配列なのでこれで数値評価系は全滅、残る痛み(pain)・特記症状(special＝頭痛/めまい/吐き気/光過敏/音過敏/集中困難)・所見メモだけで記録する形になる（新データ構造は追加していない。`saveEval`は`.ev-ortho`要素が無ければ空`{}`のまま保存されるだけで安全）。
    - **禁忌情報の表示**: `INJ_TEMPLATES[ch.injType].contra`（ACLのグラフト保護期禁忌等）を概要タブ・評価タブに表示（脳震盪バナーと排他、非脳震盪かつinjType設定済みの時のみ）。`ch.romLimit`は**staff側にも設定UIが一切無く**(Phase3未着手のデータモデルのみ)常に無効値のまま＝今表示しても常に「制限なし」にしかならないため対象外（Phase3でstaffに設定UIができた時に合わせて対応）。
    - **resolveInj**: T1-3で既にstaff権限スタブ化済み（AT役推奨の2案のうち「スタブ化」を採用済み・再対応不要）。
    - **setRtpLevel**: 変更前に`confirm('練習参加レベルを「X」に変更しますか？選手・スタッフ全員に共有されます')`を追加。確定時に`ch.rtpLevelDate`(今日の日付)・`ch.rtpLevelBy`(myTrainer.name)を記録（従来は誰がいつ変えたか一切残らなかった＝T5-2）。
    - **changeStage**: 変更前に進む/戻るで文言を変えたconfirmを追加。確定時に`rh.stageDates[]`(既存)に加え`rh.stageBy[]`（新設、段階indexごとに実施者名を記録）を追加。
    - **staffの同名関数は変更していない**: staffには個人トレーナーIDに相当する識別子（`myTrainer`相当）が存在せず「実施者記録」を意味あるものにできないため、この安全ゲートはtrainer固有の課題として扱った（見習いトレーナーの単独判断への説明責任がT5-1/T5-2の本題）。
    - **検証済み**: JXA構文チェックOK。JXAモック22項目全パス（setRtpLevel/changeStageのキャンセル時は保存されない・確定時に文言とrtpLevelDate/rtpLevelBy/stageDates/stageByが正しく記録される・changeStageの範囲外deltaはconfirmすら出ない・脳震盪時はcontraバナーでなく脳震盪バナーが優先される・非脳震盪時はcontraバナーのみ・injType未設定/未知のinjTypeでもクラッシュせずバナー無し・脳震盪時はortho欄が完全に消える・非脳震盪の膝等は従来通りortho欄が出る）。**残る既知の限界（バグではなく仕様上の前提）**: `isConcussion`フラグ自体はstaffが追跡指標タブでチェックを入れて初めて立つため、フラグを立て忘れた頭部外傷は今まで通りSCATが通常テストとして表示される—根本解消にはT2-1のガイド付きウィザード側で「部位=頭部」なら初期段階で脳震盪確認を挟む設計が必要（今回はplan通りT5対応のみ、ウィザード本体はステップ⑤以降）。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
  - **✅ T1-15（preCheckのエスケープ漏れ）完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ステップ⑤の前提バグ。`rom-joint`（placeholder「関節名」）・`str-name`（placeholder「測定部位・種目」）・カスタム種目`crit-name`は全てトレーナーの**自由入力**なのでHTMLを含みうるのに、renderRehab/記録履歴の描画で`escapeHtml`が不統一だった（`s.name`だけ2103で既にエスケープ済み、`r.joint`/`e.name`は素通し）。同一関数・同一XSS/表示崩れバグ種別なので「1つ直したら揃える」で6箇所まとめて修正: `r.joint`×3（2102前回評価/2156フォームROMラベル前回値/2210記録履歴）・`e.name`×2（2113前回記録の実施内容/2215記録履歴の未実施側。実施済み側は元々エスケープ済み）・`s.name`×1（2161フォーム筋力ラベル前回値。2103は既済み）。`angle`/`value`は`collectPreCheck`が`parseFloat`+`isNaN`ガードで常に数値なので対象外。検証済み: JXA構文OK＋モックで`<img onerror>`/`膝<b>屈曲`/`ベンチ"プレス<script>`が全て`&lt;`等に無害化され日本語・数値は保持されることを確認。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
  - **✅ ステップ⑤-a「今日の変化チェック（安全ゲート）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ユーザーが「安全ゲートから着手（推奨）」を選択。ステップ⑤の最初の一手として、AT役が最重要とした安全機能（T5-4レッドフラグへの反応ゼロの解決）を先行実装。
    - **配置**: `goRehabPlayer`内、段階タイムラインの直後・前回記録の直前（リハビリ画面を開いて最初に目に入る位置）。3問「前回より痛みが増えた／夜間痛がある／腫れ・熱感が増えた」を はい/いいえ トグルで回答。
    - **中断ゲート**: 全3問回答後にのみ判定を出す（回答途中は「残り◯問」表示で早まった判定を出さない）。全ていいえ→緑「特記事項なし・続けてOK」。1つでもはい→赤「今日は中断してください」＋該当フラグ列挙＋`escalateChgChk`で**ワンタップでスタッフに連絡**（injcomm接続。定型文「⚠️【要確認・実施前チェック】〜。本日のリハビリを中断し、スタッフの指示を仰ぎます。（トレーナー名）」を投稿→スタッフ画面の3者間コメントに即共有）。連絡後は「📨連絡しました・指示があるまで中断」表示に差し替え、画面内のinjcommリストも即更新。
    - **新規関数3つ**（`collectPreCheck`直後）: `setChgChk(key,val,injId)`（回答保存＋はい=赤/いいえ=緑のボタン装飾＋結果エリア再描画）／`renderChgChkGate(injId)`（判定HTML生成・純粋）／`escalateChgChk(injId,btn)`（guardSubmit二重送信ガード＋injcomm投稿＋失敗時releaseSubmit＆温存alert＋未ログイン/空フラグ拒否）。状態は`window._chgChk={pain,night,swell}`（`goRehabPlayer`のセクション描画直前で毎回リセット＝怪我/セッションごとに初期化）。
    - **今回のスコープ外（意図的）**: 記録フォーム本体の保存経路への機械的ブロックは未実装（見習いが誤って進めないよう視覚的に強く誘導する設計に留める）。変化チェック結果のchart.evalsへの保存も未実装（この増分は「気づき→エスカレーション」のMVP。injcommに永続記録は残る）。保存経路統合は後続のクイック評価本体（痛み＋★指標）で対応予定。
    - **検証済み**: JXA構文OK＋モック（`/tmp/chgchk_all.js`、セッション終了で消える一時ファイル）で確認——全null→残り3問／2答→残り1問／回答途中は判定を出さない／全No→緑・escalateボタン無し／1つでもYes→赤＋該当フラグのみ列挙（無関係フラグは出ない）＋escalateボタン／setChgChkがボタン装飾（はい=赤枠/いいえ=緑枠・切替で相互リセット）／escalate正常投稿でinjcomm1件・role=trainer・injId一致・両フラグと著者名入り・成功後resultが連絡済み表示／二重送信ブロック／空フラグ拒否／通信失敗でボタン復帰＋未投稿＋alert／未ログイン拒否。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
  - **✅ ステップ⑤-b「痛み＋★重要指標（クイック評価）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: `chart.metrics`（Phase1でstaffが設定した追跡指標）連動のクイック評価UIを`goRehabPlayer`に新設。
    - **配置/分岐**: `goRehabPlayer`の評価入力ブロックを、`getChart(injId).isConcussion`が**falseならクイック評価カード**（`renderQuickEvalCard`）、**trueなら従来の自由入力式「実施前チェック」**（脳震盪は数値評価対象外なので所見メモ主体・後方互換で温存）に分岐。trainer:2155-2190。
    - **クイック評価カード**: ①評価日 ②痛みレベル（運動時0〜10スライダー・前回値を初期表示だが**動かさない限り保存しない**＝前回値複製事故T4-3の防止／前回比の差分色）③各`chart.metrics`について患側入力＋（`m.lsi`なら）健側入力。前回値はplaceholder＋ラベルにゴースト表示（入力値には入れない）。差分色は`metric.direction`基準（up=増で改善/down=減で改善）。lsi指標は**左右比%を即時表示**（`symPct`＝direction考慮の対称性%・0除算/NaN/Infガード・≧90%緑✓）④メモ。指標未設定の怪我は「スタッフが🎯追跡指標を設定すると並びます」の案内。
    - **保存**: `saveQuickEval`＝guardSubmit＋`_chartIdx`で**操作単位でchart.evalsに新規evalを追記**（他端末のeval/metricsを巻き戻さない）。値のマッピングは`metricEvalRef`：rom(evalKey)→`rec.rom/romH[evalKey]`（文字列）、circ(evalKey)→`rec.circ/circH[evalKey]`（数値）、fitness/strength/evalKey無し→`rec.fit/fitH['m_'+id]`（数値）。痛みは`rec.pain.motion`（既存の痛み推移グラフ・概要「最新痛み」がそのまま読む）。eval id形式は既存`saveEval`と同一（`Date.now()+'_'+rand`）＋`source:'quick'`。空`{}`は書かない（chart肥大抑制）。痛みも指標も未入力ならalertで拒否。
    - **UX**: 保存後は緑の完了サマリー（「痛み○/10 ・ 指標○○ (+差分色)」＋「N項目が前回より改善🎉」）を`qe-result`に表示、ボタン復帰。**同日下書き**をlocalStorage(`rm_qe_<injId>`)に自動保存（入力のたび）・再描画/再訪で復元（別日の放置下書きは無視）・保存成功で削除。
    - **読み手**: 前回値は`latestEvalForMetric`（date→inputAtの2段ソートで最新の患側値を持つevalを探索）／`latestPainVal`（motion優先→全PAIN_TYPESのmax）でchart.evalsから解決。旧rlog.preCheckの「前回の記録」表示は非脳震盪では`preCheck`がnullになるだけで無害（履歴カードは従来通り旧データを表示）。
    - **検証済み**: JXA構文チェックOK＋モック**76アサート全パス**（`scratchpad/qe_mock.js`=42件＝ref/symPct全分岐・latestEvalForMetric/latestPainValのソート・saveQuickEndToEndでrom/circ/fit/健側/痛みmoved有無/未入力alert/strength→fit/連打busyブロック、`scratchpad/qe_render.js`=34件＝renderの各要素/no-metrics案内/ゴースト/lsiチップ/下書き復元（同日のみ）/XSS無害化/qeUpdateMetric・qeUpdatePainのライブ差分色・左右比・movedフラグ）。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
    - **今回のスコープ外（意図的）**: リハビリ実施記録（種目・rlog保存）は従来通り別ボタンで独立（評価=chart.evals正本／実施=rlogの分離を維持）。ミニスパークライン（プランのネオン見せ場）は未実装。staff側の同UI（フル評価フォームは既存のまま／クイック評価はtrainer固有）は変更なし。To-Doホーム（ステップ⑦）・フルウィザード（⑧）は未着手。
  - **✅ ステップ⑥-a「ミニスパークライン（ネオン見せ場）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ⑤-bのクイック評価カードに、各★指標と痛みの**推移スパークライン**を追加（planの「ネオン演出の見せ場」＝Chart.js不使用の純SVG。`}}}});`括弧地雷を回避）。
    - **新規ヘルパー4関数**（`symPct`直後・trainer:2466付近）: `metricSeries(evals,m)`＝指定metricの患側値を昇順（date→inputAt）で並べた`[{date,v}]`（値なし/空文字eval除外）／`painSeries(evals)`＝痛みを昇順で（motion優先→無ければ全PAIN_TYPESのmax、空pain除外）／`sparklineSVG(pts,direction,idsfx)`＝純SVG生成（**2点未満は''**＝推移不能、**min==maxは中央水平線**、グラデ青→紫＋glow下地polyline＋エリアfill＋終点ドット、`vector-effect="non-scaling-stroke"`で幅一定、`idsfx`は`[^a-zA-Z0-9_]`除去でサニタイズ＝gradient id衝突防止）／`sparkCaption(pts,direction)`＝「N回 ↗/↘/→」（**矢印は数値の増減＝スパークラインの見た目と一致**、色は`direction`基準で良し悪し＝改善緑/悪化赤/横ばい灰）。終点ドット色も同じ良し悪し基準。
    - **配線**: `renderQuickEvalCard`で、痛みブロック直後に痛みスパークライン（direction='down'）／各指標カードの差分行直後に患側値スパークライン（`m.direction`基準、idsfx=`'m'+index`で card内一意）。いずれも**過去evalが2回以上ある時のみ**表示（それ未満は''で何も出ない＝初回はゴースト前回値表示のみ）。ライブ入力(`qeUpdateMetric/qeUpdatePain`)や下書き復元には非干渉（履歴の静的表示のみ、保存経路も不変）。
    - **設計判断（修正1件）**: 初版は矢印を「改善方向」(improved→↗)で出していたが、スパークライン本体は**生の数値**を描くため痛み52→50で「線は下がるのに矢印↗」と視覚が矛盾。**矢印=数値の増減（線と一致）・色=良し悪し**に統一（`sparkCaption`の`arrow=last>first?'↗':'↘'`）。
    - **検証済み**: JXA構文チェックOK＋モック**31アサート全パス**（`scratchpad/spark_mock.js`=20件＝metricSeries昇順/同日2件保持/空欠損除外・circ/fit格納先追跡・painSeries motion優先/max/除外・sparklineSVG空1点で''/2点でsvg/direction別終点色（up改善緑・down改善緑・悪化赤）/横ばい青/idsfxサニタイズ/NaN除外/多点、sparkCaption 空1点''/矢印数値方向＋色良し悪しの全組合せ、`scratchpad/qe_render_spark.js`=11件＝renderQuickEvalCard実行でsvg4本（痛み+指標3）・caption4本・↗↘両方・LSI健側欄・保存ボタン配線）＋生成SVGマークアップを目視確認（整形式・値90→95→100→105が右肩上がり・終点緑）。**実機ブラウザ確認は未実施**（sandbox getcwd制約でpreview不可＝既知の環境制約、方針通り最後にまとめる）。
    - **今回のスコープ外**: ⑥のもう半分「preCheck一本化の仕上げ」（履歴カードの読み手をevalsへ移行）は未着手＝旧rlog.preCheck表示は非脳震盪で無害に温存のまま。次はこれ、または⑦To-Doホーム。
  - **✅ ステップ⑥-b「preCheck一本化の仕上げ（履歴カードの読み手をevalsへ）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: `goRehabPlayer`内の2箇所（①「📋前回の記録」カードの「評価」欄／②「記録履歴」の各ログカードの評価行）を、**非脳震盪の怪我では`lastLog.preCheck`ではなく同日の`chart.evals`（クイック評価で保存されたデータ）を参照するよう変更**。⑤-bでクイック評価に切り替えて以降、非脳震盪の新規rlogは`preCheck`が常にnull（`collectPreCheck`は`window._preCheckOpen`必須＝脳震盪画面のトグルでしか立たない）になり、この2箇所の「評価」表示が黙って空になっていた回帰を解消。脳震盪の怪我は従来通り`preCheck`のみを参照（分岐変更なし・後方互換）。
    - **配線**: `var _qch=getChart(injId)`を関数冒頭（`rh`取得直後）に移動して両カードから参照可能に（従来はクイック評価入力ブロックの直前でのみ宣言）。新設ヘルパー4つ（`metricEvalRef`の直後）：`sameDayEval(evals,date)`（同日eval群からinputAt降順で最新1件、無ければnull）／`evalPainVal(ev)`（pain.motion）／`evalMetricVals(ch,ev)`（`ch.metrics`のうちevに値がある指標だけ{name,unit,val}で返す）。
    - **「📋前回の記録」カード**: `_qch.isConcussion`なら旧preCheck表示（無変更）、そうでなければ`sameDayEval(_qch.evals,lastLog.date)`で同日クイック評価を探し、あれば「評価（クイック評価）」ボックス（痛み+各指標+メモ）を表示。同日評価が無ければ何も出さない（従来のif(lastLog.preCheck)と同じ「無ければ非表示」の挙動を維持）。
    - **「記録履歴」カード**: 同様に脳震盪はpreCheck、非脳震盪は`sameDayEval`でそのログの日付と同じ日のクイック評価を探して「痛み:X/10 指標名:値単位」の1行を表示（見つからなければ何も出さない＝rlog自体は従来通り表示される）。
    - **今回のスコープ外（意図的）**: rlogとchart.evalsの紐付けは「同じ日付」でのマッチのみ（1日に複数回リハビリを実施し複数回評価した場合、記録履歴カード側は最新の1件のみ表示）。異なる日にクイック評価だけ単独で記録された場合（rlogを保存していない日）はこの2箇所には出ない（クイック評価カード自体のスパークライン/前回値表示で確認可能なため許容）。
    - **検証済み**: JXA構文チェックOK（全文new Function()パース）。ヘルパー4関数を抽出したモック(`scratchpad/eval_mock_test.js`、セッション終了で消える一時ファイル)で**12アサート全パス**——同日に複数評価があれば最新(inputAt)を採用／該当日なしはnull／前回の記録・記録履歴カードとも評価なし日はブロックを出さない／記録履歴カードの行組み立てが期待通り（"痛み:2/10 膝伸展:120° 外果周径:32.5cm"）／脳震盪チャートはevalsが存在してもpreCheck経路のみを通りevals経路には行かない（分岐の排他性）／指標名・単位のHTMLエスケープ。**実機ブラウザ確認は未実施**（環境制約は他ステップと同じ）。
  - **✅ ステップ⑦「To-Doドリブンホーム（バッジ1個ルール）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: プラン確定版の項目8「To-Doバッジは1カード1個（最優先のみ）」を実装。ホームの「🩹担当リハビリ選手」カードの下段（従来は`tomorrowCats`チップ or「本日のメニュー未設定」テキストのみ）を、優先度付きバッジ1個に統一。
    - **新規ヘルパー2つ**（`tapeSlotBooked`直後・trainer:942付近）: `trTodoBadge(inj)`＝優先順位🔴(脳震盪/レッドフラグ未対応/評価空きすぎ14日+)→🟡(評価期限7日+)→🔵(本日メニュー未設定)→🟣(復帰テスト目前=stage フルコンタクトかつrtest未実施)→🟢(今日は記録済み)で最初に該当した1件のみ`{rank,cls,emoji,label,action}`を返す（該当なしはnull）。`action`は`'chart'|'menu'|'rtest'|'rehab'`のタグのみ保持（関数参照を直接持たせない設計、onclick文字列に安全に埋め込める）。`trBadgeGo(action,injId)`＝タグから実画面へ遷移するディスパッチャ（chart→`openChart`／menu→`goSetNextMenuT`／rtest→`goRTestRecord`／既定→`goRehabPlayer`）。
    - **レッドフラグ判定**: ステップ⑤-aで実装済みの`escalateChgChk`投稿（injcommに`role:'trainer'`＋text先頭`'⚠️【要確認・実施前チェック】'`で保存）を利用。**そのinjIdの最新injcommが上記の形のトレーナー発メッセージのままなら「未対応」と判定**（スタッフ/選手からの返信が1件でも後に付けば自動的に解除される。永続の解決済みフラグを新設していない＝既存データ構造のみで成立）。
    - **評価空き日数**: `getChart(inj.id).evals`の最新`date`（無ければ受傷日`inj.date`）から`todayStr()`までの日数。14日以上=🔴「評価が◯日空いています」、7〜13日=🟡「評価期限：前回から◯日」。
    - **復帰テスト目前**: `D.r`の`stage===STG.length-2`（＝フルコンタクト、次が完全復帰）かつ`D.rtest`に該当injIdの記録が1件も無い場合のみ🟣（既存の「🏁復帰テスト状況」セクションは`rtest`が1件でもあれば表示される別枠なので、バッジ側は「まだテストを始めていない」段階だけを補完し重複しない）。
    - **並び替え**: 担当リハビリ選手一覧を`badge.rank`昇順（同rankは受傷日降順）でソートしてから描画＝プラン「レッドフラグ最優先」を一覧の並び自体でも実現（従来はDフィルタ順のまま無秩序だった）。
    - **タップ導線**: カード全体は従来通り`goRehabPlayer`（onclick）。バッジ自体は`event.stopPropagation()`＋`trBadgeGo(action,injId)`で**該当アクション画面に直行**（🧠→カルテ概要／📋→次回メニュー設定フォーム／🏁→復帰テスト記録画面／それ以外→リハビリ画面、はカード全体と同じ遷移だが明示的に同じ関数を通す）。
    - **バッジ無し時のフォールバック**: メニュー設定済み・復帰テスト該当なし・本日未記録の「平常運転」ケースは従来通り`tomorrowCats`チップ表示に戻す（情報損失なし）。
    - **検証済み**: JXA構文チェックOK（全文new Function()パース）。`trTodoBadge`/`trBadgeGo`を抽出したモック(`scratchpad/mock_todo_badge.js`、セッション終了で消える一時ファイル)で**15アサート全パス**——脳震盪最優先／レッドフラグ未対応の検知＋スタッフ返信後の解除／評価空き14日以上で赤・7〜13日で黄（日数計算含む）／メニュー未設定で青／フルコンタクト+rtest未実施で紫／rtest実施済みなら紫を出さず今日記録済みなら緑／全部該当なしはnull／ディスパッチャが4種のアクションタグを正しい関数に振り分け／rank昇順ソート。**実機ブラウザ確認は未実施**（環境制約は他ステップと同じ）。
    - **今回のスコープ外（意図的）**: リハビリ管理タブ（一覧・検索付き、trainer:1155付近）の同種カードには今回バッジを適用していない（ホームのTo-Doドリブン化がプランの主眼のため。適用するなら`trTodoBadge`はそのまま再利用可能）。
  - **✅ T1-8（実施記録の種目名をDOMのstyle属性で拾っている）完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ステップ⑧「フル評価セクション型ウィザード」着手前の前提修正（プラン記載通り）。`doSaveRehabLogTrainer`(trainer:2972)が`exDiv.querySelector('span[style*="font-size:13px"]')`/`span[style*="border-radius:99px"]'`で種目名・カテゴリをDOMから拾っており、**見た目のフォントサイズを1つ変えるだけで種目名が静かに空文字保存になる**危険な状態だった。修正: 種目行`#rl-ex-{ei}`の外側divに`data-name`/`data-cat`属性（escapeHtml済み値）を追加し、保存関数側は`exDiv.dataset.name`/`exDiv.dataset.cat`を読むだけに変更（querySelectorを完全廃止）。**検証済み**: JXA構文チェックOK。ロジックのみのモック(`scratchpad/mock_t18.js`)4アサート全パス（正常系の名前/カテゴリ取得・要素なしでもクラッシュせず空文字・escapeHtml書込→dataset読取のラウンドトリップで特殊文字が壊れないこと）。**実機ブラウザ確認は未実施**（環境制約は他ステップと同じ）。
    - **副次発見（今回はスコープ外・spawn_taskで別途フラグ済み）**: staff/index.html(4462-4469)の同名機能（研修記録保存）にも全く同じパターンの脆弱なquerySelector-by-styleがある。trainer専用のT1-8としてplanに載っていたため今回はtrainerのみ修正。別タスクとして切り出し済み（task_1557b0c2）。
  - **✅ ステップ⑧-a「フル評価セクション型ウィザード（骨組み）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: カルテ「📊評価」タブの「＋新しい評価を記録する」で開くフル評価フォーム（`showEvalForm`）を、平坦な1画面フォームから**セクション型ウィザード**に全面書き換え。見習いが「何から・どの順で入力するか」で迷わないための誘導UI。
    - **順序変更（プラン項目4）**: 旧`痛み→ROM→MMT→周径→テスト→症状→所見`を、臨床の侵襲が少ない順`①痛み→②周径(腫脹)→③ROM→④筋力→⑤テスト→⑥症状→⑦所見`に。周径をROM前に出したのは「その日どこまで押してよいか」の判断材料になるため。**部位に応じて動的生成**（該当項目がある部位だけ並ぶ＝膝は7セクション、頭部/脳震盪は痛み/症状/所見の3セクションのみ・テスト非表示）。
    - **UI**: `chart-body`上部に**sticky進捗チップ**（番号+ラベルの横スクロール行。`top`はアプリ`.header`高さを実測して設定、z-index50で既存ヘッダー[z100]の直下に固定）＋**アコーディオン式セクション**（アクティブ1つだけ展開、他は折り畳み。ヘッダー/チップどちらのタップでも`evGoSec(i)`で移動）。各非最終セクションに「次へ▶」ボタン＝自動スクロール。保存ボタンは常時最下部に到達可能。
    - **状態不滅の肝**: `evGoSec(n,noScroll)`は**再描画せず`display`トグルのみ**＝折り畳み中のセクションも入力DOMが生きたまま（`saveEval`の`querySelectorAll('.ev-*')`はdisplay:none要素も拾えるので全項目保存される）。チップは`i<n`=done(✓緑)/`i===n`=active(青)/`i>n`=future(muted)で進捗表示。初期化は`setTimeout(30ms)`で`evGoSec(0,true)`＝ジャンプ抑止。新規追加関数は`evGoSec`のみ（`showEvalForm`直後、trainer:1812）。
    - **guardSubmit移植（プラン項目10の前提）**: `saveEval`に第3引数`btn`を追加、`svSafeUpdate`直前に`guardSubmit`、失敗時は第4引数`onError`で`releaseSubmit`＋温存alert。保存ボタンは`saveEval(iid,evalId,this)`で`this`を渡す（**guardSubmitはbtn無しだとfalseを返し保存中断するので、呼び出し側は必ずthisを渡すこと**）。連打複製（新規evalは毎回別idでpushされ複製される）を解消。
    - **⑤-bクイック評価との棲み分け**: クイック評価（`renderQuickEvalCard`、goRehabPlayer内）=日次の痛み+★指標。フル評価（`showEvalForm`、カルテ評価タブ）=週1の全項目再評価。両者は別物・別画面のまま（今回はフル評価のみ改修、クイック評価は無変更）。
    - **今回のスコープ外（意図的・⑧-b以降）**: 各項目の**前回値ゴースト表示＋direction基準の差分色**（フル評価のem.rom[].k/em.mmt/em.circキーはクイック評価の★metric.idとは別体系なので専用の前回値解決ヘルパーが要る）／ミニスパークライン／完了サマリー演出は未実装。整形テストの**二層化(supervised)タグ＋「未実施」明示選択肢**とSOAP自動下書きは**ステップ⑨**（テスト欄には「自信がなければ空欄=未実施のまま/迷ったらスタッフへ」の注意文だけ先行追加済み）。
    - **検証済み**: JavaScriptCoreパースOK（script全文`new Function`）。括弧バランスはHEADと完全同一（既知の正規表現リテラル誤検知＝私の変更由来でないことを確認）。抽出モック(`scratchpad/harness.js`、セッション終了で消える一時ファイル)で**40アサート全パス**——膝ACLで7セクション正順生成/脳震盪頭部は3セクション&テスト非表示&脳震盪バナー/編集モードで痛み・ROM・メモ全プリフィル&保存ボタンが`saveEval(3,'e1',this)`/禁忌バナー表示/`evGoSec`が表示を1セクションに絞る&done/active/futureチップ&chev▾▸&scrollTo有無(noScroll)&範囲外クランプ/`saveEval`のguardSubmitが連打・btn無しをブロック&onErrorでbtn復帰+温存alert&onDoneでchartTab('eval')。**実機ブラウザ確認は未実施**（このMacのsandbox制約でpreview不可＝既知の環境制約、方針通り最後にまとめる）。
  - **✅ ステップ⑧-b「フル評価の前回値ゴースト＋差分色＋スパークライン＋完了サマリー」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ⑧-aで骨組み化した`showEvalForm`の各数値セクション（痛み/周径/ROM/筋力）に、⑤-b譲りの前回値ゴースト・ライブ差分・ミニスパークラインを展開。
    - **direction（良し悪し）の扱いが肝**: EVAL_MASTERのrom/mmt/circには`direction`が無く、しかも`膝伸展 normal:0`・`腰前屈 normal:指床間(cm)`・周径（腫脹↔筋萎縮）など**向きが部位で反転しうる**。この体系で良し悪しを断定するのは臨床的に危険（⑤-bクイック評価が良し悪し色を出せるのはstaffが指標ごとに`direction`を明示設定しているから）。→**痛み(一律down=少ないほど良い)・筋力MMT(一律up=強いほど良い・順序型)だけ緑赤で改善/悪化を色分け**し、**ROM・周径は良し悪しを断定せず数値差＋矢印のみニュートラル（灰色）**表示にした。
    - **共有ヘルパー拡張**（後方互換）: `sparklineSVG`/`sparkCaption`に`direction==='none'`分岐を追加＝終点ドット・キャプション色を常にニュートラル（青/灰）に。⑤-bは'up'/'down'しか渡さないので挙動不変。
    - **新規ヘルパー5つ**（`evGoSec`直後・saveEvalの直前）: `evPrevVal(evals,kind,key,excludeId)`＝編集中evalを除いた直近の生値{v,date}（date→inputAt降順探索、空文字スキップ）／`evSeriesFull(evals,kind,key)`＝昇順の数値時系列（mmtは`MMT_ORDER` index、他parseFloat、非数値除外）＝スパークライン用／`evLiveDiff(el)`＝入力のたびdata-*（prev/dir/unit/ord/diff）から前回比を表示（`data-dir='none'`は灰色数値のみ・`data-ord='1'`はMMT段数差）／`evImprovementSummary(evals,entered,excludeId)`＝**痛み・筋力だけ**を対象に改善数集計（ROM/周径は向き不定なので数えない）／`showEvalSavedBanner(html)`＝評価タブ先頭に緑バナーを差し込み4.5秒でフェードアウト。
    - **フォーム改修**: `showEvalForm`の4セクション（PAIN_TYPES/em.circ/em.rom/em.mmt）を、各フィールドにラベル内ゴースト（前回値）＋input（data-prev/dir/unit/diff＋oninput/onchange=evLiveDiff）＋差分span（`evd-<kind>-<i>`）＋過去2回以上あればスパークライン、を並べる形に。既存の保存経路（`.ev-pain`等のclass/data-k）は不変＝`saveEval`は無改造で全項目拾える。
    - **完了サマリー**: `saveEval`でguardSubmit前に`evImprovementSummary`を計算（保存前の直近evalと今回入力を比較、編集時は自身除外）→onDoneで`chartTab('eval')`後に`showEvalSavedBanner('✅ 評価を保存しました'＋改善あれば「痛み・筋力で N項目が前回より改善🎉」)`。
    - **検証済み**: JavaScriptCoreパースOK（script全文`new Function`）。抽出モック2本全パス——`scratchpad/test_8b_full.js`=**35アサート**（evPrevVal最新/編集除外/空文字スキップ/欠損null・evSeriesFull昇順/mmt index/非数値除外・evImprovementSummaryが痛みdown/筋力upのみ集計しROM/circは数えない＋編集除外＋前回なしtotal0・sparklineSVG/sparkCaptionのnone=ニュートラル色/up増=緑/down減=緑/2点未満空・evLiveDiffの痛み改善緑/悪化赤/ROMニュートラル無判定/MMT段数差改善/前回なし空/±0）、`scratchpad/test_render_8b_full.js`=**18アサート**（膝ACLで`showEvalForm`が例外なく完走・前回ゴースト4種・差分span id 4種・スパークライン4本以上・oninput/onchange配線・禁忌バナー・保存ボタン`saveEval(1,null,this)`・data-dir none/down/ord=1）。**実機ブラウザ確認は未実施**（このMacのsandbox制約でpreview不可＝既知の環境制約、方針通り最後にまとめる）。
    - **今回のスコープ外（意図的）**: 健側入力欄（`.ev-romH`等）はフル評価フォームにはまだ無い（⑤-bクイック評価側のLSI用。フル評価での健側UIは未実装のまま＝saveEvalは空収集で無害）。整形テスト欄の差分表示は非対象（二値判定＝⑨のsupervised二層化で扱う）。
  - **✅ ステップ⑨（前半＝非臨床の安全部分）完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ⑨の2要素のうち「saveSOAP操作単位化」と「SOAP自動下書き（O欄限定）」を実装。臨床コンテンツ判断が要る「テストガイド二層化(supervisedタグ)」は**凛人と要相談のため未着手**（下記）。
    - **saveSOAP/delSOAP 操作単位化＋guardSubmit**: 従来は`saveChart(ch)`＝chart全体をserver-latestに上書き（同一injId内ロストアップデートの火種＝staff監査S1-3/Phase0で潰した系統の最後の残り）。`saveEval`/`delEval`と同型に書き換え——`svSafeUpdate`＋`_chartIdx`で**server-latestの対象injIdの`soaps`だけ**を触る（他端末のeval/metrics追加を巻き戻さない）。`saveSOAP`にguardSubmit（連打複製防止）＋失敗時onErrorでreleaseSubmit＆温存alertを追加、ボタンは`saveSOAP(iid,soapId,this)`。編集時は`Object.assign(rec,data)`でid保持のまま更新（複製しない）。
    - **SOAP自動下書き（O欄限定）**: 新規SOAP時のみ、`buildSOAPObjectiveDraft(iid)`が**直近evalのpain/rom/mmt/circを整形した文字列**（例「【2026-06-20の評価より】運動時痛4/10、屈曲115°、伸展 MMT4-、膝蓋骨上5cm 39cm。」）を生成→O欄の下に「📥 直近の評価から下書きを挿入」ボタン＋プレビュー表示。`insertSOAPDraft(iid)`は空なら差し込み・既記入なら末尾追記（トレーナーが自由に編集＝あくまで下書き。**測定済み数値の整形のみで臨床判断は一切加えない**＝plan「SOAP自動下書きはO欄限定」に忠実、A/P欄には触れない）。直近evalが無ければボタンごと非表示。
    - **検証済み**: JavaScriptCoreパースOK。抽出モック(`scratchpad/test_soap_full.js`)で**23アサート全パス**——buildSOAPObjectiveDraftが最新eval(e2)採用/pain(motion/press)/rom/mmt/circの整形/末尾「。」/eval無しで''・insertSOAPDraftの空差し込み＆既存追記・saveSOAP新規が既存soapを残して追記かつ**evals不干渉**（操作単位）＆tab遷移・**サーバー側で並行追加されたevalがsaveSOAPで消えない**・編集はid保持で複製しない・guardSubmit連打ブロック・delSOAPが対象だけ削除しevals/他soap温存。**実機ブラウザ確認は未実施**（環境制約は他ステップと同じ）。
  - **✅ ステップ⑨（後半＝supervised二層化・安全側の既定で構造実装）完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ユーザーが「安全側の既定で先に構造だけ実装」を選択（＝どのテストが単独可かの臨床仕分けは凛人が後から）。
    - **新規定数＋ヘルパー**（EVAL_MASTER直後・trainer:417付近）: `var ORTHO_SOLO_OK={}`（空＝**全整形外科的テストが「監督下推奨」の初期状態**）＋`orthoIsSupervised(name){return !ORTHO_SOLO_OK[name];}`。凛人が「見習い単独で確定判定してよい」と決めたテスト名を`ORTHO_SOLO_OK`に`'Neerテスト':true`の形で追記すると、**そのテストだけ🔒バッジが外れる**。テスト名はEVAL_MASTERの各部位`ortho[]`文字列と完全一致必須（コメントに明記）。臨床コンテンツなので中身は空のまま＝勝手に確定していない。
    - **UI**（`showEvalForm`のテストセクション）: 各orthoテストのラベル横に`orthoIsSupervised`がtrueなら`🔒 監督下`のアンバーバッジ。セクション冒頭の注意書きを「🔒監督下のテストは有資格スタッフ立ち会いのもと実施・判定／自信がなければ『未実施』のままでOK／迷ったらスタッフへ」に更新。select先頭の空選択肢を`-`→**`未実施`**に明示リネーム（plan「『未実施』明示選択肢」に対応。value=""は不変＝`saveEval`の`if(e.value!=='')`で従来通り保存されない＝データ挙動は完全不変）。
    - **検証済み**: JavaScriptCoreパースOK。抽出レンダーmock(`scratchpad/test_ortho_full.js`)で**5アサート全パス**——既定で膝の2テスト両方に🔒バッジ／空選択肢が「未実施」表記／`ORTHO_SOLO_OK={'Lachmanテスト':true}`にすると🔒バッジが1個に減りLachmanから外れMcMurrayには残る（バッジ数は`🔒 監督下</span>`で数え、注意書き見出しの同文言と区別）。**実機ブラウザ確認は未実施**（環境制約は他ステップと同じ）。
    - **凛人へのTODO（臨床仕分け・コード変更は不要、定数追記だけ）**: `trainer/index.html`の`ORTHO_SOLO_OK`に、見習いが単独で確定判定してよいテストを追記していく（既定は全て監督下＝安全側）。EVAL_MASTERのortho一覧が対象。**staff側の評価フォームには未反映**（trainer固有UXとして実装。必要ならstaffにも同定数・同バッジを横展開可能だが、staffは有資格者が使う想定なので優先度低）。
  - **🎉 trainer「ガイド付き評価フロー」9ステップ＝全完走（①〜⑨すべて実装完了・検証済み・未push）。** ユーザー要望「見習いが評価で何を・どの順で入力するか分からない状態のサポート」に対する一連の実装が完了。残りは実機ブラウザ確認とpush（方針通り最後にまとめる）。
  - **次の候補（こちらの判断で選んでよい）**: player 3系デザイン（alert()トースト化等）／coachレビュー未適用分（C1〜C8・U3/U9・D1〜D10）／4サイト共通デッドコード削除（1-6/1-9）／怪我×リハビリ連携Phase2（不足ゲージ）。または実機確認＋push（ユーザー判断）。
- **player監査の「実行可能な項目」は事実上完了**: 1-2/2-1・1-5・2-2・1-8・2-6・2-8・2-9・2-11が完了済み（すべて未push・未実機確認、詳細は下の個別ログ）。残る1-7（ヘルパー複製の乖離）は具体的な修正アクションのない設計上の注意点なので単独タスクとしては見送り。1-6/1-9（デッドコード削除）は4サイト監査完了後にまとめる方針、3系（デザイン全般）は別途着手判断が必要。
- **次の選択肢（優先度つき、こちらの判断で選んでよい）**:
  1. staff/trainer側の同種監査項目の実装（staff監査・trainer監査は完了済みだが実装は未着手。特にtrainer「ガイド付き評価フロー」は前々からユーザー期待度が高い保留タスク＝優先候補）。
  2. 4サイト共通のデッドコード削除（1-6/1-9）をここでまとめて着手。
  3. player 3系（デザイン全般、alert()のトースト化等）。
  4. coach全面リニューアル分（未push・詳細下記）をこのタイミングで一緒にpush対象へ含めるかの整理（pushは最後なので判断だけ先にしておくと良い）。
  5. 保留中の別プロジェクト（怪我×リハビリ連携Phase2＝不足ゲージ、TimeTree連携フェーズ1）も選択肢に入る。
- **2-11（オフライン時は「読み込みエラー」で全滅）も完了・検証済み（player/index.html、2026-07-05・このセッション）**:
  - 対応方針（監査時点で確定済みの方針通り）: 保存は全て`db.runTransaction`経由でオフラインでは実行できないため、書込はオンライン必須のまま維持。**enablePersistenceは「閲覧の生存性」目的に限定**して導入。
  - 修正: ファイル末尾の`ld().then(...)`（初期化処理）の直前に`db.enablePersistence().catch(function(e){console.log(...)})`を追加。マルチタブ('failed-precondition')や非対応ブラウザ('unimplemented')では静かに無効のまま通常動作を続ける（エラーを握りつぶして処理続行、他の初期化を止めない）。
  - 副次対応: 「失敗時の入力温存メッセージを全フォームに展開する」の残タスクを洗い出した結果、主要な入力フォーム(condition/phys/bronco/bodycomp/match/weekcheck/rehab/absence/tape/injury/編集系)は既にPhase1〜1-4で対応済みと確認。唯一未対応だった`doPhysSkipWithReason`（測定なし申告）だけが素の`svSafe`(guardSubmit無し・失敗時の温存メッセージ無し)のままだったため、他フォームと同じ`guardSubmit`+`svSafeSeq`+失敗時`releaseSubmit`＆温存メッセージのパターンに合わせて修正。ボタンのonclickも`doPhysSkipWithReason(this)`に変更。
  - 検証済み: JXA構文チェックOK。`doPhysSkipWithReason`をモック実行(`/private/tmp/.../scratchpad/run_mock_2_11.js`、セッション終了で消える一時ファイル)で6項目全パス——通常申告で保存・連打は2回目がブロックされる・保存失敗でボタン復帰＆温存メッセージ・同日申告済みなら二重保存しない。`enablePersistence`自体はFirestore標準API呼び出し1行（実ブラウザでのみ効果を体感できる領域）のため、配置がld()より前であることの確認とJXA構文チェックで担保。
- **2-9（ラベルの不統一）も完了・検証済み（player/index.html、2026-07-05・このセッション）**:
  - フィジカル測定系の表記ゆれ3箇所を「フィジカル測定」に統一: mypageカード(1035行、旧「記録入力」)／遷移先タイトル(1172行、旧「フィジカル記録」)／説明文中の案内(1117行、旧「フィジカル記録」から入力）。homeの文言(866行、元々「フィジカル測定」)に合わせた形。コメント(1555行)も表記統一。**フォーム自体の見出し「📝 記録入力」(1324行)は一覧画面と実入力フォームを画面上で区別する意図があるため意図的に変更していない**（一覧タイトルと入力フォーム見出しが同じ文字列だと二重表示で紛らわしくなるため）。
  - ヘッダーの「選手切替」ボタン(93行)を「ログアウト」に変更。押下時の確認文言は元々「ログアウトしますか？\n次回ログインにはPINが必要です」で、`logout()`の実処理も`myPid`クリア＋PIN再入力必須という**完全なログアウト**だったため、ボタンラベルを実態に合わせた（「切替」という軽い言葉で押すと、実際には再ログインが必要になり驚く、という迷いを解消）。
  - 検証済み: JXA構文チェックOK。純粋な文言差し替えのみ(ロジック変更なし)のため、grepで対象文字列が全て置き換わったこと・意図的に残した1324行以外に旧表記が残っていないことを確認。
- **2-8（未読通知に気づく導線がmypage内バッジのみ）も完了・検証済み（player/index.html、2026-07-05・このセッション）**:
  - 原因: 未読お知らせ・怪我承認通知の🔔バッジ(889行)はmypageを開かないと見えず、home/トレーニング等にいる限り気づけなかった。
  - 修正: 下部ナビ「マイページ」のアイコンに赤い小さいドット(`.nav-dot`、CSS新設)を追加。`updateNavBadge()`を新設し、mypageの🔔バッジと**全く同じ集計式**(`D.ann`の自分宛未読＋`D.i`の`notifyPlayer`true件数)で有無だけを判定して表示/非表示を切り替える。呼び出しタイミングは2箇所: ①`go(tab)`の最後（どのタブへ移動しても最新化）②`startListeners`のonSnapshotで`ann`/`i`キーが変化した時（**タブ移動しなくても他人の操作でリアルタイムに気づける**のが今回の主眼。入力中フォームの保護対象外＝ドットの更新は入力内容に一切触れないため無条件で実行）。
  - 検証済み: JXA構文チェックOK。実ファイルから`updateNavBadge`/`idEq`を抽出したモック(`/private/tmp/.../scratchpad/run_mock_2_8.js`、セッション終了で消える一時ファイル)で8項目全パス——未読お知らせ/怪我承認通知それぞれの表示/非表示切替・既読済みは非表示・他人宛は無視・myPid未設定(ログイン前)は常に非表示・dot要素が無いページでも例外にならない、を確認。**視覚的な見た目（ドットの位置・サイズ）は実機ブラウザでの確認が必要**（このMacのsandbox制約でpreview_start・ローカルサーバー経由のブラウザ自動確認は不可、既知の環境制約）。
- **2-6（同日重複レコード防止）も完了・検証済み（player/index.html、2026-07-05・このセッション）**:
  - 原因: `doCondition`/`doPhys`は同日の既存レコードをチェックせず送信するとそのまま新規保存していた（「✅本日入力済み」表示はあるが送信は素通り）。
  - 修正: 両関数の冒頭（バリデーション直後・guardSubmitより前）に同日重複チェックを追加。`D.f`/`D.ph`から`idEq(r.pid,myPid)&&r.date===dateV`で既存レコードを検索し、あれば`confirm()`で「修正画面を開きますか？」と確認→OKなら`showEditCondition`/`showEditPhysRec`に誘導して新規保存はしない、キャンセルなら何もしない（guardSubmitを通していないのでボタンは何も変化せず、そのまま再入力・再送信も可能）。
  - 副次発見・同時修正: `showEditCondition(fid)`/`showEditPhysRec(phid)`の検索が`r.id===fid`という厳密比較のみだった。しかしmypage(1015行)の「修正」ボタンはonclick文字列に`\''+id+'\'`と埋め込まれるため実際には**文字列型のidが渡る**のに対し、レコードのidは`newId()`由来の数値型＝**型不一致で一致せず、修正ボタンが常に無反応（無言で何も起きない）という既存バグ**だった。`delCondition`等の削除系は元々`String(r.id)===String(fid)`のフォールバックがあり無事だったが、修正系だけ漏れていた。これでは今回追加した「確認→修正画面へ」の誘導自体も機能しないため、`delCondition`と同じ`||String(r.id)===String(fid)`フォールバックを両関数に追加して合わせて解消。
  - 検証済み: JXA構文チェックOK。実ファイルから対象関数(`doCondition`/`doPhys`/`isFilled`/`guardSubmit`/`releaseSubmit`/`idEq`/`newId`/`fmt`/`todayStr`/`getCurrentMSess`/`broncoFromInputs`/`getBest`)をPythonでbrace抽出しJXA上でモック実行(`/private/tmp/.../scratchpad/run_mock_2_6.js`、セッション終了で消える一時ファイル)、14項目全パス——同日記録なしは通常通り新規保存／同日記録あり+OKは修正誘導かつ新規保存されない／同日記録あり+キャンセルは何もしない／他選手の同日記録とは混同しない、をcondition・phys両方で確認。加えてshowEditCondition/showEditPhysRecの型不一致修正も、文字列id・数値idどちらで呼んでも一致することを別途確認。
- **1-8（onSnapshot/ldのparsed検証が緩い）も完了・検証済み（player/staff/trainer 3ファイル同時、2026-07-05・このセッション）**:
  - 原因: `ld()`と`startListeners()`のFirestore読み取りで、選手データ(`p`キー)以外は`Array.isArray`チェックなしに`D[k]=parsed`していた（player:410/509、staff:520/618）。何らかの理由でdocの中身が壊れて配列以外（オブジェクト・文字列・null等）になった場合、そのまま`D[k]`に代入され、以降その画面の`.filter`/`.map`で例外が起き画面全体が死ぬリスクがあった。trainerは一見`Array.isArray`チェック済みに見えたが(582行等)、else分岐`else if(!Array.isArray(parsed))D[k]=parsed;`が**非配列の時だけ代入する**という逆向きのロジックで、実質同じ穴が開いていた。
  - 修正: player/staffの2ファイル4箇所は`else if(k!=='p'&&Array.isArray(parsed))D[k]=parsed;`に変更（非p系キーも配列の時だけ代入。空配列は従来通り代入=許容、非配列は代入しない=拒否、という既存の意図は保ったまま型チェックだけ追加）。trainerの2箇所は不要な逆向きelse分岐を削除するだけで対応（`if(Array.isArray(parsed)&&parsed.length>0)D[k]=parsed;`のみ残す。coach側は元々このパターン=`if(Array.isArray(p))D[k]=p;`で健全だったので手を入れていない）。
  - 検証済み: JXA構文チェック3ファイルともOK。ロジック抜き出しモック(`/private/tmp/.../scratchpad/mock_1_8.js`、セッション終了で消える一時ファイル)で「正常配列は読み込む」「空配列は既存仕様通り(player/staff方式は代入=許容、trainer方式は代入しない=既存仕様)」「壊れたデータ(オブジェクト/文字列/null)はどの方式でも一切Dを上書きしない」を確認。
- **2-2（ログイン後の着地点統一）も完了・検証済み（player/index.html、2026-07-05・このセッション）**: `confirmAutoLogin`（自動ログイン確認、[player/index.html:559](player/index.html:559)）の着地を`go('home')`→`go('mypage')`に変更し、PINログイン`doLogin`（元々mypage着地）と統一。「今日やること」チェックリストがmypageにあるため、毎朝の起動→ホーム→タブ移動→入力という遠回りを1タップ減らせる。呼び出し元は1箇所のみ（自動ログイン確認画面の「✅ はい、私です」ボタン）で他に依存箇所なし。モックで`confirmAutoLogin`後に`curTab==='mypage'`になることを確認済み。
- **1-2/2-1の実装内容（player/index.html、2026-07-05・このセッション）**:
  - 原因: `T.condition()`/`T.physical()`/`T.injury()`/`T.match()`/`T.tape()`/`showFullRanking()`がmypage/homeのカードから`go()`を経由せず直接呼ばれており、`curTab`が更新されない＋`subView`もtrueにならない。この状態で誰かが何か保存する度（27コレクション監視の`startListeners`）、フォーカスが外れた瞬間に`T[curTab]()`（古いタブ）が再実行され画面が強制的に巻き戻っていた。加えて`T.condition()`自身とテーピング予約フォーム`showTapeBookForm()`は「一覧画面」ではなく実入力フォームなのに`subView`保護が無かった（他の入力フォームは`showSub()`経由で保護済み）。
  - 修正: ①mypage/homeの直接呼び出し8箇所を全部`go('condition')`等に変更（`go()`は無改造で汎用対応）。②`showFullRanking()`を`T.ranking`として登録し直し、呼び出し元を`go('ranking')`に変更＋「← ホーム」の戻るボタンを新設（監査2-3も同時解消）。③`T.condition`の先頭に`subView=true`を追加（戻る/保存成功は元々`go('mypage')`済みなので副作用なし）。④`showTapeBookForm`の先頭にも`subView=true`を追加、これに伴い`doTapeBook`/`cancelTapeRsv`内の直接`T.tape()`呼び出し（成功・満枠時双方）を`go('tape')`に変更（**これをしないと`subView`がtrueのまま固着し、以後テーピング一覧が二度とリアルタイム更新されなくなる回帰があった＝実装中に自分で気づいて対処**）。⑤ユーザー承認のうえ、トレーニング実施画面`renderTrainingExec`にも`subView=true`を追加（下書きクッションはあるが、休憩タイマー等が再描画で毎回リセットされる体験上の問題を今回まとめて解消。退出経路はボトムナビの`go()`3つのみで全て`subView`を無条件リセットするため詰みなし）。
  - ハマった点: Edit時に`h+='...'`という単一引用符文字列の中へ`onclick="go('ranking')"`のように**内側の単一引用符をエスケープし忘れ**、文字列が途中終端される構文エラーを作った（JXA `new Function()`で`SyntaxError: Unexpected identifier 'ranking'`として検出）。修正時は必ず`onclick="go(\'tab\')"`の形式で統一すること。既存コードの`showSub`等も同じ規則。
  - 検証済み: JXA構文チェックOK。JXA上でHTML/DOM/firebaseをモックし本物の`player/index.html`を`eval`して実関数を呼ぶ模擬実行スクリプト（`/private/tmp/.../scratchpad/mock_nav.js`、セッション終了で消える一時ファイル）で22項目全パス——`go(condition)`でcurTab同期＋`T.condition`がsubView=trueにする／`go(mypage)`で解除／一覧画面5つ(physical/injury/match/tape/ranking)はcurTabだけ同期しsubViewはfalsyのまま(＝ライブ更新は維持)／rankingに戻るボタンあり／`showTapeBookForm`→`go('tape')`でsubViewが正しく解除／`startTrainingFresh`→`renderTrainingExec`が完走しsubView=true、`go('home')`で強制離脱してもsubViewが必ず解除される／実際の`startListeners`再描画ガード式をそのまま再現し「condition入力中はブロックされる」「injury一覧はライブ更新される」を直接確認。
  - **実機ブラウザ確認は保留中**（ユーザー指示で「一旦クリア」扱い）。ローカルサーバーは`python3 -m http.server 8933 --bind 127.0.0.1`で起動していた（セッション終了で死ぬので次回は再起動）→ `http://127.0.0.1:8933/player/index.html`。確認観点は次回いずれかのタイミングで: ①コンディション入力中に他画面から戻ってこないか②ホームのランキング「全体を見る」→戻るボタンでホームに戻れるか③mypageの各カードタップで正しい画面に飛ぶか④テーピング予約フォームが正常に予約できるか⑤トレーニング実施中に休憩タイマー等が意図せずリセットされないか。
- **1-5（id=Date.now()衝突リスク）も完了・検証済み（player/index.html、2026-07-05・このセッション）**:
  - 原因: 全保存関数が`id:Date.now()`でid採番しており、複数選手が同一ミリ秒に保存すると同一idになる。削除は`latest.filter(r=>r.id!==id)`方式のため、衝突すると**他人の記録も巻き込んで消える**。`doMatch`の`Date.now()+100/+101`、`doInjuryReport`の`injId+1`は「同一呼び出し内の兄弟レコード2つが同じidになる」ことだけを避けるその場しのぎで、**別々の選手同士の衝突には無力**だった。
  - 修正: 共通ヘルパー`function newId(){return Date.now()*1000+Math.floor(Math.random()*1000);}`を新設（[player/index.html:526](player/index.html:526)、`idEq`のすぐ下）。**数値のまま返す**のがポイントで、onclick埋め込み（`'+r.id+'`等の裸の数値埋め込み）や`===`比較を含む既存コードを一切変更せずに使える。`id:Date.now()`だった14箇所全部と、`+100`/`+101`/`+1`のその場しのぎ2箇所を`newId()`に置換。`chart.evals`用の`id:Date.now()+'_'+Math.floor(Math.random()*1000)`（645行・2014行、文字列id）は既存の別方式でPhase0/1で対応済みのため対象外・変更なし。
  - 既知の残課題（次回staff/trainer監査で拾うとよい）: `i`/`r`/`rlog`はstaff/trainerも書き込む共有コレクションだが、今回はplayer側の採番のみ修正。staff/trainer側が素の`Date.now()`のままなら、そちら発のレコードとの衝突リスクは残る（低頻度・低優先度と判断しスコープ外にした）。
  - 検証済み: JXA構文チェックOK。専用モック（`/private/tmp/.../scratchpad/mock_id.js`、runTransaction対応の擬似Firestoreストア込み・セッション終了で消える一時ファイル）で14項目全パス——`newId()`は数値を返しMAX_SAFE_INTEGER以内／連続2回呼び出し（doMatch的な兄弟レコード生成を模した現実的なケース）500試行で衝突0／`doCondition`・`doInjuryReport`（injury+rehabの2レコード同時生成）・`doBronco`を実行し正しくid付きレコードが生成されることを確認／`delPhysRec`が新id方式のレコードを正しく1件だけ削除できることを確認（既存の削除ロジックは無改造で動作）。
  - 補足: 20000回連続呼び出しでの衝突ゼロは最初アサートしたが失敗した（JS的に同一ミリ秒に大量呼び出しが集中し1000通りの乱数枠内で衝突する、いわゆる誕生日問題）。これは実際の本番利用パターン（同一ミリ秒に2人が保存する程度）とは乖離した過剰な負荷テストだったため、アサートを「現実的な2回連続呼び出し」に修正した。衝突確率をゼロにする改修ではなく1/1000に下げる改修である点は要注意（injcommの既存方式と同じ考え方）。
- **まだ未着手（player監査プラン残り）**: 1-6・1-9（デッドコード削除、4サイト監査完了後にまとめる方針）／1-7（ヘルパー複製の乖離、具体アクションなしの注意点）／3系（デザイン全般、alert()多用のトースト化等）。**2系(UX・導線)は全項目完了**（2-1〜2-12まで、詳細は上）。
- **⚠️ 作業ツリーは全部未コミット（2026-07-05時点）。pushはまだしていない（ユーザー指示で最後にまとめる）。**
  - 変更済み: `player/index.html`（CSS層5件＋1-1＋1-4＋1-3の一部＋1-2/2-1＋1-5＋1-8＋2-6＋2-8＋2-9＋2-11）／`staff/index.html`（1-3＋1-8＋T1-1/T1-2＋rlogソートガード）／`trainer/index.html`（1-3＋1-8＋ガイド付き評価フロー ステップ①〜⑦＋ガイド付き評価フロー①〜⑨全完走＝実バグバンチ/安全土台移植/即効UX/安全ゲート/クイック評価/ミニスパークライン/preCheck一本化仕上げ/To-Doホーム/T1-8data属性化/フル評価ウィザード骨組み＋前回値ゴースト・差分色・スパークライン・完了サマリー/SOAP操作単位化＋O欄自動下書き/整形テストsupervised二層化、T1-15エスケープ含む）／`coach/index.html`（前セッションの全面リニューアル、別件・詳細は下）／`HANDOFF.md`。
  - 未追跡（コミット不要）: `.claude/launch.json`（ローカルプレビュー用）／`.DS_Store`。
  - **全部構文チェック済み・mock実行で検証済み。実機ブラウザでの動作確認はまだ（ユーザー指示で保留中）。**
- **既に完了・検証済み（すべて未push）**:
  1. **CSS層5件**（player/index.html）: `.alert-warn`/`.alert-up`定義追加（2-4）／`.card-click`定義追加（2-5、hover+active）／`.ipt`のfont-size 14px→16px（2-12、iOS強制ズーム対策）／表彰台アバターの未定義関数`showOtherPlayer`呼び出しとcursor:pointerを削除（2-10）。
  2. **1-1**（player/index.html）: `T.home`で`yesterdayS2`を定義前に使っていた巻き上げバグを修正（宣言を先頭へ移動）。mypage側の`selectedYesterday`（matchselを`{date,pids}`として誤読）を、実データ形状（pid配列、staff監査で確定済み）に合わせて`(D.matchsel||[]).indexOf(myPid)>=0`に修正。モックで両アラートがtrueになることを確認。
  3. **1-4**（player/index.html）: guardSubmit未適用だった6関数（`doMatch`/`doWeekCheck`/`doRehab`/`doPlayerAbsence`/`doTapeBook`/`savePainSelf`）にguardSubmit＋releaseSubmit（失敗時）を追加。`doMatch`は`svSafe`のi→r→md並行保存を`svSafeSeq`（items配列、怪我時は['i','r','md']順）に統合。`doRehab`/`doWeekCheck`も`svSafe`→`svSafeSeq`に変更（svSafeは失敗時ボタン固着するため）。モックで「連打しても2回目はブロックされる」「怪我ありなしでitems順が正しい」を確認済み。
  4. **1-3**（player/staff/trainer 3ファイル同時）: テーピング予約の空き判定が複数枠予約の**先頭枠(`slotId`)しか見ていない**バグ（2枠目以降が「空き」に誤表示→二重予約可能）を、3ファイル共通ヘルパー`tapeSlotBooked(rsvs,slotId)`（`slotIds`配列全体を見る、旧データは`slotId`にフォールバック）を新設して修正。**player**: `updateTapeSlots`の空き判定＋`doTapeBook`のトランザクション内に**サーバー最新値での枠残数再検証**を追加（クライアント側スナップショットのレース対策）。**staff**: `V.tape`の枠バッジ表示2箇所（S1-12相当）。**trainer**: ホーム今日の予約表示・週間一覧2箇所（+`myRsvs`フィルタもslotIds対応化）。モックで「旧ロジックはslot2の占有を見逃す→新ロジックは検知」「レース再検証で埋まった枠はslotFull判定」を確認済み。
  5. **1-2/2-1**（ナビ経路一本化。詳細は上）。
  6. **1-5**（id衝突リスク。詳細は上）。
- **ローカルプレビュー**: `python3 -m http.server 8933 --bind 127.0.0.1 &`（要Bash権限、cwdはリポジトリ直下）→ `http://127.0.0.1:8933/player/index.html`。**preview_start（Claude Previewツール）はこのMacのsandboxでgetcwd失敗するため使えない**（既知の環境制約、今回も再確認済み。毎回Bash+dangerouslyDisableSandboxで代替）。
- **coach全面リニューアル（前セッション分）は依然未push・ユーザー判断待ち**: 「coachは今の状態でpushする？ それともC1/C2等のレビュー指摘を入れてからpushする？」という質問はまだ回答をもらっていない（今回のセッションではplayer監査の実装に話が流れたため）。次にこの質問をぶり返す必要はない——**ユーザーは「player実装を先に進めて、pushは最後にまとめる」という方針を選んだ**ので、coachの変更もそのタイミングでまとめてpushするかどうかを含めて後で確認すること。詳細は次項に温存。
- **🆕 coach全面リニューアル＋3体レビュー＋ドリルダウン＝完成・検証済み・未push（2026-07-04）。**
  - 作業ツリー状態: 変更=coach/index.html（866→約1500行）とHANDOFF.md。未追跡=.claude/launch.json（ローカルプレビュー用・コミット不要）と.DS_Store。**pushするのは coach/index.html＋HANDOFF.md のみ。**
  - ドリルダウン（ユーザー要望「未測定12名が誰か見たい」）: 考察カードtaップ→該当選手リスト展開→選手tapで個人レポート。開閉状態はinsKey（タイトルの数値除去ハッシュ）＋_insOpen辞書で再描画後も維持。
  - レビュー指摘の即日適用分（約15件）: onSnapshot再描画の嵐修正（変化なし通知スキップ＋300msデバウンス＋noAnim＋スクロール維持）／history API（個人レポート=pushState、iPhoneエッジスワイプで戻れる）／タップターゲット44px／RTP_DARKダーク配色変換（共通定数RTP_LEVELSは不変）／--txt-3コントラストAA化／hover:hover分離＋:active／タブ右端フェード＋activeタブscrollIntoView＋レポート中はタブハイライト解除／2回目以降タブはアニメ省略（_seenTabs）／countUp・リング・バーのnoAnim/reduced-motion即時確定／safe-area対応。
  - 検証済み: JXA構文全ブロックOK／モック46チェックPASS（ドリルダウン開閉・open維持含む）／本番実データREST読取で全6タブ＋全74選手レポートPASS。
  - 3体レビュー全文＋未適用リスト（C1〜C8/U3・U9/D1・D5・D9・D10）= planファイル末尾「coachサイト 3体レビュー」節。**特にC3は実データ裏付きの実害**（受傷299日・309日の消し忘れ怪我が稼働率を歪めている）。C4も実害（コンディション入力は直近6/23で止まっており、毎日入力前提の考察ルールがオオカミ少年化する）。
  - ローカルプレビュー方法: `python3 -m http.server 8931 --bind 0.0.0.0 &` → http://127.0.0.1:8931/coach/index.html （Cmd+Shift+R）。サーバはセッション終了で死ぬので次回は再起動。Chrome拡張のnavigateはlocalhost/LAN IP不可、preview_startはsandboxでgetcwd失敗（このMacの既知制約）。
- サブエージェント運用メモ: シニアコーチ役は1回目セッション上限で死亡→**軽量プロンプト（ツール呼び出し5回制限＋読む範囲を指示）で再実行し成功**。複数体走らせる日はこの手法。
- **✅ coachサイト全面リニューアル完了（2026-07-04・未push）**。ユーザー指示「見た目ガラッと変えてモダンに（スクロールアニメーション）＋各データからレポート・考察的な表示」を受けて866行→1403行に書き換え。
  - 新規: ⓪概況タブ（稼働率SVGドーナツ＋KPIカウントアップ＋チーム考察ダイジェスト）／全タブに「考察」セクション（ルールベースの考察エンジン: 復帰予定超過・同部位再発・平均離脱期間・部位別傾向90日・BIG3向上/低下・測定90日鮮度・週間ボリューム±25%・痛みスキップ偏り・睡眠トレンド・3日連続RPE8+・入力率）／個人レポートに個人考察（チーム内順位・再発リスク・疲労・ボリューム急増）／コンディション14日トレンドチャート／BIG3表彰台／スクロールリビール（IntersectionObserver、prefers-reduced-motion対応）。
  - 流用（実績コードそのまま）: データ層（短いキー・onSnapshot）／共通定数・ヘルパー／トレーニング分析ブロック（exMetrics〜drawTrChartC、staffと定義一致）。書き込み処理ゼロは維持。
  - 検証済み: JXA構文チェック全7ブロックOK（{}カウント1ズレは旧ファイルにもある escapeHtml の /'/g 誤検知）／モックデータ模擬実行40チェックPASS／全キー空データPASS／**本番実データREST読取→全6タブ＋全74選手の個人レポート描画PASS（チャート119個生成）**。
  - 旧コードの潜在バグ2件はリニューアルで消滅: avHがAVC未定義参照（デッドコード）／select 12pxのiOSズーム（16pxに）。imgFindings/タイムライン系はcoachは元々描画していないので対象外。
  - 検証環境メモ: このMacはnodeなし→構文チェックはJXA(osascript -l JavaScript, new Function)。Chrome拡張はlocalhost/LAN IPともnavigate不可・preview_startはsandboxでgetcwd失敗→実機確認はユーザーのブラウザで（ローカル: `python3 -m http.server 8931` → http://127.0.0.1:8931/coach/index.html を開いて渡した）。
- coach監査（旧計画）はこのリニューアルで実質代替。残す価値のある旧指摘はonSnapshot全キー購読（coachは閲覧専用なので許容）のみ。
- trainer実装（監査完了済み・3体レビュー反映済み）: 実装順序はplanファイル末尾「実装順序（3体統合・確定案）」の9ステップ（①実バグバンチ→②guardSubmit移植→③16px化+ログイン永続化→④安全ゲート→⑤クイック評価2分→⑥差分表示→⑦To-Doホーム→⑧フルウィザード→⑨テスト二層化+SOAP下書き）。**前セッション末にユーザーへこの順を提示済みだが、明示的なGOはまだ**（コーチサイトの質問で中断）。
- **ユーザーの要望（原文趣旨）**: トレーナーサイトは専門学生（見習い）が使う。評価で「何を入力したらいいのか、何からやったらいいのか、順序もわからない」状態だったので、それをサポートするモダンな仕様にしてほしい。
- 実装の作法: 1ステップずつ→構文チェック（JXA）→模擬実行→ユーザー確認→push。staff/trainer同時修正が必要な項目（T1-1/T1-2）は両ファイル揃えてコミット。
- ユーザーがまだ実装項目を選んでいない場合は、planのtrainer節を要約提示して選んでもらう。
- trainer実装の後（または並行の合間）: coach監査（閲覧専用なので軽め）→4サイト横断の統合優先度リスト。

## いま何をしているか（現在地）
- **🆕🆕🆕 4サイト監査 — player・staff・trainer完了（3サイトとも3体レビュー反映済み）、残りはcoachのみ。コードは一切変更していない（読み取り専用）。**
  - **trainerサイト監査＝完了・3体レビュー反映済み（2026-07-04）。planファイル末尾に「trainerサイト監査レポート」（T1〜T5＋再設計確定版＋実装順序9ステップ）。**
    - **本番実測（REST・読み取りのみ）: rlog=10件 / rtest=1件 / taperec=0件 / tape予約=0件、なのにtrainers=17名登録** ＝「人はいるのに記録が発生していない」。ユーザーの実体験（見習いが評価で固まる）と整合。chartは31件28.5KBで1MB余裕。
    - **実バグ確定4件（未修正）**: ①T1-1 経過タブが`imgFindings.join`でクラッシュ（**staff:1784/trainer:1277両方**。画像所見の詳細を書いた怪我で発火）②T1-2 タイムラインdesc+titleの二重エスケープでHTMLタグが文字で見える（両方）③T1-3 trainer:1425 `popView()`未定義で「回復済みにする」が凍結 — **修正はpopView置換ではなくボタンのstaff権限化**（AT役: バグが偶然安全弁になっている。置換すると見習いのワンタップ回復確定が完成してしまう）④T1-12 リハビリ一覧に「痛み:undefined/10」常時表示（rlogにtop-level painは無い。preCheck.painを読むべき）。
    - **AT役の最重要指摘（T5）**: 権限が臨床的に逆転（誤字修正不可なのにresolveInj/setRtpLevel/changeStageは見習いがノーガードで実行可・実施者記録ゼロ）／脳震盪がtrainer側ノーガード（isConcussionのUI参照ゼロ、SCATを陰性/陽性プルダウンで答えさせる）／レッドフラグ入力しても何も起きない／INJ_TEMPLATES.contra・romLimitが現場に一度も表示されない。**→「安全ゲート（ステップ④）をウィザードより先に」が3体一致の条件**。
    - **再設計の骨子（確定版）**: 純ウィザードでなく「1画面セクション型＋ステッパー」／入口2モード（**クイック評価2分**=痛み+★指標が既定、フル評価は週1提示）／**ステップ0「今日の変化チェック」3問＋中断ゲート**新設／順序=痛み→周径→ROM→筋力→テスト→所見／前回値はplaceholderゴースト・差分色は必ずmetric.direction基準／整形テストは`supervised`二層化タグとセットでのみ／SOAP自動下書きはO欄限定。詳細はplan必読。
    - エンジニア役の追加発見: T1-13 showTapeSetupFormだけ_subViewActive漏れ／**T1-14 trainerが未使用のtlog(500KB)等4キーを購読＝選手のセット保存ごとに全trainer端末が再DL＋画面リセット**／T1-15 preCheckエスケープ漏れ／T4-3 preCheckは「閉じると入力が捨てられる」「スライダー未操作で前回値が今日の値として複製」の静かな事故2件。
  - **staffサイト監査＝完了・3サブエージェントレビューも完了・planに反映済み（2026-07-04）。** レビュー体制はplayerの2体（エンジニア＋デザイナー）から**3体（＋トップアスレティックトレーナー役）に拡張**（ユーザー希望）。
    - 事実誤認2件を訂正（S2-4の関数特定ミス、S2-3の「最終実施日が出ない」の言い過ぎ）。
    - 優先度変更: S1-8(中→高、復帰確定フロー分散)・S2-2(高→**最高**、記録コスト)・S2-7(中→**高**、AT視点で過小評価と判定)・S2-9(低→高、iOSズーム)・S3-1保存系(中→高、トースト化)・S2-4(中→低)・S2-6(中→低)。
    - 新規セクション追加: **S4（モバイルUXの抜け漏れ、デザイナー由来、M1〜M6）**＝ナビがアイコンのみ18項目で実質崩壊/タップターゲットHIG未達/タブ誤タップで入力全消し等。**S5（臨床機能面の抜け漏れ、ATレビュー由来、S5-1〜S5-7）**＝**S5-1健側入力UIが存在せずPhase1のLSI指標に値を入れられない（Phase2着手前に必須で直すべき）**、S5-2脳振盪管理が実質放置（GRTPの24時間ルール等）。
    - 3者共通結論:「このシステムの現在最大のリスクは機能不足でなく記録が発生していないこと」。S2-2の解消を最優先にしてから画面統合・Phase2に進む方針で一致。
    - 詳細・着手順序案（全11ステップ）はplanファイル末尾「次のステップ」節に反映済み。
  - **staff監査の最重要発見（未修正）**:
    1. **実測: `tlog`が既に1MB制限の50.9%（533KB）** — Firestore REST APIで全28doc実測。数ヶ月〜1年でトレーニング記録の保存が全滅する時限爆弾。`tdraft`も99KB。
    2. **実測: `matchsel`の本番データはpid配列** — playerのmypage(886行)の`{date,pids}`想定読みが完全に間違いと確定。player 1-1の修正方針はこれで確定。
    3. `V.dash`(704行)で`todayS`を定義(723行)より前に使用 → **ダッシュボードの疲労度アラートが一度も出ない**（playerのyesterdayS2と同型の実バグ）。
    4. **リハビリ遅延アラートが孤立** — 段階目標日(stageTargetDates)を設定するUIがデッドコード(`rehabHTML`＋衛星8関数、呼び出し元ゼロ)の中にしかなく、新規怪我では二度と発火しない。旧式ログ`r.logs`のデータも現UIのどこにも表示されない。
    5. **staffにはguardSubmit（二重送信ガード）が0件**（playerは9箇所導入済み）。doAddInjuryは連打で怪我＋リハビリがペアで複製。
    6. SOAP/復帰基準/RTPレベルは依然`saveChart`（カルテ丸ごと置換）で、trainerとの同時編集で巻き戻る（Phase0で直したのは評価・指標のみ）。`svRec('r')`も同様のレコード単位置換。
    7. deleteInjury（怪我単体削除）が`chart`と`rtest`を消し残す（doDelPlayerは消しており不整合）。
    8. UX: 本番実データで「受傷88日のACLで評価0件・SOAP0件・復帰予定未設定」＝記録コストが高く運用に乗っていない。実施者プリフィル・種目一括チェック・前回コピーがクイックウィン。リハビリ業務が4画面に分散し、段階変更が2画面で挙動不一致（advRehabStageは最終段階で自動resolve、カルテのchangeStageはしない）。
  - staffの素の`sv('chart')`は掃討済みだった（残る素のsvは初回種まき専用の1件のみ・ガード付き）。CSS未定義もstaffは`bd-n`のみで健全。
  - ユーザー依頼: 「player/staff/trainer/coach の弱点洗い出しをしたい。①UX/導線の弱点・惜しい所 ②壊れやすい/危ういデータ事故リスク構造 ③デザイン/UIで古い所、を優先度(高/中/低)つきでリスト化。一気にやらずplayerサイトから」。
  - **playerサイト監査＝完了**。手法: `player/index.html`全3179行を精読＋grepで裏取り（未定義CSSクラス4件・デッドコード5関数・素の`sv()`呼び出し0件を確認）＋本番サイトをブラウザで閲覧（テスト選手でログイン→home/mypage/トレーニング/ランキング画面）。**書込操作は一切していない。**
  - **成果物＝ `/Users/nakayamarinnin/.claude/plans/4-player-staff-trainer-coach-1-ux-merry-harbor.md`（次セッションで必読）**。ユーザー承認済み（plan modeで提示→approve）。中身は「1.壊れやすい構造」「2.UX/導線」「3.デザイン」の3カテゴリ×優先度(高/中/低)、計27項目。
  - **見つけた最重要バグ3件（未修正・次回対応候補）**:
    1. `T.home`(801〜812行) で `yesterdayS2` を**定義より前に使用**（var巻き上げでundefined）→「試合日チェック未入力」アラートが**一度も出ない**。さらに `D.matchsel` の扱いが home(pid配列想定)とmypage({date,pids}想定)で**食い違っている**。修正時は`D.matchsel`の実データ形状をFirestoreで先に確認すること。
    2. onSnapshotのリスナー(`startListeners`497〜515行)は「curTabの画面」だけ再描画保護するが、`T.condition()`等はcurTab更新なしで直接呼ばれる画面があり、**入力中に他人の保存でマイページへ強制送還され入力が消える**（コンディション入力など毎日使う画面が対象）。
    3. テーピング予約 `updateTapeSlots`/`doTapeBook`(3104/3131行) の空き枠判定が**複数枠予約の先頭枠しか見ておらず**、二重予約が起こり得る。
  - **次の一手＝trainerサイトの同様監査**（trainerはリハビリ記録の主要な書き手なので、svRec('r')/saveChart箇所とrlog運用を重点確認）→coach（閲覧専用なので軽め）→最後に4サイト横断の優先度統合リスト（tlog 1MB対策とmatchsel修正が最上位候補）。
  - まだ**修正フェーズには入っていない**。ユーザーが監査結果からどれを直すか選んでから、通常の「1機能ずつ→構文チェック→模擬実行→実機確認」フローに入る。

- **（保留・進行中）新プロジェクト「怪我管理 × リハビリ連携の強化」＝実装中。下の「怪我×リハビリ連携」節に全体設計。** grilling→2サブエージェントレビュー→自己レビュー→ユーザー承認済み。
  - **✅ Phase 0（データ基盤）完了・push済み(`93c5d9c`)＝実機スモーク検証OK。次はPhase 1。** staff/trainer両方に実装：
    - P0-a `getChart`補完（metrics/mmtTargets/injType/isConcussion/medClearance/romLimit/rtpLevel の既定値）→metrics未定義の既存カルテで白画面にならない。
    - P0-b 操作単位保存：`_chartIdx`＋`saveChartMetrics`新設。`saveEval`/`delEval`を**server-latestのevalsだけ触る方式に書き換え**（旧`saveChart(ch)`全置換のロストアップデートを解消）。saveChart本体にも注意コメント追加。
    - P0-c `saveEval`拡張：健側枠(`romH/mmtH/circH/fitH`)・フィットネス独自指標(`fit`)・臨床項目(`effusion/painLoad/readiness`)を収集（中身がある時だけ書く＝空{}で肥大させない）。UIは後フェーズ、現状は空収集で無害。
    - 定数追加：`MMT_ORDER`/`METRIC_CAT_MAP`/`INJ_TEMPLATES`/`STG_CAT_BY_SYS`（staff/trainer一致。INJ_TEMPLATES/STG_CAT_BY_SYSは**最小雛形＝臨床コンテンツで凛人と精緻化が必要**）。
    - **検証済み**：両ファイル構文OK(node無し環境なのでJavaScriptCore/osascriptの`new Function`パースで代替)＋模擬実行21件パス（getChart補完・他端末evalとmetricsを巻き戻さない・編集/削除/新injId作成）。staff==trainerのPhase0関数&定数はバイト一致をdiff確認。
    - **おまけ修正**：trainerがChart.js未読込だった既存バグを発見し同commitで修正（評価タブのグラフ`drawEvalCharts`が`Chart is not defined`で落ちていた）。staffと同じCDN行を追加。
    - **⚠️実機スモークの教訓**：ローカルサーバ(127.0.0.1:8765)で確認するつもりが本番(rinto1129.github.io)を開いていて「修正が反映されない」と混乱した。Consoleのfaviconリクエスト元URLでどちらを見ているか判別できる。**必ずアドレスバーが127.0.0.1:8765か確認**。
  - **✅ Phase 1（追跡指標セクション＋種別テンプレ確定）完了・push済み(`9ce97a3`)＝実機スモークOK。次はPhase 2。**
    - **凛人監修で臨床コンテンツ確定**（仮雛形を差し替え。staff/trainer一致）：
      - ACL＝膝伸展(制限)`kext`down/膝屈曲`kflex`up/シングルホップ(fitness,LSI)。禁忌=グラフト保護期(〜12週)のOKC終末伸展。
      - ハム肉離れ＝SLR`slr`up/膝屈曲筋力(strength,LSI)/30mスプリント(fitness,秒,down)。
      - 足関節捻挫＝膝-壁距離`wbl`(cm)up/外果周径(circ,down)/片脚バランス(fitness,LSI)。
      - 肩前方脱臼＝外旋`sER`/外転`sabd`/外旋内旋筋力(strength,LSI)。禁忌=外転+外旋(apprehension)。
      - 脳震盪＝指標なし・`isConcussion:true`でGRTP別扱い。
      - `STG_CAT_BY_SYS`＝下肢/上肢/体幹**共通**(IIFEで単一定義共有)。①ウォーキング=ケア/ROM/患部外/トレ/アジリティ、②ランニング=+フィットネス、③スプリント以降=ケア/トレ/アジリティ/フィットネス(患部外・ROMは外す)。
      - `EVAL_MASTER`新規追加：大腿`slr`(SLR/正常85°)・足首`wbl`(膝-壁距離/cm/正常10cm)。※10cmは目安で仮置き（凛人未確定の唯一の値。違えば直す）。
    - **staff評価タブに「🎯追跡指標」UI新設**（trainerはPhase1では触らない＝定数のみ同期）：種別選択→`applyInjTemplate`で一括生成、`metricRow`で名前/種類/単位/向き/基準モード(受傷前/健側/正常値/手動)/手動基準値/患健LSI/目標/期限を編集、`addCustomMetric`/`delMetric`/`saveMetricsFromUI`/`toggleConcussion`。保存は全て操作単位`saveChartMetrics`(meta経由でinjType/isConcussionも)。
    - **検証済み**：JavaScriptCoreパースOK＋模擬実行6ケース(ACL生成/目標期限保存/evals未破壊/脳震盪トグルでmetrics保持/削除/手動追加/足関節wbl・外果周径down)。
    - **次＝Phase 2**（不足ゲージ, staff・カルテ内）。**Chart.js不使用のCSS/SVGネオン系ゲージ**（`}}}});`括弧地雷回避）。各metric：最新eval(date→inputAt 2段ソート)vs基準(受傷前→健側→正常値の解決＋手動目標優先)→達成率%・「あと◯◯」。direction:downで反転しない・基準の出所ラベル・LSI(患/健)表示・MMTは`MMT_ORDER`indexドット。**0除算/NaN/Infinityガード必須**(健側base=null等)。medClearance/romLimitのchart-level UIはPhase3(安全ゲート)で実装予定＝保存経路(saveChartMetricsのmeta)は用意済み。
  - **完成プランの場所**: `/Users/nakayamarinnin/.claude/plans/rom-rom-tender-sundae.md`（v2。**着手前に必読**。ここに全フェーズ・確定判断・臨床セーフティ・データ基盤修正・検証手順が入っている）。
  - **やりたいこと（ユーザーの言葉）**: 怪我管理で入れた情報からリハビリを組む。「ROMが足りない→ROM改善やろう」「あと◯度足りない」「今週までにここまで到達」を出す。ROM以外に筋力・フィットネス(時間/回数)も。エクササイズ前後の伸び(pre/post)。過去リハビリ記録から「最近走れてない→走ろう」。**全部コメントで代替できるが"専用機能"が欲しい**、が出発点。
  - **⚠️ レビューで判明した急所（プランに反映済み）**: (1)既存`saveChart`([staff:1604](staff/index.html:1604)`latest[i]=ch`全置換)は**同一injId内ロストアップデート**＝staff指標設定中にtrainerが足したevalが消える→**操作単位の保存に直す(P0)**。(2)`getChart`がmetrics未補完→既存怪我で画面が白くなる→**空配列補完(P0)**。(3)`evals`に**健側枠が無い**→並行キー`romH`等を新設して3層基準(受傷前→健側→正常値＋手動目標)を成立。(4)**臨床安全弁が必須**＝提案の安全ゲート(夜間痛/腫脹/医師ROM制限中は提案抑制)・脳震盪を数値メトリックから分離(GRTP別扱い)・医師clearanceハードゲート・怪我種別テンプレ。(5)**postはevalsに積まない**(一時的ROM増加で推移を汚す)・正本はpre。(6)ゲージは**Chart.js不使用CSS/SVG**(`}}}});`括弧地雷回避)・MMTは`MMT_ORDER`のindex比較。(7)e1rm/ph(BIG3)は**患健LSI不可**＝受傷前比(全身回復)に使う／患健LSIは単脚/ホップ等side付き種目だけ。
  - **進め方**: Phase 0(基盤修正・最高回帰リスク=saveEvalを触る→単独デプロイ&スモークで隔離)→1(指標定義+種別テンプレ生成)→2(不足ゲージ)→3(提案+安全ゲート)→4(trainer pre/post)→5(やれてない検出)→6(player/coach薄く)。各末で構文チェック+模擬実行。
  - **怪我種別テンプレ(INJ_TEMPLATES)の中身は臨床コンテンツ＝勝手に確定せず凛人と詰める**。
- **（保留中の別タスク）TimeTree連携フェーズ1「チーム共通プッシュ/プル表示」**は未着手のまま（下の「TimeTree連携」節）。フェーズ2=予定一括インポートは完成・push済み。リハビリ連携を優先するため後回し。
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

## 🆕🆕 怪我管理 × リハビリ連携の強化（全体設計）— 計画完了・実装着手直前

> **完成プラン本体＝`/Users/nakayamarinnin/.claude/plans/rom-rom-tender-sundae.md`（着手前に必読）。** 以下は要約。grilling＋2サブエージェントレビュー＋自己レビュー（コード裏取り）で確定。

### 確定した設計判断（grilling 10問の答え）
1. ROM/筋力の**正本は`chart.evals`**（injIdごと）に一本化。`EVAL_MASTER`の正常値(`normal`)を使う。
2. **不足判定3層**：受傷前ベースライン→健側(LSI)→`EVAL_MASTER`正常値、の上に**凛人の手動目標(期限つき)**を任意でかぶせ優先。基準の"出所"をゲージに明示。
3. **数値メトリック共通型**でROM(°)・周径(cm)・数値筋力(kg)・フィットネス(秒/回)を一本化＋`direction`(up/down)。**MMTは順序型で別レーン**(`MMT_ORDER`のindex比較、文字列比較不可)。
4. **提案は(A)基盤(不足→RCATSカテゴリ)＋(B)任意(指標↔種目紐付けで種目名まで)**。自動ルールエンジンは作らない。**提案に安全ゲート必須**。
5. **定量筋力**：e1rm/ph(BIG3)＝受傷前比(全身回復)／患健LSI(≧90%)は単脚・ホップ等side付き種目だけ(BIG3で患健比は無意味)。
6. **「やれてない」検出は怪我種別テンプレ前提**：系統別(下肢/上肢/脳震盪)でSTG各段階の「やるべきカテゴリ集合」を定義→直近7日`rlog`差分→「最近◯◯**直近未実施(要確認)**」。断定しない。
7. **pre/postはセッション単位**。**正本はpreのみ**(条件統一=測定日)。**postは`postCheck`止まりで推移グラフ非混入**(一時的ROM増加でトレンドを汚す)。「今日の伸び」はpre/postCheckの2値から。
8. 設定は凛人(staff)。**新Firestoreキーを足さず`chart`内に同居**。
9. **v1スコープ=staff＋trainer作り込み、player/coachは進捗ゲージを薄く差すだけ**(計算ロジックを持たせない)。

### 🛑 臨床セーフティ（トレーナー役レビューで必須判定・フル装備で採用）
- **提案の安全ゲート**：夜間痛/安静時痛・**腫脹/熱感**・**医師指示のROM制限期間内**のいずれかで積極提案を抑制し「炎症/疼痛管理優先」に切替。文言は「処方」でなく「**候補(要臨床判断)**」。
- **脳震盪を本機能から分離**：`chart.isConcussion`で数値メトリック/ゲージ/提案の対象外。GRTP(症状ベース・24時間・症状再燃で後退)別扱い。7段階に乗せない。
- **医師clearanceハードゲート**(数値が全部緑でも医師許可無しは復帰不可)。
- **怪我種別テンプレ(`INJ_TEMPLATES`)**で指標2-3個＋段階カテゴリ＋禁忌期間を一括生成(入力負荷激減＋臨床妥当性担保)。**中身は臨床コンテンツ＝勝手に確定せず凛人と詰める**。
- 段階後退フロー維持(`prevStage`)。LSI前提崩れ(両側損傷/利き脚差)の注意ラベル。健側は測定日(週1-2)のみ測り「健側測定:◯日前」を表示。

### ⚙️ データ基盤の修正（エンジニア役レビューでP0＝Phase1着手前に潰す。実コードで裏取り済み）
`chart`(injIdごと)に追記：`metrics[]`(追跡指標定義＋目標＋direction)/`mmtTargets[]`/`injType`/`isConcussion`/`medClearance`/`romLimit`。実測値は`evals`。
- **健側枠**：患側は既存`ev.rom/mmt/circ`、健側は並行キー`ev.romH/mmtH/circH/fitH`(既存`drawEvalCharts`は`e.rom`しか読まない＝後方互換)。フィットネスは`ev.fit/fitH={指標id:値}`。臨床項目`ev.effusion/painLoad/readiness`(提案ゲートの入力源)。
- **P0-a**：`getChart`に`metrics`/`mmtTargets`/`rtpLevel`等の補完([staff:1584](staff/index.html:1584)で未補完を確認)。**Phase0最初の1手**。
- **P0-b**：保存を**操作単位化**([staff:1604](staff/index.html:1604)`latest[i]=ch`が火種を確認)。素朴なid和集合マージは削除を壊すので不可。`saveChartMetrics`＝`latest[i].metrics=`のみ、eval追加/編集/削除＝`latest[i].evals`を直接操作。**回帰リスク高い`saveEval`/`delEval`＋metricsだけP0、低頻度の他saveChart呼び出しはP1**。
- **P0-c**：`saveEval`にfit/健側/effusion/painLoad/readinessの収集を追加([staff:2045](staff/index.html:2045)が現状pain/rom/mmt/circ/ortho/special/noteのみ)。
- 定数追加：`MMT_ORDER`/`METRIC_CAT_MAP`/`INJ_TEMPLATES`/`STG_CAT_BY_SYS`(4ファイルコピー運用)。最新eval解決はdate→inputAtの2段ソート。

### 実装順序（各末で構文チェック＋模擬実行→確認→次へ）
- **Phase 0**：基盤修正(P0-a/b/c＋定数)。**最高回帰リスク=saveEval経路を触る→既存の評価入力/編集/削除/グラフ/SOAP/rlogが無傷を実機スモークで確認し単独デプロイ**してからPhase1へ。
- Phase 1：追跡指標セクション＋種別テンプレ生成(staff)。
- Phase 2：不足ゲージ(CSS/SVG・3層解決・LSI・MMT段階ドット・0除算ガード)。
- Phase 3：提案＋安全ゲート＋医師clearance＋脳震盪除外。
- Phase 4：trainer実施画面pre/post(対象2-3個・前回値プリフィル・post任意・既存preCheck接続を後方互換で)。
- Phase 5：やれてない検出(系統別STG×直近rlog差分)。
- Phase 6：player/coach薄く(描画関数のみ)。

### レビュー結論
- 現場トレーナー役：骨格OK。**安全弁(腫脹/痛み/治癒段階/医師許可/怪我種別＝特に脳震盪分離)が抜けていた→全部反映済み**。
- シニアエンジニア役：**条件付き承認**。P0(saveChartマージ/getChart補完/健側枠/preCheck接続)を着手前に潰すのが条件→プランに反映済み。
- 自己レビュー(コード裏取り)：saveChart全置換・getChart未補完・saveEval項目を実コードで確認。追加修正＝e1rm患健比の誤り訂正・素朴マージは削除を壊す指摘・健側は測定日のみ運用・テンプレは凛人と詰める。

---

## 🆕 TimeTree連携プロジェクト（全体設計）— 保留中（リハビリ連携を優先）

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
- 直近push: `93c5d9c`(怪我×リハビリ Phase0 データ基盤) → `9ce97a3`(同 Phase1 追跡指標セクション＋種別テンプレ確定)。

## 次の一手
- **🔴最優先＝trainerサイト「ガイド付き評価フロー」の実装**（詳細は最上部「次セッションが最初にやること」節）。プラン＝`/Users/nakayamarinnin/.claude/plans/4-player-staff-trainer-coach-1-ux-merry-harbor.md` 末尾のtrainer節（監査T1〜T5＋再設計確定版＋実装順序9ステップ、3体レビュー反映済み）。ユーザーに実装開始のGO（とステップ順の確認）をもらってから、①実バグバンチから1ステップずつ着手。その後coach監査（軽め）→4サイト横断の統合リスト。
- **並行して保留中＝怪我管理×リハビリ連携の Phase 2（不足ゲージ, staff・カルテ内）**（プラン＝`/Users/nakayamarinnin/.claude/plans/rom-rom-tender-sundae.md`、要約は上の「怪我×リハビリ連携」節・現在地節にPhase2の要点）。**Chart.js不使用のCSS/SVGゲージ**で、各追跡指標の最新eval vs 基準(受傷前→健側→正常値＋手動目標優先)→達成率%・「あと◯◯」を表示。direction/0除算/NaN/Infinityガード・基準の出所ラベル・LSI・MMTドット。Phase0/1は完了・実機検証済み。**ユーザー承認済み(プラン全体)**。4サイト監査より前から進行中のプロジェクトなので、ユーザーが望めばこちらを先に再開してもよい。
- （保留）TimeTree連携フェーズ1「チーム共通プッシュ/プル表示」（仕様は下の「TimeTree連携」節）。厳密交互・チーム共通・新キー`pp`・player/staff/trainerにバッジ＋1タップ反転。リハビリ連携を優先するため後回し。
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
