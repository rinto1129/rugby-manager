# P2 回復追跡＋試合負荷の追加読み
## goal
試合日チェック(md v2)を正典 f に一切書かず「読み時の仮想コンディション」として player/staff/coach の負荷・コンディション集計へ合流させる（同日 f があれば負荷は加算・ウェルネスは f 優先、旧 md(rpe無し)は分析から除外）。あわせて MD+1〜+3 の回復追跡（player todo/コンディション見出し/トレーニングヒント/試合詳細の回復セクション、staff 試合レポート回復パネル＋ダッシュボード「試合後リカバリー対象」、coach 考察/チャート試合マーカー）と、未提出者への催促（個人お知らせ一括 kind:'md-remind'＋LINE用テキストコピー、player 側「入力する→」）を完成させる。前提: P1（メンバー表・md v2 フォーム・pendingMatchChecks・代理入力・削除Undo）がマージ済みで、P1a 基盤ヘルパー matchEvents()/matchEventByDate(date)/squadOf(ev)/squadRole(ev,pid)/mdOf(pid,ev)/mdRoleLabel(m)/mdLoad(m)/mdInjuryLive(m)/showMatchForm(dateArg) が4ファイル（少なくとも player/staff/coach）に identical 登録されていること。
## dataModel
【保存形の追加（追加フィールドのみ・移行なし）】
- ann: {kind:'md-remind', refEvId:<cal試合イベントid>, refDate:'YYYY-MM-DD', createdBy:<staff名>} を既存 {id,date,text,targetPid,readBy} に追加。kind 無し＝従来のお知らせ（表示不変）。
- md / f / cal への P2 追加フィールドは無し。統合は全て読み時の仮想レコード（_fromMd/_md/_evId は保存しない＝二次記録を正典に書かない規約を満たす）。

【仮想コンディション（mdAsCond(m) の戻り・f と同じ形）】
{id:'md:'+m.id, pid:m.pid, date:m.date, rpe:m.rpe, sleep:(m.sleepH>0?m.sleepH:0), duration:(m.minutes>0?m.minutes:0), note:'試合'+(ev.opp?' vs '+ev.opp:''), inputAt:m.inputAt, editedAt?:m.editedAt, soreness?:m.soreness(>0時のみ), sorenessParts?:[...], _fromMd:true, _md:m, _evId:ev?ev.id:null}
- 旧 md（v:2 でなく rpe==null）→ null（分析から除外。表示互換は P1a の mdSleepStr/mdFatigueStr）。
- 同 pid×同日に f があるとき: f の浅いコピーに _md:m を付与（inputAt 最新の f 1件のみ＝負荷二重計上防止）。

【P2 identical ヘルパー（player/staff/coach に同一コピー。dev/sync_manifest.json identical 登録）】
- var MD_RECOV_TH={sore:3,sleep:6,rpe:8,hiLoad:560};  // 回復未了判定・高負荷の閾値（1箇所で調整。凛人監修用）
- mdAsCond(m) → 上記 or null
- condWithMd(pid,fromS,toS) → 配列（date昇順→inputAt昇順）。pid==null で全員。f コピー＋_md 付与＋f無し日は仮想レコード。fromS/toS は null で無制限。
- hasCondOn(pid,dateS) → その日に f または md（旧含む）があれば true（提出判定用）
- countCondOn(dateS) → D.p のうち hasCondOn な人数
- matchDayOffset(dateS,N=3) → {ev,n} | null（matchEvents() のうち date<dateS で最も近い試合。1<=n<=N。試合当日 n=0 は null）
- matchDayTag(dateS) → 'MD+n' | ''
- recoveryFlags(r) → ['筋肉痛n','睡眠nh','RPEn']（soreness>=TH.sore／sleep>0&&sleep<TH.sleep／!_fromMd&&rpe>=TH.rpe）
- recoveryOf(pid,ev,N=3) → {md, base:mdAsCond(md)|null, days:[{n,date,rec|null,flags,future}], last:{n,rec,flags}|null, submitted, due, recovered:true|false|null}
- recoveryLabel(rc) → {k:'wait'|'none'|'ok'|'ng', label:'これから'|'未入力'|'回復良好'|'回復未了', color:'var(--text-secondary)'|'var(--text-tertiary)'|'var(--green)'|'var(--red)'}
【player/staff のみ identical】condLoad(r) → r._fromMd ? mdLoad(r._md) : sLoad(r)+(r._md?mdLoad(r._md):0)（effDur/sLoad は不変＝test_p7a 維持）
【staff 専用（identical 登録しない）】getLatestCond(pid)／mdMissingFor(ev)／mdRemindText(ev,missing)／copyText(str)／mdRemindBtnsHtml(ev)／copyMdRemind(evId)／sendMdReminders(evId,btnEl)／undoMdReminders(ids)
【既存互換フォールバック（読み側）】旧 md: mdAsCond→null（分析除外）・hasCondOn は提出としてカウント・recoveryOf は base null で f のみ表示・role 表示は P1a mdRoleLabel。evId 無し md: matchEventByDate(m.date) で試合解決。旧 matchsel 数値配列: P2 は D.matchsel を直接読まず squadOf(ev)（P1a のレガシー救済）経由のみ。id 比較は全て idEq。
【ヘルパー本文（正規化後に3ファイル一致が必須＝以下をそのままコピー）】
function mdAsCond(m){if(!m||m.rpe==null)return null;var ev=(m.evId!=null?(matchEvents()||[]).find(function(e){return idEq(e.id,m.evId);}):null)||matchEventByDate(m.date);var v={id:'md:'+m.id,pid:m.pid,date:m.date,rpe:m.rpe,sleep:(m.sleepH>0?m.sleepH:0),duration:(m.minutes>0?m.minutes:0),note:'試合'+(ev&&ev.opp?' vs '+ev.opp:''),inputAt:m.inputAt,_fromMd:true,_md:m,_evId:ev?ev.id:null};if(m.soreness>0){v.soreness=m.soreness;v.sorenessParts=(m.sorenessParts||[]).slice();}if(m.editedAt)v.editedAt=m.editedAt;return v;}
function condWithMd(pid,fromS,toS){function inW(d){return!!d&&(!fromS||d>=fromS)&&(!toS||d<=toS);}var out=[],byKey={};(D.f||[]).filter(function(x){return(pid==null||idEq(x.pid,pid))&&inW(x.date);}).forEach(function(f){var c={};for(var k in f)if(Object.prototype.hasOwnProperty.call(f,k))c[k]=f[k];out.push(c);var key=String(f.pid)+'|'+f.date;if(!byKey[key]||(c.inputAt||'')>(byKey[key].inputAt||''))byKey[key]=c;});(D.md||[]).filter(function(m){return(pid==null||idEq(m.pid,pid))&&inW(m.date);}).forEach(function(m){var key=String(m.pid)+'|'+m.date;if(byKey[key]){if(m.rpe!=null&&!byKey[key]._md)byKey[key]._md=m;return;}var v=mdAsCond(m);if(v){byKey[key]=v;out.push(v);}});out.sort(function(a,b){return(a.date||'').localeCompare(b.date||'')||(a.inputAt||'').localeCompare(b.inputAt||'');});return out;}
function hasCondOn(pid,dateS){return(D.f||[]).some(function(x){return idEq(x.pid,pid)&&x.date===dateS;})||(D.md||[]).some(function(m){return idEq(m.pid,pid)&&m.date===dateS;});}
function countCondOn(dateS){return(D.p||[]).filter(function(p){return hasCondOn(p.id,dateS);}).length;}
function matchDayOffset(dateS,N){N=N||3;var evs=(matchEvents()||[]).filter(function(e){return e&&e.date&&e.date<dateS;});if(!evs.length)return null;var ev=evs[evs.length-1];var n=Math.round((new Date(dateS+'T00:00:00')-new Date(ev.date+'T00:00:00'))/86400000);return(n>=1&&n<=N)?{ev:ev,n:n}:null;}
function matchDayTag(dateS){var o=matchDayOffset(dateS);return o?'MD+'+o.n:'';}
function recoveryFlags(r){var f=[];if(!r)return f;if(r.soreness>=MD_RECOV_TH.sore)f.push('筋肉痛'+r.soreness);if(r.sleep>0&&r.sleep<MD_RECOV_TH.sleep)f.push('睡眠'+r.sleep+'h');if(!r._fromMd&&r.rpe>=MD_RECOV_TH.rpe)f.push('RPE'+r.rpe);return f;}
function recoveryOf(pid,ev,N){N=N||3;var todayS=todayStr();var md=ev?mdOf(pid,ev):null;var days=[],last=null,submitted=0,due=0;for(var n=1;n<=N;n++){var ds=toDateStr(new Date(new Date(ev.date+'T00:00:00').getTime()+n*86400000));var recs=condWithMd(pid,ds,ds);var rec=recs.length?recs[recs.length-1]:null;var fl=recoveryFlags(rec);var future=ds>todayS;days.push({n:n,date:ds,rec:rec,flags:fl,future:future});if(!future)due++;if(rec){submitted++;last={n:n,rec:rec,flags:fl};}}return{md:md,base:mdAsCond(md),days:days,last:last,submitted:submitted,due:due,recovered:last?!last.flags.length:null};}
function recoveryLabel(rc){if(!rc||!rc.due)return{k:'wait',label:'これから',color:'var(--text-secondary)'};if(!rc.last)return{k:'none',label:'未入力',color:'var(--text-tertiary)'};return rc.recovered?{k:'ok',label:'回復良好',color:'var(--green)'}:{k:'ng',label:'回復未了',color:'var(--red)'};}
function condLoad(r){if(!r)return 0;var base=r._fromMd?0:sLoad(r);return base+(r._md?mdLoad(r._md):0);}
※ matchEvents() は date 昇順・type==='match' のみを返す前提（P1a）。mdOf(pid,ev) は ev.id 一致→無ければ ev.date 一致で md を引く前提（P1a）。coach は sLoad を持たないため condLoad は player/staff のみ。
## steps

### 1. [player/staff/coach] 閾値定数 MD_RECOV_TH を3ファイルに追加
WHERE: player/index.html:951（PARTS 949 / INJ_TYPES 950 の直後）、staff/index.html:988（PARTS 986 / INJ_TYPES 987 の直後）、coach/index.html:283（PARTS 282 の直後）
CHANGE: var MD_RECOV_TH={sore:3,sleep:6,rpe:8,hiLoad:560}; を追加。sore=筋肉痛(1-5)でこれ以上なら回復未了、sleep=睡眠h未満で回復未了、rpe=MD+n の練習RPEがこれ以上で「負荷高」フラグ、hiLoad=試合負荷(rpe×分 AU)がこれ以上で「高負荷試合」扱い（renderTrainingExec の MD+2 文言・getTodayCondition の判定に使用）。関数より前（トップレベル var）に置き、描画時に必ず定義済みにする。
REUSE: PARTS/INJ_TYPES の定数ブロック（player 949-950 / staff 986-987 / coach 282）
RISK: 低。閾値は Claude 既定値。凛人監修で数値を変える際はこの1箇所のみ（openIssues 参照）

### 2. [player/staff/coach] 追加読みヘルパー群（mdAsCond/condWithMd/hasCondOn/countCondOn/matchDayOffset/matchDayTag/recoveryFlags/recoveryOf/recoveryLabel）＋condLoad(player/staff)を追加
WHERE: player/index.html:578 の直後（sLoad の次行・P7a ブロック末尾）、staff/index.html:777 の直後（sLoad の次行）、coach/index.html:851 の直後（teamVolume の次・「考察エンジン」コメント 853 の前）
CHANGE: dataModel 記載の本文をそのままコピー（正規化後一致必須）。player/staff には condLoad も同ブロックに置く（coach には置かない）。先頭に規約コメント『// P2: 試合日 md を f の仮想レコードとして追加読み（正典 f/md には一切書かない）。旧md(rpe無し)は分析から除外。同日 f があれば負荷は加算・ウェルネスは f 優先』を付ける（コメントは正規化で許容）。依存: matchEvents/matchEventByDate/mdOf/mdLoad（P1a）。関数宣言はホイストされるので配置順は不問だが、P1a ブロックの近傍に置いて読みやすくする。
REUSE: idEq(player 1094/staff 1621/coach 311)・toDateStr・todayStr・sLoad(player 578/staff 777)・P1a matchEvents/matchEventByDate/mdOf/mdLoad
RISK: 中。condWithMd は f を浅いコピーするため呼び出し側が返り値を保存に使ってはならない（id が 'md:'+id の仮想行を svSafeUpdate に流すと不整合）。仮想行の編集/削除は必ず r._fromMd で分岐し showEditMatch/delMatchDay 系へ振る（各表示ステップで明記）

### 3. [player] condStreak: 試合日チェック(md)の日も連続入力に数える
WHERE: player/index.html:2034（condStreak 内の D.f forEach の直後）
CHANGE: (D.md||[]).forEach(function(r){if(idEq(r.pid,pid)&&r.date)days[r.date]=1;}); を追加。D5「試合当日は f を書かない」ため、md が無いと試合日でストリーク（ホームヒーロー 2125 の炎バッジ）が切れる問題の予防。旧 md も日付があれば数える（提出事実として扱う）。
REUSE: condStreak 2032-2040 の days マップ
RISK: 低。test_home_p8b.js 67-77 は D.f のみで検証（D.md=[]）＝結果不変

### 4. [player] todayTodoHtml: MD+1〜+3 はコンディション項目のラベルを「回復チェック」に
WHERE: player/index.html:1697（todoItems.push({key:'cond',...}) の行）
CHANGE: 直前に var mdo=matchDayOffset(todayStr()); を置き、label を mdo?'コンディション入力（試合後'+mdo.n+'日目の回復チェック）':'コンディション入力' に変更。key/done/icon/onclick は不変（go('condition')）。試合当日(n=0)は matchDayOffset が null を返すので P1 の「試合日チェック」置換と衝突しない。urgent は付けない（test_dash.js 82 の『urgent強調は試合日チェックの1件のみ』を維持）。
REUSE: todayTodoHtml 1682-1749 の todoItems 構造・matchDayOffset(step2)
RISK: 低。test_dash.js 65 の has(t1,'コンディション入力') は新ラベルにも含まれるため緑のまま。MD-x（未来）チップ 2173-2186 は触らない

### 5. [player] T.condition: 一覧/本日カード/チャートに md 仮想行を合流＋MD+n 見出し＋試合当日カード＋7日負荷
WHERE: player/index.html:2577-2617（T.condition 全体。lf 2579 / 見出し 2583-2584 / 本日カード 2585-2592 / 過去一覧 2607-2614 / チャート 2616）
CHANGE: (a) 2579: var lf=condWithMd(myPid).slice().reverse();（date降順・md仮想行込み）。todayDone 2580 は lf[0].date===td のまま（md も『本日入力済み』扱い）。(b) 2584 の見出し直下に MD+n 行: var mdo=matchDayOffset(td); if(mdo) '<div class="card" style="margin-bottom:12px;border-left:3px solid var(--purple)"><div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:13px"><span class="flag" style="background:var(--purple);color:var(--white)">MD+'+mdo.n+'</span>試合後'+mdo.n+'日目の回復チェック</div><div style="font-size:11px;color:var(--text-secondary);margin-top:3px">'+fmt(mdo.ev.date)+(mdo.ev.opp?' vs '+escapeHtml(mdo.ev.opp):'')+' の回復を追っています。筋肉痛と睡眠は正直に。</div></div>'。(c) 試合当日: var evT=matchEventByDate(td); if(evT){ var mdT=mdOf(myPid,evT); カード（border-left var(--maroon)）『今日は試合日』＋ mdT?『試合日チェック入力済み → 詳細を見る(showMatchDetail(mdT.id))』:『試合に出た人は「試合日チェック」で完了（このフォームは不要）→ 入力する(showMatchForm(td))』}。通常フォームは残す（メンバー外/自主練用・ハードブロックしない）。(d) 本日カード 2585-2592: tdRec._fromMd のとき RPE/睡眠/負荷を表示しつつ『MATCH』flag（background:var(--maroon);color:var(--white)）＋ mdRoleLabel(tdRec._md) を付け、修正→showEditMatch(tdRec._md.id)・削除→delMatchDay(tdRec._md.id) に振る（f 行は従来どおり）。2589 の sLoad(tdRec) → condLoad(tdRec)。(e) 過去一覧 2607-2614: r._fromMd なら 日付＋MATCH flag＋pain-dot(rpe)＋sleep＋condLoad(r)+' AU'＋筋肉痛ext（soreness/sorenessParts は f と同表示）＋修正/削除は showEditMatch/delMatchDay。r._md（同日 f+md）なら sLoad 表示の横に '<span style="font-size:10px;color:var(--maroon)">+試合'+mdLoad(r._md)+'AU</span>'。2613 の sLoad(r) → condLoad(r)。(f) チャート 2616: recs は lf（合流済み）を使用。RPE/睡眠 dataset に pointStyle:recs.map(function(r){return r._fromMd?'rectRot':'circle';}),pointRadius:recs.map(function(r){return r._fromMd?6:3;}) を追加。canvas 直下に recs.some(_fromMd) のとき '<div style="font-size:10px;color:var(--text-tertiary);margin-top:4px">◆＝試合日</div>'。(g) 本日カード直後に 7日負荷タイル: var l7=condWithMd(myPid,agoStr(6),td); var tot=l7.reduce(function(s,r){return s+condLoad(r);},0), mt=l7.reduce(function(s,r){return s+(r._md?mdLoad(r._md):0);},0); '<div class="mc" style="margin-bottom:12px"><div class="v" style="color:var(--purple)">'+tot+'</div><div class="l">直近7日の負荷(AU)'+(mt?' ・ うち試合 '+mt:'')+'</div></div>'（tot>0 のときのみ）。
REUSE: rate5HTML/RATE5_LABELS/SORE_EMO 2771-2785・sc/rc 1106-1107・roleBadgeHtml 3967→P1a mdRoleLabel・showEditMatch 4391・delMatchDay 3141（P1 で Undo 化済）・agoStr 6545
RISK: 中。test_cond.js は T.condition のフォーム描画/保存を検証（D.md=[]）＝新カードは出ないので緑。cf-* の id は変更しない。Chart の hex は既存行の流用のみ（新規 hex を書かない）

### 6. [player] getTodayCondition: 前日の試合負荷・MD+2 高負荷・当日筋肉痛を判定に追加
WHERE: player/index.html:5395-5426（getTodayCondition）
CHANGE: 5398 の mine を var win=toDateStr(new Date(new Date(today).getTime()-2*86400000)); var mine=condWithMd(myPid,win,today); に置換（従来の『直近2日以内』ロジックと等価。5405-5411 の recent 代用はそのまま動く）。5418-5422 の前日ルール直後に: if(yestRec&&yestRec._fromMd){reasons.push('昨日は試合（RPE'+yestRec.rpe+'・'+condLoad(yestRec)+'AU）');if(yestRec._md.postFatigue>=4)bad=true;}（rpe>=8 の既存判定で bad は既に立つ）。さらに var mdo=matchDayOffset(today,2); if(mdo&&mdo.n===2){var m2=mdOf(myPid,mdo.ev);if(m2&&mdLoad(m2)>=MD_RECOV_TH.hiLoad){bad=true;reasons.push('一昨日の試合負荷が高い('+mdLoad(m2)+'AU)');}}。当日 todayRec.soreness>=4 のとき bad=true, reasons.push('筋肉痛が強い('+todayRec.soreness+'/5)')。戻り値の形 {bad,good,reasons} は不変。
REUSE: getTodayCondition 5395-5426・renderTrainingExec 5053-5057 の cond 表示（変更不要）
RISK: 低。呼び出しは 5053 の1箇所のみ。test_train_weak.js 等が getTodayCondition を直接検証するなら D.md=[] で従来値

### 7. [player] renderTrainingExec: MD+1「回復優先」/ MD+2「中強度まで」ヒントカード
WHERE: player/index.html:5062（MD-1 テーパーヒントブロック 5058-5062 の直後）
CHANGE: var mdoT=matchDayOffset(todayStr(),2); if(mdoT){var mT=mdOf(myPid,mdoT.ev),hiT=!!(mT&&mdLoad(mT)>=MD_RECOV_TH.hiLoad); n===1: '<div class="card" style="border-left:3px solid var(--purple);margin-bottom:12px"><div style="font-size:12px;color:var(--purple);font-weight:700;display:flex;align-items:center;gap:6px"><span class="flag" style="background:var(--purple);color:var(--white)">MD+1</span>昨日は試合'+(mT?'（'+mdLoad(mT)+'AU）':'')+'</div><div style="font-size:11px;color:var(--text-secondary);margin-top:3px">回復優先。高重量・追い込みは避け、可動域と軽負荷で血流を促す程度に。筋肉痛が強い部位は外そう。</div></div>'。n===2: flag MD+2『中強度まで』＋ (hiT?'試合負荷が高かったので主働筋のボリュームは抑えめに。':'フォーム重視で前回同等まで。') }。MD-1（明日試合）と MD+n が同時に真の場合は両方出す（週2試合）。
REUSE: MD-1 ヒント 5058-5062 のマークアップ（flag/カード様式）・matchDayOffset・mdOf/mdLoad(P1a)
RISK: 低。subView 内のため onSnapshot 再描画の影響なし

### 8. [player] getMyInsights: 7日コンディションに試合 RPE を合流＋「試合後の回復」ルール追加
WHERE: player/index.html:6606（cond7）と 6612 の直後（4) ブロック末尾）
CHANGE: 6606: var cond7=condWithMd(pid,agoStr(6),todayStr());（avgOf は null を無視＝仮想行の rpe も平均に入る）。6612 の後に 4') ルール: var lastEv=(matchEvents()||[]).filter(function(e){return e.date<todayStr()&&inR(e.date);}).slice(-1)[0]; if(lastEv){var rc=recoveryOf(pid,lastEv),rl=recoveryLabel(rc); if(rl.k==='ng')out.push({lv:'warn',t:fmt(lastEv.date)+'の試合後、回復が追いついていません（MD+'+rc.last.n+': '+escapeHtml(rc.last.flags.join('・'))+'）',d:'睡眠と栄養を優先し、今週の負荷は控えめに。痛みが残るなら怪我報告を。',detail:rc.days.map(日別行: MD+n / 日付 / 筋肉痛 / 睡眠 / flags or OK / 未入力).join('')}); else if(rl.k==='ok'&&rc.submitted>=2)out.push({lv:'good',t:fmt(lastEv.date)+'の試合後、回復は順調です',d:'MD+1〜+'+rc.last.n+'の筋肉痛・睡眠は基準内。'+(rc.base?'試合負荷 '+mdLoad(rc.md)+'AU。':'')}); else if(rl.k==='none'&&rc.due>=1)out.push({lv:'info',t:'試合後の回復チェックが未入力です',d:'MD+1〜+3は毎日のコンディション入力で回復を追います。'});}
REUSE: getMyInsights 6562-6641 の {lv,t,d,detail} 契約・weeklyReviewCardHtml 2042（自動で上位3件に乗る）
RISK: 低。test_mydata.js は getMyInsights を D.cal=[] で検証＝新ルールは発火しない

### 9. [player] T.mydata コンディションチャート(md-cond-chart)に試合日を合流＋◆マーカー
WHERE: player/index.html:6670（fRecs）、6735-6740（fMap/cSet）、6742（canvas カード）、6951-6955（charts.md_cond）
CHANGE: 6670: var fRecs=condWithMd(myPid,R==='all'?null:since,null);（date昇順・仮想行込み。wMap 6737 は r.weight のある f だけが入るので仮想行は無視される）。6742 の canvas div の直後に fRecs.some(_fromMd) のとき '<div style="font-size:10px;color:var(--text-tertiary);margin-top:4px">◆＝試合日（試合日チェックのRPE・睡眠）</div>'。6952/6953 の RPE・睡眠 dataset に pointStyle:cDates.map(function(dt){return fMap[dt]&&fMap[dt]._fromMd?'rectRot':'circle';}),pointRadius:cDates.map(function(dt){return fMap[dt]&&fMap[dt]._fromMd?6:3;}) を追加（既存の pointRadius:3 を置換）。new Chart の数は不変（chart_counts player:14 維持）。
REUSE: T.mydata 6661-6975・dC/charts.md_cond の冪等描画
RISK: 低。test_mydata.js 161/175（canvas 存在・charts.md_cond 生成）は不変。Chart.js 4.4.1 の indexable pointStyle 配列は対応（実機で確認）

### 10. [player] showMatchDetail: 回復セクション（RECOVERY・pitchProgressHtml・MD+1〜+3 日別行）
WHERE: player/index.html:4386（showSub(h) の直前。4369 の x.id===mid は P1 で idEq 化済み前提）
CHANGE: var ev=(m.evId!=null?(matchEvents()||[]).find(function(e){return idEq(e.id,m.evId);}):null)||matchEventByDate(m.date)||{id:null,date:m.date}; var rc=recoveryOf(myPid,ev),rl=recoveryLabel(rc); h+='<div class="form-box"><div class="form-title" style="display:flex;align-items:center;gap:6px">'+ic('i-heart',13,'var(--maroon)')+' 回復の進み <span class="kicker" style="margin:0">RECOVERY</span><span class="bd" style="margin-left:auto;background:'+rl.color+';color:var(--white)">'+rl.label+'</span></div>'+pitchProgressHtml(rc.submitted,4,['MD','+1','+2','+3'],{h:60,ball:ic('i-ball',20,'var(--pitch-accent)'),caption:['試合','','回復チェック '+rc.submitted+'/3']})+rc.days.map(function(d){var r=d.rec;return'<div class="log-row"><span style="min-width:52px;font-weight:600">MD+'+d.n+'</span><span style="min-width:44px;color:var(--text-secondary)">'+fmt(d.date).slice(5)+'</span>'+(r?'<span>'+(r.soreness?SORE_EMO[r.soreness-1]+' '+RATE5_LABELS.sore[r.soreness-1]:'筋肉痛 -')+'</span><span style="color:'+sc(r.sleep)+'">'+(r.sleep>0?r.sleep+'h':'-')+'</span><span>RPE '+(r.rpe!=null?r.rpe:'-')+'</span>'+(d.flags.length?'<span class="bd bd-r">'+escapeHtml(d.flags.join('・'))+'</span>':'<span class="bd bd-g">OK</span>'):(d.future?'<span style="color:var(--text-tertiary)">これから</span>':(d.date===todayStr()?'<button class="btn btn-sm btn-p" onclick="go(\'condition\')">今日の回復チェックを入力</button>':'<span style="color:var(--text-tertiary)">未入力</span>')))+'</div>';}).join('')+'</div>'; 旧 md（base null）でも f 由来の日別行は出る。試合負荷は基本情報側（P1 で表示済み前提）。
REUSE: pitchProgressHtml 3932（サブ画面＝毎回アニメが仕様・still 不要）・SORE_EMO 2771/RATE5_LABELS 2773・sc 1107・showSub 2073（P1 で backTab 'match' 化済み前提）
RISK: 低。サブ画面のため onSnapshot 再描画の影響なし。.rv-armed は書かない

### 11. [player] mypage「あなたへのお知らせ」: kind:'md-remind' に「入力する →」/「入力済み」を表示
WHERE: player/index.html:2404-2405（myAnns.forEach 内の h+= 行）
CHANGE: 2405 の本文 div の後に: var extra=''; if(a.kind==='md-remind'){var done=(D.md||[]).some(function(m){return idEq(m.pid,myPid)&&((a.refEvId!=null&&m.evId!=null&&idEq(m.evId,a.refEvId))||m.date===a.refDate);}); extra=done?'<div style="font-size:11px;color:var(--green);font-weight:700;margin-top:4px">'+ic('i-check-c',12)+' 入力済み</div>':'<button class="btn btn-sm btn-match" style="margin-top:6px" onclick="showMatchForm(\''+escapeHtml(a.refDate||'')+'\')">'+ic('i-flag',12)+' 入力する →</button>';} を h に連結。既読登録 2407-2413 は不変。ホーム 2083 は targetPid 無しのみ表示なので個人催促はマイページ＋ヘッダ未読バッジ（2104/2382/updateNavBadge）に自然に乗る。
REUSE: mypage 2402-2416・showMatchForm(dateArg)（P1 M1）
RISK: 低〜中。P1 が showMatchForm の引数を evId に変えた場合は onclick を a.refEvId に差し替える（openIssues）

### 12. [staff] getLatestCond(pid) を追加（staff 専用・md 合流版の最新レコード）
WHERE: staff/index.html:1648 の直後（getLatestFatigue の次行）
CHANGE: function getLatestCond(pid){var r=condWithMd(pid);return r.length?r[r.length-1]:null;} を追加。getLatestFatigue は残す（他呼び出しへの影響ゼロ）。以降のステップで V.fatigue / dash fa / reqQueue red の3箇所を getLatestCond に切替える。
REUSE: condWithMd(step2)
RISK: 低

### 13. [staff] reqQueue / dashboard の提出判定・レッドフラグに md を合流
WHERE: staff/index.html:1672（reqQueue red）、1676-1681（reqQueue late）、1780（dash fa）、1824-1829（condSubmittedToday/condNotSubmitted/condRate/condSubCnt）、1841-1847（lateSubmitters）
CHANGE: 1672/1780: var lf=getLatestCond(p.id);if(lf&&lf.date===todayS){if(lf.rpe>=8&&!lf._fromMd)…RPE行…;if(lf.sleep>0&&lf.sleep<=5)…睡眠行（_fromMd なら txt に ' (試合日)' を付加）…}（試合RPEは負荷でありレッドフラグにしない＝D5 ウェルネス優先の解釈。sleep の >0 ガードは f.sleep=0(未入力)の誤警報も同時に消す）。1676-1677: var hasY=hasCondOn(p.id,ydS),hasT=hasCondOn(p.id,todayS); 1679: var lastRec=getLatestCond(p.id);。1825-1827: var condNotSubmitted=D.p.filter(function(p){return!hasCondOn(p.id,todayS);}); （1824 の condSubmittedToday は削除。condRate/condSubCnt はそのまま算出＝試合当日は md 提出者も分子に入り提出率ピッチ 1992 が正しく進む）。1841-1842: hasCondOn に置換、1845: getLatestCond(p.id)。
REUSE: reqQueue 1661-1687・V.dash 1775-1850・pitchProgressHtml 提出率ピッチ 1992（変更不要）
RISK: 中。test_staff_ia_p8d.js 39-44（red 2件=RPE9+睡眠4.5、late 1件）と test_dash_staff.js 42/48（提出率50%）は D.md=[] のため不変。sleep>0 ガードは既存挙動の改善（0h 誤警報が消える）＝openIssues に明記

### 14. [staff] ダッシュボード「試合後リカバリー対象」カード（注意層・cantPrac 拡張）
WHERE: staff/index.html:1938（cantPrac ブロックの閉じ直後・「連続欠席」1939 の前）と 1973（warnCount）
CHANGE: var recovBlocks=[]; (matchEvents()||[]).forEach(function(ev){var n=Math.round((new Date(todayS+'T00:00:00')-new Date(ev.date+'T00:00:00'))/86400000);if(n<1||n>3)return; 母数 pids = squadOf(ev) の pid ∪ その試合の md 提出者（m.evId 一致 or m.date===ev.date）; 各 p について m=mdOf(p.id,ev), rc=recoveryOf(p.id,ev), rl=recoveryLabel(rc), tags=[], pri=0 を組み立て: ①HIA: m&&(m.hiaInjId||(m.hiaImpact&&(m.hiaSymptoms||[]).length)) → {t:'HIA',c:'bd-r'},pri=5 ②怪我報告: m&&mdInjuryLive(m) → 'bd-r',pri=4 ③来週練習: cp=(m&&m.canPractice)||(D.i の source==='match'&&date===ev.date&&approved!==false な i の canPractice); '参加できない'/'わからない' → {t:'来週'+cp,c:'bd-a'},pri=3 ④試合後疲労: m&&(m.postFatigue>=4||m.soreness>=4||m.cramp) → {t:m.cramp?'攣り':'試合後疲労高',c:'bd-a'},pri=2 ⑤出場: m&&m.minutes>=60 → {t:m.minutes+'分',c:'bd-b'},pri=1 ⑥回復: rl.k==='ng' → {t:'回復未了 '+rc.last.flags.join('・'),c:'bd-r'},pri=3 / rl.k==='none' → {t:'回復チェック未入力',c:'bd-a'}。tags が空の選手は載せない。pri 降順ソート → recovBlocks.push({ev,n,rows})}); recovBlocks.forEach → warnItems.push(見出し: ic('i-ball',15,'var(--amber)')+'試合後リカバリー対象<span class="bd bd-a">'+rows.length+'</span><span style="font-size:11px;font-weight:600;color:var(--text-secondary)">MD+'+n+' ・ '+fmt(ev.date)+(ev.opp?' vs '+escapeHtml(ev.opp):'')+'</span>' ＋ 行: '<div class="alert-card alert-warn" style="cursor:pointer;justify-content:space-between;flex-wrap:wrap;gap:6px" onclick="goPlayerDetail('+p.id+',3)"><span>'+escapeHtml(p.name)+'</span><span style="display:flex;gap:4px;flex-wrap:wrap">'+tags.map(bd chip).join('')+'</span></div>'）。1973: warnCount に recovBlocks の rows 合計を加算。既存 cantPrac ブロック 1933-1938 はそのまま残す（試合以外の canPractice 用）。
REUSE: cantPrac 描画 1933-1938 の様式・alert-card/bd クラス・goPlayerDetail(pid,openTab) 4578（openTab=3 で疲労度タブ）・squadOf/mdOf/mdInjuryLive（P1a）
RISK: 中。test_dash_staff.js は D.cal=[] D.md=[] のため recovBlocks 空＝注意層の件数・構造不変。md v2 フィールド名（hiaInjId/hiaImpact/hiaSymptoms/canPractice/postFatigue/soreness/cramp/minutes）は P1 の確定名に合わせる

### 15. [staff] V.fatigue（チーム表/個人一覧/チャート）に md を合流
WHERE: staff/index.html:2264（teamData）、2266（個人一覧）、2267（チーム表）、4319（renderFatigueChart）
CHANGE: 2264: f:getLatestCond(p.id)。2266: var recs=condWithMd(parseInt(pf)).slice().reverse(); 行: r._fromMd なら 日付の隣に '<span class="flag" style="background:var(--maroon);color:var(--white)">MATCH</span>'、RPE/睡眠セルは同じ、sRPE は condLoad(r)、修正→showEditMatchStaff(\''+r._md.id+'\',\''+r.date+'\')・削除→delMatchDayStaff(\''+r._md.id+'\',\''+r.date+'\')（P1 で Undo 化済）。r._md（同日 f+md）なら sRPE 表示を condLoad(r)+' <span style="font-size:10px;color:var(--maroon)">(試合'+mdLoad(r._md)+')</span>'。f 行の修正/削除は従来どおり。2267: f._fromMd なら日付セルに MATCH flag、srpe=condLoad(f)。4319: recs=condWithMd(pid).slice(-30)、sRPE dataset を condLoad(r)、RPE dataset に pointStyle/pointRadius 配列（_fromMd→'rectRot'/6）。new Chart 数不変。
REUSE: V.fatigue 2262-2267・renderFatigueChart 4319・showEditMatchStaff 5478・delMatchDayStaff 5155
RISK: 低〜中。sleep=0（未入力）の仮想行は '0h' 表示＝f の既存挙動と同じ

### 16. [staff] goPlayerDetail 疲労度タブ・ヒーロー・提出カレンダーに md を合流
WHERE: staff/index.html:4585-4586（fRecs/lf）、4596（condToday）、4628（dt3 一覧）、4632-4633（14日提出）、4652-4653（ch-pftg）
CHANGE: 4585: var fRecs=condWithMd(pid).slice().reverse();（降順）。4596 の condToday=fRecs.find(date===todayS2) はそのまま md も拾う（ヒーロー『本日コンディション』が試合当日に✓になる）。4628: 最新カードは lf._fromMd なら MATCH flag＋sRPE=condLoad(lf)、一覧行は step15 と同じ分岐（修正/削除ボタンは無いので flag と condLoad のみ）。4632-4633 は fRecs.some(date) のまま＝md 日も提出扱い。4652: var fr=condWithMd(pid).slice(-30); sRPE dataset に condLoad、pointStyle 配列。
REUSE: goPlayerDetail 4578-4655・step15 の行様式
RISK: 低。test_staff_pdetail_std.js は D.md 空前提

### 17. [staff] exportCSV('fatigue') に試合行を追加読み（末尾に種別列）
WHERE: staff/index.html:5374
CHANGE: csv='選手,日付,RPE,睡眠,TR時間,sRPE,メモ,種別\n'; condWithMd(null).forEach(function(r){csv+='"'+pName(r.pid)+'","'+r.date+'",'+r.rpe+','+r.sleep+','+(r._fromMd?r.duration:effDur(r))+','+condLoad(r)+',"'+String(r.note||'').replace(/"/g,'""')+'","'+(r._fromMd?'試合':(r._md?'練習+試合':'練習'))+'"\n';}); 列は末尾追加のみ（既存6列の位置は不変）。
REUSE: exportCSV 5367-5381・effDur 770
RISK: 低。CSV 利用者へ列追加を周知（openIssues）

### 18. [staff] 試合レポート（goMatchDateDetail）に回復パネル＋催促ボタン
WHERE: staff/index.html:5461（3枚のメトリクスの閉じ直後＝催促ボタン）と 5474 の pushView 直前（回復パネル）。P1 で goMatchReport(evId) に改称されている場合はその提出状況パネル直下と末尾
CHANGE: var ev=matchEventByDate(date)||{id:null,date:date}; (a) 5461 直後: if(ev.id!=null)h+=mdRemindBtnsHtml(ev);（P1 の未提出者チップの直下に置く）。(b) 回復パネル: var nDay=Math.round((new Date(todayStr()+'T00:00:00')-new Date(date+'T00:00:00'))/86400000); if(nDay>=1){ roster = squadOf(ev) の pid ∪ recs の pid を D.p で解決; rcs=roster.map(p→{p,rc:recoveryOf(p.id,ev)}); function avgL(a){var v=a.filter(function(x){return x!=null&&x>0;});return v.length?v.reduce(function(s,x){return s+x;},0)/v.length:null;} dayStats=[1,2,3].map(n→{n,cnt,sore:avgL(soreness),sleep:avgL(sleep),rpe:avgL(rpe)}); h+='<div class="form-box"><div class="form-title">'+ic('i-heart',14,'var(--maroon)')+' 回復の進み <span class="kicker" style="margin:0">RECOVERY MD+1〜+3</span></div><div class="grid g3">'+dayStats.map(d→'<div class="mc"><div class="v" style="color:'+(d.sore==null?'var(--text-tertiary)':d.sore>=MD_RECOV_TH.sore?'var(--red)':'var(--green)')+'">'+(d.sore!=null?d.sore.toFixed(1):'-')+'</div><div class="l">MD+'+d.n+' 筋肉痛 平均</div><div style="font-size:10px;color:var(--text-secondary)">睡眠 '+(d.sleep!=null?d.sleep.toFixed(1)+'h':'-')+' ・ 提出 '+d.cnt+'/'+roster.length+'</div></div>').join('')+'</div>'; ng=rcs.filter(k==='ng'), none=rcs.filter(k==='none'); h+= ng.length?'<div style="font-size:12px;font-weight:700;color:var(--red);margin:10px 0 6px">まだ戻っていない選手 ('+ng.length+'名)</div><div style="display:flex;flex-wrap:wrap;gap:5px">'+ng.map(x→'<span class="chip-late" style="cursor:pointer" onclick="goPlayerDetail('+x.p.id+',3)">'+escapeHtml(x.p.name)+' <span class="bd bd-r">MD+'+x.rc.last.n+' '+escapeHtml(x.rc.last.flags.join('・'))+'</span></span>').join('')+'</div>':'<div style="font-size:12px;color:var(--green);font-weight:600;margin-top:8px">'+ic('i-check-c',13)+' 回復チェック提出者は全員基準内</div>'; none.length なら '回復チェック未入力 (n名)' チップ列（goPlayerDetail）; h+='</div>'; } 
REUSE: submissionPanel 1984-1999 の chip-late 様式・mc/grid g3・squadOf/mdOf（P1a）・recoveryOf/recoveryLabel(step2)
RISK: 中。staff に avgOf が無いためローカル avgL を使う（identical 追加はしない）。P1 の画面再構成と衝突しないよう「パネルは末尾追加」に限定

### 19. [staff] 催促: 個人お知らせ一括（kind:'md-remind'）＋LINE用テキストコピー＋Undo
WHERE: staff/index.html:5302 の直後（delAnnounce の次・postAnnounce 群の末尾）
CHANGE: 新設 6関数: (1) mdMissingFor(ev): (squadOf(ev)||[]) から role==='none' を除き、mdOf(p.id,ev) が無い選手を [{p,role,num}] で返す（P1 に同等関数があればそれを使い重複定義しない）。(2) mdRemindText(ev,missing): '【試合日チェック未入力のお知らせ】\n'+fmt(ev.date)+(ev.opp?' vs '+ev.opp:'')+' の試合日チェックがまだ入力されていません。\n本日中にアプリ（ホーム→試合日チェック）から入力をお願いします。\n'+missing.map('・'+name+(num?'（'+num+'）':'')).join('\n')+'\n残り '+missing.length+'名'。(3) copyText(str): navigator.clipboard.writeText があれば then(toast('コピーしました（LINEに貼り付けてください）'))、無ければ textarea+document.execCommand('copy') フォールバック、失敗は alert('コピーできませんでした。テキストを長押しで選択してください。')＋テキストを pushView で表示。(4) mdRemindBtnsHtml(ev): 未提出0なら ''、それ以外 '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-sm btn-p" onclick="sendMdReminders(\''+ev.id+'\',this)">'+ic('i-megaphone',12)+' 未提出者に個別お知らせ（n名）</button><button class="btn btn-sm" onclick="copyMdRemind(\''+ev.id+'\')">'+ic('i-clipboard',12)+' LINE用テキストをコピー</button></div>'。(5) copyMdRemind(evId): ev を matchEvents() から idEq で解決→copyText(mdRemindText(ev,mdMissingFor(ev)))。(6) sendMdReminders(evId,btnEl): guardSubmit→ svSafeUpdate('ann',function(latest){ addedIds=[];skipped=0; miss.forEach: latest に kind==='md-remind'&&idEq(refEvId,ev.id)&&idEq(targetPid,p.id) があれば skipped++ で飛ばす、無ければ {id:newId(),date:todayStr(),text:'【試合日チェック未入力】'+fmt(ev.date)+(opp)+' の試合日チェックがまだ入力されていません。ホームの「試合日チェック」から入力してください。',targetPid:p.id,kind:'md-remind',refEvId:ev.id,refDate:ev.date,createdBy:getCurrentUserName(MY_ROLE)} を push し addedIds に記録; return latest;}, onDone: releaseSubmit; addedIds 空なら toast('全員に送信済みです'); それ以外 toast(n+'名に送信しました'+(skipped?'（'+skipped+'名は送信済み）':''),'元に戻す',function(){undoMdReminders(ids);}); curPage==='dash' なら V.dash(); onError: releaseSubmit+alert)。undoMdReminders(ids): svSafeUpdate('ann', latest.filter(!ids に含まれる id)) → toast('取り消しました')。1トランザクションで N 件追記＝staff に svSafeSeq が無い制約を svSafeUpdate で満たす（重複判定も latest に対して行うため二重送信でも増えない）。
REUSE: postAnnounce 5275（ann 形）・doRejectInjury/undoRejectInjury 8602-8635（Undo 雛形）・guardSubmit 1244/releaseSubmit 1255/newId 1240・toast 447・getCurrentUserName/MY_ROLE（8586 と同じ）
RISK: 中。confirm() 不使用・素の sv 不使用。player 側の targetPid 比較は厳密等価（2380）なので targetPid は p.id をそのまま（数値）入れる。jsc テストでは navigator.clipboard をスタブする

### 20. [staff] ダッシュボードの試合日チェック未入力ブロック（P1 置換後）に催促ボタンを配置
WHERE: staff/index.html:2118 相当（現行 2109-2118 は P1 で pendingMatchChecks/squadOf ベースの試合ごとブロックに置換される。その各ブロックの見出し直下）
CHANGE: 各試合 ev の見出し（『試合日チェック未入力 9/5 / n名』）の直後に mdRemindBtnsHtml(ev) を挿入。P1 がまだ日付ベースなら ev=matchEventByDate(yesterdayDS) で解決し ev があるときのみ出す。ブロック自体の母数・名前チップは P1 のまま。
REUSE: step19 mdRemindBtnsHtml・P1 の未入力ブロック
RISK: 低。test_dash_staff.js は D.cal=[] で非表示

### 21. [coach] condDaily: md 合流＋試合日フラグ（charts.cond の ◆ マーカー用）
WHERE: coach/index.html:823-836
CHANGE: function condDaily(days){var out=[];var all=condWithMd(null,agoStr(days-1),todayStr());for(var n=days-1;n>=0;n--){var ds=agoStr(n);var recs=all.filter(function(x){return x.date===ds;});…rpes/sleeps は従来計算…;out.push({date:ds,rpe:…,sleep:…,n:recs.length,match:!!matchEventByDate(ds)});}return out;} 同日 f+md は f の rpe/sleep が使われる（ウェルネス f 優先）。仮想行は rpe/sleep が平均に入る。
REUSE: condDaily 823-836・matchEventByDate（P1a）
RISK: 低。戻り値に match を追加するだけ（既存キー不変）

### 22. [coach] charts.cond: 試合日ポイントを ◆ で強調＋凡例キャプション
WHERE: coach/index.html:2080（canvas カード）と 2097-2098（2 datasets）
CHANGE: 2097/2098 の pointRadius:3 を pointRadius:daily.map(function(d){return d.match?6:3;}) に、pointStyle:daily.map(function(d){return d.match?'rectRot':'circle';}) を追加。2080 の canvas div の後（同じ card 内）に daily.some(match) のとき '<div style="font-size:10px;color:var(--txt-3);margin-top:6px">◆＝試合日（試合日チェックの RPE・睡眠を合算）</div>'。new Chart は増やさない（chart_counts coach:4 維持）。既存の hex はそのまま（新規 hex を書かない）。
REUSE: renderConditionView 2061-2102
RISK: 低

### 23. [coach] condAlerts: md 合流＋「試合後回復未了」フラグ
WHERE: coach/index.html:1803-1816
CHANGE: 1806: var recs=condWithMd(p.id,recent7,todayStr()).slice().reverse();（降順）。1809 avgRpe はそのまま（試合 RPE を含む）。1811 の睡眠判定の後に var mdo=matchDayOffset(todayStr());if(mdo){var rc=recoveryOf(p.id,mdo.ev);if(recoveryLabel(rc).k==='ng')flag='試合後回復未了';} を置き、1812 の avgRpe>=8 は最後（従来どおり最優先）。戻り {p,flag,sleep,avgRpe} は不変（renderHomeView 1777-1785 / renderConditionView 2065-2089 は無改修）。
REUSE: condAlerts 1803-1816
RISK: 低

### 24. [coach] insCondition: 7日/前週レコードに md 合流＋高RPE連続から試合日を除外＋「試合後の回復」ルール
WHERE: coach/index.html:1118（recs7）、1127（prevRecs）、1157（streak）、1167 の直後（新ルール）
CHANGE: 1118: var recs7=condWithMd(null,agoStr(6),todayStr()); 1127: var prevRecs=condWithMd(null,agoStr(13),agoStr(7));（従来の x.date<agoStr(6) と同範囲）。1157: condWithMd(p.id).slice().reverse().filter(function(x){return x.rpe!=null&&!x._fromMd;}).slice(0,5)（試合 RPE を疲労蓄積の連続判定に数えない）。1167 の後: var mdo=matchDayOffset(todayStr()); if(mdo){var ev=mdo.ev;var roster=D.p.filter(function(p){return squadRole(ev,p.id)||mdOf(p.id,ev);});var rcs=roster.map(function(p){return{p:p,rc:recoveryOf(p.id,ev)};});var ng=rcs.filter(function(x){return recoveryLabel(x.rc).k==='ng';}),sub=rcs.filter(function(x){return x.rc.submitted>0;}); if(roster.length)out.push({lv:ng.length?'warn':(sub.length?'good':'info'),t:fmt(ev.date)+'の試合（MD+'+mdo.n+'）: 回復チェック提出 '+sub.length+'/'+roster.length+'名・回復未了 '+ng.length+'名',d:ng.length?'筋肉痛'+MD_RECOV_TH.sore+'以上または睡眠'+MD_RECOV_TH.sleep+'h未満が残る選手がいます。今週の負荷は個別に調整を。':'提出者の筋肉痛・睡眠は基準内です。',detail:capRows(ng.map(function(x){return insRowP(x.p.id,'MD+'+x.rc.last.n,'<span style="color:var(--red);font-weight:800;font-size:13px">'+escapeHtml(x.rc.last.flags.join('・'))+'</span>');}),10)});} 1170 coveredPids は recs7 合流済みで md 提出者も入力扱い。insHome 1185 は無改修（自動で乗る）。
REUSE: insCondition 1116-1183・insRowP 883・capRows 892・insCard/insightSec 863-901
RISK: 低。coach テスト群は D.cal/D.md 空前提

### 25. [coach] KPI・平均睡眠・週報の提出数に md を合流
WHERE: coach/index.html:1759（renderHomeView inputToday）、2066（renderConditionView inputToday）、1664（avgSleepCalc）、1621-1622（weeklyDeltaData sub）
CHANGE: 1759/2066: var inputToday=countCondOn(today);。1664: var vals=condWithMd(null,since,todayStr()).filter(function(x){return x.sleep!=null&&x.sleep>0;}).map(function(x){return x.sleep;});。1621: condWithMd(null,monS,todayS).length、1622: condWithMd(null,lastMonS,lastSunS).length（同日 f+md は f コピー1件＝二重計上なし）。
REUSE: weeklyDeltaData 1606-1637・avgSleepCalc 1663-1668
RISK: 低。test_p8e_coach.js の sub 率は D.md=[] で不変

### 26. [coach] 個人レポート/個人考察: 7日コンディションに md 合流＋「試合負荷」ミニ統計
WHERE: coach/index.html:2221（renderPlayerReport condRecs）、2231 の直後（condStats 追加）、1231（insPlayer cond7）
CHANGE: 2221: var condRecs=condWithMd(pid,recent7,todayStr());。2231 の後: var mdIn=condRecs.filter(function(x){return x._md;});if(mdIn.length){var ld=mdIn.reduce(function(s,x){return s+mdLoad(x._md);},0);condStats+=miniStat('試合負荷(7日)',ld+'AU','var(--accent)');}。1231: var cond7=condWithMd(pid,agoStr(6),todayStr());。個人レポートの「試合履歴（出場数・合計分・試合ごとの RPE/perf）」は P5 の範囲＝ここでは触らない。
REUSE: renderPlayerReport 2219-2233・miniStat 1250・insPlayer 1196-1247
RISK: 低

### 27. [dev] sync_manifest 登録・sync_check/residue・全テスト
WHERE: dev/sync_manifest.json（identical セクション末尾）・dev/run_tests.py
CHANGE: identical に MD_RECOV_TH(var; player/staff/coach)・mdAsCond・condWithMd・hasCondOn・countCondOn・matchDayOffset・matchDayTag・recoveryFlags・recoveryOf・recoveryLabel（function; player/staff/coach）・condLoad（function; player/staff）を追加。chart_counts は不変（new Chart を増やさない）。順に python3 dev/sync_check.py → python3 dev/sync_check.py --residue（新規マークアップは var() のみ＝残渣0維持）→ python3 dev/run_tests.py（既存64本＋新規3本）。
REUSE: dev/sync_check.py・dev/run_tests.py・dev/extract.py
RISK: 低。identical は正規化後一致が必須＝3ファイルへ同一本文をコピー（コメント差のみ許容）

## tests
- 【新規】dev/test_matchday_recovery.js（先頭に『// 実行: jsc dev/prelude.js /tmp/player.js dev/test_matchday_recovery.js』・日付は daysAgo(n) 相対・D.cal に {id:900,date:daysAgo(2),type:'match',title:'vs A大',opp:'A大'} と md v2 {id:51,pid:1,date:daysAgo(2),evId:900,rpe:8,minutes:80,sleepH:6.5,soreness:2,role:'start',inputAt}）: (1) matchDayOffset: daysAgo(1)→n=1、daysAgo(2)の翌々日=今日→n=2、4日後は null、試合当日は null、MD-1（未来試合）は null (2) mdAsCond: v2→ {rpe:8,duration:80,sleep:6.5,_fromMd:true,id:'md:51'}、旧md {fatiguePre:3,sleepTime:'23:00'} → null (3) condWithMd: f 無し日は仮想行、同日 f あり日は f コピーに _md が付き仮想行は増えない、同日 f が2件なら inputAt 最新の1件だけ _md、返り値を変更しても D.f が汚れない（D.f[0] に _md が無い） (4) condLoad: 仮想=640、f(rpe5,duration60)+_md=300+640 (5) hasCondOn/countCondOn: md のみの日も true、旧 md も true (6) recoveryOf/recoveryLabel: MD+1 f(soreness4,sleep5)→flags 2件・k='ng'、MD+1〜+3 全て soreness1/sleep7→k='ok'、f 無し→k='none'、試合翌日が未来→k='wait' (7) condStreak: f(今日) + md(昨日) で 2 (8) todayTodoHtml: MD+2 の今日に『試合後2日目の回復チェック』を含み、has('コンディション入力') も真、urgent 赤背景は0件（試合日チェック todo が無い前提） (9) T.condition: MD+n カードに 'MD+2' flag、過去一覧に 'MATCH' flag と '640 AU'、修正ボタンが showEditMatch を指す、7日負荷タイルに『うち試合 640』 (10) getTodayCondition: 昨日 md(rpe8) で bad=true・reasons に『昨日は試合』、当日 f soreness4 で『筋肉痛が強い』 (11) getMyInsights: MD+1 f(soreness4) で lv:'warn' の『回復が追いついていません』、全 OK で lv:'good' (12) showMatchDetail(51): 'RECOVERY' と 'MD+1' 行・pitch(data-pitch) が出る (13) mypage: D.ann に {kind:'md-remind',targetPid:1,refEvId:900,refDate} → md 有なら『入力済み』、md を消すと『入力する →』と showMatchForm( が出る。末尾 print('ALL MATCHDAY-RECOVERY TESTS PASSED')。
- 【新規】dev/test_matchday_recovery_staff.js（『// 実行: jsc dev/prelude.js /tmp/staff.js …』・setKey で D.p 3名・cal 試合 daysAgo(2)・ev.squad=[{pid:1,num:1},{pid:2,num:16},{pid:3,num:9}]・md v2 は pid1 のみ・pid2 は f のみ）: (1) getLatestCond(1) が _fromMd（今日の f が無い場合）／同日 f があれば f 側 (2) reqQueue.red: 試合当日の md rpe9 はレッドフラグに載らない、md sleepH 4.5 は載る、f.sleep=0 は載らない（>0 ガード） (3) reqQueue.late / dashboard: md のみ提出の選手が『未提出』に出ない・提出率の分子に入る（data-cu の値で検証） (4) V.dash: 注意層に『試合後リカバリー対象』と 'MD+2'、HIA タグが最上位（pri ソート）、canPractice '参加できない' で『来週参加できない』、MD+1 f(soreness4) で『回復未了』、D.cal=[] なら出ない＝warnCount 不変 (5) V.fatigue: チーム表に MATCH flag、個人一覧の仮想行の修正ボタンが showEditMatchStaff を指す (6) goPlayerDetail(1,3): dt3 に MATCH flag、ヒーロー本日コンディションが ✓ (7) exportCSV('fatigue'): Blob 生成をスタブし '試合' 行と '練習+試合' が含まれ、既存6列の位置が不変 (8) goMatchDateDetail(date): 'RECOVERY' パネル・『まだ戻っていない選手』に pid2、『回復チェック未入力』に pid3、mdRemindBtnsHtml の2ボタン (9) mdMissingFor: role none 除外・md 提出者除外 (10) mdRemindText: 日付/相手/名前/『残り n名』を含む (11) sendMdReminders: svSafeUpdate を実 prelude で通し drainMicrotasks 後に __store.ann に kind:'md-remind'&&refEvId===900 が未提出者数だけ追加、二度目は追加0で toast『全員に送信済み』、undoMdReminders(ids) で消える (12) copyText: navigator.clipboard スタブで toast が出る／無しで execCommand フォールバック。末尾 'ALL … PASSED'。
- 【新規】dev/test_matchday_recovery_coach.js（『// 実行: jsc dev/prelude.js /tmp/coach.js …』）: (1) condDaily(14): 試合日の行に match:true、md のみの日の rpe/sleep/n が入る、同日 f+md は f 優先で n=1 (2) charts.cond: renderConditionView 後に __timeouts を実行し charts.cond.config の pointStyle 配列に 'rectRot' が含まれる、new Chart 数は1 (3) condAlerts: MD+1 f(soreness4) の選手に flag '試合後回復未了'、avgRpe>=8 なら '疲労蓄積' が勝つ (4) insCondition: 『の試合（MD+』ルールが出て提出 n/N と回復未了 m が正しい、高RPE連続に試合 RPE が数えられない (5) countCondOn/avgSleepCalc/weeklyDeltaData.sub が md を含む (6) renderPlayerReport: '試合負荷(7日)' ミニ統計、D.md=[] なら出ない。
- 【既存・維持確認】dev/test_dash.js 62-100（コンディション項目ラベルに『コンディション入力』を含む・urgent は試合日チェックのみ）／dev/test_home_p8b.js 30-38（playerホームに未入力一覧を出さない＝P2 は home に一覧を足さない）・67-77（condStreak）／dev/test_cond.js（T.condition フォーム id cf-* 不変）／dev/test_mydata.js 161・175（md-cond-chart/charts.md_cond）／dev/test_p7a.js（effDur/sLoad 無改修）／dev/test_dash_staff.js（注意層の件数・提出率50%）／dev/test_staff_ia_p8d.js 19-57（reqQueue red 2件・late 1件・バッジ）／dev/test_p8e_coach.js（weeklyDeltaData）／dev/test_mstat.js 113（ms 索引に kind 無し＝P2 は ms/gs に触れない）／dev/test_fieldmap_coach.js・test_absence_coach.js（無影響）。全て D.md=[] または D.cal=[] 前提のため結果不変を確認する。
- 【手順】python3 dev/run_tests.py test_matchday → 緑後に python3 dev/run_tests.py（全量）→ python3 dev/sync_check.py → python3 dev/sync_check.py --residue（残渣0）。

## syncManifest
- identical 追加: MD_RECOV_TH {files:[player,staff,coach], kind:'var'}
- identical 追加: mdAsCond / condWithMd / hasCondOn / countCondOn / matchDayOffset / matchDayTag / recoveryFlags / recoveryOf / recoveryLabel {files:[player,staff,coach], kind:'function'}
- identical 追加: condLoad {files:[player,staff], kind:'function'}（coach は sLoad を持たないため対象外）
- staff 専用（登録しない）: getLatestCond / mdMissingFor / mdRemindText / copyText / mdRemindBtnsHtml / copyMdRemind / sendMdReminders / undoMdReminders
- variant 変更なし・chart_counts 変更なし（player:14 / staff:12 / coach:4 を維持＝new Chart を増やさない）
- 前提: P1a で matchEvents / matchEventByDate / squadOf / squadRole / mdOf / mdRoleLabel / mdLoad / mdInjuryLive が identical 登録済み（coach を含む3ファイル以上）。未登録なら P2 着手前に P1a 側で揃える

## openIssues
- P1a 基盤の関数名・引数（matchEvents() が date 昇順を返すこと／mdOf(pid,ev) が ev.id→ev.date の順でフォールバックすること／showMatchForm(dateArg) の引数が日付であること）に依存。P1 実装で名前や引数（例: evId 渡し）が変わった場合、step2 の mdAsCond/matchDayOffset/recoveryOf と step11 の onclick を追従させる。
- MD_RECOV_TH の既定値（筋肉痛>=3/5・睡眠<6h・練習RPE>=8・高負荷試合>=560AU=70分×RPE8）は Claude 推奨値。凛人監修で変える場合は3ファイルの定数のみ（sync_check --update 不要＝identical のまま3箇所同時変更）。
- 試合当日の md RPE をレッドフラグ（reqQueue.red / dash 疲労度アラート）から除外する解釈（試合の高RPEは負荷であり疲労警報ではない）。睡眠は md でも警報対象。代わりに試合の追跡は『試合後リカバリー対象』カード（step14）が担う。
- step13 で睡眠レッドフラグに >0 ガードを追加すると、f.sleep=0（未入力・staff 代理入力の空欄）の『睡眠 0h』誤警報が消える＝既存挙動の改善だが挙動変更として周知。
- 同日に f が複数ある選手は inputAt 最新の1件にのみ _md を付与（負荷の二重計上防止）。同日に md が複数（P1 の重複ガード前の旧データ）ある場合は最初の1件のみ採用。
- 週内2試合（例: 土・火）のとき MD+n は直近試合基準。ホームの週間スケジュール MD-x チップ（player 2173-2186）は未来方向のまま無改修＝同一日に MD+1 と MD-2 が併存しうる（表示は別カード）。
- T.condition は試合当日も通常フォームを残す（メンバー外・自主練用）。D5『試合日は f を書かない』は案内文で担保しハードブロックしない。試合出場者が誤って f を書いた場合は同日 f+md の合算ルールで負荷は加算・ウェルネスは f 優先になる。
- exportCSV('fatigue') の末尾に『種別』列を追加（既存6列の位置は不変）。CSV を外部で加工しているなら周知が必要。
- Chart.js 4.4.1 の indexable pointStyle/pointRadius 配列は jsc モックでは検証できない（config の配列存在のみテスト）。実機で ◆ マーカーの見た目を確認。
- coach の考察『試合後の回復』は matchDayOffset(今日) が有効な MD+1〜+3 のみ表示（試合が無い週は出ない）。個人レポートの試合履歴（出場数・合計分・試合ごとの RPE/perf）と coach 試合レポートは P5、trainer への md/cal 購読追加と要ケア一覧も P5＝P2 では trainer/index.html を触らない。
- 催促お知らせの重複判定は kind+refEvId+targetPid（再送は不可）。再催促が必要になった場合は『再送』ボタン（refEvId に送信回数を持たせる）を P2 以降で検討。LINE テキストは手動貼り付け前提（LINE API 連携はしない）。
- recoveryOf は選手×3日ごとに condWithMd(pid,ds,ds) を呼ぶ（D.f 走査）。50名×3 程度なら問題ないが、staff 試合レポートで全員分を描く際に体感遅延があれば condWithMd(pid,MD+1,MD+3) を1回にまとめる最適化を行う（結果は同じ）。

## estimate
3〜4 作業セッション（player 1.5 / staff 1.5 / coach 0.5 / テスト・sync 0.5）。追加行数の目安: player +230、staff +280、coach +120、dev テスト3本 +350、sync_manifest +11 エントリ。P1 マージ後に着手し、step1-2（共通ヘルパー＋manifest）→ player（3-11）→ staff（12-20）→ coach（21-26）→ dev（27）の順で「1機能ずつ構文チェック→模擬実行」。各サイト完了ごとに python3 dev/run_tests.py と sync_check.py を回す。9/5 分の遡り入力（P1 の代理入力）が済んでいれば、staff ダッシュボードの『試合後リカバリー対象』は今日(MD+2)から実データで動作確認できる。