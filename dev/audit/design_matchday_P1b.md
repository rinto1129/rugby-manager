# P1b 選手: 新試合日チェックフォームv2＋催促＋CRUD
## goal
選手が「対象試合が明示された」試合日チェックv2（出場区分/出場分/RPE×分の試合負荷/睡眠h/朝食/疲労前後・筋肉痛(1-5)/perf/怪我/攣り詳細/HIA）を試合当日〜3日間の催促に沿って重複なく1回で提出でき、修正・削除(Undo)・後日の怪我追加報告が破綻なく回る。旧md（role文字列/fatiguePre・Post 1-6/sleepTime・wakeTime/evId無し）は読み側フォールバックで表示互換を維持し、md以外の正典ストア（f/i/r）には試合の二次記録を書かない（HIA/怪我の i・r 起票は選手申告そのものなので正典として書く）。
## dataModel
【md v2（player doMatch が生成・追加フィールドのみ・既存移行なし）】
{id:newId(), pid:myPid, date:ev.date（試合イベントから固定）, evId:ev.id（cal試合イベントid・idEq比較）, inputAt:ISO, v:2,
 role:'start'|'reserve'|'none'（squadRole(ev,pid) 初期値・選手が変更可）, num:squadNum(ev,pid)||null,
 minutes:int 0〜120（start既定80 / reserve既定空=必須入力 / none=0固定）,
 rpe:int 1〜10（minutes>0 のとき必須。minutes==0 なら省略＝フィールド無し）,
 sleepH:number 0〜24（step .5・必須）, breakfast:'はい'|'いいえ', breakfastDetail:string,
 preFatigue:1〜5（必須）, postFatigue:1〜5（必須）, soreness:1〜5（必須）, sorenessParts:[PARTS文字列]（soreness>=2 かつ選択時のみ）,
 perf:1〜5（minutes>0 のとき必須。minutes==0 なら省略）,
 injured:bool, （injured時のみ）injId:<i.id>, injSide,injPart,injType,injHistory,injHow,injPainAt(1-10必須),injPainNow(1-10必須),injContinued,canPractice（全て既存名）, injLate:true（後日申告リンク時のみ）,
 cramp:bool, （cramp時のみ）crampWhen:'前半'|'後半'|'試合後'（必須）, crampParts:[MD_CRAMP_PARTS文字列]（1つ以上必須）, crampFreq:'今回が初めて'|'たまにある'|'よく攣る'（既存）,
 hiaImpact:bool, （hiaImpact時のみ）hiaSymptoms:[MD_HIA_SYMPTOMS文字列]（0件可）, hiaInjId:<i.id>（衝撃あり＋症状1件以上で自動起票した i のid。怪我報告が type:'脳震盪' の場合は injId と同じ id）,
 note:string, editedAt?:ISO}
【i（試合起票・既存形に追加）】source:'match', approved:null, canPractice, painLevel:injPainNow（editInjury 4533 が読む）, mdId:<md.id>, matchEvId:<ev.id>。HIA自動起票は {part:'頭部', side:'', type:'脳震盪', hia:true, hiaSymptoms:[...], note:'【試合で受傷・HIA疑い】頭部への強い衝撃あり / 症状: 頭痛・めまい', canPractice:'わからない'} ＋ r{id,injId,pid,stage:0,logs:[],stageDates:[]}。後日申告（showInjuryReport(opts)経由）は note 先頭タグ '【試合で受傷('+fmt(date)+')・後日申告】'。
【cal 試合イベント（P1a基盤が書く・P1bは読むだけ）】{id,date,type:'match',title,detail, opp?,ko?,venue?, squad?:[{pid,num}], squadAt?}。squad 未登録＝誰も催促対象にしない（squadRole→null）。旧 matchsel は読み書きしない。
【読み側フォールバック（旧md）】v!==2 のレコードは role=文字列そのまま（mdRoleLabel が MD_ROLE_LABEL[m.role]||m.role）、疲労= mdFatigueStr が '前n/6 → 後m/6'（<1は'未入力'）、睡眠= mdSleepStr が 'sleepTime → wakeTime'、minutes/rpe/perf は '—'、mdLoad=0。evId 無し md は mdOf(pid,ev) が date 一致で同定（重複ガード・done判定・詳細のイベント解決すべて共通）。injured の生死は mdInjuryLive(m)（injId→D.i idEq & approved!==false／旧データは pid×date×source:'match' 照合）。
【定数（player新設・var）】MD_ROLE_LABEL={start:'スタート',reserve:'リザーブ',none:'出場なし'} / MD_CRAMP_WHEN=['前半','後半','試合後'] / MD_CRAMP_PARTS=['ふくらはぎ','ハムストリングス','大腿四頭筋','足裏','その他'] / MD_HIA_SYMPTOMS=['頭痛','めまい','吐き気','もやもや','記憶が飛んだ','その他'] / RATE5_LABELS に fat:['元気','やや疲れ','ふつう','疲れ気味','ヘトヘト'], perf:['不調','いまいち','ふつう','良い','最高'] を追加（アイコンは既存 STRESS_EMO=疲労(1=笑顔→5=強い) / MOOD_EMO=perf(1=どんより→5=絶好調) / SORE_EMO を流用・新規SVG不要）。
【共通ヘルパー契約（P1a基盤。P1aが未着なら本フェーズで player に定義し staff にコピー→identical登録。全て D.cal/D.md/D.i の読み取り専用・引数の id 比較は idEq）】
- matchEvents() → (D.cal||[]).filter(e=>e&&e.type==='match') を date 昇順で返す
- matchEventById(id) → matchEvents().find(e=>idEq(e.id,id))||null（P1bで追加提案）
- matchEventByDate(date,pid) → 同日イベント配列のうち squadRole(ev,pid)!=null を優先、無ければ先頭、無ければ null（同日A/B戦対応）
- squadOf(ev) → Array.isArray(ev&&ev.squad)?ev.squad:[]
- squadNum(ev,pid) → squadOf(ev).find(idEq(pid)).num（無ければ null）
- squadRole(ev,pid) → 未登録 null／num 1〜15 'start'／それ以外 'reserve'
- mdOf(pid,ev) → (D.md||[]).find(m=>idEq(m.pid,pid)&&(m.evId!=null?idEq(m.evId,ev.id):m.date===ev.date))||null
- mdRoleLabel(m) → MD_ROLE_LABEL[m.role]||m.role||''（roleBadgeHtml(mdRoleLabel(m)) で ROLE_EN の英字併記が生きる）
- mdLoad(m) → m.v===2?(m.rpe||0)*(m.minutes||0):0
- pendingMatchChecks(pid,todayS,N) → N既定3。from=toDateStr(new Date(todayS+'T00:00:00')-N日)。matchEvents() のうち from<=date<=todayS かつ squadRole!=null かつ !mdOf(pid,ev) を [{ev,date,daysAgo}] date昇順で返す（role:'none' 任意提出者・squad未登録試合は含めない）
- mdInjuryLive(m) → 上記の生死判定で該当 i レコード or null（hia側は hiaInjId で同型に mdHiaLive(m)）
- mdSleepStr(m) / mdFatigueStr(m) → 上記フォールバック文字列
- matchLoadByDate(pid,date) → P2（f 追加読み）用。P1bでは未使用・契約のみ確認
## steps

### 1. [player] 定数追加（役割ラベル・攣り・HIA・rate5ラベル）
WHERE: player/index.html:2773 RATE5_LABELS（同行を書き換え）＋直後 2774 に var 4本を挿入
CHANGE: RATE5_LABELS に fat/perf キーを追加。MD_ROLE_LABEL / MD_CRAMP_WHEN / MD_CRAMP_PARTS / MD_HIA_SYMPTOMS を var で定義（dataModel の値）。生hex禁止のため文字列のみ。
REUSE: STRESS_EMO(2770・疲労用に極性一致) / MOOD_EMO(2769・perf用) / SORE_EMO(2771)
RISK: 低。test_cond.js は MOOD_EMO 極性のみ検証＝影響なし

### 2. [player] 汎用チップ部品 chipsHTML/toggleChip/chipVals/setChips
WHERE: player/index.html:2825 clearPartChips 直後・2827 bindSorePartsToggle の手前に挿入
CHANGE: var _chipOpts={},_chipOnChange={}; chipsHTML(id,opts) は partChipsHTML(2807) と同型マークアップ（class="btn btn-sm part-chip"・aria-pressed・hidden input id=id にカンマ区切り）で opts 配列を描画し _chipOpts[id]=opts を登録。toggleChip(id,i) は togglePartChip(2812) と同じ選択スタイル（borderColor/color/background を var(--maroon)/var(--white)）で hidden を更新し、_chipOnChange[id] があれば選択配列で呼ぶ。chipVals(id) は hidden を split(',').filter(Boolean)。setChips(id,vals) は未選択のものだけ toggleChip（編集フォームのプリセット用）。partChipsHTML/togglePartChip は無改修（f.sorenessParts と test_cond.js を守る）。
REUSE: partChipsHTML 2807 / togglePartChip 2812 / clearPartChips 2821 / _rate5OnChange 2775 の登録パターン
RISK: 低。P1c で staff にコピーする前提（本フェーズは player のみ）

### 3. [player（＋staff コピー）] P1a基盤ヘルパー群の配置（未着なら先行定義）
WHERE: player/index.html:3970 roleBadgeHtml 直後（3971 showMyChart の手前）。staff は staff/index.html:414 roleBadgeHtml 直後
CHANGE: dataModel の契約どおり matchEvents / matchEventById / matchEventByDate / squadOf / squadNum / squadRole / mdOf / mdRoleLabel / mdLoad / pendingMatchChecks / mdInjuryLive / mdHiaLive / mdSleepStr / mdFatigueStr を1ブロックで定義（コメント行のみの差は sync_check が許容）。P1a が既に定義済みなら本ステップは『契約一致の確認』のみ（引数順・null 返却・idEq 使用）。matchEventByDate(date,pid) は pid 省略可。
REUSE: idEq 1094 / toDateStr 1089 / fmt 1099 / roleBadgeHtml 3967（無改修）
RISK: 中。P1a と二重定義になると後勝ちで契約ズレ→sync_check identical で検出。P1a側の名前と完全一致させること

### 4. [player] showMatchForm(evId) 全面改修（対象試合明示・日付固定・v2項目）
WHERE: player/index.html:4321-4343 を置換
CHANGE: 引数 evId→ev=matchEventById(evId)。無ければ matchEventByDate(todayStr(),myPid)→pendingMatchChecks(myPid,todayStr(),3) の最新→null。null なら showSub('<div class="alert-card alert-warn">登録された試合がありません。スタッフに試合日の登録を依頼してください</div>','match','試合日チェックに戻る') で終了（自由日付入力は設けない＝D2）。dup=mdOf(myPid,ev) があれば『'+fmt(ev.date)+' の試合日チェックは入力済みです』alert-info＋<button class="btn btn-match" onclick="showEditMatch('id')">修正画面を開く</button> を showSub して終了（confirm不使用）。role=squadRole(ev,myPid)（null→'none'）、num=squadNum。ヘッダ: kicker『MATCH DAY CHECK』＋『試合日チェック』＋試合カード（border-left:3px solid var(--maroon)・ic('i-ball')＋fmt(ev.date)＋(ev.opp?' vs '+escapeHtml(ev.opp))＋(ev.ko?' KO '+escapeHtml(ev.ko))＋(ev.venue?' @ '+escapeHtml(ev.venue))＋title 併記）。日付 input は置かない。role null なら alert-info『メンバー表に入っていませんが、任意で提出できます』。フォーム: ①出場 form-box: select#md-role（option value=start/reserve/none・MD_ROLE_LABEL・selected=roleV・onchange="mdRoleChange()"）＋num があれば <span class="num">#num</span>／出場時間 <input class="ipt" type="number" id="md-min" min="0" max="120" value=(start:80 / reserve:'' / none:0) oninput="updMdLoad()">（none は disabled）／試合のきつさ numStepHTML('md-rpe',1,10,'updMdLoad()')＋<div id="md-load-pv"></div>。②コンディション form-box: 睡眠 <input type="number" id="md-sleep" step="0.5" min="0" max="24" placeholder="例: 7.5">／朝食 select#md-bf＋#md-bf-detail/#md-bftext（既存 4328-4329 と同 id・同 onchange）／試合前の疲労 rate5HTML('md-fpre',STRESS_EMO,'元気','ヘトヘト',RATE5_LABELS.fat)／試合後の疲労 rate5HTML('md-fpost',…)／筋肉痛 rate5HTML('md-sore',SORE_EMO,'なし','激痛',RATE5_LABELS.sore)＋<div class="fl" id="md-parts-wrap" style="display:none">partChipsHTML('md-parts')</div>／パフォーマンス rate5HTML('md-perf',MOOD_EMO,'不調','最高',RATE5_LABELS.perf)（minutes==0 のときは wrap を display:none）。③怪我 form-box: 既存 4330-4339 を id そのままで維持。④足の攣り form-box: select#md-cramp（既存）→#md-cramp-detail 内に select#md-crampwhen（MD_CRAMP_WHEN・先頭に value="" の『選択してください』）＋『攣った部位（複数可）』chipsHTML('md-crampparts',MD_CRAMP_PARTS)＋select#md-crampfreq（既存）。⑤頭部 form-box『頭部への衝撃』: select#md-hia（いいえ/はい・onchange="mdHiaToggle()"）→#md-hia-detail（display:none）: 『症状（複数可）』chipsHTML('md-hiasym',MD_HIA_SYMPTOMS)＋<div id="md-hia-warn" class="alert-card alert-down" style="display:none">頭を強く打った後に症状がある場合は脳震盪の疑いがあります。今日は運動・運転・飲酒を避けて安静にし、症状が強くなったら医療機関へ。送信すると「HIA疑い」としてスタッフ・トレーナーに報告されます</div>。⑥メモ textarea#md-note。送信 <button class="btn btn-match" onclick="doMatch('EVID',this)">記録を送信する</button>（EVID は文字列で埋め込む）。showSub(h,'match','試合日チェックに戻る') 後に bindSorePartsToggle('md-sore','md-parts-wrap','md-parts'); _chipOnChange['md-hiasym']=sel=>#md-hia-warn の表示切替; setTimeout(mdRoleChange,50)。.rv-armed は書かない（規約）。
REUSE: numStepHTML 2758 / rate5HTML 2776 / setRate5 2786 / partChipsHTML 2807 / bindSorePartsToggle 2827 / showSub 2073 / escapeHtml 1443 / ic 1310 / 既存怪我ブロック 4330-4339
RISK: 中。旧 onclick="showMatchForm()"（2753）は T.match 改修で消える。他サイトからの呼び出し無し（grep 済み）

### 5. [player] フォーム補助 updMdLoad/mdRoleChange/mdHiaToggle と _mdPending 宣言
WHERE: player/index.html:4320 コメント『// === MATCH DAY FORM ===』直後に var _mdPending=null; を置き、4343 の直後（新 showMatchForm の直後）に3関数を追加
CHANGE: updMdLoad(): r=parseInt(#md-rpe)||0, m=parseInt(#md-min)||0 → #md-load-pv に updSrpe(2834) と同型の <div class="mc"><div class="v" style="color:var(--purple)">r*m</div><div class="l">試合負荷(AU)</div><div …>RPE×出場分</div></div>（r&&m のときのみ）。mdRoleChange(): role=none→#md-min.value=0・disabled=true・#md-perf-wrap を display:none／start で空なら 80／reserve は空のまま・disabled=false → updMdLoad()。mdHiaToggle(): #md-hia の値で #md-hia-detail を切替、いいえ なら clearChips 相当（toggleChip で全解除）＋#md-hia-warn 非表示。
REUSE: updSrpe 2834 / numStep 2765
RISK: 低

### 6. [player] doMatch(evId,btnEl) 改修（必須→guardSubmit→重複→i/r/HIA生成→冪等再送）
WHERE: player/index.html:4345-4366 を置換
CHANGE: 順序厳守: (a) ev=matchEventById(evId)（無ければ alert('試合が見つかりません。画面を戻ってやり直してください') で return）。(b) 必須チェックは全て guardSubmit の前: role が MD_ROLE_LABEL に無ければ alert('出場区分を選んでください')／minutes=parseInt(#md-min)（role none は 0 固定）→ !isFilled||<0||>120 で alert('出場時間（分）を入力してください（出場なしは0）')／minutes>0 で rpe !isFilled||<1||>10 → alert('試合のきつさ RPE（1〜10）を入力してください')／sleepH=parseFloat(#md-sleep) !isFilled||<0||>24 → alert('昨夜の睡眠時間（h）を入力してください')／pre・post・sore=parseInt(hidden)||0 が <1 → それぞれ alert('試合前の疲労感を選んでください' 等)／minutes>0 で perf<1 → alert('パフォーマンスの自己評価を選んでください')／injured 時 injPainAt/injPainNow を doInjuryReport(4509-4510) と同型で 1〜10 必須／cramp 時 crampWhen が MD_CRAMP_WHEN に無い → alert('攣ったタイミングを選んでください')、chipVals('md-crampparts') が 0 件 → alert('攣った部位を1つ以上選んでください')。(c) 最終防衛の重複ガード: dup=mdOf(myPid,ev) → toast('この試合は入力済みです。修正画面を開きます'); showEditMatch(dup.id); return（confirm 不使用）。(d) guardSubmit(btnEl,'送信中…')。(e) id 予約: sig=String(myPid)+'|'+String(ev.id); pend=(_mdPending&&_mdPending.sig===sig)?_mdPending:null; ids=pend?pend.ids:{md:newId(),inj:newId(),reh:newId(),hia:newId(),hiaR:newId()}。(f) rec を dataModel どおり組立（date:ev.date, evId:ev.id, v:2, role, num:squadNum(ev,myPid), minutes, rpe は minutes>0 のみ, sleepH, breakfast/Detail, preFatigue/postFatigue/soreness(+sorenessParts は sore>=2 かつ選択時), perf は minutes>0 のみ, note）。items=[]。injured なら 4351-4355 と同型で injRec{id:ids.inj, …既存フィールド, painLevel:injPainNow, mdId:ids.md, matchEvId:ev.id} と rehabRec{id:ids.reh,injId:ids.inj} を push、rec.injured=true・rec.injId=ids.inj。hia=(#md-hia==='はい'), hiaSym=chipVals('md-hiasym'): rec.hiaImpact=hia; hia なら rec.hiaSymptoms=hiaSym; hia&&hiaSym.length なら (injured&&injType==='脳震盪') の場合は injRec.hia=true, injRec.hiaSymptoms=hiaSym, rec.hiaInjId=ids.inj（二重起票しない）、それ以外は hiaRec{id:ids.hia,pid,side:'',part:'頭部',partOther:'',type:'脳震盪',typeOther:'',date:ev.date,returnDate:'',hospitalVisited:false,hospitalDate:'',note:'【試合で受傷・HIA疑い】頭部への強い衝撃あり / 症状: '+hiaSym.join('・'),resolved:false,source:'match',hia:true,hiaSymptoms:hiaSym,canPractice:'わからない',mdId:ids.md,matchEvId:ev.id,approved:null} と r{id:ids.hiaR,injId:ids.hia,…} を push、rec.hiaInjId=ids.hia。cramp なら rec.cramp=true, crampWhen, crampParts, crampFreq。最後に {k:'md',rec} を push。(g) 再送フィルタ: send=pend?items.filter(it=>pend.savedIds.indexOf(it.rec.id)<0):items。(h) svSafeSeq(send, onAllDone: _mdPending=null; go('match'); toast(hiaCreated?'記録しました。頭部の症状は「HIA疑い」としてスタッフ・トレーナーに報告されます':'記録しました'), onError(err,done,item): _mdPending={sig:sig,ids:ids,savedIds:(pend?pend.savedIds:[]).concat(send.slice(0,done.length).map(it=>it.rec.id))}; releaseSubmit(btnEl); alert('保存できませんでした。電波の良い場所でもう一度「記録を送信する」を押してください。送信済みの分は二重登録されません'))。
REUSE: isFilled 1012 / guardSubmit 1040 / releaseSubmit 1051 / svSafeSeq 1015（無改修）/ newId 1097 / doFinishTraining 5719-5738 の done 分岐（手本）/ doInjuryReport 4507-4525 の i・r 生成形
RISK: 中。svSafeSeq は全か無でないため onError→再送で ids 再利用が肝。再送前に injured/hia フラグを変えた場合は savedIds に無い新スロットだけ送られる（既送分の内容差し替えは不可＝修正画面へ）

### 7. [player] showMatchDetail(mid) v2/旧互換表示＋修正/削除ボタン
WHERE: player/index.html:4368-4387 を置換
CHANGE: find を idEq に統一（4369 の === を修正）。ev=matchEventById(m.evId)||matchEventByDate(m.date,myPid)。見出し『試合記録 fmt(m.date)』＋試合カード（opp/ko/venue。無ければ ev.title）。基本情報: 出場 roleBadgeHtml(mdRoleLabel(m))＋(m.num?' <span class="num">#'+m.num+'</span>')／v2 のとき grid3 の mc 3枚（出場 m.minutes+'分'／RPE m.rpe||'—'／試合負荷 mdLoad(m)+' AU' color var(--purple)）／睡眠 mdSleepStr(m)／朝食 escapeHtml(breakfast＋detail)／疲労 mdFatigueStr(m)／v2 のみ 筋肉痛 soreness+'/5'+(sorenessParts.map(escapeHtml).join('・'))／パフォーマンス perf+'/5'（minutes==0 は '—'）。怪我ブロック（4377-4384 を維持しつつ全自由文を escapeHtml）＋ live=mdInjuryLive(m) で状態チップ（null→bd-n『取消・却下済み』／approved==null→bd-a『スタッフ確認待ち』／true→bd-g『承認済み』）＋ボタン（approved==null なら editInjury(id)『報告を修正』／それ以外 showMyChart(id)『カルテ』）。攣り: crampWhen／crampParts.join('・')／crampFreq（旧は crampFreq のみ）。頭部: hiaImpact なら 症状 hiaSymptoms.join('・')＋mdHiaLive で同様の状態チップ。メモ escapeHtml(note)。提出 fmtDateTime(inputAt)＋(editedAt?'（修正済）')。末尾に <div style="display:flex;gap:6px"><button class="btn" onclick="showEditMatch('id')">修正</button><button class="btn btn-d" onclick="delMatchDay('id')">削除</button></div>。showSub(h,'match','試合日チェックに戻る')。
REUSE: roleBadgeHtml 3967 / fmtDateTime 1098 / editInjury 4528 / showMyChart 3971 / .mc .grid3（CSS 72,77）
RISK: 低

### 8. [player] showEditMatch(mid)/doEditMatch v2化（日付固定・攣りトグル常時・injured は追加報告へ誘導）
WHERE: player/index.html:4391-4416（showEditMatch）と 4417-4438（doEditMatch）を置換
CHANGE: showEditMatch: 見出し下に『fmt(m.date) の記録（日付は変更できません）』＋ev の opp/ko。フィールド id は emd- 接頭: select#emd-role（start/reserve/none・onchange で emd-min の disabled/0 切替）／#emd-min／numStepHTML('emd-rpe',1,10,'updEMdLoad()')＋#emd-load-pv／#emd-sleep（v2: sleepH。旧レコードは『前回入力 sleepTime→wakeTime』を text 表示し emd-sleep は任意）／#emd-bf/#emd-bf-detail/#emd-bftext（既存）／rate5 'emd-fpre','emd-fpost','emd-sore'(+#emd-parts-wrap partChipsHTML('emd-parts'))，'emd-perf'（旧レコードは mdFatigueStr を text 表示し rate5 は任意）。攣りは常時描画: select#emd-cramp（いいえ/はい・onchange で #emd-cramp-detail 切替）＋#emd-crampwhen＋chipsHTML('emd-crampparts',MD_CRAMP_PARTS)＋#emd-crampfreq。怪我: m.injured なら 4403 の alert-info を維持（怪我の修正は怪我タブへ）、false なら <button class="btn" style="border-color:var(--red);color:var(--red)" onclick="showInjuryReport({mdId:'id',evId:'evId',date:'date'})">この試合で痛めた箇所を追加で報告する</button>（頭部症状は同ボタン群に {hia:true} 版『頭部の症状が出た』を並べる）。HIA は読み取り表示のみ。メモ #emd-note。保存 doEditMatch('id',this)。setTimeout(50) で現在値をプリセット（select.value／numStep .value／setRate5 は値がある時のみ1回／(m.sorenessParts||[]).forEach→togglePartChip／setChips('emd-crampparts',m.crampParts)）。showSub(h,'match','試合日チェックに戻る')＋bindSorePartsToggle('emd-sore','emd-parts-wrap','emd-parts')。doEditMatch: 必須チェックは doMatch と同じ（v2 は全項目必須／v!==2 は rate5・sleep が空なら『未変更』扱いで書かない）→guardSubmit→svSafeUpdate('md', latest 内で idEq 再探索, m.role/num(維持)/minutes/rpe(minutes>0 のみ・0 なら delete)/sleepH/breakfast/breakfastDetail/preFatigue/postFatigue/soreness(+sorenessParts は sore>=2&&parts.length のとき set・それ以外 delete)/perf(minutes>0 のみ)/note を更新、cramp=はい なら cramp:true+crampWhen/crampParts/crampFreq、いいえ なら cramp:false＋3フィールド delete、injured/injId/inj*/hia* は触らない、editedAt 付与）→onDone: notFound なら releaseSubmit+alert、成功で go('match');toast('修正しました')。
REUSE: showEditCondition 3001-3026 のプリセット手順（setRate5 は値あり時のみ1回）/ doEditCondition 3045-3058 の delete 方針 / 既存 doEditMatch 4420-4437 の骨格
RISK: 中。旧レコード編集時に v2 必須を強制すると旧データが保存不能になるため v!==2 は緩和（openIssues 参照）

### 9. [player] showInjuryReport(opts)/doInjuryReport 後日申告リンク（md.injId／source:'match'）
WHERE: player/index.html:4494（showInjuryReport 引数追加）・4497（ir-date 初期値）・4503-4504（説明文）・4507-4525（doInjuryReport）
CHANGE: var _irOpts=null; を 4493 に追加。showInjuryReport(opts): _irOpts=opts||null。opts があれば ir-date value=opts.date、フォーム上部に alert-info『'+fmt(opts.date)+' の試合で受傷した分として報告します（試合日チェックに紐づきます）』、opts.hia なら setTimeout で #ir-part='頭部'・#ir-type='脳震盪' をプリセット。doInjuryReport: injRec 生成後に if(_irOpts){injRec.source='match';injRec.matchEvId=_irOpts.evId;injRec.mdId=_irOpts.mdId;injRec.note='【試合で受傷('+fmt(_irOpts.date)+')・後日申告】'+how+…（既存の連結を維持）; if(_irOpts.hia){injRec.hia=true;}}。svSafeSeq の onAllDone で _irOpts.mdId があれば svSafeUpdate('md', latest の該当 md に injured:true, injId:injId, injLate:true, injPart/injSide/injType/injPainNow/canPractice を i と同値で転記、hia なら hiaImpact:true, hiaInjId:injId, editedAt) → 完了/失敗いずれでも _irOpts=null; go('injury'); toast('報告しました。スタッフが確認します')。md 更新失敗は i/r が成立しているので alert せずコンソールのみ。
REUSE: showInjuryReport 4494 / doInjuryReport 4507 / svSafeUpdate 999 / editInjury 4572 のタグ規約
RISK: 低〜中。md への転記は選手申告の正典フィールド（二次記録ではない）。_irOpts の消し忘れ防止に showInjuryReport 冒頭で必ず再代入

### 10. [player] delMatchDay(mid) を即削除＋Undoトーストへ
WHERE: player/index.html:3141-3151 を置換
CHANGE: confirm を撤去。rec=D.md.find(idEq)（無ければ alert('記録が見つかりませんでした')）。svSafeUpdate('md', latest.filter(r=>!idEq(r.id,mid))・件数不変なら notFound) → onDone: go('match'); toast('削除しました'+((rec.injured||rec.hiaInjId)?'（怪我報告は残ります）':''),'元に戻す',function(){svSafeUpdate('md',latest=>{if(!latest.some(r=>idEq(r.id,rec.id)))latest.push(rec);return latest;},function(){go('match');toast('元に戻しました');});})。onError は alert('削除できませんでした…')。
REUSE: toast(msg,actionLabel,actionFn) 1325 / cancelInjury 4585-4600 の Undo 復元形
RISK: 低。delWeekCheck 3129/delCondition 3153 の confirm は本フェーズ対象外（残置）

### 11. [player] todayTodoHtml: pendingMatchChecks による日付別 urgent todo＋試合日はコンディション todo を置換
WHERE: player/index.html:1690-1699 を置換（1697 の cond push を条件分岐に）
CHANGE: 1690-1695（yesterday/matchsel 判定）と 1699 を削除。var todayS=todayStr(); var evToday=matchEventByDate(todayS,myPid); var mdToday=evToday?mdOf(myPid,evToday):null; var inSquadToday=!!(evToday&&squadRole(evToday,myPid)!=null); if(inSquadToday||mdToday){todoItems.push({key:'match'+evToday.id,done:!!mdToday,label:'今日の試合日チェック',icon:'match',onclick:"showMatchForm('"+evToday.id+"')",urgent:!mdToday});}else{todoItems.push({key:'cond',done:todayDone,label:'コンディション入力',icon:'condition',onclick:"go('condition')"});} pendingMatchChecks(myPid,todayS,3).filter(p=>p.daysAgo>0).forEach(p=>todoItems.push({key:'match'+p.ev.id,done:false,label:(p.daysAgo===1?'昨日':fmt(p.date))+'の試合日チェック',icon:'match',onclick:"showMatchForm('"+p.ev.id+"')",urgent:true}))。以降の描画ロジック（1714-1748）は無改修。
REUSE: pendingMatchChecks / matchEventByDate / mdOf / squadRole（Step3）/ 既存 todo 描画 1729-1748
RISK: 中。test_dash.js 74-88 のフィクスチャを squad 付き cal に変更する必要あり（label『昨日の試合日チェック』は維持されるので assertion は不変）。test_home_p8b.js 31-38 は squad 無し＝todo 自体が出ず、否定 assertion は維持

### 12. [player] T.home ヒーロー MATCH DAY タップでフォーム
WHERE: player/index.html:2116-2118（heroTap の決定）
CHANGE: var heroTap=''; if(kick.indexOf('TODAY:')===0)heroTap=' onclick="go(\'training\')" style="cursor:pointer"'; else if(kick==='MATCH DAY'){var evHero=matchEventByDate(todayStr(),myPid);if(evHero)heroTap=' onclick="showMatchForm(\''+evHero.id+'\')" style="cursor:pointer"';}。ベルバッジ 2126 は既に stopPropagation 済み。kicker 文言は 'MATCH DAY' のまま（ev.opp があれば 2124 の学年行末尾に ' / vs '+escapeHtml(ev.opp) を追記可・任意）。
REUSE: 2118 の TODAY: 分岐
RISK: 低。怪我中は RETURN TO PLAY 優先で hero タップ無し（todo 側に導線があるため可）

### 13. [player] T.mypage 試合日チェックカードに未入力/入力済みバッジ
WHERE: player/index.html:2483
CHANGE: var mdPend=pendingMatchChecks(myPid,todayStr(),3); var mdRecent=(D.md||[]).some(m=>idEq(m.pid,myPid)&&m.date>=toDateStr(new Date(Date.now()-3*86400000))); カード内 <div style="font-weight:600;font-size:13px">試合日チェック</div> の直後に mdPend.length?'<div style="font-size:11px;color:var(--red);margin-top:4px">未入力 '+mdPend.length+'件</div>':(mdRecent?'<div style="font-size:11px;color:var(--green);margin-top:4px">'+ic('i-check-c',12)+' 入力済み</div>':'')。onclick は go('match') のまま。
REUSE: 2472-2473 のコンディションカードの未入力/入力済み表現
RISK: 低

### 14. [player] T.match 一覧再構成（対象試合の状態＋記録一覧 v2/旧互換）
WHERE: player/index.html:2750-2755 を置換
CHANGE: var todayS=todayStr(); mine=(D.md||[]).filter(idEq(pid)).sort(date desc); hiaAlert=(D.i||[]).some(x=>idEq(x.pid,myPid)&&x.hia&&!x.resolved&&x.approved!==false) → 先頭に <div class="alert-card alert-down">脳震盪の疑いがある報告があります。今日は安静にし、症状が強くなったら医療機関へ</div>。『対象の試合』セクション: recentEvs=matchEvents().filter(e=>e.date<=todayS).slice(-3).reverse()（0件なら『登録された試合がありません。スタッフがカレンダーに登録すると表示されます』）。各行 card: fmt(date)＋(opp?' vs '+escapeHtml(opp))＋(ko)＋状態: md=mdOf(myPid,ev) あり→<span class="bd bd-g">入力済み</span>＋<button class="btn btn-sm" onclick="showMatchDetail('id')">確認</button>／squadRole!=null かつ md 無し→<span class="bd bd-r">未入力</span>＋<button class="btn btn-match btn-sm" onclick="showMatchForm('evId')">入力する</button>（date>=3日前なら 'rv-urgent' ではなく単に border-left:3px solid var(--red) で強調・.rv-armed は書かない）／squadRole==null かつ md 無し→<span class="bd bd-n">メンバー外</span>＋<button class="btn btn-sm" onclick="showMatchForm('evId')">任意で入力</button>。『過去の試合記録』: mine.map(m=>'<div class="card card-click" onclick="showMatchDetail(\''+m.id+'\')">'+fmt(m.date)＋(ev.opp)＋roleBadgeHtml(mdRoleLabel(m))＋(m.num?'<span class="num">#'+m.num+'</span>')＋修正/削除ボタン（event.stopPropagation・showEditMatch/delMatchDay を文字列 id で）＋2行目: v2 なら m.minutes+'分 / RPE '+(m.rpe||'—')+' / '+mdLoad(m)+' AU'+(m.perf?' / perf '+m.perf+'/5':'') 旧なら mdFatigueStr(m)＋タグ: mdInjuryLive(m)?' | <span style="color:var(--red)">怪我あり</span>' / m.hiaInjId&&mdHiaLive(m)?' | <span class="bd bd-r">HIA</span>' / m.cramp?' | 足攣り'）。2754 の数値リテラル埋め込み showMatchDetail(m.id) は文字列引用に変更。戻るボタンは go('mypage') のまま。
REUSE: roleBadgeHtml 3967 / mdRoleLabel / mdLoad / mdFatigueStr / mdInjuryLive / .bd-* (CSS 63) / .card-click (65)
RISK: 低。T.match は subView=null のため onSnapshot で再描画される（一覧なので可）

### 15. [player] help『試合があった日』文言更新
WHERE: player/index.html:2525-2528
CHANGE: 『「試合日チェック」から入力（試合の日〜3日以内・ホームの「今日やること」からも開けます）』『・出場区分と出場時間（分）、試合のきつさ RPE（1〜10）』『・睡眠時間・試合前後の疲労感・筋肉痛・パフォーマンス（各5段階）』『・怪我／足の攣り／頭を強く打った → 該当があればチェック（頭部の症状はHIA疑いとして即報告されます）』の4行に差し替え。
REUSE: —
RISK: なし

### 16. [staff] （任意・同時出荷推奨）v2 レコードの読み側最小互換パッチ
WHERE: staff/index.html:5467（goMatchDateDetail 行の『疲労: 前X/6 → 後Y/6』）・5466（roleBadgeHtml(m.role)）・8563-8570（goMatchDetail の基本情報行）
CHANGE: 5466 を roleBadgeHtml(mdRoleLabel(m))、5467 を mdFatigueStr(m)+(m.v===2?' / '+m.minutes+'分 RPE'+(m.rpe||'—')+' '+mdLoad(m)+'AU':'') に置換。8563-8570 の 試合前/後疲労・睡眠 を mdFatigueStr/mdSleepStr に置換し、v2 のとき 出場時間/RPE/試合負荷/筋肉痛/perf/攣り詳細(crampWhen・crampParts)/HIA(hiaSymptoms) の detail-row を追加。showEditMatchStaff 5478 は v2 レコードなら先頭に alert-info『新形式の記録の修正は P1c の代理入力画面から』を出し旧フィールド編集を抑止（P1c で置換）。Step3 のヘルパーが staff に存在することが前提。
REUSE: Step3 identical ヘルパー / staff roleBadgeHtml 411
RISK: 低。P1b を単独出荷すると staff 側が 'undefined/6' 表示になるため、この最小パッチか P1c を同一リリースに含める

## tests
- 【新規】dev/test_matchday_form.js（先頭『// 実行: jsc dev/prelude.js /tmp/player.js dev/test_matchday_form.js』・日付は daysAgo(n) 相対・DOM は test_bc_dup.js 方式の _dom スタブ＋setInput、rate5 は setRate5、チップは toggleChip、Promise は drain()）: (1) showMatchForm(evId) がヘッダに fmt(ev.date)/opp/ko を出し、input type=date を含まない・md-role の selected が squadRole 通り（num 5→start・num 18→reserve・未登録→none＋『任意で提出できます』）・mdRoleChange 後の md-min 既定（80/''/0+disabled） (2) 必須チェック: 出場区分/出場分/RPE(minutes>0のみ)/睡眠/疲労前後/筋肉痛/perf/怪我時痛み/攣り時 when・parts が __alerts に出て __store['md'] が 0 件のまま (3) 正常送信で md が evId・v:2・minutes・rpe・sleepH・preFatigue…・sorenessParts を持ち inputAt 付与、role none は minutes 0 かつ rpe/perf フィールド無し (4) injured=はい で i(source:'match',approved:null,mdId,matchEvId,painLevel)・r が生成され md.injId===i.id (5) hia=はい＋症状1件で type:'脳震盪' part:'頭部' hia:true の i と r が生成され md.hiaInjId が一致、症状0件なら i は増えず md.hiaImpact:true hiaSymptoms:[] (6) 怪我報告が type 脳震盪＋HIA該当のとき i は1件のみで hia:true・md.injId===md.hiaInjId (7) 重複ガード: 同 evId の md 既存で doMatch→showEditMatch(id) が呼ばれ __store 不変（confirm 未使用＝prelude の confirm を呼ぶと fail するよう confirm=function(){throw} に差し替えて検証）; evId 無し旧 md（date 一致）でも同様に誘導 (8) 冪等再送: db.runTransaction を 'r' で1回だけ reject するよう差し替え→doMatch→onError で releaseSubmit・_mdPending.savedIds に i.id→再度 doMatch→i は1件・r/md が保存され md.injId が最初の i.id と一致（newId 再採番なし）→成功後 _mdPending===null
- 【新規】dev/test_matchday_todo.js（player）: (1) 今日試合＋squad 内＋md 無し→todo に『今日の試合日チェック』urgent、『コンディション入力』が出ない (2) md 追加で done（onclick 消失・line-through） (3) 今日試合だが squad 外→『コンディション入力』が出て試合 todo は出ない（role:'none' は催促対象外） (4) 2日前の試合が未入力→『YYYY/MM/DD の試合日チェック』が urgent で残る、4日前は出ない（N=3） (5) 昨日は『昨日の試合日チェック』 (6) squad 未登録イベントは催促しない (7) evId 無し旧 md（date 一致）で done 扱い (8) T.home のヒーローが MATCH DAY のとき onclick="showMatchForm('evId')" を含み、怪我中は RETURN TO PLAY で含まない (9) T.mypage カードに『未入力 n件』/『入力済み』 (10) pendingMatchChecks の戻り値が date 昇順・daysAgo 正しい・idEq で文字列 pid も一致
- 【新規】dev/test_matchday_crud.js（player）: (1) T.match: 対象試合カードの状態チップ（入力済み/未入力/メンバー外）とボタンの onclick が文字列 id (2) 旧 md（fatiguePre:3,fatiguePost:5,sleepTime/wakeTime,role:'スタート'）が一覧で『前3/6 → 後5/6』・STARTING XV 併記、showMatchDetail で 'undefined' を含まず sleepTime→wakeTime 表示 (3) v2 md の showMatchDetail が 出場分/RPE/AU/perf/攣り when・parts/HIA 症状と修正・削除ボタンを含み、自由文（injHow に '<b>'）が escapeHtml される (4) showEditMatch が日付 input を持たず、攣り『いいえ』のレコードでも emd-cramp が描画され、doEditMatch で はい→crampWhen/crampParts 保存・いいえ→3フィールド delete、injured/injId は不変、editedAt 付与 (5) 旧 md を doEditMatch しても fatiguePre/sleepTime が残り v は付かない (6) delMatchDay: confirm 不使用（throw 差し替え）で即削除→toast の第2引数『元に戻す』と fn、injured なら msg に『怪我報告は残ります』、fn() で復元・二重復元しない (7) showInjuryReport({mdId,evId,date}) → doInjuryReport で i.source==='match'・note 先頭『【試合で受傷(…)・後日申告】』・mdId、完了後 md.injured===true・injId 一致・injLate:true、_irOpts が null に戻る
- 【既存改修】dev/test_dash.js 74-88: D.cal のイベントに squad:[{pid:1,num:1}] を付与し D.matchsel=[1] 行を削除（matchsel は読まない）。assertion『昨日の試合日チェック』『urgent 1件のみ』『md 追加で消える（旧形式 date 一致）』はそのまま通ること。LEGACY_TARGETS に載っているためヘッダ追記不要
- 【既存維持】dev/test_home_p8b.js 31-38: 無改修。squad 無しの match cal＋matchsel=[1] で『試合日チェック未入力』一覧と『あと1名』が出ないことは新実装でも成立（todo 自体が出ない）
- 【既存確認】dev/test_cond.js（RATE5_LABELS キー追加・partChipsHTML 無改修で影響なし）/ dev/test_p5_guards.js（cancelInjury・editInjury の分岐無改修）/ dev/test_dash_staff.js・dev/test_mstat.js（staff・ms 索引に kind 無しを維持＝本フェーズは ms を触らない）/ test_pitch.js 等 identical 系（roleBadgeHtml・svSafeSeq・toast は無改修）
- 【ゲート】python3 dev/run_tests.py 全緑 → python3 dev/sync_check.py 緑（Step3 ヘルパーを player/staff で一致）→ python3 dev/sync_check.py --residue 違反 0（新規マークアップは var(--token) のみ・chart_counts 不変）→ python3 dev/extract.py player/index.html /tmp/player.js && jsc dev/prelude.js /tmp/player.js で SyntaxError 無し

## syncManifest
- identical 追加（kind:'function'・files:['player','staff']。P1a が先に登録済みなら重複登録しない）: matchEvents / matchEventById / matchEventByDate / squadOf / squadNum / squadRole / mdOf / mdRoleLabel / mdLoad / pendingMatchChecks / mdInjuryLive / mdHiaLive / mdSleepStr / mdFatigueStr（coach は P5 で files に追加）
- identical 追加（kind:'var'・files:['player'] で登録し P1c の staff 代理入力で ['player','staff'] に拡張）: MD_ROLE_LABEL / MD_CRAMP_WHEN / MD_CRAMP_PARTS / MD_HIA_SYMPTOMS
- identical 追加（kind:'function'・files:['player']→P1c で staff 追加）: chipsHTML / toggleChip / chipVals / setChips
- 無改修で identical 維持: roleBadgeHtml（player 3967/staff 411）・svSafeSeq（player 1015/trainer 850）・toast・isFilled・guardSubmit・releaseSubmit・newId・effDur・sLoad
- variant 維持: numStepHTML の player 版（44px タッチターゲット・md5 5cfb2ef67e7f）は無改修＝台帳更新不要
- chart_counts 不変（新規 new Chart 無し）。RATE5_LABELS / rate5HTML / partChipsHTML は player 専用のため台帳対象外のまま

## openIssues
- P1a 未着（grep で matchEvents/squadRole は4サイトとも 0 件）。P1b を先に着手する場合は Step3 のヘルパーを player＋staff に定義して identical 登録し、P1a はその契約に合わせる（特に squadRole の num 判定『1〜15=start・それ以外=reserve』と matchEventByDate(date,pid) の同日複数試合の優先規則）。cal 試合イベントの opp/ko/venue/squad の書き込み UI は P1a（staff calEventFormHTML 8668/goSelectMatchMembers 8907 置換）に依存。
- squad 未登録の試合（P1a 前に登録済みの試合・staff がメンバー表を入れ忘れた試合）は誰にも催促されない設計（squadRole→null）。T.match の『任意で入力』で提出は可能。9/5 分の遡り入力は『staff がメンバー表を登録→選手に催促』の順で運用する。
- 旧 md（v!==2）の編集フォームでは v2 必須項目を任意扱いにし、旧フィールド（fatiguePre/Post・sleepTime/wakeTime）は残置・v は付けない。旧データが本番に何件あるかは未確認（1件も無ければ緩和ロジックは削減可）。
- minutes==0（出場なし）のとき rpe/perf を省略可にした（試合負荷 0）。リザーブ未出場でもウォームアップ RPE を取りたい場合は rpe を常時必須へ1行変更。perf 必須（minutes>0）の運用負荷が高ければ任意化も1行。
- 冪等再送は『予約 id の再利用＋savedIds フィルタ』方式。既送分（例: i が成功後に r/md が失敗）の内容を再送前に変えても既送レコードは更新されない（修正画面で直す）。svSafeSeq 本体は無改修（trainer と identical のため触らない）。
- HIA 自動起票は approved:null（承認待ち）。hasActiveInjury(1964) は approved を見ないため、提出直後に player の第3タブが『リハビリ』へ切り替わる（既存の match 起票と同じ挙動）。却下されると自動で戻る。staff 新着カードの【HIA】最上位タグ・承認時 chart.isConcussion=true は P1c/P5（staff）側。
- P1b を単独出荷すると staff の goMatchDateDetail 5467 / goMatchDetail 8566 が v2 レコードで 'undefined/6' になる → Step16 の最小パッチを同梱するか P1c と同時出荷。exportCSV('matchday') 5376 の v2 列対応は P5。
- 試合当日の T.condition（『本日入力済み』カード・当日 f の有無）は本フェーズで触らない。試合日に f を書かない D5 に伴う集計側の md 追加読み（effDur/sLoad/getTodayCondition/condStreak/mydata チャート）は P2 で matchLoadByDate を使って実装。
- delWeekCheck 3129 / delCondition 3153 / delBC 3165 の confirm 残置は本フェーズ対象外（雛形v2違反として別フェーズで一括）。
- T.match の『対象の試合』は直近3試合（今日以前）に固定。シーズン一覧（出場数・合計分）は P4。

## estimate
player 本体 約 450〜550 行差分（Step1-15）＋staff 最小パッチ 約 30 行（Step16）＋テスト3本 約 300 行＋台帳更新。1機能ずつ構文チェック→模擬実行の進め方で 2〜3 作業日（Step3-6 を1日目、7-10 を2日目、11-16＋テスト仕上げを3日目）。9/5 分の遡り入力は P1a（メンバー表）と本フェーズ完成後に staff が squad 登録→選手が T.match『対象の試合』から入力、未提出分は P1c 代理入力で埋める。