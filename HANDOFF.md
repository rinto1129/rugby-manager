# 引き継ぎ書 (HANDOFF)

> このファイルは「会話をクリアしても作業を引き継ぐ」ための申し送り。
> SessionStartフックで新セッション開始時に自動で読み込まれる。
> **作業の区切りごとにClaudeが更新する。** 古い情報は上書きしてよい（旧版はgit履歴に全て残っている）。

---

## 最終更新
- 日時: 2026-07-15（**🔴v2プラン: P0・P1・P2a・P2b・P4・P5・P6・P7a・P7b完了/push済み（P7b=`ee08429`）。P3不採用。P7c=実装完了・敵対的レビュー4次元(11体)→2確定(both low)修正・全検証緑＝push前。P7dは未着手**）
- 更新者: Claude
- **⚠️ 並行セッション事故の記録（2026-07-15）**: 本セッションのP7c作業中に**別セッション（ユーザー=中山凛人）が `6a34e5f`「レポート追加: バックス ブロンコタイム2026-07」をコミット＆push**（origin/main=`6a34e5f`）。**内容は `reports/bronco-backs-2026-07.html`（310行）のみ・staff/coach/trainer は無変更＝私のP7cと非衝突**。P7cは `6a34e5f` の上に1コミットで乗せる。着手前の`git log`確認を徹底（メモリ`project_concurrent_session_race`）。
- **✅ P7c「復帰フロー＋coach根拠＋承認ルール明文化＋トレーナー新規登録チップ」実装完了（ライトのまま・push前）**。**staff/coach/trainer 3ファイル変更**（+110/-3行）＋新テスト2本（`dev/test_p7c.js`/`dev/test_p7c_coach.js`）。検証: `python3 dev/run_tests.py`=**61 run/0 fail**＋`dev/sync_check.py`=ALL SYNC OK＋coach `renderPlayerReport` 実描画スモーク（全6根拠が出力・throwなし）＋敵対的レビュー(4次元find→11体verify→**2確定(both low)修正・4 REFUTED・承認ルールは所見ゼロ**)。**push単位=1（staff+coach+trainer+新テスト2本＋HANDOFF）**。実装内容↓。
  - **復帰フロー（staff）**: `approveRTest` 承認後、`goRTestDetail` に「復帰処理」パネル（□RTP完全復帰／□回復済み／□リハ段階完了）。チェックした項目のみ `doApplyReturn` が逐次反映＝**RTP完全復帰=`chartUpdate`(ch.rtpLevel='full'+rtpLevelDate)／resolved=`svSafeUpdate('i')`／段階完了=`svSafeUpdate('r')`(stage=STG.length-1+stageDates+stampWho)**。**svSafeSeqは追記専用のため不使用**（既存レコード更新は chartUpdate/svSafeUpdate 逐次チェーン。各op冪等）。`approveRTest`/`applyReturnComplete` に `roleGuard('approveRtest'/'approveRtp')`（P4のapprove系ACLをボタン化）。未完了項目のみチェックボックス化・完了済みは✓表示。
  - **🔑 P7cレビュー確定修正①(low)**: **r（リハビリ）レコードが無い怪我**（`approveInjury`で承認した選手/試合報告等はr未生成）でrf-stgが空振り→成功トースト誤表示＋「完了」に永遠に未到達。→ `returnFlowState(inj,ch,rh)`（テスト対象に切出し）で**rが無ければ段階管理対象外＝`stageDone`扱い**（rtp+resolvedだけで完了到達可）＋**rf-stgは`stageApplicable`時のみ描画**（空振り経路を根絶）。
  - **coach根拠（閲覧専用・描画のみ）**: `renderPlayerReport` の「現在の怪我・リハビリ」に **診断名(medical.diagnosis)／機転(injDetail.mechanism)／復帰基準 達成N/12／最新評価(`evalSummary`=痛み最大・ROM/MMT先頭キー)／最新SOAP A・P／画像有無(imgTypes or imgFindings)** を追加。純粋 `injEvidence(ch)`/`evalSummary(ev)`（テスト対象）。**ch.imagesは死placeholderのため不使用**（imgTypes/imgFindingsで判定）。**🔑 P7cレビュー確定修正②(low)**: `evalSummary` のROM/MMT**値**は自由記述入力（trainerのtype=text）なので `escapeHtml(String(...))` で必ずエスケープ（innerHTML注入/レイアウト破壊防止・キーは元から escape 済）。`hasImg` は `imgFindings` が空配列でも誤検出しないよう `Array.isArray?length:値` で防御。
  - **承認ルール明文化（レビュー所見ゼロ）**: staff `doAddInjury`=`source:'staff',approved:true,approvedBy:getCurrentUserName(MY_ROLE),approvedByRole:MY_ROLE`／trainer `trDoAddInjury`=`approvedBy/approvedByRole` 追加（source:'trainer',approved:true は既存）／staff `approveInjury`=`approvedBy/approvedByRole` 追加。**選手/試合起票のみ要承認（approved:null）は不変**。**approvedAtはstaff/trainer起票には付けない**（player通知feedは`source∈{player,match}`必須で誤通知はしないが最小面を維持）。選手側の全編集/取消/通知ゲートは`source∈{player,match}`必須＝staff作成(source:'staff')は正しく除外（自主検証＋レビューで回帰ゼロ確認）。
  - **トレーナー新規登録チップ（staff・injcomm非使用）**: trainer起票の怪我は`source:'trainer'・即approved`で「新着怪我(承認待ち)」に載らない＝見落とし防止。**injcommを汚さず`inj.source==='trainer'`から派生**（`trainerNewInjChips`＝純粋・テスト対象）＋**端末ローカル(localStorage `rm_seen_newinj`)の既読で消える通知チップ**（`ackNewInjChip`=既読化→goInjuryDetail）。登録30日window＋seenで新端末の洪水を抑制。P4のFirestore-state依頼チップとは別系統（意図設計・レビューで2件REFUTED）。
- **✅ P7b「欠席統一（今日は休む↔欠席a）」実装完了（ライトのまま・push前）**。**player/coach 2ファイル変更**（+106/-12行）＋新テスト2本（`dev/test_absence_sync.js`/`dev/test_absence_coach.js`）。**staffは無変更**。検証: `python3 dev/run_tests.py`=**59 run/0 fail**＋`dev/sync_check.py`=ALL SYNC OK＋敵対的レビュー2巡。**push単位=1（player+coach+新テスト2本＋HANDOFF）**。実装内容↓。
  - **🔑 最重要の設計判断（2026-07-15・レビュー由来）: 「今日は休む」を欠席a に書き込む案は不採用**。プラン/初版は休むを`a`(欠席申告)にもupsertする双方向設計だったが、敵対的レビュー(5次元find→13確定)で `a`（＝チーム練習の欠席セッション・スタッフ所有・約十数箇所が正典読み）に休む(個人ウエイト休養)を混ぜると**①スタッフ作成セッションへの誤混入②オフ日の幻セッション生成で出席率破壊③正式な欠席/遅刻申告のブロック④二重計上**が起きると判明。**これはP7aで却下した cond-bc と同型の「二次記録を正典ストアに書く汚染」**。→ **休むは tlog(absent) のみに保持**（`a`には一切書かない）。ユーザー承認済み（AskUserQuestion「休むはtlogのみに戻す（推奨）」2026-07-15）。
  - **coach=追加読み（ユーザー選択・主目的）**: coachは従来通りtlog欠席で休むを把握＋**新`aAbsenceEvents(fromDate)`で`a`の全欠席申告（tlog無しの(pid,date)のみ）を追加読み**（`seen`セットで二重計上回避・a内重複も畳む）。coachは`a`をこれまで欠席に未使用だった＝**今まで見えなかった正式欠席申告がcoachに反映**（今回の実質的価値）。repoint=insTraining欠席率(分母/分子両方に加算＝率≤100%維持)/renderTrainingView(absentCount/injuryAbsent/injNotices/記録一覧)/buildHistCoach。**遅刻/早退/部分参加は全欠席でないため除外**（reason接頭辞ブロックリスト）。`isInjuryAbsent(l)`=tlogは'痛み・怪我'完全一致（含有チェックで同値）／**a由来(_fromA)は自由記述の怪我誤検出（「怪我人の付き添い」等）回避のため怪我判定しない**。
  - **削除=ハード削除＋Undo（ユーザー選択）**: `deleted:true`論理削除は現状全ファイル未使用で全read siteへの`!l.deleted`一斉追加が必要＝不採用。休む取消はtlogを実削除→tlogToday(1659)/出席率(6221)等の**全tlog読み側は無改修で正しく戻る**。
  - **player実装**: `myAbsentTlogsToday()`／`saveTrainingAbsent`を**svSafeUpdateで取引内冪等化**（サーバー最新に同日欠席あれば無変更＝連打/複数端末レースでも同日1件）＋**本日チーム練習実施済み(自主除く)なら休む不可ガード**（実施と欠席の矛盾防止）／`cancelTrainingRest`＋`undoCancelTrainingRest`（当日休むtlogをハード削除＋5秒Undo・delTlog同方式・**Undoは同(pid,date)照合で取消→再休養→Undoの同日2件も防ぐ**）／`startTraining`を**cancel-aware化**（本日休養済みなら取消導線を先に表示＝休む/実施の共存を防ぐ）／`T.training`最上部に**日次休養バナー＋取消**。`cancelAbsence`/`delTlog`/`undoDelTlog`は`a`↔tlog連携を持たせず**pre-P7b挙動を維持**（過剰削除・孤児化を回避）。
  - **敵対的レビュー2巡目(coach/player各1体)の残処置**: ①player=実施→再メニュー→休むでの実tlog+欠席tlog共存（実施済みガードで解消）②player=取消→再休養→Undoの同日2件（Undo(pid,date)照合で解消）③coach=`aEv`怪我通知ループが`_fromA`で常にfalse＝デッドコード（削除）④coach=staff自由記述が偶然「遅刻」等で始まると除外される稀エッジ（許容）。**新規失敗0**。
- **✅ P7a「体重dedup＋sRPE実測化」push済み `6aa9713`**。**player/staff/coach 3ファイル＋sync_manifest変更**（+87/-23行）＋新テスト`dev/test_p7a.js`。検証: `python3 dev/run_tests.py`=**57 run/0 fail**＋`dev/sync_check.py`=ALL SYNC OK（effDur/sLoad をidentical登録）＋敵対的レビュー(4次元find→6所見→検証)=全処置後**残バグ0**。実装内容↓。
  - **cond-bc materializeは不採用（ユーザー選択・2026-07-15）**: プランは「コンディション体重→同日bc(source:'cond')をupsert」だったが、bcは体組成(weight/fat/muscle)コレクションで**約15箇所が「体組成測定」として無条件に読む**（提出ステータス/測定会/一覧/CSV/チャート/最後に測った日）。weight-onlyのcond-bcがそこに**偽の測定として漏れる**リスク大。かつ体重平均は`getCurrentWeightInfo`が元々`f`も読むので**materialize無しでも正しい**。→ **cond-bcを作らず、体重は`f`のみに保存**。`doBCInput`のP5昇格分岐は無害な休眠コードとして残置（cond-bcが存在しないため実質no-op）。
  - **体重dedup（identical: getCurrentWeightInfo=player/staff/coach・getWeightInfoAt=player/staff）**: 従来`D.f`と`D.bc`の体重を配列に両push→30日平均だったが、**同日に両方あると二重計上**（cond-bc有無に関わらず既存の潜在バグ＝同日にコンディション体重+実測bcで発生）。→ **日付キーのbyDate mapでdedup（同日はbc優先）**。`N回`カウントも実日数で正確化。
  - **sRPE実測化（effDur/sLoad 新設・identical player/staff）**: セッションロード表示は従来`rpe*(duration||0)`＝選手手動入力のTR時間依存（朝入力運用で空欄が多く空振り）。→ `finishTraining`が**セッション実測時間**（開始ts→完了・妥当域1〜300分のみ採用）を`tlog.durMin`と当日`f.durMin`に記録（`syncSessionDurToF`）。表示は`sLoad(f)=rpe*effDur(f)`に置換（player2箇所+staff7箇所）。coachはセッションロード表示なし＝effDur不要。
  - **effDurの優先順位＝duration(手動)>durMin(実測)>当日tlog>0（レビュー由来の設計変更）**: プランは「durMin優先」だったが、durMinは`ts→完了tap`の**壁時計計測で不確実**（タブ放置で過大化・実測が手動の正確値を上書き・手動編集が次セッションで再上書き＝レビューでmedium2件）。→ **手動durationがあればそれを最優先**。durMinは**空欄の穴埋め**（プランの朝入力空振り対策のゴールは達成）。これで編集の手動値が耐久し、壁時計の過大化も手動入力で自己修正可能。編集フォームは触らず（durMin優先廃止でプリフィル/durMinクリアのハックが不要になり全revert）。
  - **syncSessionDurToF redundant-write ガード（レビュー由来）**: 当日コンディション未提出（トレ→後で入力の普通の順）だと`D.f`に候補が無く、updateFnが不変returnでも`tx.set`がf全体docを無駄に再書込み（Sparkの書込枠浪費）。→ 先頭で`D.f`に当日候補が無ければ**svSafeUpdate自体を呼ばず早期return**（取りこぼしはtlog側durMinのeffDurフォールバックで実害なし）。
  - **レビュー6所見の処置**: ①手動編集が次セッションで再上書き(medium)②壁時計durMinが手動を上書き・過大(medium)→**duration優先化で両方解消**。③無関係編集でdurMin→duration焼付き(low)④空欄クリアが0で残らない(low)→**編集フォームrevert（effDurプリフィル/delete durMin撤去）で解消**。⑤redundant write(low)→**ガード追加**。⑥cross-midnightでdurMin取りこぼし(low)→**誤検出**（log.dateはセッション開始日でコンディションと一致）。
- **✅ P6「staff/trainer CRUD残り＋prompt()7箇所撲滅」の中核を実装完了（ライトのまま・push前）**。**player/staff/trainer 3ファイル変更**（+約760/-90行・53新関数）＋新テスト`dev/test_p6.js`。検証: `python3 dev/run_tests.py`=**56 run/0 fail**＋`dev/sync_check.py`=ALL SYNC OK＋敵対的レビュー(5領域find→6候補→11エージェント検証)=確定4バグ修正後**残バグ0**。**push単位=1（player+staff+trainer+新テスト）。ユーザー確認後にpush**。実装内容↓。
  - **🎯 prompt()完全撲滅（7箇所→0）**: staff6箇所=`editStageDate`/`setStageTargetDate`(段階開始/目標日・空欄=削除保持)/`advStage`内(撤去→目標日設定ボタンに集約)/`markSkipForSess`(測定なし理由)/`goSaveAsTemplate`(テンプレ名・confirmも統合)/`rejectInjury`(却下理由・承認レース対策＋Undo)。trainer1箇所=`goSaveAsTemplateT`(テンプレ名・confirm統合)。**全ファイルで`grep -c "prompt("`=0**。雛形v2（pushView/showSub→フォーム→svSafeUpdate→toast/alert）で書き直し、テンプレ採番はtx内latest基準でid衝突回避。
  - **staff CRUD編集フォーム（削除ボタン横に「修正」新設）**: `f`(コンディション・選手固有フィールド保全)/`bc`(体組成)/`ann`(お知らせ・readBy保全)/`cal`(カレンダー・編集では測定会自動作成しない)/`a`(欠席・source:'player'保全、absTemp.sourceMap)。すべてin-place svSafeUpdate＋editedAt＋notFoundガード。
  - **staff wc/md 代理修正**: `showEditWeekCheckStaff`/`showEditMatchStaff`(コンディション欄のみ・injured/crampフラグと怪我サブフィールドは触らず＝i/r重複防止)。**wc/mdの新規「代理入力」はP7以降へ**（injId picker/svSafeSeq移植が必要）。
  - **staff misc**: `goRenameTrainer`(トレーナー改名・name のみ)/`goEditRTestTpl`(復帰テストテンプレ編集・動的physTestsプリフィル、_rtPhysCount再初期化)/`delTapeSlot`(テーピング枠個別削除・予約ありはslotIds跨ぎ破損回避でブロック・Undo)/`cancelPhSkip`/`editPhSkipReason`(phskip取消/理由修正・id無し旧レコードはpid+phInMSessで照合)/`delRTestResult`(復帰テスト結果削除・Undo)。
  - **trainer**: `showChangePINT`(PIN変更・ホームヘッダに導線・myTrainer.pin同期)/`delMyTapeSlot`＋`showEditTapeSlot`(枠個別削除/編集＋過去日も日単位削除可)/`goSaveAsTemplateT`(prompt撤去)。
  - **cross-file**: `injcomm`コメント**編集**を player/staff/trainer 3ファイルに追加（作者本人のみ・インライン展開・updateFn内で作者再判定・editedAt表示）。`recorderName(rec)`リゾルバをstaff/trainerに追加＝SOAP/テーピングの記録者を`author`文字列→**authorId(trainerId)参照**化（表示は`trainers`から現在名を解決・旧レコードはauthor文字列にフォールバック・改名が新規レコードに反映）。
  - **敵対的レビュー由来の確定修正4件（触る時に退行させない）**: ①**timeOptionsを5分グリッド化**＋グリッド外値のprepend保持（旧10分グリッドだと5分単位の枠を編集すると08:05等が選択できず`00:00`に破損＝high。staff/trainer両方修正）②**SOAP/テーピングのauthorIdは新規レコードのみ刻む**（編集時は元のauthorIdを温存＝別作者の記録を編集しても記録者を書き換えない。saveSOAP/saveTapeRec）③`undoCancelPhSkip`の二重復元ガードをphInMSess照合に（id無し＆msessId無しの旧レコードで`idEq(null,null)`が常にfalseで機能しなかった）④`doChangePINT`にnotFoundガード（トレーナー記録消失時に偽の成功表示＋in-memory pin desyncを防ぐ）。新テスト`dev/test_p6.js`(timeOptions/recorderName・31アサーション)で①②を回帰固定。
  - **⏭️ P6でP7以降へ送った項目（未実装）**: (a)staff `tape`代理変更（player専用のselectedTapeSlot等の枠選択グローバル状態が必要＝新規UI構築が要る）(b)wc/md **新規**代理入力（svSafeSeq移植＋怪我重複対策）(c)trainer側 `rtest`編集/削除（staff側は削除実装済。trainerは結果一覧UIが未整備＝新サーフェス要）(d)`rtest`結果の**編集フォーム**（physResults再入力＝複雑。削除→再入力で代替）(e)`rlog`**種目編集**（exercises配列エディタ＝日付/実施者/コメント編集はstaff `goEditRehabLogStaff`に既存。種目単位の編集は複雑で未着手）(f)preCheck編集（脳震盪サブオブジェクト編集＝複雑）。**これらはP7/P8で機能統合・IA再編と併せて実装するのが自然**。
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
| P5 | player CRUD残り（怪我/rlog/痛み/wc/md/bc/tape/欠席/PIN） | ✅ push済み `585b926`（55 run/0 fail・sync OK・敵対的レビュー18体で確定4バグ修正済） |
| P6 | staff/trainer CRUD残り＋prompt()7箇所（staff6+trainer1）撲滅 | ✅ push済み `1b25310`（56 run/0 fail・sync OK・敵対的レビュー11体で確定4バグ修正済）。残: tape代理変更/wc・md新規代理入力/trainer rtest/rtest結果編集/rlog種目編集/preCheck編集はP7以降へ |
| P7a | 体重dedup＋sRPE実測化（durMin/effDur/sLoad） | ✅ push済み `6aa9713`（57 run/0 fail・sync OK・敵対的レビュー4次元→6所見全処置）。**cond-bc materializeは不採用**（体組成汚染回避・ユーザー選択）。effDurは**duration手動優先>durMin実測>tlog** |
| P7b | 欠席統一（今日は休む↔欠席a・coach追加読み） | ✅ push済み `ee08429`（59 run/0 fail・sync OK・敵対的レビュー2巡）。**休むはtlogのみ保持＝aに書かない（汚染回避・cond-bcと同型）**。coachは`aAbsenceEvents`で正式欠席申告を追加読み。取消=ハード削除+Undo。staff無変更 |
| P7c | 復帰フロー＋coach根拠＋承認ルール明文化＋トレーナー新規登録チップ | 🟩 実装完了・**push前**（61 run/0 fail・sync OK・敵対的レビュー4次元11体→2確定(low)修正・render smoke緑）。svSafeSeq不使用（更新はchartUpdate/svSafeUpdate逐次）。承認ルール=trainer/staff起票即approved+approvedBy／player/match要承認。r無し怪我の空振り根絶・coach ROM/MMT値エスケープ |
| P7d | 1フォーム化（受傷1フォーム・リハ1画面・選手側1シート・saveQuickEval廃止・pp編集staff集約・ブロンコ統合） | ⬜ |
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
- ブランチ: main。origin/main=`6a34e5f`（P7b `ee08429` ＋ 別セッションの「レポート追加」`6a34e5f`＝ともにpush済み）。**P7cはこの上に1コミットでpush**（staff/coach/trainer＋dev/test_p7c.js＋dev/test_p7c_coach.js＋HANDOFF.md）。**⚠️ `reports/bronco-backs-2026-07.html` は別セッション（ユーザー）が作成・push済み＝P7cでは一切触らない**。push前に`git diff --stat`で対象外変更ゼロ確認済み
- テスト用選手「テスト選手」(CTB/1年, note=動作確認用)が本番に1名存在（削除可）
- ⚠️ 検証はjsc模擬実行で完結（本番Firestore直結のためブラウザで代理編集/削除の保存ボタンは押さない）。最終目視はユーザーのCmd+Shift+R確認に委ねる

## 運用ルール（このプロジェクト固有）
- データは「短いキー」で読む。保存は `svSafe` / `svSafeUpdate` を使う。
- 1機能ずつ → jsc構文チェック → 模擬実行 → 次へ。まとめて変更しない。
- git push の前は必ずユーザーに確認。それ以外の局所的・可逆な作業は確認不要で進める。
- 詳細は `CLAUDE.md` を参照（最重要ガイド）。
