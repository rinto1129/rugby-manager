# OVERALL
3視点レビュー計45件超（整合性13＋提案5／実装リスク17＋提案7／使いやすさ16＋提案14）を統合し、重複を畳んで mustFix 10・shouldFix 19・improvements 11・rejected 3 に整理した。プランの行番号参照は HEAD bc735ac と一致し、既存の敵対レビュー5本（critiques_partial / critiques_p1ab）はほぼ反映済み。残る穴は「反映の過程で新たに生じた不整合」に集中している: (1) mdInjuryLive に追加した i.mdId 逆引きが HIA 自動起票 i を拾い、HIA のみの md が全サイトで「怪我」にも二重計上される（critiques_p1ab P1b#2 の分離要求が逆引き追加で再発）、(2) md↔試合の所属規則が B群「同規則」・設計判断「先頭イベントのみ」・重複判定「pid×(evId|date)」・coach/trainer の自前フィルタ・_smdPending sig=pid|date の5通りに分裂し同日2試合で挙動が割れる、(3) i/r→md の保存順で md が重複に負けたとき i/r が孤児化する（releaseSubmit・pending 破棄も未記載）、(4) P4-1「4サイト」と P5-2「coach に追加」の二重配置矛盾、(5) doEditCalEvent の date/type 変更が squad/md を孤児化する経路、(6) updateFn 内 newId/累積が Firestore 再試行で二重化、(7) 怪我報告→試合日チェックの順で i が二重起票、(8) 9/5 遡り導線が「直近3試合」から脱落しうる。いずれも1〜数行の追記で解消でき、D1〜D9 に抵触するものは無い。UX 系（必須集合・レポート順序・代理入力の連続入力・メンバー表の手間）は Claude 推奨細部の範囲内での修正で、必須集合だけはプランで明文化してから承認すべき。実装上の重要ファイル: /Users/nakayamarinnin/Documents/個人開発プロジェクト/rugby-manager/staff/index.html（svSafeUpdate 1276・doEditCalEvent 8705・approveInjury 8581・pushView 1764・exportCSV 5367）／player/index.html（todayTodoHtml 1690・showMatchForm 4321・doInjuryReport 4507・readBy 2402）／dev/prelude.js（sessionStorage/Blob 未定義）／dev/sync_check.py（extract_block 87・check 140）／trainer/index.html（1465 リハ対象フィルタ・2043 scene）。

# MUST FIX (10)

## M1. mdInjuryLive/mdHiaLive の境界を対称に定義し HIA 自動起票 i を「怪我」に二重計上しない
FIX: §共通ヘルパー B群（L71）の mdInjuryLive を『(a) m.injId!=null → idEq 一致の i／(b) 無ければ D.i から idEq(x.mdId,m.id) かつ !injIsHia(x)／(c) !mdIsV2(m)&&m.injured のときのみ pid×date×source:"match" 照合（旧データ専用）／いずれも approved!==false』に書き直し、mdHiaLive を『hiaInjId 一致 → 無ければ idEq(x.mdId,m.id)&&injIsHia(x)』と対称にする。脳震盪 type の怪我報告は injId===hiaInjId（同一 id）で両方 true が仕様と明記。P1a-4 test_matchday_helpers に4ケースを追加: HIA のみ起票した v2 md → mdInjuryLive null・mdHia true／脳震盪 type の怪我報告 → 両方 true・同一 id／v2 md(injured:false) は同日 source:match の i に date フォールバックしない／旧 md(injured:true) は date×source で拾う。P1c-3・4・13、P2-4、P5-2、P1c-14 の「怪我 n」「HIA n」はこの2関数の結果をそのまま使う旨を1行添える。
REF: プラン §共通ヘルパー B群 L71 ／ P1b-5 L111 ／ P1c-3・4・13 ／ P2-4 ／ P5-2 ／ P1c-14 ／ critiques_p1ab.md L89-99（P1b#2 fix(3)）
SRC: 整合性（medium）／整合性 提案「mdInjuryLive テスト固定」

## M2. md↔試合の所属述語を mdBelongsTo(m,ev) 1本に集約（重複判定・同日2試合・coach/trainer・pending sig を同規則に）
FIX: B群に `mdBelongsTo(m,ev)` を追加: evId が現存イベントに解決でき ev.id 非 null → idEq(m.evId,ev.id) のみ／それ以外 → m.date===ev.date かつ（ev.id==null または ev が matchEventByDate(m.date,m.pid) と idEq）＝同日複数は squad 所属優先・無ければ先頭にのみ属する。mdOf/mdsOfEvent/pendingMatchChecks/matchChecksMissing は全てこれを呼ぶ薄いラッパと明記し、§設計判断「同日2試合」の『旧 md は先頭イベントのみ』と B群「同規則」の矛盾を解消。重複判定は latest を受ける純関数 `mdDupIn(latest,pid,ev)`（同じ述語・B群 identical）を置き、P1b-5・P1c-8・§設計判断「重複ガードの最終防衛」の『同 pid×(evId|date)』を『mdDupIn で判定（date 一致だけでは弾かない）』に統一。P5-2 に『matchReportData は mds=mdsOfEvent(ev)・squad の提出判定は mdOf(pid,ev)』、P1c-14 に『matchCareList は mdsOfEvent(ev)』＝『独自の evId/date フィルタを書かない』を1行追加（design_P3P4P5 L128/L164 の自前フィルタは無効）。P1c-8 の _smdPending sig は `String(pid)+'|'+matchEventKey(ev)`（P1b-5 と同形・design_P1c L56 の pid|date は廃止）。テスト: test_matchday_helpers『同日2試合＋旧 md は先頭のみ』『疑似イベントに一致』『D.cal 差し替え後』、test_matchday_form(7)/test_matchday_proxy_staff(4)『同日 A 提出後に B を提出できる』、test_matchday_p5_coach(2)/test_matchday_care_trainer『evId が cal に無い v2 md（同日 cal 試合あり）が提出数に含まれる』。
REF: プラン §共通ヘルパー B群 L71 ／ §設計判断 L204・L208 ／ P1b-5 L111 ／ P1c-8 L131 ／ P1c-14 L137 ／ P5-2 L173 ／ design_P3P4P5.md L128・L164 ／ design_P1c.md L56（sig=pid+'|'+ev.date）
SRC: 整合性（medium×3・low）／実装リスク（medium・low）／整合性 提案「mdBelongsTo」

## M3. md が重複で弾かれたとき i/r を孤児にしない（dup md へ転記・releaseSubmit・pending 破棄・事前チェック）
FIX: P1b-5 doMatch と P1c-8 doAddMatchDay に共通で追記: (1) フォーム描画時（P1b-4/P1c-7）と guardSubmit 前にローカル mdOf(pid,ev) の事前チェック（design_P1b (c) を本文化）。(2) svSafeUpdate('md') の updateFn で mdDupIn が dup を返したら、dup 側に injId/hiaInjId が無く今回の ids.inj/ids.hia が savedIds にあれば injured:true・injId・inj* フィールド・injLate:true／hiaInjId・editedAt を dup に転記して return latest（push しない）。既に injId があれば何も書かない。(3) dup/onError どちらも releaseSubmit(btnEl)、dup 時は _mdPending/_smdPending を破棄（sessionStorage も removeItem）。(4) toast 文言『既に提出があったため怪我報告をその記録に追記しました』→ showEditMatch(dup.id)（staff は goMatchDetail(dup.id)）。テスト: test_matchday_form(7)/test_matchday_proxy_staff に『dup 時に i を積んだケースで dup md.injId===i.id・ボタン解放・pending null』。
REF: プラン P1b-5 L111 ／ P1c-8 L131 ／ P1b-4 ／ P1c-7 ／ player/index.html:1015-1037 svSafeSeq ／ staff/index.html:1276-1286 svSafeUpdate ／ design_P1b.md L69(c)
SRC: 整合性（low）／実装リスク（medium）／整合性 提案「重複時の i/r 救済」

## M4. 怪我報告→試合日チェックの順でも i を二重起票しない（既存 i への紐づけ）
FIX: P1b-4 showMatchForm／P1c-7 goAddMatchDay の描画時に `(D.i||[]).filter(x=>idEq(x.pid,pid)&&!x.resolved&&x.approved!==false&&(x.source==='player'||x.source==='match')&&x.mdId==null&&|x.date−ev.date|<=1日)` を引き、あれば③怪我ブロック上部に alert-info『既に報告済みの怪我があります: 右膝 捻挫（9/5）』＋チェック『この試合の怪我として紐づける（新しく登録しない）』を既定ON。P1b-5 doMatch／P1c-8 doAddMatchDay: 紐づけ時は i/r を push せず rec.injured=true・rec.injId=既存 id、canPractice/injPart/injSide/injType/injPainNow を i から転記し、md 保存成功後に svSafeUpdate('i') で該当 i に mdId/matchEvId（数値正規化）を追記（source・approved は触らない＝承認ルール不変）。mdInjuryLive (a) で辿れる。テスト: test_matchday_form／test_matchday_proxy_staff に『既存 i ありで送信→i は増えず md.injId が既存 id・i.mdId===md.id』。
REF: プラン P1b-4・P1b-5・P1b-8 ／ P1c-7・P1c-8 ／ player/index.html:2130（ホーム赤ボタン）・4507-4516（doInjuryReport source:'player' approved:null）
SRC: 使いやすさ（high）／使いやすさ 提案「既存の怪我報告への紐づけ」

## M5. updateFn は純粋関数（再試行安全）を規約化し、sendMdReminders の newId を updateFn 外で予約
FIX: §共通ヘルパー冒頭の契約文（L66）に『svSafeUpdate の updateFn は Firestore 競合で複数回実行される（prelude モックは再試行しない）。フラグ/配列は updateFn 先頭で初期化、newId は updateFn 外で予約、DOM 値は updateFn 外で読んだ変数を使う（手本: doRejectInjury 8602-8616）』を追記し、P1a-18 の CLAUDE.md 更新（保存層の節 L74 付近）にも同文を含める。P2-4 sendMdReminders は `var pre=missing.map(p→{p,id:newId()})` を updateFn 外で作り、updateFn 内は `added=[];skipped=0;` から始める。P1a-8 saveSquad／P1b-5・P1c-8 の md 段／P1c-9 doEditMatchStaff（既存 5502-5516 の DOM 読みは updateFn 外へ移す）／P1b-9・P1c-10 の Undo 復元は `notFound=false;dup=false;` を updateFn 先頭に置く旨を各ステップに1行。
REF: staff/index.html:1276-1286 svSafeUpdate ／ 5502-5516 doEditMatchStaff ／ 8602-8616 doRejectInjury ／ プラン §共通ヘルパー L66 ／ P1a-8 ／ P1b-5 ／ P1c-9 ／ P2-4 L150 ／ P1a-18
SRC: 実装リスク（medium）／実装リスク 提案「CLAUDE.md 規約追記」

## M6. P4-1「4サイト」と P5-2「coach に追加」の二重配置矛盾を解消（trainer には置かない）
FIX: P4-1 を『[player/staff/coach] mdIsCap・matchStatsFor（mdRoleCode/mdLoad は B群既存を使う）、[player/staff] MD_CAPS_MILESTONES。trainer には置かない（P1c-14 の B群サブセットに mdRoleCode/mdLoad が無く未定義参照になる）』に訂正。P5-2 を『mdIsCap/matchStatsFor は P4-1 で配置済み＝追加しない（`grep -cE '^\s*function mdIsCap\(' coach/index.html` が1であることを確認）』に書き換え。P5-8 の manifest 記述（mdIsCap{player,staff,coach}）はそのまま。
REF: プラン P4-1 L164 ／ P5-2 L173 ／ P5-8 L179 ／ P1a-3 L89（二重定義検査で赤化）／ P1c-14 L137
SRC: 整合性（medium）

## M7. doEditCalEvent の日付・種別変更で squad/md が孤児化する経路を塞ぐ（delCalEvent と同じ拒否方針）
FIX: P1a-7 の doEditCalEvent updateFn に『squadOf(latest[idx]).length>0 または (D.md||[]).some(m=>mdBelongsTo(m,latest[idx])) のとき、type!=='match' への変更または date 変更は blocked=true（updateFn 先頭で初期化）→ onDone で releaseSubmit＋alert("メンバー表/試合日チェックが登録済みの試合は日付・種別を変更できません。先に削除するか新しい試合を登録してください")』を追加。opp/ko/venue/title/detail の変更は自由。test_matchday_cal_staff に『squad あり試合の date 変更が拒否され cal 不変』を追加。将来 date 変更を許す場合は同トランザクションで md.date を追従させる旨を openIssues に残す。
REF: staff/index.html:8705-8723（date/type を無条件上書き）／ プラン P1a-7 L93 ／ P1a-12 L98
SRC: 整合性（medium）／整合性 提案「編集ガード」

## M8. 9/5 遡り運用の導線を保証（「対象の試合」から 9/5 が落ちない・旧形式/重複 md の扱い・催促窓の文言訂正）
FIX: P1b-12「対象の試合」を『直近3試合のうち squadRole(ev,myPid)!=null または md あり の試合 ∪ squadRole!=null かつ !mdOf の過去試合（date>=today−30日）を未入力行を先頭に表示。どれにも該当しなければ最新1試合のみ「メンバー外（出場した場合は任意で入力→出場区分を変更）」を1行』に変更（P4-3 でも維持）。運用節2の『催促窓（3日）は過ぎているので todo は出ない』を『出荷日によっては窓内（daysAgo≤3）に入りホーム todo が出ることがある。「対象の試合」の未入力行から入力』に訂正。運用節に (a)『P1 出荷前の試合（次戦を含む）は旧フォームで受け付け、後で staff がレポート行の「v2 で入れ直す（削除→代理入力・Undo 付き・怪我は残る）」で置換する』、(b)『旧形式/重複/誤日付の md は goMatchReport 行を pid で畳み（inputAt 最新を代表・2件以上は bd-a「重複 n件」＋古い方の削除ボタン・旧 md は bd-n「旧形式」）→ 確認→削除→代理入力』の段を追加し、9/5 で必ず集める項目を『出場区分・出場分・RPE・怪我・攣り・HIA』と明記。test_matchday_crud(1) に『4試合前でも squad 所属・未入力なら対象に出る』を追加。
REF: プラン P1b-12 L118 ／ §9/5 分の遡り運用 L140-144 ／ P1c-4 L127 ／ P1c-9 L132 ／ design_P1a.md L33（from=todayS−N日 <= ev.date：今日 9/8 なら 9/5 は daysAgo=3 で窓内）／ player/index.html:2750-2755 ／ 確定バグ#1/#5
SRC: 実装リスク（medium）／使いやすさ（medium）／整合性（low）

## M9. 必須項目の集合をプランで確定（代理入力で睡眠・疲労を捏造させない／逐次 alert 廃止）
FIX: P1b-5 の必須を明文化: 必須＝出場区分／出場分／RPE（minutes>0）／試合後疲労／筋肉痛／perf（minutes>0）／条件付き（怪我: injPainAt・injPainNow、攣り: crampWhen＋crampParts≥1）。任意＝睡眠h／試合前疲労／朝食（未入力はフィールドを書かない＝null。mdAsCond の sleep は sleepH>0 のみ、mdFatigueStr は既存「未入力」分岐、mdTriage の睡眠<6h は sleepH!=null のときのみ）。P1c-8 代理入力は出場区分／出場分／RPE（minutes>0）のみ必須、他は空なら書かない。検証は1回の alert に未入力項目を列挙（『出場時間・RPE が未入力です』）し先頭の該当要素へ scrollIntoView。フォームは必須ブロック（①出場・②試合後疲労/筋肉痛/perf）を上、任意ブロックを下に、送信ボタンは position:sticky;bottom。データモデル L48-57 の sleepH/preFatigue に『任意』注記、P1b-15(2)/test_matchday_proxy_staff の必須テスト期待を新集合に合わせる。
REF: プラン データモデル L48-57 ／ P1b-5 L111 ／ P1c-8 L131 ／ design_P1b.md L8-12・L69 ／ design_P1c.md L56（sleepH/pre/post 必須）／ player/index.html:2836-2859（f は睡眠・筋肉痛とも任意）
SRC: 使いやすさ（high）／使いやすさ 提案「必須項目の最小化」

## M10. _mdPending/_smdPending はメモリ変数が正・sessionStorage はミラー（jsc とプライベートモードで冪等再送を成立させる）
FIX: P1b-3・P1c-8・§設計判断「pending は sessionStorage」を『`var _mdPending=null` を正とし、保存時 try{sessionStorage.setItem('rm_md_pending',…)}、showMatchForm 描画時と doMatch 冒頭で `_mdPending||try{JSON.parse(sessionStorage.getItem(...))}` で復元（_smdPending も同型・key 'rm_smd_pending'）』に書き換え。dev/prelude.js に localStorage（L13）と同型の sessionStorage モックを1行追加（既存コードは try/catch 経由のみ＝無害）し、P1b-15(8)/P1c-15 の冪等再送テストに『prelude の sessionStorage モック前提』を明記。
REF: dev/prelude.js:13（localStorage のみ・sessionStorage 未定義）／ player/index.html:1720-1726（try/catch 握り潰し）／ プラン P1b-3 L109 ／ P1b-15 L121 ／ P1c-8 L131 ／ §設計判断 L204
SRC: 整合性（low）／実装リスク（medium）／実装リスク 提案「prelude モック」

# SHOULD FIX (19)

## S1. matchEventById を D.cal 参照同一性でメモ化し、mdsOfEvent/mdOf は idEq 先行で短絡
FIX: P1a-2 の A群に `var _mevSrc=null,_mevMap={};function matchEventById(id){if(_mevSrc!==D.cal){_mevSrc=D.cal;_mevMap={};matchEvents().forEach(e=>_mevMap[String(e.id)]=e);}return id==null?null:(_mevMap[String(id)]||null);}` を採用（D.cal は onSnapshot で丸ごと差し替わる・テストは setKey で配列差し替え＝無害）。mdBelongsTo は idEq(m.evId,ev.id) を先に試し不一致時のみ解決判定へ。4ファイル identical 同時変更。test_matchday_helpers に『D.cal 差し替え後に旧イベントが引けない』を1件。
REF: プラン §共通ヘルパー A/B群 L70-71 ／ P1a-2 L88 ／ staff/index.html:1568-1590（f/tlog 更新ごとに V[curPage]() 再描画）

## S2. 集計は pid ユニーク（mdsOfEventUniq）で数え、行表示は全件＋重複バッジ
FIX: B群に `mdsOfEventUniq(ev)`（pid ごとに inputAt 最新1件）を identical（player/staff/coach＋P1c-14 で trainer）で追加。goMatchReport/V.matchview/matchPanel/coach matchReportData/trainer matchCareList の『提出 n』『怪我 n』『HIA n』『攣り n』とピッチ idx はこれを使い、pitchProgressHtml の idx は Math.min(idx,total)。行表示は mdsOfEvent 全件のまま（重複を staff が削除できるように・mustFix 8 の bd-a「重複 n件」と連動）。
REF: プラン P1c-3/4/11 L126-127・L134 ／ P5-2 ／ P1c-14 ／ 確定バグ#5（P1 以前の同日重複 md）

## S3. delMatchDayStaff の Undo 復元分岐（pushView 中は再描画しない）と復元時の重複ガード＋__els テスト
FIX: P1c-10 の復元コールバックを `if(document.getElementById('mr-root'))goMatchReport(evKey,true);else if(!viewStack.length&&V[curPage])V[curPage]();toast('元に戻しました');` に（pushed view 中は toast のみ）。P1b-9/P1c-10 の復元 updateFn は `latest.some(idEq(r.id,rec.id))` に加え mdDupIn(latest,rec.pid,ev) も確認し、存在すれば push せず dup=true → toast('別の記録が既に登録されています')。P1b-9 の player 側は go('match') のまま。test_matchday_proxy_staff に『__els で getElementById を差し替え、mr-root 未生成かつ viewStack 空のとき V[curPage]() 経由／viewStack 非空なら再描画なし』を1ケース（critiques_partial L57 の反映漏れ）。
REF: staff/index.html:1764-1765 pushView/popView ／ 1568-1590 onSnapshot（viewStack 非空は再描画しない）／ プラン P1b-9 L115 ／ P1c-10 L133 ／ critiques_partial.md L57

## S4. approveInjury に二重送信ガードと Undo を付け、HIA カードに症状を併記
FIX: P1c-12: 1911 の onclick を `approveInjury(id,this)` にし、関数冒頭で `if(btnEl&&!guardSubmit(btnEl,'処理中…'))return;`、notFound/blocked/onError で releaseSubmit（btnEl null 許容で test_p7c.js:73-82 を維持）。成功 toast に『元に戻す』（svSafeUpdate('i') で approved=null・approvedAt/By/Role/notifyPlayer を delete。injIsHia なら svSafeUpdate('chart') で isConcussion=false。5秒内のみ）。新着怪我カードは HIA のとき hiaSymptoms を1行併記。
REF: staff/index.html:1911（onclick に this 無し）／ 8581-8590 approveInjury ／ 8602-8635 doRejectInjury/undoRejectInjury（型）／ プラン P1c-12 L135

## S5. 試合日レポートは要対応を最上段に、提出状況は折りたたみ、メンバー表との食い違いを可視化
FIX: P1c-4 の順序を『メトリクス → 要対応（rank≤6・canPractice==='参加できない' は bd-r「来週不可」常設） → 提出状況（全員提出なら1行「全員提出済み」に畳み、未提出時のみピッチ＋chip-late＋代理入力） → その他』に変更。HIA/怪我タイルに onclick で要対応節へ scrollIntoView。行に `squadRole(ev,m.pid)!==mdRoleCode(m)` なら bd-a「メンバー表: スタート」、メンバー外提出は「メンバー外の提出 n名」節に分け goSquadEditor 導線。提出 n は squad∩mds に統一し「+n」で併記（P1a-10/P1c-3/P1c-11/coach matchReportData の submitted/extraN と同定義）。
REF: プラン P1c-4 L127 ／ P1a-10 ／ P1c-3 ／ P1c-11 ／ staff/index.html:1985-1999 submissionPanel・5454-5475（canPractice 非表示の低バグ）

## S6. 試合当日の KO 前は催促を『試合後に入力』表示にする（pendingMatchChecks は変えない）
FIX: 表示側のみ: P1b-10 当日 todo は『今日の試合日チェック（試合後に入力）』、P1b-11 mypage は『今夜入力』（赤字にしない）、showMatchForm は当日かつ now<ko なら先頭に alert-info『試合後に入力してください（送信は可能）』（ブロックしない）。P1c-11 staff matchPanel は ev.ko があり now<KO+2h（ko 無しは 18:00）なら『試合後に集計（KO 14:00）』の1行にし chip-late/pitchProgressHtml を出さない。D4「当日の夜まで」と両立。
REF: プラン P1b-10 L116 ／ P1b-11 L117 ／ P1c-11 L134 ／ P1a-11 L97 ／ design_P1a.md L94（daysAgo=0 で全員未入力）

## S7. recoveryOf に『未評価』状態を追加（筋肉痛未回答で「回復良好」を返さない）
FIX: P2-2 の recoveryOf: days[] に eval:boolean（rec.soreness!=null）を持ち、recovered は『評価済み日が1日以上あり全て flags 空』のときのみ true、評価済み0なら null。recoveryLabel に k:'na' label:'筋肉痛未回答' を追加し、P2-3（player RECOVERY）・P2-4（staff リカバリー対象・回復パネル）・P2-5（coach insCondition/RECOVERY）で na 分岐を表示。test_matchday_recovery(6) に『soreness 無し→k:na』。
REF: design_P2.md L35-37（recoveryFlags/recoveryOf/recoveryLabel）／ player/index.html:2851-2859（f.soreness は任意）／ プラン P2-2・P2-3・P2-4・P2-5

## S8. sync/検証手順の整合（grep 基準・var 二重定義・trainer は関数単位・行参照・維持確認）
FIX: 完了条件（P1a-3・§設計判断 L210・検証2 L218）の grep を `grep -cE '^\s*function matchEvents\(' player/index.html staff/index.html trainer/index.html coach/index.html` 各1に改め、sync_check の二重定義検査は kind:'var' も `^\s*var NAME\s*=` の出現≥2 を NG に。P1c-15 の『B群に trainer』を『P1c-14 でコピーした9関数（＋mdsOfEventUniq）のみ files に trainer を追加。hasCondOn/pendingMatchChecks/matchChecksMissing は [player,staff,coach] のまま』に明記。P1a-17 の『test_dash.js:75-77』を『76-77＋86（リセット行）』に訂正。P1c-15 の維持確認リストに test_matchday_squad_staff.js／test_matchday_cal_staff.js（P1a）を追加。
REF: dev/sync_check.py:87（^\s*function）・146-153 ／ dev/test_dash.js:76-77・86 ／ プラン P1a-3 L89 ／ P1a-17 L103 ／ P1c-15 L138 ／ §設計判断 L210 ／ 検証2 L218 ／ critiques_partial.md L68

## S9. 当日提出済みの試合 todo を done 行として残す（P1b-10 の文言を design と一致させる）
FIX: P1b-10 を『evToday=matchEventByDate(todayS,myPid)、mdToday=mdOf(myPid,evToday)。inSquadToday||mdToday なら {key:'match'+evToday.id,done:!!mdToday,label:'今日の試合日チェック',urgent:!mdToday} を push（cond todo と置換）。pendingMatchChecks は daysAgo>0 の未提出分のみ担当（提出で消える＝test_dash.js:78-85 と整合）』と明記。
REF: プラン P1b-10 L116 ／ design_P1b.md L99・L135(2) ／ dev/test_dash.js:78-85

## S10. HIA 申告の心理的ハードルを下げる文言・却下プリセット・却下通知の表現
FIX: P1b-4 #md-hia-warn に『送信するとスタッフ・トレーナーに「HIA疑い」として届き、確認までリハビリタブが出ます。症状が無いと確認されればすぐ元に戻ります（申告して損はありません）』を追記。P1c-12 rejectInjury で injIsHia(inj) のとき理由プリセットチップ『症状なしを確認・問題なし』『医療機関で異常なし』→ #rej-reason に代入。player 2439-2446 の却下分岐で injIsHia(x)&&x.source==='match' なら見出しを『頭部の症状は「問題なし」と確認されました』（alert-info）に、理由はそのまま表示。doMatch 成功 toast は injured/HIA どちらでも『リハビリタブが表示されます』を添える。coach/trainer の表記は『脳震盪疑い（HIA）』。
REF: player/index.html:1964-1978（hasActiveInjury は approved を見ない）・2439-2446 ／ プラン P1b-4 L110 ／ P1b-5 L111 ／ P1c-12 L135 ／ P5-3/4

## S11. trainer 要ケア行を翌週初日の優先順位付けに足る粒度にする
FIX: P1c-14 の行を『名前｜(side+part+type) 痛み n/10｜来週: canPractice（「参加できない」は bd-r）｜攣り: crampWhen・crampParts』にし、行タップで md 由来の injHow/injContinued/hiaSymptoms を読み取り専用の clp で展開（trainer に goMatchDetail は無い）。approved===true の行のみ『カルテ』（既存方針）。1465/1467/1626 のリハ対象フィルタは不変。
REF: trainer/index.html:1465-1467 ／ プラン P1c-14 L137 ／ design_P3P4P5.md L164

## S12. exportCSV を buildCSV 純関数に分離し、prelude に Blob/URL/execCommand/select モックを追加
FIX: P5-7: `buildCSV(type,evId)→{fname,csv}` を新設し exportCSV は `var r=buildCSV(type,evId);if(!r.csv)return;`＋Blob/ダウンロードのみに。test_matchday_csv_staff.js は buildCSV の戻り（未提出行・GPS ソース・csvCell の "" エスケープ）を検証。dev/prelude.js に `function Blob(parts){this.parts=parts;}`・`var URL={createObjectURL:function(){return'blob:mock';}}`・`document.execCommand=function(){return true;}`・mkEl に `select:function(){}` を1回追加し、P2-6 copyText のスタブ記述を『prelude 依存』に置換。
REF: staff/index.html:5367-5381 exportCSV（Blob/URL.createObjectURL/link.click 直呼び）／ dev/prelude.js（Blob/URL 未定義・exportCSV を通す既存テスト 0件）／ プラン P5-7・P5-8 L178-179 ／ P2-6 L152

## S13. 用語表を1つ決め、各ステップの pushView/見出し文字列を明記
FIX: 選手入力＝『試合日チェック』（T.match 見出し 2752・フォーム 4321・詳細『試合日チェック 9/5 vs ○○』）／スタッフ集計＝『試合日レポート』（ナビ 368・goMatchReport タイトル）／1件詳細・修正＝『試合日チェック（選手名・日付）』（goMatchDetail/showEditMatchStaff/goAddMatchDay）／『メンバー表』（『出場選手設定』『出場選手』『メンバー選定』は全廃）。P1b-12・P1c-5・P1c-7・P1c-9 の CHANGE にタイトル文字列を書く。
REF: player/index.html:2752・4321・4370・2483 ／ staff/index.html:368・2366・5474・5481・8561 ／ プラン P1b-12・P1c-5・P1c-7・P1c-9

## S14. help の RPE 文言を同日負荷モデルに合わせる（試合翌日に試合 RPE を f に入れさせない）
FIX: P1b-13 で 2514 も『RPE：その日の練習のきつさ（1〜10）。試合の日は試合日チェックで入力』に改め、2525 の試合ブロックに『試合翌日のコンディションには試合の RPE を入れない（回復チェックとして睡眠・筋肉痛を）』を1行。P2-3 の MD+1 カード文言にも同旨。
REF: player/index.html:571-578 effDur・2512-2516・2525 ／ プラン P1b-13 L119 ／ P2-3 L149

## S15. 検証3（本番 Firestore 直結）の巡回範囲を player の自動書き込み経路を避けて明記
FIX: 検証3 に『player は選手未選択（myPid 無し）のままホームまで。mypage（描画時に ann.readBy を svSafeUpdate で既読化 2402-2413）とトレーニングタブ（tdraft 間引き同期 4875-4885）は開かない。showMatchForm のヘッダ表示確認は jsc テスト（_dom['main'] 方式）で代替』を追記。P2 の md-remind 送信後は特に実選手で mypage を開かない。
REF: player/index.html:2402-2413・4875-4885 ／ プラン 検証3 L219

## S16. staff に agoStr が無い（P2 の getLatestCond/日付計算で未定義参照）
FIX: P2-4 で staff にも `function agoStr(n){return toDateStr(new Date(Date.now()-n*86400000));}` を player/coach と同一本文でコピーし identical 登録（3ファイル）。または getLatestCond の30日窓は toDateStr(new Date(Date.now()-30*86400000)) を直書きし agoStr を使わないと明記。
REF: staff/index.html:1635-1641（monStr/weekMonday のみ）／ player/index.html:6545 ／ coach/index.html:756 ／ プラン P2-4 L150

## S17. doEditMatchStaff で evId を別試合へ移しても i.date/matchEvId は追従しないことを明記
FIX: P1c-9 に『md の evId 変更時、連結された i の date/matchEvId は書き換えない（受傷日は臨床情報＝怪我管理で修正）。編集フォームの怪我ブロックに「怪我報告の受傷日は怪我管理で修正してください」を表示』を1行追加。
REF: プラン P1c-9 L132 ／ staff/index.html:5502-5520

## S18. coach の新規マークアップは ic() を i-ball 以外で使わない
FIX: P5-2〜5 に『coach の <symbol> は i-ball 1個のみ。staff 由来のコード片（ic('i-warn')/ic('i-flag')）を持ち込まない。必要なら symbol を追加し residue ゲートを通す』を1行追記。
REF: coach/index.html:190（symbol は i-ball のみ）／ プラン P5-2〜5

## S19. docs 更新の抜け（CLAUDE.md:74 svSafeSeq・exportAllJSON と matchsel）
FIX: P1c-15 に『CLAUDE.md:74 を「svSafeSeq（player/staff/trainer identical）」に更新』を追加。P1a-18 に『HANDOFF に「matchsel は SK 外＝exportAllJSON（Object.keys(SK) 走査）の対象外・doc 残置」を明記』を追加。
REF: CLAUDE.md:74 ／ staff/index.html:5384-5390 exportAllJSON ／ プラン P1c-15 L138 ／ P1a-18 L104

# IMPROVEMENTS (11)

## I1. [推奨/S/P1c] 代理入力『保存して次の未提出者へ』（残り n名・背番号順）
WHAT: P1c-8 doAddMatchDay 成功時に matchChecksMissing(ev) を再計算し、残りがあれば toast('記録しました 残り n名','次の未提出者へ',()=>goAddMatchDay(evKey,next.id))、無ければ従来通り goMatchReport。フォーム下部に『保存して次へ』ボタン、ヘッダに『残り n名』、未提出チップは squadOf の num 昇順。
WHY: 未提出10名を埋めるのに毎回レポートへ戻る往復を半減。9/5 の遡り運用（運用節3）そのものの作業。

## I2. [推奨/S/P1c（ボタンは P1a-9）] ダッシュボードに『次の試合』行（メンバー表の登録状態）
WHAT: P1c-11 matchPanel 冒頭に nextEv=matchEvents().filter(date>todayS)[0] が7日以内なら kicker『NEXT MATCH ・ MD-n』＋matchEvTitle＋（squadOf(nextEv).length ? 'メンバー表 n名 ✓' : bd-a『メンバー表未登録』・当日は bd-r）＋『メンバー表を開く』(goSquadEditor)。『今日の予定』2073-2077 の match 行にも同ボタン（P1a-9 で行を触るついで）。
WHY: squad 未登録＝催促・todo・P2 一括催促が全て沈黙する唯一の前提を、毎日見る画面で担保する。

## I3. [推奨/M/P1a] メンバー表エディタの手間削減（前回コピー／選出のみ表示／チームシート要約／検証緩和／保存 Undo）
WHAT: P1a-8 goSquadEditor に (1)『前回のメンバー表をコピー』（matchEvents().filter(date<ev.date&&squadOf(e).length).slice(-1)[0] の squad を _squadTemp へ・D.p に居ない pid は除外して toast）、(2)『選出のみ表示』トグル＋#sq-sum 直下に num 昇順のチームシート要約、(3) saveSquad の検証を『重複番号のみ拒否』に緩め、未設定は1回の警告で続行可（reserve 扱い）・24〜30 は警告のみ（D7 の 1-15/16-23 初期提案は維持）、(4) 保存 toast に『元に戻す』（保存前 squad/squadAt を退避し svSafeUpdate('cal') で復元）。test_matchday_squad_staff に『24名でも保存できる』『コピーで前回が入る』。
WHY: 毎週23タップ＋番号確認の反復と、練習試合（24名以上帯同）が保存できない制約（design_P1a openIssues L182 が自認）を解く。全解除→保存の誤操作も戻せる。

## I4. [推奨/S/P1c] LINE 用催促テキストのコピーを P2 から P1c-4 に前倒し
WHAT: P1c-4 goMatchReport の未提出チップ直下に『LINE用テキストをコピー』（P2-4 の mdRemindText/copyText/copyMdRemind を staff ローカルで先に置く）。P2 は ann 一括送信ボタンを足すだけにする。
WHY: 9/5 の遡り運用（運用節2『LINE で周知』）が P1 完了直後に必要。2関数は依存が無く D9 の順序を変えない。

## I5. [推奨/S/P1a（フォーム）／P5（scene・CSV）] cal 試合イベントに comp（公式戦/練習試合）を追加し P5 の scene 既定と CSV に反映
WHAT: P1a-5/6/7 のフォームに select #cef-comp『公式戦 / 練習試合 / 未設定』（任意・既存は ''・doCalImport は付けない）。goMatchReport/coach 試合セレクタに bd『練習試合』。P5-6 の scene 既定を `ev.comp==='practice'?'練習試合':'公式戦'`（ev は matchEventById(inj.matchEvId)||matchEventByDate(inj.date)）。P5-7 CSV に『試合種別』『提出遅延日数』(inputAt の日付−date) 列。
WHY: detectCalType は 'vs'/'対' で練習試合も match にするため、D1 第3柱（長期分析）で公式戦（80分高強度）と練習試合（ローリングサブ）の負荷分布が混ざる。P5-6 の『公式戦』固定が INJ_SCENE の『練習試合』を誤らせる。追加フィールドのみ。

## I6. [推奨/S/P1c] HIA 承認後に chart.isConcussion が未設定の怪我を goInjuryDetail で検知し『カルテに反映』ボタン
WHAT: goInjuryDetail のヒーローに `injIsHia(inj)&&inj.approved===true&&!(getChart(inj.id)||{}).isConcussion` のとき bd-r『脳震盪フラグ未設定』＋ボタン『カルテに反映』→ hiaChartApply(inj.id,…)（roleGate('diagnosis') 経由）。テスト: chart 無し→ボタンあり、適用後→消える。
WHY: プランは hiaChartApply 失敗時に alert 案内のみで再適用経路が無い（approveInjury は approved:true 後に再実行されない）。安全ゲート（trainer trTodoBadge 1381）の起動漏れを機械的に拾える。

## I7. [推奨/S/P1b] 出場時間のクイックチップ（0/10/20/30/40/60/80）
WHAT: P1b-4 #md-min の上に chipsHTML('md-minq',[0,10,20,30,40,60,80])、選択で #md-min.value を代入して updMdLoad()。手入力も残す。P1c-7 の代理入力も同型。
WHY: リザーブは minutes が空で必須＝スマホで数値入力が要る。出場分は 10〜30 分帯に集中するのでタップ1回で埋まる。

## I8. [推奨/S/P2] MD+1〜+3 の毎日コンディションで筋肉痛を必須にし部位チップを初期展開
WHAT: P2-3 の T.condition で matchDayOffset(td) が真なら筋肉痛 rate5 を必須（doCondition で sore<1 なら alert）にし、部位チップ wrap を初期展開。それ以外の日は従来通り任意。
WHY: shouldFix の『未評価』状態と組み合わせ、回復判定の母数を確保する。D4『翌日以降の回復は毎日のコンディションで追う』の実効性。

## I9. [推奨/S/P2] 試合日に f を入れるときの二重計上防止案内
WHAT: doCondition で dateV が試合日かつ squadRole!=null かつ mdOf あり なら alert-info『この日は試合日チェック済みです。試合以外のセッション（自主練等）のみ記録してください』を出してから保存（ブロックしない）。
WHY: design_P2 openIssues が認める『同日 f+md は負荷加算』は、試合の RPE を f にも入れた選手で二重計上になる。

## I10. [推奨/S/P4（暫定は P1b）] 送信後の着地をホームに（FULL TIME『完了』→go('home')）
WHAT: P4-5 showMatchResult の『完了』を go('home') に。P1b-5 の暫定着地も、ホーム todo から開いた場合は go('home')（showMatchForm(evId,from) の第2引数）。
WHY: ホーム todo が ✓ に変わる瞬間（chk-draw 演出・player 1735 付近）が達成感を与える。今は go('match') で一覧に戻り演出が見えない。

## I11. [見送り/M/P2（計測後）] P2 の condWithMd/getLatestCond/recoveryOf を pid|date 索引（condIndex）で回す
WHAT: `condIndex(fromS,toS)` で D.f/D.md を1回走査し {pid|date:[recs]} を作り、condWithMd(pid,fromS,toS,idx) の第4引数で受ける（省略時は内部構築＝互換）。V.dash/V.fatigue/回復パネルで1描画1索引を共有。identical 3ファイル同時。
WHY: 選手60×f 全走査×3日を描画ごとに繰り返す懸念はあるが、既存の getLatestFatigue 系も同型の走査で実測問題が出ていない。matchEventById メモ化（shouldFix 1）を先に入れ、P2 実装後に実データで描画時間を計測してから判断する。

# REJECTED
- 使いやすさレビュー『必須を出場区分・出場分・RPE・筋肉痛・perf に絞る』のうち『試合後疲労の任意化』は不採用。D1 第1柱「疲労の早期把握」の主指標であり、試合直後の1タップで想起バイアスも小さい。必須集合は mustFix 9 のとおり（試合後疲労・筋肉痛は必須、睡眠h・試合前疲労・朝食を任意）に確定する。
- 実装リスクレビュー『doEditMatchStaff で evId 変更時に svSafeUpdate("i") で i.date/matchEvId を非同期追従させる』案 (a) は不採用。i は怪我管理の正典で受傷日は臨床情報のため、md 側の編集から自動改変しない（割り切り案 (b) を shouldFix 17 として採用＝フォームに『受傷日は怪我管理で修正』を明記）。
- 使いやすさレビュー『次戦前に P1a+P1b+P1c を揃えて出荷できないなら「次戦も旧形式になる」と明記して判断を仰ぐ』の問い合わせ形式は不採用。D9 の順序は固定で再質問しない。代わりに mustFix 8 で運用節に『P1 出荷前の試合は旧フォームで受け付け、後で v2 代理入力（削除→再入力・Undo 付き）で置換する』を明記して解決する。