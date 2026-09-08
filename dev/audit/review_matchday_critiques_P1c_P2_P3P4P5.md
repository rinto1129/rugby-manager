
=== CRITIQUE P1c: needs-fixes ===
- [high] メンバー表ボタン3箇所が P1a で削除される goSelectMatchMembers を呼ぶ（クリックで ReferenceError）
  detail: P1c ステップ3（UPCOMING/REPORTS カードの『メンバー表』）・4（提出状況パネルの『登録する』）・11（ダッシュボードの『登録する』）は goSelectMatchMembers(ev.id,ev.date) を呼ぶ。しかし前提の P1a 設計は手順6で staff/index.html:8905-8945（goSelectMatchMembers/toggleMatchSel/matchSelAll/saveMatchSel/matchSelTemp）を丸ごと goSquadEditor(evid) 系に差し替え、手順7で 2556/8660 の呼び出しも goSquadEditor に置換し、さらに P1a の dev/test_matchday_squad_staff.js が『goSelectMatchMembers/saveMatchSel が未定義』を検証する。現行 HEAD の goSelectMatchMembers(staff/index.html:8907) は matchsel 旧配列を読む実装なので、仮に残しても D2『matchsel は読み書きしない』に反する。P1c の未解決欄は『P1a が別名にした場合は差し替える』と条件付きだが、提示された P1a 設計は既に goSquadEditor で確定しているため条件は成立済み。
  fix: ステップ3/4/11 の3箇所を onclick="goSquadEditor('"+ev.id+"')" に確定（引数は evid のみ）。疑似イベント（id:null）では非表示のまま。P1c の未解決欄からこの項目を削除し、テスト test_matchday_report_staff.js (1)/(2) と test_matchday_dash_staff.js (3) の期待文字列を 'goSquadEditor(' に固定する。
  ref: staff/index.html:2556, 8660, 8907-8945 / P1a 手順6・7・19
- [high] dev/test_matchday_dash_staff.js が P1a と P1c で同名・矛盾する期待値＝P1c 実装で P1a テストが赤化する
  detail: P1a 手順20 が新規作成する dev/test_matchday_dash_staff.js は『試合日チェック未入力』見出し2ブロック・『残り1名（提出 1/2）』・『3日経過』バッジ・V.matchview の『提出: 0/2名』『NEXT』フラグを検証する。P1c ステップ3は V.matchview を『UPCOMING』kicker・『提出 0/2名』（コロン無し）に、ステップ11はダッシュボードを『提出 n/N』『未入力 (n名)』の matchPanel に再構成するため、これらの期待値は全て不成立になる。P1c のテスト欄は同名ファイルを【新規】と記載しており衝突を認識していない。またステップ11の削除対象『2109-2119 の旧ブロック』は HEAD 基準で、P1a 実装後は P1a 手順9 が置いた mdPend ブロック（$m().innerHTML+= 方式・pendingMatchChecks ベース）が削除対象になる。
  fix: ステップ11の削除対象を『P1a 手順9 が生成した試合日チェック未入力ブロック（mdPend）』と明記。テスト欄の test_matchday_dash_staff.js を【新規】から【P1a版を書き換え】に変更し、P1a 側の期待（NEXT/提出:/残りn名/n日経過/matchNotDone 不在）のうち維持するもの（matchNotDone 不在・5日前非表示・D.cal=[] で非表示）と置換するもの（文言）を列挙する。V.matchview の文言は P1a と揃えられるなら揃える（例: 『提出 n/N名』表記を1つに統一）。
  ref: dev/test_matchday_dash_staff.js（P1a 手順20 / P1c テスト欄）, staff/index.html:2109-2119, 2396-2414
- [high] hiaChartApply の失敗時案内が到達不能（chartUpdate は identical で onError を持たない）
  detail: staff/index.html:2875 chartUpdate(injId,fn,onDone) は staff/trainer の identical 登録（sync_manifest 211）で第4引数が無く、内部の svSafeUpdate(1276) は onError 未指定時に alert('保存に失敗しました') を出す。ステップ2/8/12 の『失敗時は toast で「評価タブの脳震盪フラグを ON」を案内』は chartUpdate 経由では実装できず、また既定 alert が出た後に onDone が呼ばれないため、ステップ8の onAll（hiaChartApply→popView→goMatchReport→toast）は chart 失敗時に画面遷移せず代理入力フォームに留まり、guardSubmit のボタンは releaseSubmit されないまま固着する。chartUpdate に引数を足すと trainer と同期変更が必要。
  fix: hiaChartApply(injId,onDone,onError) を svSafeUpdate('chart',function(latest){var i=_chartIdx(latest,injId);latest[i].isConcussion=true;latest[i].injType='脳震盪';return latest;},onDone,onError) で直接書く（_chartIdx は identical のまま呼ぶだけ）。ステップ8の onAll は『先に popView();goMatchReport(evKey);toast(...)』を行い、その後 hiaChartApply を非同期に走らせて失敗時のみ alert/toast で案内する順序に確定。ステップ12 も同じ順（V.dash()→toast→chart）。
  ref: staff/index.html:2872-2881, 1276-1286, dev/sync_manifest.json:211
- [medium] P1b 部品との名前・内容の食い違い（RATE5_LABELS/チップ部品/アイコン配列）＝identical 登録が割れる
  detail: P1b は RATE5_LABELS に fat:['元気','やや疲れ','ふつう','疲れ気味','ヘトヘト'], perf:['不調','いまいち','ふつう','良い','最高'] を追加し、汎用チップは chipsHTML(id,opts)/toggleChip(id,i)/chipVals(id)/setChips(id,vals) を定義、疲労は STRESS_EMO・perf は MOOD_EMO を使う。P1c ステップ1/7/9 は fatigue:['元気','軽い','ふつう','重い','限界']・perf:['悪い',…]・listChipsHTML/toggleListChip(id,i,val)・『STRESS_EMO 逆順 or i-face』と別名別内容で書いており、ステップ1の移植リストに STRESS_EMO/MOOD_EMO が無い（sync 欄には STRESS_EMO がある）。RATE5_LABELS は kind:'var' の identical 対象なので staff 側で独自ラベルを書くと sync_check が赤になる（正規化はコメント行のみ許容・dev/sync_check.py:126-133）。
  fix: ステップ1を『P1b が player に置いた MOOD_EMO/STRESS_EMO/SORE_EMO/RATE5_LABELS(fat,perf)/MD_ROLE_LABEL/MD_CRAMP_WHEN/MD_CRAMP_PARTS/MD_HIA_SYMPTOMS/rate5HTML/setRate5/_rate5OnChange/partChipsHTML/togglePartChip/clearPartChips/bindSorePartsToggle/chipsHTML/toggleChip/chipVals/setChips をバイト一致でコピー』に書き換え、ステップ7/9 の部品名を chipsHTML/setChips/chipVals に、疲労=STRESS_EMO・perf=MOOD_EMO・ラベルキー fat/perf に統一。sync 欄も同名で登録。
  ref: player/index.html:2769-2833, dev/sync_check.py:92-133 / P1b 手順1・2
- [medium] mdLoad の契約が P1a/P1b（旧md=0）と P1c（旧md=null）で矛盾し mdTriage の上位25% 閾値と表示に影響
  detail: P1a は mdLoad(m)=(+m.rpe||0)*(+m.minutes||0)、P1b は m.v===2?…:0 で旧 md は 0 を返す。P1c は『mdLoad→rpe*minutes|null（旧mdは null）』を前提に mdTriage で『mds の mdLoad 非null を降順ソート』し閾値を出すため、旧 md（0）が閾値計算の母集団に入り、旧 md 混在試合で上位25% が下振れする。またレポート行の『負荷 '+mdLoad(m)+' AU』が旧 md で『0 AU』になりうる（設計は mdIsV2 分岐で '-' としているが mdLoad の null 前提が残る）。v2 判定も P1c mdIsV2(v===2||rpe!=null||minutes!=null)・P1a mdFatigueStr(v===2||preFatigue!=null…)・P2 mdAsCond(rpe==null→null) と3種類ある。
  fix: mdIsV2(m)→m.v===2 を P1a 基盤の identical ヘルパー（player/staff/coach）に昇格し、P1a mdFatigueStr・P2 mdAsCond・P1c 全分岐をこれ1本に統一。mdTriage の閾値は mds.filter(mdIsV2).map(mdLoad) で計算し、負荷列は mdIsV2(m)?mdLoad(m)+' AU':'-'。P1c データ欄の『mdLoad→…|null』を P1a の定義（数値・旧md=0）に訂正。
  ref: P1a データ欄 mdLoad / P1c ステップ2 mdTriage・ステップ4 行2行目
- [medium] hiaChartApply が chart.injDetail.scene='公式戦' を自動保存＝二次記録の正典書き込み・P5-T3 と矛盾
  detail: D6 が求めるのは『承認時に chart.isConcussion=true』のみ。P1c は加えて injDetail.scene が空なら '公式戦' を書く（テスト (6) も scene==='公式戦' を要求）。一方 P5-T3 は同じ scene について『renderChartDiagnosis で source:'match' なら既定選択にする・保存は saveChartDiagnosis のみ＝自動保存しない』と明記しており、scene は source:'match' から機械的に導ける二次情報。承認操作の副作用としてカルテの受傷詳細を書き換えるのは『二次記録を正典ストアへ書かない』規約に抵触し、練習試合（cal に無い match）でも '公式戦' が固定される。injType='脳震盪' は INJ_TEMPLATES のキー（staff/index.html:601）として有効で、3399 の select・3410 の禁忌表示に乗るため問題なし。
  fix: hiaChartApply は isConcussion:true と injType:'脳震盪' のみ設定（injDetail は触らない）。テスト (6) の scene 検証を削除し『injDetail が未作成のままでも落ちない』に置換。scene の既定表示は P5-T3 に委ねる。
  ref: staff/index.html:579-601, 3399-3411, 2849-2856 / P5 手順24 (3)
- [medium] resolveMatchEvent(key) が『削除済み evId』で疑似イベント {date:evId} を作り、孤児 md が一覧から消える
  detail: P1a 未解決欄の通り delCalEvent(staff/index.html:8771 付近) は squad と md.evId を孤児化する。P1c ステップ5 は goMatchDetail で resolveMatchEvent(m.evId!=null?m.evId:m.date) を呼ぶが、evId が cal に無いと id 一致→date 一致(evId 文字列で照合→null)→疑似 {id:null,date:evId} となり fmt(evId) が数値文字列として表示される。またステップ3の行ソース『matchEvents() ∪ cal に無い md 日付』では、evId 孤児の v2 md は同日に別の cal match があると date でも evId でも拾われず、V.matchview/レポートの提出数から静かに消える。
  fix: resolveMatchEvent(key,dateHint) に第2引数を追加し、id 一致→(dateHint||key が /^\d{4}-\d{2}-\d{2}$/ のとき) matchEventByDate→疑似 {id:null,date:dateHint||key} の順にする。goMatchDetail/showEditMatchStaff/delMatchDayStaff は (m.evId,m.date) を渡す。V.matchview の疑似行は『mdsOfEvent(実イベント) のいずれにも属さない md の日付』から作る（evId 孤児も救済）。テスト (3) に『evId が cal に無い v2 md が疑似行に出て fmt が日付で描かれる』を追加。
  ref: staff/index.html:8559-8560, 8771 / P1c ステップ2・3・5
- [medium] HIA疑い判定が症状のみ＝却下・削除後もレポート/ダッシュボード/trainer 要ケアに『HIA疑い』が残り続ける
  detail: mdIsHiaSuspect(m)=hiaImpact&&hiaSymptoms.length>0 は i の状態を見ない。staff が自動起票された脳震盪 i を doRejectInjury(staff/index.html:8602)で却下（approved:false・resolved:true）しても、deleteInjury(4271)で削除しても、md 側の hiaImpact/hiaSymptoms は不変なので V.matchview の『HIA n』・goMatchReport の要対応 rank0・ダッシュボードの『HIA疑い n』・trainer ステップ14 の最上段が永続する。怪我側は mdInjuryLive で approved!==false を反映しているのに HIA だけ非対称。P1b は mdHiaLive(m)（hiaInjId→i の生死）、P5 は mdHia(m)（hiaInjId!=null||症状）と別名の述語を持つ予定で3重定義になる。
  fix: identical ヘルパー mdHia(m) を今フェーズで定義: m.hiaInjId!=null なら『idEq 一致の i が存在し approved!==false』、hiaInjId 無し（旧/未起票）なら hiaImpact&&symptoms.length>0。P1b の mdHiaLive・P5 の mdHia をこれに統合し、mdIsHiaSuspect は廃止。テスト (5)/(6) に『却下後は HIA 件数が減る』を追加。
  ref: staff/index.html:8602-8622, 4271-4290 / P1c ステップ2 mdIsHiaSuspect・ステップ14 / P1b mdHiaLive / P5 mdHia
- [medium] ステップ13 が P1a 手順10（cal.squad カスケード）と手順12（help 文言）を二重実装し、P1a の文言を上書きで消す
  detail: doDelPlayer への svSafeUpdate('cal', squad から pid 除去) は P1a 手順10 が 5067 直後に同一コードで追加済み。P1c ステップ13 は同じ連鎖をもう一段足す指示になっており、実装すると cal を2回書く。help も P1a 手順12 が 2366 を『「カレンダー」→ 試合イベントの「メンバー表」』に直し『対戦相手・KO・会場』の行を追加するが、P1c の置換文は『「カレンダー」→ 試合の「出場選手設定」』（P1a が廃止したボタン名）で、P1a が足した行を含まない。
  fix: ステップ13 を『P1a 手順10 の cal カスケードが存在することを grep で確認（無ければ追加）』『help は P1a 手順12 の文面を土台に、試合日レポート/代理入力/HIA の3行を追記（ボタン名は「メンバー表」）』に書き換える。test_matchday_dash_staff (8) は P1a の cal カスケードを検証する既存テストがあればそれに委ねる。
  ref: staff/index.html:5067, 2366-2368 / P1a 手順10・12
- [medium] cal.title/opp を HTML に埋め込む matchEventTitle の出力が未エスケープ
  detail: P1a データ欄は matchEvLabel について『escapeHtml は呼び出し側の責務』と明記し、V.calendar(2554) も escapeHtml(e.title) で出している。P1c の matchEventTitle(ev) は ev.opp/ev.title を生連結し、ステップ3/4/5/11/14 で escapeHtml を挟む記述が無い。cal.title は staff の自由入力（8672 calEventFormHTML）と TimeTree 一括インポートの自由文なので '&'・'<' を含みうる。また matchEvLabel（P1a・4ファイル identical）と matchEventTitle（P1c・staff ローカル）の重複定義。
  fix: matchEventTitle(ev)=escapeHtml(matchEvLabel(ev))+(ev.ko?' '+escapeHtml(ev.ko)+' KO':'') として『戻り値はエスケープ済み HTML』と定義コメントに明記（trainer コピー時も同じ）。テスト (1) に title に '<b>' を含む cal を置き '&lt;b&gt;' になることを追加。
  ref: staff/index.html:2554, 8672 / P1a データ欄 matchEvLabel / P1c ステップ2
- [low] doEditMatchStaff で evId を別試合に変更した後の遷移先が旧 evKey のまま
  detail: ステップ9の成功時は popView();goMatchReport(evKey) で、evKey は呼び出し元（修正前のイベント）。v2 で #emds-ev を別試合に変えると、遷移先レポートにはその md が無く『修正しました』の直後に対象行が消えたように見える。リスク欄は旧 md の date 変更についてのみ言及。
  fix: updateFn 内で確定した evId/date から newKey=matchEventKey(resolveMatchEvent(newEvId,newDate)) を取り、成功時は goMatchReport(newKey)。テスト (9) に『別試合へ移した後、移動先レポートに行が出る』を追加。
  ref: staff/index.html:5502-5520 / P1c ステップ9
- [low] 新着怪我カードの『代理』バッジは到達不能（代理入力の怪我は approved:true で pendingInj に載らない）
  detail: pendingInj は !x.approved の怪我だけ（staff/index.html:1807）。ステップ8の代理入力は approved:true で起票するため 1911 の x.proxy 分岐は常に偽。一方、proxy の怪我が実際に並ぶ V.injury の injCard(2193)・goInjuryDetail(2898) のヒーローには『代理入力』『【HIA】』『試合で受傷（md へ戻る）』の表示が無い。
  fix: 1911 の proxy 分岐を削除し、injCard(2193) と goInjuryDetail ヒーローに injIsHia→『HIA』bd-r・inj.proxy→『代理入力（recordedBy）』bd-b・inj.mdId→『試合日チェックを開く』(goMatchDetail(inj.mdId)) を追加する（ステップ12 の『任意』を必須に格上げ）。
  ref: staff/index.html:1807, 1911, 2193, 2898-2904
- [low] HIA 承認・代理入力でのカルテ書き込みが roleGate を経由しない（strict 切替時の整合）
  detail: chart.injType/isConcussion は既存では applyInjTemplate(3476)/toggleConcussion(3519) から書かれ、ROLE_ACL(4115) の diagnosis/eval は 'trainer'（soft=両者可・strict=トレーナー専任）。hiaChartApply は staff から無条件に chart を書く。approveInjury 自体は ROLE_ACL に無い（approveRtp/approveRtest のみ）ので現状通りで良いが、CLAUDE.md『リハ関連の新ボタンは全て roleGate/roleGuard 経由』に照らすと chart 側は roleGate('diagnosis') を見るのが整合的。
  fix: hiaChartApply の入口で if(!roleGate('diagnosis')){toast('脳震盪フラグはトレーナーがカルテで設定します');return onDone&&onDone();} を置く（soft では素通り）。
  ref: staff/index.html:4113-4135, 3476, 3519
- [low] 代理入力フォームの選手切替時に『入力済み』カードと disabled が残る／jsc テストでの mr-root 判定
  detail: ステップ7の smdSyncSquad は dup があれば #smd-dup を出し記録ボタンを disabled にするが、_pSearchOnSelect で別選手に切り替えた際に #smd-dup を消して disabled を戻す記述が無い。またステップ10 の Undo は document.getElementById('mr-root') の有無で分岐するが、dev/prelude.js:34 の getElementById は常に要素を返すため、テスト (10) では常に goMatchReport(evKey,true) 側に入る（実ブラウザと分岐が違う）。
  fix: smdSyncSquad(pid) の冒頭で #smd-dup を空にし記録ボタンの disabled を解除してから dup 判定する。テストは test_dash_staff と同様に __els マップで getElementById を差し替え、'mr-root' 未生成時に V[curPage] 側へ落ちることも1ケース入れる。
  ref: staff/index.html:1657, dev/prelude.js:33-42 / P1c ステップ7・10
- [low] 検証済み（問題なし・記録のみ）
  detail: (a) 新規保存経路は svSafeSeq/svSafeUpdate のみ・svRec 廃止・confirm 撤去・生hex 無し・.rv-armed 直書き無し・短いキー('md','i','r','chart','cal')のみ。(b) svSafeSeq は player 1015 と trainer 850 が正規化後一致（dev/sync_check.py の normalize で実照合）し staff に不在＝移植して identical [player,staff,trainer] 登録は妥当。staff は i-check/i-face-1〜5/i-pain-1〜5/i-ball/i-warn/i-heart 等の symbol と .bd-b/.bd-p/.bd-n/.chip-late/.flag/.kicker/.g4 を持つ。PARTS/INJ_TYPES は player と同一。(c) 旧 md（role 文字列・fatiguePre/Post・sleepTime/wakeTime・evId 無し）は mdRoleLabel/mdFatigueStr/mdSleepStr/mdIsV2 分岐で読める。(d) 代理入力の i は approved:true/source:'match' で V.injury(2181)・reqQueue(1663)・trainer 1465/1626 の既存フィルタに整合。(e) dev/test_p7c.js 73-82 は V.dash/toast をスタブし getCurrentUserName('staff')='スタッフ'、prelude の runTransaction は Promise 連鎖のみで drainMicrotasks 1回で完走＝svSafeUpdate 化後も緑。test_dash_staff は D.cal=[]/D.md=[] で matchPanel 空・新着怪我バッジ '<span class="bd bd-r">1</span>' 不変。test_mstat 113・t
  fix: なし
  ref: staff/index.html:1263-1298, 2875, 4093-4098 / dev/prelude.js:45-69 / dev/test_p7c.js:6-13, 73-82
MISSED:
  * staff/index.html:4641（goPlayerDetail『最近の入力記録』の md 行）: slice(0,3) が配列順で未ソート・クリック不可。inputAt 降順に直し goMatchDetail(r.id) へのリンクと『代理』表示を付ける（P1c 目的(2)の試合起点化と同じ画面群）
  * staff/index.html:2193（V.injury injCard）と 2898（goInjuryDetail ヒーロー）: injIsHia→『HIA』・inj.proxy→『代理入力』・inj.mdId→『試合日チェックを開く』が無い（設計は 2193 を任意扱い）
  * staff/index.html:2197（V.injury の承認待ちバナー）: HIA 件数を『うち HIA n件』で併記しないとダッシュボード以外で HIA を見落とす
  * staff/index.html:8771 付近 delCalEvent: 試合イベント削除時に squad/md.evId が孤児化する（P1a 未解決）。P1c 側で最低限『md がある試合は削除前に alert で件数警告』または resolveMatchEvent の date 救済（finding 参照）を入れる
  * dev/test_matchday_squad_staff.js（P1a 手順19）: 『goSelectMatchMembers が未定義』『V.calendar に goSelectMatchMembers 文字列が無い』の既存アサートが P1c ステップ3/4/11 の実装で維持されるか run_tests で確認する項目がテスト欄に無い
  * HANDOFF.md:34, 57-60: P6 積み残し『試合日記録の新規代理入力』の消し込みとフェーズ表への P1c 行追加（既存フェーズは全て HANDOFF 更新コミットを伴う運用）
  * dev/sync_manifest.json: mdIsV2/mdHia（統一版）/matchEventTitle(escape済み) を identical に登録する行が sync 欄に無い（現状は staff ローカル扱い）。P2/P5 が同名を再定義しないよう P1c で登録しておく
  * staff/index.html:1663 reqQueue.pendingInj: HIA を先頭に並べるソートが無い（ダッシュボードの pendingInj 1807 だけ並び替える設計だが、updateQueueBadge の文言や他画面には反映されない。少なくとも reqQueue 側で同じ比較関数を共有する）

=== CRITIQUE P2: needs-fixes ===
- [high] showMatchForm の引数が P1b（evId）と食い違う（step 5(c)・step 11 は日付を渡している）
  detail: P1b step 4 は showMatchForm(evId) に全面改修し、id で見つからない場合は matchEventByDate(todayStr(),myPid)→pendingMatchChecks 最新→null へフォールバックする。P2 step 5(c) の『入力する(showMatchForm(td))』と step 11 の onclick="showMatchForm('"+a.refDate+"')" は日付文字列を渡すため matchEventById は必ず null になり、催促対象（例: 3日前の試合）ではなく『今日の試合』または『直近の未提出』が開く。さらに P2 の前提文『showMatchForm(dateArg) が4ファイル（少なくとも player/staff/coach）に identical 登録』は誤り＝showMatchForm は player 専用（staff は goAddMatchDay・coach/trainer に入力フォームは無い）。現行 player/index.html:4321 は引数なし（date 固定）。
  fix: step 5(c) は showMatchForm(evT.id)、step 11 は var evR=(a.refEvId!=null?matchEvents().find(idEq(e.id,a.refEvId)):null)||matchEventByDate(a.refDate); evR があるときのみ showMatchForm(evR.id) ボタンを出し、無ければ『試合が見つかりません』文言。前提文から showMatchForm を identical 一覧から外し『P1b の showMatchForm(evId)（player 専用）』と明記。テスト(13)の期待も showMatchForm('900' を含む、に変更。
  ref: player/index.html:4321 / P1b step 4,11 / P2 step 5(c),11
- [high] mdAsCond の旧md判定 rpe==null が、P1b/P1c の『出場なし・minutes 0 は rpe 省略』と衝突し v2 md を分析から落とす
  detail: P1b step 6 は minutes==0 のとき rpe/perf フィールドを書かない、P1c step 8 も rpe:rpe||null。P2 の mdAsCond は if(!m||m.rpe==null)return null なので、この v2 md（sleepH・preFatigue/postFatigue・soreness を持つ）が仮想レコードにならない。結果: (1) 試合当日 T.condition で todayDone=false→『本日入力済み』カードが出ず通常フォームだけ残る（todo は P1b で done 扱い＝不整合）(2) recoveryOf.base が null (3) 睡眠・筋肉痛が coach condDaily/avgSleepCalc/insCondition から抜ける (4) condWithMd の同日 f 合流条件 m.rpe!=null も同様に外れる。hasCondOn だけは true になるため提出率と一覧の整合も崩れる。
  fix: v2 判定を P1a の mdFatigueStr と同基準 var isV2=m.v===2||m.preFatigue!=null||m.postFatigue!=null||m.sleepH!=null; にし、旧md（isV2 false）のみ null。v2 は rpe:(m.rpe!=null?m.rpe:null) で返す（avgOf・recoveryFlags・chart は null 安全、condLoad→mdLoad=0）。condWithMd の合流条件も m.rpe!=null ではなく isV2 判定に。test_matchday_recovery.js に『v2 role none・rpe 無し→仮想行あり・rpe null・sleep 7』ケースを追加。
  ref: P2 dataModel mdAsCond/condWithMd / P1b step 6 / P1c step 8
- [high] getMyInsights の『試合後の回復』ルールに日付窓が無く、古い試合で恒久的に warn/info が出続ける
  detail: step 8 は lastEv=matchEvents().filter(date<today&&inR(date)).slice(-1)[0] で『期間内（既定90日）の最後の試合』を取り、recoveryOf(pid,lastEv) を評価する。試合から 4日以上経つと days は全て過去（due=3）なので、f が無ければ k='none'→『試合後の回復チェックが未入力です』、MD+1〜+3 に筋肉痛3以上が1日でもあれば k='ng'→『回復が追いついていません』が、次の試合まで（数週間）マイデータ考察と月曜の weeklyReviewCardHtml（2042・上位3件に自動で乗る）に出続ける。
  fix: var nd=Math.round((new Date(todayStr()+'T00:00:00')-new Date(lastEv.date+'T00:00:00'))/86400000); if(lastEv&&nd>=1&&nd<=7) に限定（'none' は nd<=3 のみ、'ng'/'ok' は nd<=7）。テスト(11)に『8日前の試合では出ない』を追加。coach step 24 は matchDayOffset(今日) で MD+1〜+3 に限定済み＝整合。
  ref: player/index.html:6606-6612 / player/index.html:2042 / P2 step 8
- [medium] 個別催促を一括送信すると staff ダッシュボードのお知らせ一覧（直近8件）が md-remind で埋まる
  detail: staff/index.html:2150 は D.ann を date 降順で slice(0,8) し、個人宛は『個人: 名前』『既読0/1』で1件ずつ描画する。step 19 で未提出者 N 名（試合直後は 10〜20名）に kind:'md-remind' を N 件追記すると、全体お知らせが一覧から押し出され、以後の投稿確認・修正/削除導線（showEditAnnounce/delAnnounce）が使いにくくなる。player 側は targetPid 個別なので影響なし。
  fix: 2150 の一覧を D.ann.filter(function(a){return a.kind!=='md-remind';}) にし、md-remind は refEvId ごとに『試合日チェック催促 9/5 vs A大: n名（既読 m）』の1行に集約（クリックで goMatchReport）。集約行に『取り消す』（undoMdReminders(ids)）を置けば Undo 期限切れ後の削除も confirm 無しで満たせる。
  ref: staff/index.html:2150 / P2 step 19
- [medium] V.fatigue の仮想行から呼ぶ showEditMatchStaff/delMatchDayStaff（P1c 版）は完了後に試合レポートへ遷移し、疲労度画面に戻らない
  detail: P1c step 9/10 は成功時に popView(); goMatchReport(evKey) を固定で呼ぶ。V.fatigue はメインページ（viewStack 空）なので popView() は nav(curPage)=fatigue を再描画した直後に goMatchReport で試合レポートを push する＝修正/削除のたびに画面が飛ぶ。step 15 の onclick="showEditMatchStaff('id','date')" は第2引数を date（evKey として date 文字列）で渡す前提だが、戻り先を指定する手段が無い。Undo の復元コールバック（P1c: mr-root があれば goMatchReport(evKey,true) else V[curPage]()）は V.fatigue でも動くが、削除直後の遷移が先に起きる。
  fix: P1c の showEditMatchStaff/doEditMatchStaff/delMatchDayStaff に第3引数 opts={back:'report'|'page'} を足し、'page' なら成功時に popView() だけ／削除は V[curPage]() 再描画で戻す。P2 step 15/16 は back:'page' を渡す。代替: V.fatigue の仮想行は修正/削除ボタンを置かず『試合レポートで修正』リンク（goMatchReport(evKey)）にする。
  ref: staff/index.html:1768 (popView) / P1c step 9,10 / P2 step 15
- [medium] step 14 の HIA タグ判定が承認状態を見ない（却下済み HIA でも最上位に残る）
  detail: 『試合後リカバリー対象』の ①HIA は m&&(m.hiaInjId||(m.hiaImpact&&(m.hiaSymptoms||[]).length)) で判定しており、staff が却下（approved:false）した HIA 起票でも pri=5 で最上段に出続ける。②怪我は mdInjuryLive（approved!==false）で正しく除外しているため非対称。承認ルール（player/match 起票=要承認・却下は無効）と不整合。
  fix: P1b の mdHiaLive(m)（hiaInjId 一致の i が approved!==false）を identical に昇格して使う: hia=m&&(mdHiaLive(m)||(m.hiaInjId==null&&m.hiaImpact&&(m.hiaSymptoms||[]).length))。coach P5 の mdHia も同じ判定に揃える。テスト(4)に『HIA 却下後は HIA タグが消える』を追加。
  ref: P2 step 14 / P1b dataModel mdHiaLive / staff/index.html:8591 rejectInjury
- [medium] onSnapshot の要対応バッジ更新トリガに md が無く、試合日チェック提出でレッドフラグ/督促が更新されない
  detail: step 13 で reqQueue.red（getLatestCond）と late（hasCondOn）が md に依存するようになるが、staff/index.html:1583 は if(k==='i'||k==='rtest'||k==='f')updateQueueBadge(); のみ。md の snapshot ではバッジが再計算されず、md で睡眠4.5h のレッドフラグ追加や、md 提出で late から外れる変化が次の f/i 更新まで反映されない。
  fix: 1583 を if(k==='i'||k==='rtest'||k==='f'||k==='md')updateQueueBadge(); に変更（P2 step 13 の一部として明記）。
  ref: staff/index.html:1583
- [medium] goPlayerDetail『最近の入力記録』で仮想行が『コンディション』として二重表示される
  detail: step 16 で fRecs=condWithMd(pid) にすると、4639 の fRecs.slice(0,5) に _fromMd の仮想行（inputAt=md.inputAt）が入り、4641 の D.md 由来『試合日』行と同じ提出が2行並ぶ。
  fix: 4639 を fRecs.filter(function(r){return!r._fromMd;}).slice(0,5) に。同日 f+md の f コピー（_md 付き）は f として1行でよい。
  ref: staff/index.html:4638-4641
- [medium] copyText のフォールバック検証は prelude に execCommand と textarea.select が無く、設計どおりのテストでは通らない
  detail: dev/prelude.js:22-45 の document モックは execCommand を持たず、mkEl() にも select() が無い。step 19 の『navigator.clipboard が無ければ textarea+document.execCommand('copy')』経路は jsc では TypeError→alert 経路に落ちる。P2 テスト(12)『無しで execCommand フォールバック』はテスト内スタブ無しでは赤になる。navigator は var 宣言（プロパティ追加は可）。
  fix: copyText 実装で var ta=document.createElement('textarea'); if(typeof ta.select==='function')ta.select(); と document.execCommand の存在チェックを入れる。テスト(12)では document.execCommand=function(){return true;} と、mkEl 相当に select を足す stub（var _ce=document.createElement;document.createElement=function(t){var e=_ce(t);e.select=function(){};return e;}）を明記。
  ref: dev/prelude.js:22-45 / P2 step 19
- [medium] mypage のコンディションカードは D.f のみ＝試合当日に md を提出しても『コンディション入力』未入力カードが残る（P1b/P2 のどちらも触っていない）
  detail: player/index.html:2373 の lf/todayDone と 2472-2473 のカードは D.f だけを見る。D5『試合当日は f を書かない』により、試合日チェック済みでもマイページに未入力カードが出て、ホーム todo（P1b で done）と食い違う。P1b step 13 は 2483 の試合カードのみ変更。
  fix: P2 step 11 と同じ箇所で todayDone=hasCondOn(myPid,todayStr()) に置換し、myLatestF が無く md がある場合は『試合日チェック入力済み → 詳細』カード（showMatchDetail）を出す。test_cond.js 29-30 の mypage アサーションは D.md=[] で不変。
  ref: player/index.html:2373,2472-2473
- [low] getTodayCondition で前日が試合のとき『前日の練習がハード(RPE8)』と『昨日は試合（RPE8…）』が二重に reasons へ入る
  detail: 5418-5422 の既存ルール（yestRec.rpe>=8→'前日の練習がハード'）は仮想行にもそのまま当たり、step 6 の追加 reason と両方表示される。文言も『練習』で誤り。
  fix: 既存ルールを if(yestRec._fromMd){...試合文言...}else if(yestRec.rpe>=8){...} の分岐にする。テスト(10)で reasons に『練習がハード』を含まないことを確認。
  ref: player/index.html:5418-5422 / P2 step 6
- [low] mdMissingFor の『role==="none" を除く』は squad 要素に role が無いため無意味で、P1c matchChecksMissing と形も違う
  detail: P1a の squad は [{pid,num}]・squadRole は 'start'|'reserve'|null で 'none' は返らない（'none' は md.role の値）。P1c step 2 の matchChecksMissing(ev) は選手オブジェクト配列を返すが、P2 の mdMissingFor は [{p,role,num}] を期待しており『同等関数があれば流用』が成立しない。
  fix: mdMissingFor を削除し、P1c の matchChecksMissing(ev)（D.p 在籍・mdOf 無し）を使う。mdRemindText/sendMdReminders は p 配列を受け、num は squadOf(ev).find(idEq(pid)).num で引く。role フィルタ文言は削除。
  ref: P1a dataModel squad / P1c step 2 / P2 step 19
- [low] recoveryOf は ev が null のとき ev.date で TypeError（仕様文は ev null を許容している）
  detail: var md=ev?mdOf(pid,ev):null; の直後で new Date(ev.date+...) を無条件に呼ぶ。現状の呼び出し（step 8/10/14/18/23/24）は非 null を渡すが、P5 以降の再利用で落ちる。
  fix: 先頭に if(!ev||!ev.date)return null; を置き、recoveryLabel(null) が {k:'wait'} を返す既存分岐で吸収。
  ref: P2 dataModel recoveryOf
- [low] coach charts.cond の◆マーカーは P2 step 22 と P5 step 20 が同じ改修を二重に設計している
  detail: 両方が renderConditionView 2096-2099 の pointRadius/pointStyle 配列化とキャプション追加を行う。P2 は condDaily の match フラグ、P5 は matchEvents の mset で判定＝実装順によっては二重定義・差分衝突になる。
  fix: P2 で実装し、P5 step 20 は『P2 実装済み＝tooltip title の（試合日）付加と pointHoverRadius のみ追加』に縮小する。
  ref: coach/index.html:2096-2099 / P5 step 20
- [low] getLatestCond/condWithMd を毎描画で全選手分呼ぶ計算量（reqQueue・V.dash fa・V.fatigue teamData）
  detail: condWithMd(pid) は D.f 全走査＋浅いコピー＋ソートを選手ごとに行い、reqQueue は nav() と f/i/rtest snapshot ごとに走る。旧 getLatestFatigue も per-player filter+sort だったので同オーダーだが、コピー分だけ増える。試合レポートの recoveryOf は選手×3日で condWithMd を呼ぶ。
  fix: 許容範囲だが、getLatestCond は condWithMd(pid,agoStr(30),null) など窓付きにして走査量を抑える（最新が30日以上前なら null→従来と同じ『未入力』扱い）。
  ref: staff/index.html:1672,1780,2264 / P2 step 12-14
MISSED:
  * player/index.html:2373,2472-2473 — mypage コンディションカードの todayDone/入力済み表示（D.f のみ・試合当日 md 未反映）
  * staff/index.html:1583 — onSnapshot の updateQueueBadge 発火条件に 'md' を追加
  * staff/index.html:4638-4641 — goPlayerDetail allSubs の仮想行除外（試合日行との二重表示）
  * staff/index.html:2150 — ダッシュボードお知らせ一覧の kind:'md-remind' 除外/集約
  * player/index.html:5418-5422 — 前日ルールの試合分岐（文言重複）
  * player/index.html:1697 — P1b step 11 適用後は cond push が else 分岐内に移る＝step 4 の挿入位置を『P1b の else 分岐内』と明記
  * coach/index.html:2096-2099 — P5 step 20 と重複（一方に統合）
  * dev/prelude.js:22-45 — copyText テスト用の document.execCommand / textarea.select スタブ（テスト側で追加）

=== CRITIQUE P3P4P5: needs-fixes ===
- [high] mdHia(m) が却下済み HIA を拾う＋HIA判定ヘルパーが3フェーズで3種類に分裂（mdHiaLive/mdIsHiaSuspect/mdHia）
  detail: P5 dataModel 6 の mdHia は `m.hiaInjId!=null || (hiaImpact&&symptoms.length>0)`。hiaInjId は P1b doMatch が i を自動起票した時点で md に固定され、staff が却下（doRejectInjury staff/index.html:8602-8616 で approved=false かつ resolved=true）しても md 側は残る。よって coach matchReportData.hiaN / insMatch の lv:'bad' / trainer matchCareList rank0『HIA疑い』が却下後も立ち続け、D7・dataModel(f)『approved!==false』に反する。さらに trainer 行の承認表示は `row.inj.approved===true?'':'スタッフ承認待ち'` なので approved===false の行が『承認待ち』と表示される。P1b は mdHiaLive(m)（hiaInjId→D.i idEq & approved!==false）、P1c は mdIsHiaSuspect(m)（md フィールドのみ）を既に定義しており、P5 が第3の名前を増やしている（観点 b/d）。
  fix: mdHia を新設せず、P1c の mdIsHiaSuspect を identical（player/staff/trainer/coach）へ昇格して『申告ベースの疑い』に使い、『生きている HIA 怪我』は P1b の mdHiaLive を trainer/coach にもコピーして使う。coach hiaN・trainer rank0 は `mdIsHiaSuspect(m) && !(m.hiaInjId!=null && !mdHiaLive(m))`（却下済みは除外）にする。trainer matchCareList は inj が存在し approved===false の行を除外（または『却下済み』ラベル）。sync 節の『mdHia{4ファイル}』を『mdIsHiaSuspect{4}・mdHiaLive{4}』に差し替え。
  ref: P5 dataModel 6 / step17 / step23 / P1b step3 mdHiaLive / P1c step2 mdIsHiaSuspect / staff/index.html:8602-8616
- [high] trainer tsUseMatch の onclick に JSON.stringify(nx.date) を埋めると属性が壊れてボタンが死ぬ
  detail: P5-T3(2) は `onclick="tsUseMatch('+JSON.stringify(nx.date)+')"` を指定。日付文字列を JSON.stringify すると `"2026-09-13"` と二重引用符付きになり、二重引用符で囲んだ onclick 属性が途中で終端する（`onclick="tsUseMatch("2026-09-13")"`）。既存の staff 6533 `JSON.stringify(s.id)` は数値 id だから無事なだけで、文字列には流用できない。
  fix: `onclick="tsUseMatch(\''+nx.date+'\')"`（YYYY-MM-DD は引用符を含まないので単引用符埋め込みで安全）。テスト (5) に『生成 HTML が tsUseMatch(\'20 を含む』を追加して回帰ガード。
  ref: P5 step24(2) / trainer/index.html:4032
- [high] coach に chip() 関数が存在しない → matchHomeCards が ReferenceError で概況全体が落ちる
  detail: P5-C3 の前戦カードは `chip('提出 '+r.submitted+'/'+r.squadN)` / `chip('平均RPE …')` を関数呼び出しで書いているが、coach/index.html には `.chip` CSS（133行）と weeklyReportCard 内ローカルの `dchip`（1640行）しか無く、グローバル chip() は無い。試合イベントが1件でも登録された時点で renderHomeView が例外で止まり、coach の概況タブが空になる。
  fix: `'<span class="chip">'+…+'</span>'` をインラインで書くか、coach 専用 `function chipHtml(t){return '<span class="chip">'+t+'</span>';}` を matchHomeCards の直前に置く（登録不要）。dev/test_matchday_p5_coach.js (5) は cal あり・squad ありで renderHomeView を実行し例外が出ないことを主張に含める。
  ref: P5 step18 / coach/index.html:133,1640
- [high] P3-6/7/8/25 が依存する staff の試合日画面は P1c で goMatchReport(evKey,replace) に改名・replace パスは pushView を通らない
  detail: P1c step4 は goMatchDateDetail(date) を薄いエイリアスにし本体を goMatchReport(evKey,replace) に置換、Undo 復元時（P1c step10）は `replace=true` で `$m().innerHTML=h` のみ＝pushView の第3引数コールバックは呼ばれない。P3-6 は『pushView の第3引数コールバックで mdSessLoad』と書いているため、削除→元に戻すの再描画では GPS プレースホルダ（mdd-g-*/mdd-u-*/#mdd-gsum）が永久に空のまま。加えて P3 step8/25 と P2 step18/20 は `goMatchDateDetail(...)` を呼ぶ前提で書かれており、P1c の疑似イベント（id:null）を渡す経路（ev.id を渡すと null）で解決に失敗する。P3-6 の要素 id `'mdd-g-'+ev.id+'-'+pid` も疑似イベントでは 'mdd-g-null-…' になる。
  fix: (1) 非同期ロードを `function mrLoadSess(ev){…mdSessLoad(…)}` に切り出し、goMatchReport の pushView 経路（fn）と replace 経路（innerHTML 直後に `setTimeout(function(){mrLoadSess(ev);},0)`）の両方から呼ぶ。(2) 要素 id は P1c の matchEventKey(ev)（id無しは date 文字列）で `'mdd-g-'+key+'-'+pid`。(3) P3 step8 / step25 / P2 step18・20 の呼び出しを `goMatchReport(matchEventKey(ev))` に統一し、goMatchDateDetail は互換エイリアスとしてのみ残す旨を P3 冒頭の『未解決』から『確定』に格上げする。
  ref: P3 step6(4)/step8/step25 ・ P1c step4/step10 ・ P2 step18/20 ・ staff/index.html:1764 pushView
- [medium] CAPS バッジの pts=BPTS.club（既定10pt＝最高単価）が badgePts ランキングと staff バッジ一覧の合計を歪める
  detail: STD_DEFAULT.badgePts（player/index.html:506）は club:10 で単一バッジ最高点。MD_CAPS_MILESTONES 6段階を全て club 点で加算すると 1 選手最大 60pt（BIG3クラブ 10pt・皆勤賞 3pt と比較して桁違い）。この totalPts は player ランキングの『バッジPt』種目（player/index.html:3477, 3522）と staff renderBadgeListStaff（staff/index.html:933）の合計に直結し、出場数で測定会由来のランキングが上書きされる。また getStdCfg（player:517）は badgePts の既知キーしかコピーしないため、将来 'caps' キーを足すには STD_DEFAULT・getStdCfg（identical 3ファイル）・V.standards UI（staff:8986/9074）の同時変更が必要＝設計が避けた通りだが、代替として club を流用するのは副作用が大きすぎる。
  fix: P4 では `pts:0`（表示は '+0'）か `pts:BPTS.pb||0`（自己ベストと同じ 1pt）に固定し、cat:'caps' で区別できるようにしておく。ポイント設計は openIssues のまま凛人判断待ちとする。test_matchday_p4_player (4) に『caps バッジの pts が club 点でない』を追加。
  ref: P4 step10 / player/index.html:506,517,1170,3477,3522 / staff/index.html:933
- [medium] P4-2 の computeAllBadges 追加コードに『同日 md の dedupe』が無い（本文とテスト(4)が要求）
  detail: step10 の変更文は『念のため date で dedupe（同日2件は1キャップ）』と書き、テスト (4) も『同日重複 md は1キャップ』を主張するが、示されたコード片は pid ごとに mdIsCap の md を push→date 昇順ソートするだけで重複を落としていない。P1 の重複ガード前に作られた旧データ（確定バグ #5 で『何件でも作れる』と確認済み）が本番に残っていれば、CAPS が水増しされ『5 CAPS』が早期に付く。
  fix: list 構築時に `var seen={};` を持ち `if(seen[m.date])return;seen[m.date]=1;` で date 単位に畳む（evId 無しの旧 md は date、v2 は evId 優先で key を `String(m.evId!=null?m.evId:m.date)` にすると同日2試合を区別できる）。identical のため player/staff 同一ソースで。
  ref: P4 step10 / player/index.html:1279 / staff/index.html:7267
- [medium] P5-C5（charts.cond 試合マーカー）が P2 step21-22 と同一箇所を二重実装しコンフリクトする
  detail: P2 step21 は condDaily の戻り値に `match:!!matchEventByDate(ds)` を追加し、step22 で同じ 2097/2098 の dataset に pointRadius/pointStyle 配列と canvas 直下の『◆＝試合日』キャプションを入れる。P5-C5 は matchEvents() から独自に isM 配列を作り、同じ dataset に pointRadius/pointStyle/pointHoverRadius を追加し、secH の sub に別の『◆＝試合日』を付ける。順番通り P2→P5 で実装すると同一オブジェクトリテラルに pointRadius が2回現れる（後勝ちで片方が死ぬ・レビューで混乱）、キャプションが2箇所に出る。テストも P2 (2) と P5 (6) で重複。
  fix: P5-C5 を『P2 前提の差分』に書き直す: condDaily(P2) の d.match を使い、追加は pointHoverRadius と tooltip title の『（試合日）』のみ。secH sub の文言変更は P2 のキャプションと重複しないよう片方に統一。P2 未着なら P5-C5 は P2 step21-22 をそのまま実施する、と依存順序を明記。
  ref: P5 step20 / P2 step21-22 / coach/index.html:823-836,2096-2098
- [medium] trainer への P1a ヘルパー再配置と P1c step14（任意の trainer 要ケアカード）との二重定義・二重実装
  detail: P5-T1 は trainer/index.html:222 直後に matchEvents/matchEventByDate/squadOf/squadRole を含む一式を『P1a のソースをそのままコピー』と書くが、P1a step15 は既に trainer:907（idEq 直後）へグループA 5関数を配置済み。同名 function を2回宣言すると後勝ちで動くが、sync_check の extract_block は最初の出現しか照合しないため『登録上は一致・実行時は別実体』という検出不能のズレになる。同様に coach では P1a step16 が coach:315 に13関数を配置済みなのに P5-C2 は『coach:1528 POS_NUM 直後に P1a identical 群』と再配置を指示している。さらに P1c step14（採用時）は trainer に md 購読＋mdTriage/injIsHia/mdsOfEvent ベースの要ケアカードを入れるが、P5-T2 は別実装の matchCareList/matchCareCardHtml を新設し、P1c-14 の扱いに一切触れていない。
  fix: P5-T1: trainer へコピーするのはグループB（mdOf/mdRoleLabel/mdInjuryLive＋mdHiaLive/mdIsHiaSuspect）のみ、グループAは grep で存在確認して追加しない。P5-C2: coach へは mdRoleCode/mdIsCap/matchStatsFor のみ追加、P1a 群は 315 の既存を使う。P5-T2 冒頭に『P1c step14 を採用済みなら SK/D 追加は済み、mdTriage 版カードを削除して本ステップの matchCareCardHtml に置換（injIsHia/mdIsHiaSuspect/mdsOfEvent は流用）』の分岐を明記。実装前に `grep -n '^function matchEvents\|^function mdOf' */index.html` でヒットが各1回であることを完了条件に入れる。
  ref: P5 step17/step22 / P1a step15(trainer:907)・step16(coach:315) / P1c step14 / dev/sync_check.py extract_block
- [medium] GPS ウィザードの evId が『練習』セッションに漏れて保存される（gpsSetType/gpsReadMeta の仕様）
  detail: P3-1 は gpsSetType で『evId は保持（kind のみリセット）』とし、gpsReadMeta は `var ev=document.getElementById('gps-ev');if(ev)st.meta.evId=ev.value||''` と select が描画されている時だけ読む。試合スタッツで試合を選んだ後 GPS タブへ戻ると kind='practice'・select 非表示・evId は残る→そのまま保存すると gs 索引に kind:'practice' かつ evId 付きの行が生まれ、dataModel の『練習セッションや手入力日付では付けない』に反する。sessForEvent は evId を最優先で採用するため、この練習 GPS が試合の GPS として md に結合される（needMatchKind の date フォールバックより前に拾われる）。
  fix: gpsReadMeta を `st.meta.evId=(ev?(ev.value||''):'')` にして select 非表示時は必ずクリア。gpsDoSave の meta 組立で `evId:(st.type==='match'||st.meta.kind==='match')?st.meta.evId:''` とし、gpsCommit/mstatCommit 側は非空のときだけ付与（既存案のまま）。test_matchday_p3_staff (4) に『kind practice で保存すると evId キーが付かない（evId 残留時も）』を追加。
  ref: P3 step1/step3 / staff/index.html:6245 gpsSetType, 6246-6252 gpsReadMeta, 6342 gpsDoSave
- [medium] player に .ghost-host クラスは存在せず、.card は position:relative を持たない→ゴースト背番号がカード外へ飛ぶ
  detail: P4-4(4) は『class card ghost-host』を前提にするが、player/index.html の CSS に .ghost-host は無い（grep 0件）。.ghost-num（132行）は position:absolute で、親に position:relative がある .hero（159-161）/.myphys-card（124）/.rail-card（194）でしか正しく収まらない。.card（64行）は position/overflow 指定無しのため、サマリーカードに置いた ghost-num は #main の左上（最寄りの positioned 祖先）に描画され、他カードと重なる。
  fix: サマリーカードを `<div class="card" style="position:relative;overflow:hidden">` にし、子要素を `<div style="position:relative;z-index:1">` で包む（.hero>:not(.ghost-num) と同じ構造）か、既存の .myphys-card を流用。ライトテーマなので ghost-num--light を併用。
  ref: P4 step12(4) / player/index.html:64,124,132-133,159-161,194
- [medium] showMatchResult の `me.position` — player に me はグローバル変数として存在しない
  detail: P4-6 の ghost 算出 `POS_NUM[me.position]` は `me` を参照するが、player では `var me=…` が T.home（2100）・4179・4668 の各関数ローカルにしか無く、グローバル未定義→ReferenceError で FULL TIME 画面が出ず doMatch 成功後に真っ白になる（svSafeSeq は完了済みなので md は保存されているが遷移不能）。
  fix: showMatchResult 冒頭で `var me=(D.p||[]).find(function(x){return idEq(x.id,myPid);})||{};` を取得してから POS_NUM を引く。
  ref: P4 step14 / player/index.html:2100,4179,4668
- [medium] exportCSV の未提出行で mdMinutesShown(m)/mdRoleLabel(m) に m=null が渡り TypeError
  detail: P5-S1 は各試合で『squad 順＋メンバー外提出者＋未提出者（提出='未提出'・md 列は空）』を出力し、出場分に `mdMinutesShown(m, sessRowOf(...)).v` を使うが、dataModel 3 の mdMinutesShown は `isFilled(m.minutes)` から始まり m の null ガードが無い。未提出行では m が無いので 1 行目で例外→CSV が落ちる。mdRoleLabel(P1a)も m.role を直読み。
  fix: mdMinutesShown の仕様を `if(!m)m={}` で始める（未提出者でも GPS 実測分を『出場分ソース=GPS』として出せる＝GPS出場なのに未提出の可視化に一致）。CSV 生成側も `m?mdRoleLabel(m):''` 等の三項で分岐し、test_matchday_csv_staff (3) に『未提出行に GPS 分が入りソース GPS』を追加。identical なので player 側も同時変更。
  ref: P5 dataModel 3 / step25 / staff/index.html:5367-5381
- [low] 『GPS出場なのに未提出』の強調が squad 内に限定され、メンバー表外で出場した選手を取りこぼす
  detail: P3-6 の赤バッジは P1c の matchChecksMissing(ev)（squad の pid のみ）を母集団にする。GPS 行に min>0 があるのに squad にも md にも居ない選手（メンバー表の入れ忘れ・当日交代）は、提出者行にも未提出チップにも現れず、#mdd-gsum の件数だけが増える。D3 の『メンバー表が正典』を運用で守らせるには最も価値のある警告。
  fix: gsRows 結合後に `pid が squad 外 && md 無し && min>0` の集合を作り、#mdd-gsum の .l か未提出チップ列の末尾に『GPS出場だがメンバー表外 n名（名前）』を bd-a で出す。goSquadEditor への導線を添える。
  ref: P3 step6(4) / P1c step2 matchChecksMissing
- [low] P4-6 の FLAG 配置が本文と『リスク』で矛盾＋pbFlash の『PB!』ラベルが固定
  detail: step14 の変更文は『flag を hero に追加』、リスク欄は『hero の max-height:96px を溢れる→hero 外の kicker 行に置く』と逆のことを書いている。また pbFlash（player/index.html:1349）は `<span class="flag">PB!</span>` を固定描画するため、初出場で『PB!／初出場！』という表示になる。
  fix: flag は hero 外（MATCH REPORT カードの kicker 行）に確定し、コード片から hero 内の flag を削除。pbFlash は第2引数 label を任意で受ける（`label||'PB!'`）拡張を許容するか、CAPS では toast のみにする。
  ref: P4 step14 / player/index.html:159,1347-1354
- [low] P4-4 の T.match『再構成』が P1b で入った対象試合セクション・HIA 注意文言の維持を明示していない
  detail: P1b step14 は T.match に『対象の試合（直近3試合：入力済み/未入力/メンバー外の状態チップ＋入力ボタン）』『HIA 疑いの alert-down』を追加し、test_matchday_crud.js (1) がこれを検証する。P4-4 は（6）で修正/削除ボタンの維持のみ書き、上記セクションの扱いが無いため、実装者が『マイ試合履歴』へ丸ごと置換すると P1b テストが赤化し、催促導線（D4）が消える。
  fix: P4-4 の変更文に『P1b の対象試合セクションと HIA アラートはサマリーカードの上に維持（順序: HIA→対象の試合→サマリー→推移バー→履歴）』を明記し、test_matchday_p4_player (5) に『未入力チップと showMatchForm( 導線が残る』を追加。
  ref: P4 step12 / P1b step14 / dev/test_matchday_crud.js(1)
- [low] exportCSV の pName が厳密等価（x.id===pid）で idEq 未使用
  detail: staff/index.html:5369 `var pName=function(pid){var p=D.p.find(function(x){return x.id===pid;})…}` は既存だが、P5-S1 で試合単位 CSV に作り替える際に旧 md（pid が文字列化しているレコード）が『不明』で出力される。確定バグ #14（id 比較の不統一）の残渣。
  fix: csvCell 追加と同時に pName を idEq に直す（matchday 分岐だけでなく全種別に効く・挙動改善のみ）。
  ref: P5 step25 / staff/index.html:5369
MISSED:
  * player/index.html:64 `.card` に position:relative が無い（P4-4 ゴースト背番号の親として不可。.ghost-host は存在しない）
  * player/index.html:2100,4179,4668 `me` は各関数ローカル（P4-6 showMatchResult でグローバル参照不可）
  * player/index.html:1349 pbFlash の『PB!』フラグ固定（CAPS 演出で文言不一致）
  * player/index.html:517 getStdCfg が badgePts の既知キーのみコピー（'caps' 追加時は STD_DEFAULT/getStdCfg/staff:8986,9074 の同時変更が必要＝P4-2 の pts 設計に直結）
  * coach/index.html:133 `.chip` は CSS のみ・1640 `dchip` はローカル（P5-C3 の chip() 呼び出しが未定義）
  * coach/index.html:315 P1a step16 のヘルパー配置点（P5-C2 の 1528 再配置と衝突・二重定義）
  * trainer/index.html:907 P1a step15 のグループA配置点（P5-T1 の 222 再配置と衝突・二重定義）
  * trainer/index.html:61-65 .bd-n 未定義（設計の想定通り要追加。staff:69/player:63 と同型で var(--bg-tertiary)/var(--text-secondary)）
  * staff/index.html:6245 gpsSetType / 6246-6252 gpsReadMeta（evId のクリア条件が無く練習 GPS へ漏れる）
  * staff/index.html:5369 exportCSV pName の厳密等価（idEq 化）
  * staff/index.html:8602-8616 doRejectInjury（approved=false と同時に resolved=true）— mdHia の hiaInjId 判定が却下後も真になる根拠
  * dev/test_matchday_crud.js(1)（P1b）: T.match の対象試合セクション維持を P4-4 が明示していない