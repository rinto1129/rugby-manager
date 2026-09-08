# P1a スタッフ: 試合イベント拡張＋メンバー表＋共通ヘルパー基盤
## goal
(1) cal の試合イベントに opp/ko/venue と squad[{pid,num}]/squadAt を「追加フィールド」で持たせ、staff のイベント追加/修正フォーム（type==='match' 時のみ表示）と TimeTree 取込で書けるようにする。(2) goSelectMatchMembers〜saveMatchSel（staff 8905-8945）を「メンバー表登録」（選手選択＋背番号1〜23割当・POS_NUM 初期提案・重複警告・1-15=スタート/16-23=リザーブ自動判定・svSafeUpdate('cal') で該当イベントを idEq upsert）に置換し、matchsel には一切書かない。(3) 以降の全フェーズ（P1b player 新フォーム/催促、P2 回復、P3 GPS/ms、P4 出場記録、P5 coach/trainer）が依存する共通ヘルパー群を 4 ファイルへ配置し identical 登録する。(4) 旧 matchsel 参照 3 箇所（player 1694 / staff 1817,2114）をヘルパー経由に置換し、旧 md（role 文字列・fatiguePre/Post 1-6・sleepTime/wakeTime・evId 無し）を壊さない読み側フォールバックを固める。
## dataModel
【cal 試合イベント（type:'match'）追加フィールド・全て任意＝既存イベントは無いまま動く】
- opp: string（対戦相手。空文字可。表示は matchEvLabel(ev)= ev.opp ? 'vs '+opp : ev.title||'試合'）
- ko: string 'HH:MM'（input type=time の値そのまま。空文字可）
- venue: string（会場。空文字可）
- squad: [{pid:number, num:number(1..23)}]（num 昇順で保存。無い/空=メンバー表未登録＝催促対象なし）
- squadAt: ISO 文字列（メンバー表の最終保存時刻）
- 既存の id(数値 Date.now)/date/type/title/detail/editedAt はそのまま。doEditCalEvent は in-place 更新（latest[idx].x=…）なので squad は自動的に保全される。
【md（このフェーズでは書かない。ヘルパーの読み側契約として v2 を確定）】
- 旧: {id,pid,date,inputAt,role:'スタート'|'リザーブ'|'出場なし（…）',fatiguePre/fatiguePost(1-6),sleepTime,wakeTime,breakfast,breakfastDetail,injured,cramp,inj*,crampFreq,editedAt}（evId 無し）
- v2（P1b で player/staff が書く）: {…, v:2, evId, role:'start'|'reserve'|'none', num, minutes, rpe, sleepH, preFatigue/postFatigue/soreness(1-5), sorenessParts[], perf, injId, hiaImpact, hiaSymptoms[], hiaInjId, cramp, crampWhen, crampParts[], crampFreq, note, proxy, recordedBy}
- 読み側規則: evId があれば idEq(evId,ev.id)、無ければ date 一致で試合に紐づける（mdOf）。role は mdRoleLabel で日本語化（旧文字列はそのまま返す）。負荷は mdLoad=rpe×minutes（旧=0）。疲労は mdFatigueStr（v2=/5・旧=/6・値<1 は「未入力」）。睡眠は mdSleepStr（sleepH → 'x.xh'、旧 sleepTime/wakeTime → 'HH:MM → HH:MM（x.xh）'）。
【SK/D】player 408/952・staff 567/1199・coach 216-217 から matchsel を削除（購読停止＝「読まない」を機械的に保証。Firestore の doc 自体は残置）。trainer は元々無し。
【新規定数（staff のみ・identical 登録しない）】SQUAD_RES_NUM={HO:[16],PR:[17,18],LO:[19],FL:[20],'No.8':[20],SH:[21],SO:[22],CTB:[22,23],WTB:[23],FB:[23]}（リザーブ番号の初期提案）。POS_NUM は staff に無い（identical は player/trainer/coach のみ）ので staff:572 `var POS` 直後に同一定義をコピーし identical の files に staff を追加。
【共通ヘルパー（正確な仕様。全て top-level function 宣言・(D.md||[]) 等で未購読キーに耐性）】
■グループA（cal/squad・player/staff/trainer/coach 4 ファイル identical）
- matchEvents() → (D.cal||[]) の type==='match' かつ date が文字列のものを date 昇順（同日は String(id) 昇順）で返す配列。
- matchEventByDate(date) → その日付の試合イベント（同日複数なら最初の 1 件）|| null。
- squadOf(ev) → ev.squad が配列なら pid!=null の要素配列、それ以外は []。
- squadRole(ev,pid) → squadOf(ev) に idEq(pid) の要素が無ければ null。num を parseInt し 1..15→'start'、16..23→'reserve'、それ以外（NaN/24+）→'reserve'。
- matchEvLabel(ev) → ev.opp ? 'vs '+ev.opp : (ev.title||'試合')。escapeHtml は呼び出し側の責務。
■グループB（md・player/staff/coach identical。trainer は P5 で md 購読と同時に追加）
- mdOf(pid,ev) → (D.md||[]) から idEq(m.pid,pid) かつ (m.evId!=null ? idEq(m.evId,ev.id) : m.date===ev.date) を抽出し、inputAt 降順の先頭 || null。ev が null なら null。
- mdRoleLabel(m) → m.role が 'start'→'スタート' / 'reserve'→'リザーブ' / 'none'→'出場なし' / それ以外は m.role||''（旧日本語文字列をそのまま）。roleBadgeHtml(mdRoleLabel(m)) で既存バッジに乗る（ROLE_EN は日本語キー）。
- mdLoad(m) → (+m.rpe||0)*(+m.minutes||0)（旧 md は 0）。
- matchLoadByDate(pid,date) → その pid・date の md 全件の mdLoad 合計（同日 2 試合は加算。f への「追加読み」はこれを呼ぶ＝P2/P4）。
- mdSleepStr(m) → m.sleepH!=null&&!=='' なら (+sleepH)+'h'。無ければ sleepTime/wakeTime から ((wake-sleep+1440)%1440)/60 を小数1桁で 'HH:MM → HH:MM（7.5h）'。どちらも無ければ '-'。
- mdFatigueStr(m) → v2 判定 = m.v===2 || preFatigue!=null || postFatigue!=null。v2 は preFatigue/postFatigue と分母 5、旧は fatiguePre/fatiguePost と分母 6。各値は +x>=1 なら 'x/分母'、それ以外 '未入力'。戻り '前a → 後b'。
- mdInjuryLive(m) → 生きている怪我レコード(i) || null。injId/hiaInjId があればその id に idEq 一致し approved!==false の i。無く m.injured の旧データは idEq(pid)&&date===m.date&&source==='match'&&approved!==false の i。集計・バッジ・CSV の「怪我あり」はこれの truthy を使う（md.injured 直読みを段階的に置換。P1b/P5 で消費）。
- pendingMatchChecks(pid,todayS,N) → todayS 既定 todayStr()、N 既定 3。matchEvents() のうち from=todayS-N日 <= ev.date <= todayS、squadRole(ev,pid)!=null、!mdOf(pid,ev) のものを日付昇順（古い順）で [{ev,date,daysAgo}] として返す。メンバー表未登録の試合・メンバー外の選手（D9 role:'none' 任意提出）は対象外。
## steps

### 1. [staff] POS_NUM を staff に追加（背番号初期提案の前提）
WHERE: staff/index.html:572 `var POS=[…]` の直後に挿入
CHANGE: player:416 と完全同一の `var POS_NUM={PR:'1·3',HO:'2',LO:'4·5',FL:'6·7','No.8':'8',SH:'9',SO:'10',CTB:'12·13',WTB:'11·14',FB:'15'};` をコピー。合わせて staff 専用定数 `var SQUAD_RES_NUM={HO:[16],PR:[17,18],LO:[19],FL:[20],'No.8':[20],SH:[21],SO:[22],CTB:[22,23],WTB:[23],FB:[23]};` を直下に置く（identical 登録しない）。
REUSE: player/index.html:416 POS_NUM（バイト一致でコピー）
RISK: sync_check の kind:'var' は `^\s*var POS_NUM\s*=` で抽出＝行頭に置く。staff に POS_NUM の既存参照は 0 件（grep 済）なので衝突なし。

### 2. [staff] 共通ヘルパー群（グループA+B）を staff に配置
WHERE: staff/index.html:777 `function sLoad(f){…}` の直後（778）に「// ===== 試合基盤ヘルパー（P1a・identical） =====」ブロックとして挿入
CHANGE: dataModel 記載の 13 関数（matchEvents/matchEventByDate/squadOf/squadRole/matchEvLabel/mdOf/mdRoleLabel/mdLoad/matchLoadByDate/mdSleepStr/mdFatigueStr/mdInjuryLive/pendingMatchChecks）を top-level `function` 宣言で書く。行末コメントは付けない（sync_check の正規化は「//のみの行」しか除去しないため、行末コメントの差で identical が割れる）。依存は idEq(1621)/toDateStr(1638)/todayStr(1637) のみ。
REUSE: idEq staff:1621 / toDateStr 1638 / todayStr 1637
RISK: D.md/D.cal は staff で購読済み。`(D.md||[])` ガードは trainer/coach コピー時の安全のため必ず入れる。

### 3. [staff] calEventFormHTML: type==='match' 時のみ表示する対戦相手/KO/会場ブロック
WHERE: staff/index.html:8668-8673 calEventFormHTML(defaultDate)
CHANGE: 種別 select(#cef-type) に `onchange="calTypeChanged(this.value)"` を付け、タイトル入力の placeholder を『例: vs ○○大学（空なら対戦相手から自動）』に。詳細行の直後に `<div id="cef-match" class="grid g2" style="gap:10px;margin-bottom:10px">` を追加: `#cef-opp`(input, label『対戦相手』, placeholder『例: 福岡工業大学』, grid-column:1/-1) / `#cef-ko`(input type=time, label『キックオフ』) / `#cef-venue`(input, label『会場』, placeholder『例: 福大グラウンド / ○○競技場』)。初期表示は select の既定値が match なので display は block（新規関数 `function calTypeChanged(t){var e=document.getElementById('cef-match');if(e)e.style.display=(t==='match')?'grid':'none';}` を calEventFormHTML の直後に定義）。読み取り用に `function calMatchFieldsRead(){return{opp:((document.getElementById('cef-opp')||{}).value||'').trim(),ko:((document.getElementById('cef-ko')||{}).value||'').trim(),venue:((document.getElementById('cef-venue')||{}).value||'').trim()};}` も追加。
REUSE: 既存の .grid.g2/.fl/.ipt マークアップ（8669-8672）
RISK: 生 hex 禁止＝色指定は書かない。calEventFormHTML は goAddCalEvent(8674)/showEditCalEvent(8692)/calDayClick(8665) の 3 箇所から使われるので id は重複させない（1 画面 1 フォームのみ＝現状維持）。

### 4. [staff] doAddCalEvent / doAddCalEventForDate: 試合フィールドを追加保存＋タイトル自動補完
WHERE: staff/index.html:8681-8690 doAddCalEvent、8763-8770 doAddCalEventForDate
CHANGE: 両関数で rec 組立を共通化: `var mf=(evtType==='match')?calMatchFieldsRead():null; if(!title&&mf&&mf.opp)title='vs '+mf.opp;` を必須チェック（8684/8765 の `if(!date||!title)`）の前に移動して評価。rec は `{id:Date.now(),date,type:evtType,title,detail}` に、match のとき `rec.opp=mf.opp;rec.ko=mf.ko;rec.venue=mf.venue;` を追加（空文字も保存＝表示側は falsy 判定）。squad は付けない（メンバー表画面でのみ書く）。保存は既存どおり svSafe('cal',rec)。alert 文言は『日付とタイトル（または対戦相手）を入力してください』。
REUSE: svSafe staff:1263 / autoCreateMSessFromCal 8725（そのまま）
RISK: title 自動補完で TimeTree 取込の重複判定（date+title 一致）と整合させるため、補完形式は取込と同じ『vs 相手』にする。

### 5. [staff] showEditCalEvent / doEditCalEvent: 試合フィールドの読み書き（squad は in-place で保全）
WHERE: staff/index.html:8692-8704 showEditCalEvent、8705-8723 doEditCalEvent
CHANGE: showEditCalEvent の後埋めコールバック（8698-8702）に `e=document.getElementById('cef-opp');if(e)e.value=r.opp||''; e=…('cef-ko');if(e)e.value=r.ko||((r.detail||'').match(/(\d{1,2}):(\d{2})/)?RegExp.$1.padStart(2,'0')+':'+RegExp.$2:''); e=…('cef-venue');if(e)e.value=r.venue||''; calTypeChanged(r.type||'other');` を追加（detail 由来の KO は画面上の候補に過ぎず、保存ボタンを押した時だけ ko に確定＝二次記録の自動生成なし）。squad があれば form-title 下に『メンバー表 n名登録済み（squadAt）』の情報行と『メンバー表を開く』ボタン（goSquadEditor(evid)）。doEditCalEvent の updateFn に `if(evtType==='match'){var mf=calMatchFieldsRead();latest[idx].opp=mf.opp;latest[idx].ko=mf.ko;latest[idx].venue=mf.venue;}` を追加（title 空補完も doAddCalEvent と同じ）。latest[idx] を in-place 更新しているので squad/squadAt は触らずに保全される。
REUSE: svSafeUpdate 1276 / guardSubmit 1244 / releaseSubmit 1255 / idEq
RISK: doEditCalEvent は DOM を updateFn 内で読む（既存もそう）。トランザクション再試行で値が変わらないので問題なし。

### 6. [staff] メンバー表エディタ goSquadEditor（goSelectMatchMembers/toggleMatchSel/matchSelAll/saveMatchSel の置換）
WHERE: staff/index.html:8905-8945（`// === MATCH MEMBER SELECTION ===` 〜 saveMatchSel）を丸ごと差し替え
CHANGE: 状態 `var _squadTemp={};`（pid→num。キーの有無＝選出、値は number|''）。`function goSquadEditor(evid){var ev=D.cal.find(function(x){return idEq(x.id,evid);});if(!ev)return;_squadTemp={};squadOf(ev).forEach(function(s){_squadTemp[s.pid]=parseInt(s.num)||'';});` 見出し: ic('i-ball')+fmt(ev.date)+' '+escapeHtml(matchEvLabel(ev))+(ev.ko?' KO '+escapeHtml(ev.ko):'')+(ev.venue?' @'+escapeHtml(ev.venue):'')。説明文『出場メンバーを選び背番号を割り当ててください（1〜15＝スタート／16〜23＝リザーブ）。選手を選ぶとポジションの代表番号を自動提案します』。操作行: `自動採番`(squadAutoNum)・`全解除`(squadClearAll)・検索 input(#sq-q, oninput=squadFilter＝行の data-search 部分一致で display 切替)。集計行 `#sq-sum`。選手一覧は D.p を POS.indexOf(position) 昇順→year 降順→name 順で並べ、各行 `<div class="cb-row" id="sq-row-PID" data-search="名前 pos" onclick="squadToggle(PID)">`: cb-box(#sq-cb-PID, on 時 ic('i-check',14)) + avH(p,28) + 名前 + `pos/year年` + 背番号入力 `<input type="number" class="ipt" id="sq-num-PID" min="1" max="23" style="width:64px;text-align:center" onclick="event.stopPropagation()" oninput="squadSetNum(PID,this.value)">`（未選出時 display:none）+ ロールバッジ `<span class="bd bd-p" id="sq-role-PID">`（スタート/リザーブ、未選出時空）。最大高 500px スクロール。下部: キャンセル(popView) / 保存(`saveSquad('EVID',this)`)。pushView('メンバー表（'+fmt(ev.date)+'）',h)。
`squadProposeNum(p)`: used={} を _squadTemp から作り、候補=(POS_NUM[p.position]||'').split('·').map(Number).filter(Boolean) → SQUAD_RES_NUM[p.position]||[] → 16..23 → 1..23 の順で未使用の最初を返す（無ければ ''）。
`squadToggle(pid)`: 選出中なら delete _squadTemp[pid]、未選出なら _squadTemp[pid]=squadProposeNum(p)。DOM は cb-box .on/チェック、row の style.background='var(--blue-bg)' or ''、num input の表示/値、role バッジを更新し squadSummary()。
`squadSetNum(pid,v)`: n=parseInt(v); _squadTemp[pid]=(n>=1&&n<=23)?n:''; role バッジ更新（n<=15 スタート／16-23 リザーブ／それ以外は bd-r『範囲外』）; squadSummary()。
`squadAutoNum()`: 選出中で num が '' の選手に squadProposeNum を順に付与（POS 順）。`squadClearAll()`: _squadTemp={} で全行リセット。
`squadSummary()`: 選出 pid の num を集計し `#sq-sum` に『スタート a/15 ・ リザーブ b/8 ・ 合計 n名』、重複番号があれば `<span class="bd bd-r">#7 重複</span>` を番号ごとに、未設定があれば `<span class="bd bd-a">番号未設定 k名</span>` を並べる（生 hex 禁止・.bd のみ）。
`saveSquad(evid,btnEl)`: 検証は guardSubmit の前に置く: 未設定/範囲外の選手名を列挙して alert('背番号が未設定または範囲外（1〜23）です: …')、重複は alert('背番号が重複しています: #7, #12')。OK なら guardSubmit(btnEl,'保存中…')→ entries=Object.keys(_squadTemp).map(k→{pid:idEq 復元のため D.p.find(idEq(x.id,k)).id, num}).sort(num 昇順) → `svSafeUpdate('cal',function(latest){var idx=latest.findIndex(function(x){return idEq(x.id,evid);});if(idx<0){notFound=true;return latest;}latest[idx].squad=entries;latest[idx].squadAt=new Date().toISOString();return latest;},function(){if(notFound){releaseSubmit(btnEl);alert('試合イベントが見つかりませんでした');return;}popView();toast('メンバー表を保存しました（'+entries.length+'名）');},function(){releaseSubmit(btnEl);alert('保存できませんでした。もう一度お試しください');})`。matchsel には一切書かない。
REUSE: cb-row/cb-box CSS staff:159-160 / avH 1604 / POS 572 / POS_NUM(手順1) / pushView 1764 / guardSubmit/releaseSubmit 1244/1255 / svSafeUpdate 1276 / toast 447 / ic('i-check')
RISK: onclick に pid を数値リテラル埋め込み（既存 8917 と同型）。行 id は 'sq-'+p.id で衝突なし。alert は検証失敗系なので規約違反ではない（confirm/prompt 不使用）。旧 matchsel の数値配列は読まない（D2）＝9/5 分は手順 6 の画面で遡って登録する。

### 7. [staff] カレンダー導線の差し替え（月イベント一覧＋日付詳細）
WHERE: staff/index.html:2554-2556（V.calendar イベント一覧行）、8659-8661（calDayClick のイベント行）
CHANGE: 2556: `'<button class="btn btn-sm" … onclick="goSelectMatchMembers(…)">出場選手設定</button>'` → `'<button class="btn btn-sm" style="flex-shrink:0" onclick="goSquadEditor(\''+e.id+'\')">'+ic('i-users',12)+' メンバー表'+(squadOf(e).length?' '+squadOf(e).length:'')+'</button>'`。2554 の detail 行の前に match かつ (opp||ko||venue) があれば `'<div style="font-size:11px;color:var(--text-secondary)">'+escapeHtml(matchEvLabel(e))+(e.ko?' ・KO '+escapeHtml(e.ko):'')+(e.venue?' ・'+escapeHtml(e.venue):'')+'</div>'` を追加。8660: 『出場選手』ボタンを同じ『メンバー表 n』に置換（onclick goSquadEditor）。8661 の detail 表示の後に同じ opp/ko/venue 行。
REUSE: squadOf/matchEvLabel（手順2）/ ic('i-users')（staff に定義済み）
RISK: 2537（月セル）の match 色 --purple と 2547 の --maroon-vivid 不一致は C5 の範囲＝このフェーズでは触らない。

### 8. [staff] V.matchview: 行ソースを『cal 試合イベント ∪ md 日付』にしメンバー表導線を追加
WHERE: staff/index.html:2396-2414 matchview（dates 生成 2399-2401 と mdH 2402-2414）
CHANGE: `var evByDate={};matchEvents().forEach(function(e){if(!evByDate[e.date])evByDate[e.date]=e;});var dates=Object.keys(Object.assign({},dateMap,evByDate)).sort(desc)`。各行: ev=evByDate[date]; recs=dateMap[date]||[]; N=ev?squadOf(ev).length:0。見出しは fmt(date)+(ev?' <span style="font-weight:600">'+escapeHtml(matchEvLabel(ev))+'</span>':'')、副題『提出: recs.length'+(N?'/'+N:'')+'名'+(ev&&!N?' ・メンバー表未登録':'')。ev があれば右側に `<button class="btn btn-sm" onclick="event.stopPropagation();goSquadEditor('ID')">メンバー表</button>`。date>todayS の行は `<span class="flag" style="background:var(--maroon-vivid);color:var(--white)">NEXT</span>` を付け、カードの onclick は goMatchDateDetail のまま（提出 0 でも開ける＝P1b で未提出者チップを足す前提）。怪我/足攣りバッジは当面 m.injured/m.cramp のまま（mdInjuryLive への統一は P1b でフォーム側と同時）。
REUSE: matchEvents/squadOf/matchEvLabel / .flag CSS staff:178 / 既存カード構造 2406-2413
RISK: D.md の date が cal に無い過去日（旧データ）は従来通り md 行として残る。同日 2 試合は最初の 1 件のみボタン化（openIssues）。

### 9. [staff] ダッシュボード: 死コード削除＋未入力ブロックを pendingMatchChecks に置換（旧 matchsel 参照 1817/2114 の撤去）
WHERE: staff/index.html:1815-1819（削除）、2109-2119（置換）
CHANGE: 1815-1819（コメント行〜matchNotDone）を丸ごと削除（描画参照 0 件・非試合日誤判定の温床）。2109-2119 を次に置換: `var mdPend={};D.p.forEach(function(p){pendingMatchChecks(p.id,todayS,3).forEach(function(x){var k=String(x.ev.id);if(!mdPend[k])mdPend[k]={ev:x.ev,daysAgo:x.daysAgo,players:[]};mdPend[k].players.push(p);});});Object.keys(mdPend).sort(function(a,b){return mdPend[b].ev.date.localeCompare(mdPend[a].ev.date);}).forEach(function(k){var g=mdPend[k],N=squadOf(g.ev).length,done=N-g.players.length;$m().innerHTML+='<div style="margin-top:1rem"><div style="display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;margin-bottom:.5rem">'+ic('i-ball',15,'var(--maroon)')+'試合日チェック未入力 <span style="font-size:12px;color:var(--text-secondary)">'+fmt(g.ev.date)+' '+escapeHtml(matchEvLabel(g.ev))+' / 残り'+g.players.length+'名（提出 '+done+'/'+N+'）'+(g.daysAgo>=2?' <span class="bd bd-r">'+g.daysAgo+'日経過</span>':'')+'</span></div>'+g.players.map(function(p){return'<div class="alert-card alert-down" style="cursor:pointer" onclick="goPlayerDetail('+p.id+')">'+escapeHtml(p.name)+'</div>';}).join('')+'</div>';});` 比較は全て idEq（ヘルパー内）。P1b はこのブロックに『代理入力』『未提出者にお知らせ』ボタンを足す。
REUSE: todayS（V.dash 1778 で定義済み）/ goPlayerDetail 4578 / alert-card.alert-down CSS 147 / ic('i-ball')
RISK: 試合日当日は daysAgo=0 で全員未入力として出る（D4『試合当日から催促』の仕様通り）。メンバー表未登録の試合は 0 件＝出ない（登録を促す文言は V.matchview 側『メンバー表未登録』で担う）。

### 10. [staff] 選手削除カスケードに cal.squad からの除去を追加
WHERE: staff/index.html:5052-5067 doDelPlayer の Promise 連鎖（5067 の 'a' の後）
CHANGE: `.then(function(){return svSafeUpdate('cal',function(latest){(latest||[]).forEach(function(e){if(Array.isArray(e.squad))e.squad=e.squad.filter(function(s){return!idEq(s.pid,pid);});});return latest||[];});})` を追加。matchsel は書かない（残置・読まない）。confirm() は既存のまま（B群純掃除の範囲外）。
REUSE: svSafeUpdate の Promise 返却（1276）／既存 'a' の absentees フィルタ 5067 と同型
RISK: 低。cal 全件を 1 トランザクションで書く既存パターン（doCalImport 8887）と同じ。

### 11. [staff] TimeTree 一括インポート: match 行の時間を ko に格納
WHERE: staff/index.html:8892 doCalImport の latest.push({…})
CHANGE: `var rec={id:…,date:r.date,type:r.type,title:r.title,detail:r.time||''};if(r.type==='match'){var km=(r.time||'').match(/^(\d{1,2}):(\d{2})$/);if(km)rec.ko=km[1].padStart(2,'0')+':'+km[2];}latest.push(rec);`。opp/venue は自動生成しない（title を正典として matchEvLabel が title フォールバック）。detectCalType(8803-8805) の vs 判定はそのまま。プレビュー表（8862-8872）の変更は不要。
REUSE: _normCalDate 8795 / CAL_IMP_TYPES 8794 / 既存 dup 判定 8890
RISK: 8805 の `t`/`title` 変数混在は既存挙動（'ｖｓ'/'対' は元の title で判定）＝触らない。

### 12. [staff] help 文言の実導線化＋SK/D から matchsel 削除
WHERE: staff/index.html:2366（help）、567（SK）、1199（D）
CHANGE: 2366: 『<b>出場メンバー登録：</b>「カレンダー」→ 試合イベントの「メンバー表」（試合日レポートの行からも開ける）<br>』に変更し、『<b>対戦相手・KO・会場：</b>「カレンダー」→ 試合イベントの修正で入力<br>』を 1 行追加。567 の `matchsel:'rm_matchsel',` と 1199 の `matchsel:[],` を削除（startListeners 1568 は Object.keys(SK) を回すので購読が止まる）。
REUSE: —
RISK: D.matchsel 参照は手順 6/9 で全て消えていることを `grep -n matchsel staff/index.html` で確認（ヒット 0 が完了条件）。テストが D.matchsel=[] を代入しても無害。

### 13. [player] 共通ヘルパー群を player に配置＋SK/D から matchsel 削除
WHERE: player/index.html:578 `function sLoad` 直後（579）にヘルパーブロック／408 SK・952 D から matchsel を削除
CHANGE: staff（手順2）と正規化後バイト一致でグループA+B の 13 関数をコピー。依存 idEq 1094 / toDateStr 1089 / todayStr 1088 は定義済み。
REUSE: 手順2 のブロックをそのままコピー
RISK: sync_check identical で md5 一致必須＝コピー後に `python3 dev/sync_check.py` を必ず回す。

### 14. [player] todayTodoHtml の試合 todo を pendingMatchChecks に置換（旧 matchsel 参照 1694 の撤去）
WHERE: player/index.html:1690-1695（yesterday〜showMatchDayAlert）と 1699（todoItems.push）
CHANGE: 1690-1695 を削除し、1699 を `pendingMatchChecks(myPid,todayStr(),3).forEach(function(x){var lb=x.daysAgo===0?'今日の試合日チェック':x.daysAgo===1?'昨日の試合日チェック':fmt(x.date)+'の試合日チェック';todoItems.push({key:'match'+x.ev.id,done:false,label:lb,icon:'match',onclick:"go('match')",urgent:x.daysAgo>=1});});` に置換。onclick は当面 go('match')（P1b で showMatchForm(date,evId) に変更し、D5 の『試合日は cond todo を試合日チェックに置換』も P1b で同時に行う）。
REUSE: pendingMatchChecks/fmt / 既存 todoItems 契約（key/done/label/icon/onclick/urgent）
RISK: dev/test_dash.js 74-88 は matchsel フィクスチャ依存＝手順 20 でフィクスチャを squad に変更（ラベル『昨日の試合日チェック』と urgent 1 件の期待は維持）。test_home_p8b 31-38（一覧を出さない）は影響なし。

### 15. [trainer] グループA ヘルパー（cal/squad）を trainer に配置
WHERE: trainer/index.html:906 `function idEq` 直後（907）
CHANGE: matchEvents/matchEventByDate/squadOf/squadRole/matchEvLabel の 5 関数をコピー（trainer は cal 購読済み・md 未購読）。グループB は P5（md 購読追加）で同時にコピーし manifest の files に trainer を足す。
REUSE: trainer idEq 906 / POS_NUM 222（未使用だが将来の背番号表示用）
RISK: D.md を参照するグループB を trainer に入れない限り未定義参照は起きない。

### 16. [coach] グループA+B ヘルパーを coach に配置＋SK/D から matchsel 削除
WHERE: coach/index.html:314 `function escapeHtml` 直後（315）／216 D・217 SK から matchsel 削除
CHANGE: 13 関数をコピー（coach は md/cal 購読済み。toDateStr 312/todayStr 313/idEq 311 あり）。P5 の試合レポート・個人レポート試合履歴はこれを消費する。
REUSE: coach idEq/toDateStr/todayStr 311-313
RISK: coach は _allKeys=Object.keys(SK)（222）で購読するので SK から外せば購読も止まる。

### 17. [dev] sync_manifest.json 更新＋sync_check 緑化
WHERE: dev/sync_manifest.json identical セクション（POS_NUM エントリ＋新規 13 エントリ）
CHANGE: POS_NUM の files を ['player','staff','trainer','coach'] に。新規: matchEvents/matchEventByDate/squadOf/squadRole/matchEvLabel = files ['player','staff','trainer','coach'] kind 'function'；mdOf/mdRoleLabel/mdLoad/matchLoadByDate/mdSleepStr/mdFatigueStr/mdInjuryLive/pendingMatchChecks = files ['player','staff','coach'] kind 'function'。chart_counts は不変（new Chart を増やさない）。`python3 dev/sync_check.py` と `--residue` が両方 exit 0 になるまで揃える。
REUSE: dev/sync_check.py の extract_block（`^\s*function NAME\s*\(`）
RISK: 関数内の行末コメント差・空行差は正規化で吸収されない（行末空白と //のみ行だけ）。

### 18. [dev] 新規テスト test_matchday_helpers.js（player/staff/coach）
WHERE: dev/test_matchday_helpers.js（先頭に『// 実行: jsc dev/prelude.js /tmp/player.js dev/test_matchday_helpers.js』『… /tmp/staff.js …』『… /tmp/coach.js …』の 3 行）
CHANGE: daysAgo(n) 相対日付で cal 2 件（daysAgo(1) 試合 squad=[{pid:1,num:9},{pid:2,num:18},{pid:3,num:'x'}]、daysAgo(5) 試合 squad 無し、他 type:'weight'）と md（旧: {pid:1,date:daysAgo(1),role:'スタート',fatiguePre:3,fatiguePost:5,sleepTime:'23:00',wakeTime:'06:30',injured:true} ／ v2: {pid:2,evId:…,v:2,role:'reserve',rpe:8,minutes:30,sleepH:7.5,preFatigue:2,postFatigue:4}）を置き、matchEvents 昇順・matchEventByDate・squadOf(無し→[])・squadRole(9→start/18→reserve/'x'→reserve/未所属→null)・mdOf(evId 優先・date フォールバック・pid 型ゆらぎ idEq)・mdRoleLabel(旧文字列そのまま/v2 変換)・mdLoad(旧 0 / v2 240)・matchLoadByDate(同日 2 件加算)・mdSleepStr('23:00 → 06:30（7.5h）'/'7.5h')・mdFatigueStr('前3/6 → 後5/6'/'前2/5 → 後4/5'/値0→'未入力')・mdInjuryLive(injId 一致・approved:false 除外・旧 injured の pid×date×source 照合)・pendingMatchChecks(N=3 窓・daysAgo=1 が残る／daysAgo=5 は窓外／squad 無しは対象外／md 提出後に消える／メンバー外は対象外) を検証。
REUSE: dev/test_dash.js の ok/has/daysAgo パターン
RISK: 3 サイトで同一テストを走らせるため D の未購読キーは setKey で明示初期化。

### 19. [dev] 新規テスト test_matchday_squad_staff.js／test_matchday_cal_staff.js
WHERE: dev/test_matchday_squad_staff.js、dev/test_matchday_cal_staff.js（先頭『// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_xxx.js』）
CHANGE: squad: D.p=PR/HO/SO/WTB×学年違い、cal 試合 1 件（squad 既存 1 名）。goSquadEditor(evid) → __els['main-ct'] に『メンバー表』『1〜15＝スタート』が出る／既存 1 名が選出状態。squadToggle(PR) → _squadTemp[pid]===1（POS_NUM 初期提案）、2 人目の PR は 3、3 人目の PR は 17（SQUAD_RES_NUM）。squadSetNum で重複 → sq-sum に『#1 重複』。saveSquad は重複時に __alerts に『重複』が積まれ __store['cal'] 不変。修正後 saveSquad → drainMicrotasks 後 __store['cal'] の該当イベントに squad（num 昇順）と squadAt があり、__store['matchsel'] が undefined のまま（＝書かない）。squadRole 判定が 15/16 境界で切り替わる。cal: calEventFormHTML に #cef-opp/#cef-ko/#cef-venue と onchange=calTypeChanged が含まれる／doAddCalEventForDate で title 空+opp あり → __store['cal'] に title 'vs 福岡工業大学'・opp/ko/venue が保存／doEditCalEvent が squad を保全して opp を更新／doCalImport で『2026-09-05 | match | vs文理 | 14:00』が ko '14:00' になり weight 行には ko が付かない／V.calendar 出力に『メンバー表』と onclick goSquadEditor があり『出場選手設定』『goSelectMatchMembers』が無い。
REUSE: dev/test_mstat.js の drain()（drainMicrotasks）／test_staff_ia_p8d.js の setKey/_els パターン
RISK: pushView の後埋め fn は setTimeout 経由＝prelude の __timeouts を `__timeouts.splice(0).forEach(function(f){f();})` で明示ドレインする。

### 20. [dev] 既存テストのフィクスチャ更新＋ダッシュボード/試合日レポートの回帰テスト
WHERE: dev/test_dash.js:75-77（D.cal/D.matchsel）、dev/test_home_p8b.js:31-32、新規 dev/test_matchday_dash_staff.js
CHANGE: test_dash 77 `D.matchsel=[1];` を削除し 76 を `D.cal=[{id:41,date:ydS,type:'match',title:'練習試合',squad:[{pid:1,num:1}]}];` に（期待文字列『昨日の試合日チェック』・red-bg 1 件・md 追加で消える、は維持）。86/88 の D.matchsel=[] 行は削除可（残っても無害）。test_home_p8b 32 `setKey('matchsel',[1])` → cal に squad を持たせる形へ（一覧が出ない期待は維持）。新規 test_matchday_dash_staff.js: 昨日試合（squad 2 名・md 1 名）＋3 日前試合（squad 1 名・md 無し）＋5 日前試合（窓外）で V.dash を描画し、『試合日チェック未入力』見出しが 2 ブロック・『残り1名（提出 1/2）』・3 日前ブロックに『3日経過』バッジ・5 日前は出ない・matchNotDone 由来の文字列が無い、を検証。V.matchview で提出 0 の試合行が出て『メンバー表』ボタンと『提出: 0/2名』があり、未来日には『NEXT』が付くことを検証。既存 test_dash_staff.js（D.cal=[]）・test_mstat.js:113（ms に kind 無し）は無変更で緑のまま。
REUSE: test_dash_staff.js の renderDash() パターン
RISK: run_tests.py の LEGACY_TARGETS に無い新規テストは先頭 15 行の『実行:』行でサイト判別される＝必須。

## tests
- 【更新】dev/test_dash.js 74-88: フィクスチャを D.matchsel=[1] → D.cal 試合イベントの squad:[{pid:1,num:1}] に変更。期待（『昨日の試合日チェック』表示・urgent red-bg が 1 件・#i-warn・md 追加で消える）は維持。
- 【更新】dev/test_home_p8b.js 31-38: setKey('matchsel',[1]) を cal の squad に置換（player ホームに『試合日チェック未入力』一覧・『あとN名』が出ない期待は維持）。
- 【新規】dev/test_matchday_helpers.js（player/staff/coach の 3 サイトで実行）: matchEvents 昇順／matchEventByDate／squadOf 空配列フォールバック／squadRole 1-15=start・16-23=reserve・NaN=reserve・未所属=null／mdOf evId 優先＋date フォールバック＋idEq／mdRoleLabel 旧文字列透過＋v2 変換／mdLoad 旧 0・v2 rpe×minutes／matchLoadByDate 同日加算／mdSleepStr 旧時刻→時間換算・v2 sleepH／mdFatigueStr 分母 6/5・値<1 は『未入力』／mdInjuryLive injId/hiaInjId・approved:false 除外・旧 injured の pid×date×source 照合／pendingMatchChecks N=3 窓・squad 無し除外・メンバー外除外・md 提出で消える・daysAgo 正しさ。
- 【新規】dev/test_matchday_squad_staff.js: goSquadEditor 描画、POS_NUM→SQUAD_RES_NUM→16..23 の初期提案順、重複警告、範囲外/未設定/重複で saveSquad が alert して書かない、正常保存で __store['cal'] の該当イベントに squad(num 昇順)+squadAt、__store['matchsel'] に書き込みが無い、goSelectMatchMembers/saveMatchSel が未定義。
- 【新規】dev/test_matchday_cal_staff.js: calEventFormHTML の match ブロック、calTypeChanged、doAddCalEventForDate/doAddCalEvent の opp/ko/venue 保存と title 自動補完、showEditCalEvent の後埋め（detail '14:00 KO' から cef-ko 候補）、doEditCalEvent が squad を保全、doCalImport の ko 抽出（match 行のみ）、V.calendar/calDayClick の『メンバー表』導線と旧ボタン文言の消滅。
- 【新規】dev/test_matchday_dash_staff.js: V.dash の未入力ブロックが試合ごと・3 日窓で出る（2 日後でも残る／5 日前は出ない／メンバー表未登録は出ない／提出 n/N と経過日バッジ）、1815-1819 撤去の回帰（'matchNotDone' 文字列なし）、V.matchview の cal∪md 行・提出 0/N・メンバー表ボタン・NEXT フラグ。
- 【維持確認】dev/test_dash_staff.js（D.cal=[] で未入力ブロックが出ない）、dev/test_mstat.js:113（ms 索引に kind 無し＝本フェーズは ms を触らない）、dev/test_staff_ia_p8d.js（setKey('matchsel',[]) は無害）、run_tests.py 全体 0 fail。
- 【機械ゲート】python3 dev/sync_check.py（identical 138 件＝125+13・POS_NUM 4 ファイル）緑／python3 dev/sync_check.py --residue 違反 0／各サイト jsc ロード（SyntaxError なし）。

## syncManifest
- identical.POS_NUM.files: ['player','trainer','coach'] → ['player','staff','trainer','coach']（staff:572 直後にコピー）
- identical に追加（files: player,staff,trainer,coach / kind:function）: matchEvents, matchEventByDate, squadOf, squadRole, matchEvLabel
- identical に追加（files: player,staff,coach / kind:function。trainer は P5 で md 購読追加と同時に files へ追記）: mdOf, mdRoleLabel, mdLoad, matchLoadByDate, mdSleepStr, mdFatigueStr, mdInjuryLive, pendingMatchChecks
- variant: 変更なし（svSafe/numStepHTML 等は触らない）。chart_counts: 変更なし（player14/staff12/trainer2/coach4）
- staff 専用（登録しない）: SQUAD_RES_NUM, _squadTemp, goSquadEditor, squadProposeNum, squadToggle, squadSetNum, squadAutoNum, squadClearAll, squadFilter, squadSummary, saveSquad, calTypeChanged, calMatchFieldsRead
- 削除される旧関数（staff）: goSelectMatchMembers, toggleMatchSel, matchSelAll, saveMatchSel, matchSelTemp（manifest 未登録なので台帳変更なし）

## openIssues
- 同日 2 試合（A/B 戦を別イベントで登録）の扱い: matchEventByDate は最初の 1 件、旧 md（evId 無し）は date フォールバックで両イベントに一致し二重計上しうる。P1b で md に evId を書き始めれば新規分は解消。V.matchview の行は日付単位で最初のイベントのみボタン化（同日複数は行を分けるか P1b で判断）。
- 背番号の範囲を 1〜23 に厳格化（D3）。24 名以上を帯同する練習試合では保存できない。squadRole は 24+ を 'reserve' として読むので、将来 max を緩める場合は saveSquad の検証だけ変えれば済む設計にしてある。
- trainer への md 購読追加（D7）は P5 に置く前提でグループB ヘルパーを trainer に入れていない。P5 で SK 追加＋コピー＋manifest files 更新が必要（先に入れておく判断も可＝(D.md||[]) ガード済みで安全）。
- SK/D からの matchsel 削除は『読まない』の機械的保証のため推奨したが、残しても実害はない（doc は小さい）。ユーザー決定 D2『読み書きしない（残置）』の解釈として購読停止まで含めた。
- delCalEvent(8771) は confirm() のまま（B群純掃除の範囲）。試合イベント削除で squad と（P1b 以降の）md.evId が孤児化する。mdOf は evId 一致のみで探すため、削除後は V.matchview の md 行（date 単位）でしか辿れない。Undo トースト化と『md がある試合は削除不可/警告』は C5/S2 で扱う。
- TimeTree 取込で opp/venue を title から自動抽出しない方針（title を正典、matchEvLabel が title フォールバック）。取込後に修正フォームで入れる運用。KO のみ time 列から抽出。
- P1b（player 新フォーム・staff 代理入力）が md v2 を書き始めるまで mdLoad/mdSleepStr/mdFatigueStr の v2 分岐は実データで通らない。test_matchday_helpers.js の v2 フィクスチャで契約を固定しておく。
- staff ダッシュボードの未入力ブロックに『代理入力』『お知らせ一括』ボタンを足すのは P1b（このフェーズでは名前カード→goPlayerDetail のみ）。

## estimate
staff 約 320〜380 行（ヘルパー 60・エディタ 130・フォーム/導線/ダッシュボード/レポート 120・削除 45 行）／player 約 70 行（ヘルパー 60・todo 10）／trainer 約 15 行／coach 約 65 行／dev テスト 4 本 約 300 行＋既存 2 本のフィクスチャ修正＋manifest。1 機能ずつ jsc→模擬→次の運用で 1 セッション（4〜6 時間）。順序: 手順1-2（基盤）→17（manifest 緑）→18（ヘルパーテスト）→3-5（cal フォーム）→6-7（エディタ＋導線）→19→8-9（レポート/ダッシュボード）→20→10-12→13-16（他サイト同期）→17 再実行→run_tests 全緑。完了後に 9/5 の試合イベントへ opp/ko/venue とメンバー表を登録し、P1b（player 新フォーム＋staff 代理入力）へ。