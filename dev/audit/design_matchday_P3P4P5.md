# P3 GPS/ms紐づけ・P4 選手シーズン出場記録・P5 coach/trainer反映＋CSV
## goal
D1の3本柱を「試合イベント(cal type:'match')＝正典」の上で完結させる。P3=同日の gs(kind match)/ms を evId（旧データは date）で md に pid 結合し、出場分の GPS バックフィル表示と「GPS上は出場しているのに未提出」の強調、取込フォームを cal 試合 select 化して gs/ms 索引に evId を保存（ms に kind は足さない）。P4=player T.match を「マイ試合履歴」（通算/今季サマリー・カード拡張・GPS chip・HTML バー推移）にし、doMatch 成功後に FULL TIME 画面、computeAllBadges に CAPS マイルストーン。P5=coach に試合タブ（試合レポート）＋概況の前戦/次戦カード＋insMatch＋charts.cond 試合マーカー＋個人レポート試合履歴＋approved!==false 統一、trainer に md 購読＋「試合後の要ケア」カード＋tapeslot 種別表示＋カルテ scene 既定「公式戦」、staff CSV を試合単位・列拡張・csvCell 共通化。全て追加フィールド/追加読みのみ・既存データ移行なし・二次記録を正典に書かない。
## dataModel
【保存形の追加（全て任意フィールド・既存互換）】
- gs 索引（staff gpsCommit 6120）: {id,date,kind,label,team,n,ts, evId?:number|string} — evId は meta.evId が非空のときだけ付与（練習セッションや手入力日付では付けない）。
- ms 索引（staff mstatCommit 6205）: {id,date,label,team,n,ts, evId?} — kind は引き続き保存しない（dev/test_mstat.js:113 維持）。
- _gpsWiz.meta（staff 6241）: {date,kind,label,team, evId:''} を追加。
- md（P1a で v:2 化済み）: 本フェーズで新規フィールド追加なし。表示上のバックフィル値（GPS min）は保存しない。
- cal 試合イベント（P1a で {opp,ko,venue,squad:[{pid,num}],squadAt} 追加済み）: 本フェーズで追加なし。
- 旧データの読み側フォールバック（必須）: (a) evId 無しの gs/ms → date 一致で結合（gs は kind==='match' のみ）／(b) evId 無しの md → P1a matchEventByDate(m.date) で ev 解決、無ければ「日付のみ」表示（opp/num は空）／(c) 旧 role 文字列（'スタート'/'リザーブ'/'出場なし（…）'）→ mdRoleCode で 'start'/'reserve'/'none' に正規化／(d) 旧 fatiguePre/Post(1-6)・sleepTime/wakeTime → P1a の mdFatigueStr/mdSleepStr で表示・CSV 出力／(e) 旧 matchsel 数値配列 → 読み書きしない（squadOf(ev) が ev.squad のみを見る＝P1a 仕様）／(f) 承認判定は coach/trainer とも x.approved!==false（null=承認待ちは含める）。

【新規ヘルパー（identical 登録・名前/引数/戻り値/配置）】
1. sessForEvent(list, ev, needMatchKind) → 配列。files:[player,staff]。list=D.gs|D.ms。ev が null なら []。要素 s は「s.evId が非空なら idEq(s.evId,ev.id)、無ければ s.date===ev.date かつ (needMatchKind ? s.kind==='match' : true)」で採用。配置: player 3405 の試合スタッツ読取り層の直前／staff 6136 gpsLoadRows の直前。
2. sessRowOf(rows, pid) → 行 or null。files:[player,staff]。(rows||[]).find(idEq(r.pid,pid))。同上配置。
3. mdMinutesShown(m, gpsRow) → {v:number|null, src:'md'|'gps'|null}。files:[player,staff]。isFilled(m.minutes)&&m.minutes>=0 なら {v:m.minutes,src:'md'}；それ以外で gpsRow&&gpsRow.min>0 なら {v:gpsRow.min,src:'gps'}；どちらも無ければ {v:null,src:null}。保存はしない（表示専用）。
4. mdRoleCode(m) → 'start'|'reserve'|'none'。files:[player,staff,trainer,coach]。m.role が 'start'/'reserve'/'none' ならそのまま、'スタート'→'start'、'リザーブ'→'reserve'、それ以外（出場なし系/undefined）→'none'。※P1a に同名があればそれを使い本項は不要（P1a の mdRoleLabel の内部に同等マップがあるはずなので、実装時に確認して一本化）。配置: roleBadgeHtml の直前（player 3965 付近／staff 411 付近）、coach POS_NUM(1528) 直後、trainer POS_NUM(222) 直後。
5. mdIsCap(m) → boolean。files:[player,staff,coach]。mdRoleCode(m)==='start' || (mdRoleCode(m)==='reserve' && (m.minutes==null || m.minutes>0))。出場記録（CAPS）の単位。
6. mdHia(m) → boolean。files:[player,staff,trainer,coach]。m.hiaInjId!=null || (!!m.hiaImpact && (m.hiaSymptoms||[]).length>0)。※P1a に同等があれば流用。
7. matchStatsFor(mds) → {n, caps, starts, minutes, avgRpe, avgPerf, avgLoad}。files:[player,staff,coach]。mds=md 配列。minutes は m.minutes の合計（null は 0 扱い・GPS バックフィルはしない＝正典値のみ）、avgRpe/avgPerf/avgLoad は avgOf 相当（null 除外・無ければ null）。純関数＝テスト対象。
8. MD_CAPS_MILESTONES=[1,5,10,20,30,50]（var・files:[player,staff]）。computeAllBadges 内の CAPS バッジ閾値。
9. csvCell(v) → string。staff 専用（identical 登録しない）。v==null→'""'、それ以外 '"'+String(v).replace(/"/g,'""')+'"'。配置: exportCSV(5367) 直前。
10. coach 専用（登録不要・純関数）: matchReportData(ev) → {ev, squad, squadN, mds, submitted, extraN, injN, injPending, hiaN, crampN, cantPrac, rpeBuckets:[n1_3,n4_6,n7_8,n9_10], avgRpe, avgLoad, maxLoad, minutesTotal, recovery:[{d:1,date,n,soreness,sleep,rpe},{d:2..},{d:3..}], highLoad:[{p,rpe,minutes,load}]}。insMatch() → 考察配列。lastMatchEvent(todayS)/nextMatchEvent(todayS) → ev|null（matchEvents() から date<=today の末尾／date>today の先頭）。
11. trainer 専用: matchCareList(ev) → [{rank:0..3, p, m, inj, label, cls, approved:true|null|false, iid}]（rank 0=HIA疑い / 1=怪我報告 / 2=攣り / 3=痛み・筋肉痛強い）。純関数＝テスト対象。
12. staff 専用: mdSessLoad(gsList, msList, cb) → gpsLoadRows/msLoadRows を pending カウンタで連鎖し、全件キャッシュ済みなら同期で cb（player の gpsLoadMany/msLoadMany と同型・staff 側は関数名が違うため identical にしない）。

【P1a 基盤への依存（本フェーズで files に trainer/coach を追加して identical 登録を拡張）】matchEvents()／matchEventByDate(date)／squadOf(ev)／squadRole(ev,pid)／mdOf(pid,ev)／mdRoleLabel(m)／mdLoad(m)／mdInjuryLive(m)／mdSleepStr(m)／mdFatigueStr(m)。coach は P5-coach 全般、trainer は P5-trainer の要ケアカードで必要。P1a 実装時点で既に4ファイル登録なら変更なし。
## steps

### 1. [staff] P3-1 取込ウィザードの meta に evId を追加（初期化・読取・保存メタ）
WHERE: gpsWizInit staff/index.html:6239-6243 の meta 初期値／gpsReadMeta 6246-6252／gpsDoSave 6342 の meta 組立／gpsSetType 6245
CHANGE: 6241 の meta を {date:'',kind:'practice',label:'',team:'',evId:''} に。gpsReadMeta に `var ev=document.getElementById('gps-ev');if(ev)st.meta.evId=ev.value||'';` を追加し、evId が非空なら対応 cal イベントから st.meta.date=ev.date を上書き（日付 input が hidden でも整合）。新関数 gpsPickEv(v): st.meta.evId=v; v 非空なら ev=matchEvents().find(idEq(e.id,v)) を引き st.meta.date=ev.date、st.meta.label が空なら label=(ev.opp?'vs '+ev.opp:ev.title||'')、その後 V.gps()。gpsDoSave 6342 の meta に evId:st.meta.evId を追加。gpsSetType でタイプ切替時に evId は保持（kind のみリセット）。
REUSE: P1a matchEvents()／既存 gpsReadMeta の DOM 読取パターン
RISK: V.gps() 再描画でテキスト入力中の label が消える→gpsPickEv 内で先に gpsReadMeta() を呼んでから上書きする。

### 2. [staff] P3-2 STEP1 メタ入力の日付を cal 試合 select 化（GPS=kind match 時／試合スタッツ=常時）
WHERE: V.gps STEP1 メタカード staff/index.html:6463-6470（日付 input 6466）
CHANGE: `var showEv=(st.type==='match'||st.meta.kind==='match');` のとき 6466 の前に `<div class="fl"><label>試合</label><select class="ipt" id="gps-ev" onchange="gpsPickEv(this.value)"><option value="">（手入力）</option>`+matchEvents().slice().reverse().slice(0,30).map(ev→`<option value="'+ev.id+'"'+(idEq(st.meta.evId,ev.id)?' selected':'')+'>'+fmt(ev.date)+' '+escapeHtml(ev.opp?'vs '+ev.opp:ev.title||'')+'</option>`)+`</select></div>` を挿入。evId が選択済みなら日付 input を readonly（value=ev.date）にし、未選択なら従来の手入力。GPS の種別 select（6467）を 'match' に変えたときも select を出すため、gps-kind の onchange に gpsReadMeta();V.gps() を追加（現状 onchange 無し）。STEP3 確認（6507）に evId があれば「試合: 9/5 vs ○○」行を追加。
REUSE: P1a matchEvents()／fmt／escapeHtml／既存の select 生成パターン(6449-6450)
RISK: cal に試合イベントが 0 件だと select が空→（手入力）のみで従来通り動く。試合が同日に 2 件ある場合はユーザーが選ぶ（date フォールバックは先頭）。

### 3. [staff] P3-3 gpsToStep2 の必須チェックと gs/ms 索引への evId 保存（ms に kind は足さない）
WHERE: gpsToStep2 staff/index.html:6295-6300／gpsCommit 6120／mstatCommit 6205
CHANGE: gpsToStep2: `if(!st.meta.date){...}` の前に、showEv かつ evId 空かつ date 空なら st.err='試合を選択するか日付を入力してください'。gpsCommit 6120 の push オブジェクトを変数 entry に分け、`if(meta.evId!=null&&meta.evId!=='')entry.evId=meta.evId;` を付けてから push。mstatCommit 6205 も同じ（entry に kind は絶対に入れない＝コメント『種別は常に試合＝kind保存なし』を維持）。
REUSE: 既存の冪等ガード(6119/6204)はそのまま
RISK: dev/test_gps.js の gs 索引期待値は evId 未指定 meta なので不変。test_mstat.js:113 も不変。evId は cal.id と同型（Date.now 数値）だが select 経由で文字列になる→保存前に isNaN(+v)?v:+v で数値化（gpsSetMatch 6317 と同型）。

### 4. [staff] P3-4 取込履歴・詳細ヘッダに試合名（ev.opp/title）を併記
WHERE: V.gps 履歴行 staff/index.html:6529-6536／msDetail ヘッダ 6356-6360／gpsDetail ヘッダ 6383-6387
CHANGE: 各所で `var ev=s.evId!=null?matchEvents().find(idEq(e.id,s.evId)):null;` を引き、ラベル表示を `escapeHtml(s.label||(ev?(ev.opp?'vs '+ev.opp:ev.title):'')||fmt(s.date))` に。履歴行にはさらに `<span class="bd bd-n">未紐づけ</span>` を（試合種別なのに evId 無し かつ matchEventByDate(s.date) も無い場合のみ）表示し、遡及入力の取りこぼしを可視化。
REUSE: P1a matchEvents/matchEventByDate
RISK: なし（表示のみ）。

### 5. [staff] P3-5 sessForEvent/sessRowOf/mdMinutesShown/mdSessLoad を追加
WHERE: staff/index.html:6136 gpsLoadRows 直前（sessForEvent, sessRowOf, mdMinutesShown）／6144 gpsLoadRows 直後（mdSessLoad）
CHANGE: dataModel 1-3,12 の定義どおり。mdSessLoad(gsList,msList,cb): ids=gsList.map(id)+msList.map(id); 全て _grCache/_msrCache にあれば即 cb()、無ければ pending=未ロード数で gpsLoadRows/msLoadRows を呼び 0 で cb()。
REUSE: gpsLoadRows 6138／msLoadRows 6222／isFilled 1242／idEq
RISK: identical 登録するので player 側（step 12）と正規化後ソース完全一致必須（コメント差は許容）。

### 6. [staff] P3-6 goMatchDateDetail に GPS/スタッツを pid 結合（バックフィル表示・GPS出場なのに未提出の強調）
WHERE: goMatchDateDetail staff/index.html:5454-5475（P1 M6 で提出状況ボード＋未提出チップ＋トリアージ順に再構成済みの版に対して追加。P1 後は ev を引数または date→matchEventByDate で解決している前提）
CHANGE: (1) ev 解決後に `var gsL=sessForEvent(D.gs,ev,true),msL=sessForEvent(D.ms,ev,false);`。(2) メトリクス行に `<div class="mc" id="mdd-gsum"><div class="v">…</div><div class="l">GPS/スタッツ</div></div>` を追加し、初期は gsL.length+'/'+msL.length+' 件'。(3) 提出者の各行に `<span id="mdd-g-'+m.pid+'" style="font-size:11px;color:var(--text-secondary)"></span>` を、未提出チップの各要素に `<span id="mdd-u-'+p.id+'"></span>` を仕込む（描画は同期のまま）。(4) pushView の第3引数コールバックで mdSessLoad(gsL,msL,function(){ gsRows=gsL.map(id→_grCache[id]||[]) を結合（同 pid 複数行は min 合算・dist/hsr 合算・max は最大）、msRows も tkl/tklD/G/P/M/carry 合算。提出者行: `var ms=mdMinutesShown(m,gRow);` → '出場 '+ms.v+'分'+(ms.src==='gps'?' <span class="bd bd-n">GPS</span>':'')+' ・ '+(gRow?((gRow.dist||0)/1000).toFixed(1)+'km ・ HSR '+(gRow.hsr||0)+'m':'')+(mRow?' ・ TKL '+(made)+'/'+(att):'') を getElementById('mdd-g-'+pid) に流し込む。未提出者: gRow&&gRow.min>0 なら getElementById('mdd-u-'+pid).innerHTML='<span class="bd bd-r">GPS出場 '+gRow.min+'分・未提出</span>' とし、親チップの style.borderColor='var(--red)'。#mdd-gsum の .v を 'GPS '+gsN+'名 / スタッツ '+msN+'名' に、赤件数があれば .l に ' ・ GPS出場なのに未提出 '+k+'名' を付け color var(--red)。})。(5) ev が無い（旧 md の日付のみ）場合は gsL/msL 共に空で分岐スキップ。
REUSE: pushView(title,html,fn) 1764 のコールバック／mdSessLoad(step5)／P1 M6 の未提出チップ／avH／bd クラス
RISK: 非同期後に別画面へ遷移していると getElementById が別要素を拾う可能性→各 id に ev.id を含める（'mdd-g-'+ev.id+'-'+pid）。同日に練習 GPS(kind practice) があっても needMatchKind=true で除外。

### 7. [staff] P3-7 goMatchDetail（1件詳細）に GPS/スタッツのボックスを追加
WHERE: goMatchDetail staff/index.html:8559-8579（P1 で canPractice/inputAt/editedAt 行・idEq・escapeHtml 化済みの版）
CHANGE: 基本情報ボックスの後に `<div class="form-box" id="mdd1-gps"><div class="form-title">GPS・スタッツ</div><div class="no">読み込み中…</div></div>` を追加。pushView の第3引数で ev=（m.evId? matchEvents().find : matchEventByDate(m.date)）→ mdSessLoad(sessForEvent(D.gs,ev,true),sessForEvent(D.ms,ev,false),function(){ 行を detail-row で 出場(分・ソース md/GPS)／距離 km／高強度ラン m／最高速 km/h／スプリント 本／タックル made/att (成功率%)／キャリー／LB を組み立て innerHTML 置換。どちらも無ければ '<div class="no">この試合の GPS/スタッツはありません</div>' })。出場(分)は mdMinutesShown を使い、md.minutes 未入力かつ GPS あり なら 'GPS 実測' バッジ、両方あり かつ |md-GPS|>=15 分なら '<span class="bd bd-a">自己申告と'+diff+'分差</span>'（訂正判断の材料・保存はしない）。
REUSE: gpsDetail の列定義 6388-6397／msDetail の成功率計算 6365
RISK: なし。

### 8. [staff] P3-8 GPS取込 STEP3 完了メッセージに『試合日レポートを見る』導線
WHERE: V.gps STEP3 savedId ブロック staff/index.html:6497-6502
CHANGE: st.meta.evId があれば 6502 のボタン列に `<button class="btn" onclick="goMatchDateDetail(...)">試合日レポートを見る</button>`（P1 の signature に合わせ ev.id または ev.date を渡す）を追加。
REUSE: goMatchDateDetail
RISK: なし。

### 9. [player] P4-1 mdRoleCode／mdIsCap／matchStatsFor／MD_CAPS_MILESTONES を追加（4ファイル同期）
WHERE: player/index.html:3965 ROLE_EN 直前（mdRoleCode, mdIsCap, matchStatsFor, MD_CAPS_MILESTONES）／staff/index.html:411 roleBadgeHtml 直前／coach/index.html:1528 POS_NUM 直後（mdRoleCode, mdIsCap, matchStatsFor）／trainer/index.html:222 POS_NUM 直後（mdRoleCode）
CHANGE: dataModel 4,5,7,8 の定義どおり。matchStatsFor は avgOf に依存しない自前の null 除外平均（coach の avgOf(837) と player の avgOf(6547) は同名だが staff/trainer に無いため、関数内で完結させる）。
REUSE: P1a mdRoleLabel の内部マップ（あれば mdRoleCode をそれに委譲）
RISK: P1a が既に mdRoleCode を持つ場合は二重定義になる→実装時に grep で確認し、無い場合のみ追加。

### 10. [player] P4-2 computeAllBadges に CAPS マイルストーンバッジ（player/staff identical 同時変更）
WHERE: computeAllBadges player/index.html:1279（BIG3クラブ block の直後・皆勤賞 1281 の前）／staff 同関数の同位置
CHANGE: `var mdBy={};(D.md||[]).forEach(function(m){if(!mdIsCap(m))return;var k=String(m.pid);(mdBy[k]=mdBy[k]||[]).push(m);});Object.keys(mdBy).forEach(function(k){var list=mdBy[k].slice().sort(function(a,b){return (a.date||'').localeCompare(b.date||'');});MD_CAPS_MILESTONES.forEach(function(th){if(list.length>=th){var at=list[th-1];add(k,{type:'club',sessId:null,sessName:null,cat:'caps',label:th===1?'初出場':th+' CAPS',pts:BPTS.club||0,year:(at.date||'').slice(0,4),date:at.date||null});}});});` を挿入。同一 pid×同一 date の md 重複は P1 M2 のガードで発生しない前提だが、念のため date で dedupe（同日2件は1キャップ）。
REUSE: add()／BPTS／type:'club' の既存色（badgeColor 6502 の club）
RISK: computeAllBadges は sync_manifest identical（player,staff）→両方同時に同一ソースで変更。dev/test_badges.js は D.md 空のため結果不変。pts に BPTS.club を流用する点は openIssues。

### 11. [player] P4-3 sessForEvent/sessRowOf/mdMinutesShown を player にも配置（identical）
WHERE: player/index.html:3405 試合スタッツ読取り層コメントの直前
CHANGE: step5 と正規化後ソース完全一致のコピー。
REUSE: gpsLoadMany 3360／msLoadMany 3414（player 側の非同期ロードはこれを使う）
RISK: なし。

### 12. [player] P4-4 T.match を『マイ試合履歴』に再構成（サマリー・推移バー・カード拡張・GPS chip・非同期ガード）
WHERE: T.match player/index.html:2750-2755（P1 M1/M3/S2 で showMatchForm(ev) 導線・Undo 削除・pending 表示済みの版）
CHANGE: (1) 先頭に `var _my=++_mtInvoke;`（新グローバル var _mtInvoke=0 を _rkInvoke 3448 の隣に）。(2) mds=自分の md を date 降順、各 m に ev=(m.evId!=null?matchEvents().find(idEq(e.id,m.evId)):matchEventByDate(m.date)) を付与。(3) 範囲チップ: window._myMatchRange='season'|'all'（既定 'season'＝date.slice(0,4)===todayStr().slice(0,4)）。(4) サマリーカード（class card ghost-host・ghost-num=最新 md の m.num || squad num || POS_NUM 先頭）: matchStatsFor(範囲内 mds) で 出場 caps ／ スタート starts ／ 合計 minutes 分 ／ 平均RPE ／ 平均perf を .grid3 .mc で。0件なら『まだ試合記録がありません』。(5) 推移バー（Chart.js 不使用・chart_counts 不変）: 直近10試合を日付昇順に、`<div style="display:flex;align-items:flex-end;gap:4px;height:64px">` 内に各試合 2 本の div（高さ=rpe/10*100%・背景 var(--maroon)／perf/5*100%・var(--purple)）＋下に MM/DD ラベル。凡例『■RPE ■パフォーマンス』。(6) カード: 見出し fmt(date)+' '+(ev?escapeHtml(ev.opp?'vs '+ev.opp:ev.title):'')、右に mdRoleLabel(m) バッジと `#`+(m.num||squadNum) chip、2行目 '出場 '+ms.v+'分'+(src gps?' (GPS)':'')+' ・ RPE '+(m.rpe??'-')+' ・ 負荷 '+(mdLoad(m)??'-')+' AU ・ ⭐'+(m.perf??'-')、3行目 GPS chip `<span id="mt-g-'+m.id+'"></span>`（距離/HSR/最高速・スタッツ TKL）、フラグ: mdInjuryLive(m)→'怪我あり'(bd-r)、mdHia(m)→'HIA'(bd-r)、m.cramp→'攣り'(bd-a)。旧 md（rpe 無し）は 2行目を mdFatigueStr(m) に置換。修正/削除ボタンは P1 版を維持（onclick は文字列 id 渡し）。(7) 描画後: 全 md の ev から ids=sessForEvent(D.gs,ev,true)+sessForEvent(D.ms,ev,false) を集め、未キャッシュがあれば gpsLoadMany/msLoadMany→完了時 `if(_my===_mtInvoke&&curTab==='match'&&!subView)T.match();`（renderRank 3641 と同じ非同期ガード）。キャッシュ済みなら同期で chip を埋める。
REUSE: showSelfFitnessResult の card 行パターン 6488-6493／mc・grid3 CSS(72,77)／renderRank の _rkInvoke ガード 3641／P1a matchEvents・matchEventByDate・mdRoleLabel・mdLoad・mdInjuryLive・mdFatigueStr
RISK: T.match は _RV_FORM_TABS(1363) に含まれ reveal 対象外＝.rv を書いてもアニメしない（問題なし）。ゴースト背番号は .ghost-host 前提（player CSS 132 に .ghost-num あり・親に position:relative が必要→card ghost-host を使う）。生 hex 禁止＝色は var(--maroon)/var(--purple) のみ。

### 13. [player] P4-5 showMatchDetail に対戦相手・背番号・GPS/スタッツボックス
WHERE: showMatchDetail player/index.html:4368-4387（P1 S3 で escapeHtml/idEq/修正・削除ボタン化済み）
CHANGE: 見出しを '試合記録 '+fmt(m.date)+(ev?' '+escapeHtml(ev.opp?'vs '+ev.opp:ev.title):'') に。基本情報に '背番号 #'+(m.num||squadNum||'-') 行を追加。末尾に `<div class="form-box" id="mtd-gps"><div class="form-title">GPS・スタッツ</div><div class="no">読み込み中…</div></div>` を置き、showSub 後に gpsLoadMany/msLoadMany で staff step7 と同じ行（出場分＋ソース／距離／HSR／最高速／スプリント／TKL）を getElementById('mtd-gps').innerHTML に流す（showSub の再描画不要・subView 中は onSnapshot 再描画されない前提はコード規約通り）。
REUSE: staff step7 と同じ行定義（文言も揃える）／gpsLoadMany 3360／msLoadMany 3414
RISK: ロード完了時に既に別画面なら getElementById が null→ガード。

### 14. [player] P4-6 doMatch 成功後の FULL TIME 画面 showMatchResult(rec,ev)
WHERE: 新規 showMatchResult を showSelfFitnessResult player/index.html:6479-6497 の直後に追加／doMatch 成功コールバック 4360-4361（P1 版では go('match');toast）を差し替え
CHANGE: showMatchResult(rec,ev): `var code=mdRoleCode(rec),ghost=rec.num||(POS_NUM[me.position]||'').split('·')[0]||'';` → `<div class="hero"><div class="ghost-num">'+ghost+'</div><div class="kicker" style="color:var(--rose-l)">FULL TIME</div><div style="font-size:26px;font-weight:900;font-family:var(--font-num);font-style:italic;line-height:1.15">'+escapeHtml(ev?(ev.opp?'vs '+ev.opp:ev.title):fmt(rec.date))+'</div><div style="font-size:11px;opacity:.85">'+(code==='start'?'STARTING XV':code==='reserve'?'FINISHER':'出場なし')+(rec.minutes!=null?' ・ '+rec.minutes+'分':'')+'</div></div>`。カード 'MATCH REPORT' rows: [出場, mdRoleLabel]/[出場時間, minutes分]/[RPE, rpe]/[試合負荷, mdLoad(rec)+' AU']/[睡眠, sleepH+'h']/[パフォーマンス, perf+'/5']/(rec.injured?['怪我報告','送信済み（スタッフ確認待ち）']:[])/(rec.cramp?['攣り', crampWhen+' '+crampParts.join('・')]:[])。mdHia(rec) なら hero 直下に `<div class="alert-card" style="background:var(--red-bg);color:var(--red)">頭部への衝撃と症状が報告されています。今日は安静にし、症状が続く・悪化する場合は必ずスタッフ/医師に連絡してください</div>`（P1 が同文言を toast で出している場合はこちらに一本化）。マイルストーン: `var caps=(D.md||[]).filter(pid 自分 && mdIsCap).length;` が MD_CAPS_MILESTONES に含まれれば `<span class="flag" style="background:var(--gold-hot);color:var(--ink)">'+(caps===1?'FIRST CAP':caps+' CAPS')+'</span>` を hero に追加し pbFlash(caps===1?'初出場！':caps+'キャップ達成！')。末尾 `<button class="btn btn-p" style="width:100%;margin-top:16px" onclick="go('match')">完了</button>`。showSub(h,'match','試合履歴')。doMatch 成功: `showMatchResult(rec,ev);toast('記録しました');`（D.md は svSafeSeq が更新済みなので caps は保存後値）。
REUSE: showSelfFitnessResult 6479-6497 の hero/カード/ボタン構造／pbFlash 1347／showSub(html,backTab,backLabel) 2073／flag CSS 163／POS_NUM 416
RISK: staff 代理入力（P1 M5）では FULL TIME を出さない（staff 側は toast のみ）。hero の max-height:96px(159) に flag を足すと溢れる→flag は hero 外の kicker 行に置く。

### 15. [player] P4-7 マイページ『試合』カードにキャップ数
WHERE: T.mypage player/index.html:2483（P1 M3 で 未入力/入力済 バッジ追加済み）
CHANGE: `var caps=(D.md||[]).filter(function(m){return idEq(m.pid,myPid)&&mdIsCap(m);}).length;` を計算し、カード下段に `<div style="font-size:11px;color:var(--text-secondary);margin-top:4px">'+caps+' CAPS</div>`（0 のときは非表示）。
REUSE: mdIsCap
RISK: なし。

### 16. [coach] P5-C1 approved!==false 統一（7箇所）
WHERE: coach/index.html:765 injuryStatusMaps／778 rtpBuckets／905 insInjury／1753 renderHomeView KPI／1821 renderInjuryView／2173 renderPlayerReport／2114 renderPlayersView
CHANGE: 各 filter/find の `!x.resolved` を `!x.resolved&&x.approved!==false` に（1540 fieldMapData・1618 weeklyDeltaData と同基準）。2114 は `D.i.find(function(x){return idEq(x.pid,p.id)&&!x.resolved&&x.approved!==false;})`。
REUSE: fieldMapData 1540 の既存式
RISK: 却下＝resolved:true も同時に立つ（staff doRejectInjury 8615）ため実害は限定的だが、Undo で resolved が戻る経路と rejectInjury 以前の旧データ（approved:false のみ）を確実に除外するために必要。dev/test_fieldmap_coach.js は不変。

### 17. [coach] P5-C2 P1a ヘルパー＋matchReportData/insMatch/lastMatchEvent/nextMatchEvent を coach に配置
WHERE: coach/index.html:1528 POS_NUM 直後（P1a identical 群：matchEvents/matchEventByDate/squadOf/squadRole/mdOf/mdRoleLabel/mdLoad/mdInjuryLive/mdHia、step9 の mdRoleCode/mdIsCap/matchStatsFor）／coach 専用 matchReportData・insMatch・lastMatchEvent・nextMatchEvent は condDaily(823) の直後
CHANGE: matchReportData(ev): squad=squadOf(ev); mds=D.md.filter(idEq(m.evId,ev.id)||(m.evId==null&&m.date===ev.date)); submitted=squad.filter(s→mds.some(idEq(m.pid,s.pid))).length; extraN=mds.filter(pid が squad 外).length; injN=mds.filter(mdInjuryLive).length; injPending=それらのうち D.i の injId 一致で approved==null; hiaN=mds.filter(mdHia).length; crampN=mds.filter(m.cramp).length; cantPrac=mds.filter(m.canPractice==='参加できない').length; rpeBuckets=[1-3,4-6,7-8,9-10] の件数; avgRpe/avgLoad/maxLoad/minutesTotal（mdLoad・m.minutes）; highLoad=mds.filter(rpe>=9&&(minutes||0)>=60); recovery: d=1..3 の date=ev.date+d について squad pid の D.f を集め {n, soreness:avg, sleep:avg(>0), rpe:avg}。insMatch(): ev=lastMatchEvent(today) が無い/7日超なら []。項目: (a) lv=hiaN?'bad':injN?'warn':'good', t:'前戦 '+fmt(ev.date)+(opp)+'：怪我報告 '+injN+'件'+(hiaN?'（HIA疑い '+hiaN+'）':''), d:'承認待ち '+injPending+'件。トレーナー/スタッフの確認状況をご確認ください', detail: 該当選手 insRowP(pid, 部位/HIA)；(b) highLoad.length なら lv:'warn', t:'試合負荷が高い選手 '+n+'名（RPE9以上×60分以上）', d:'翌週前半はリカバリー優先が妥当です', detail: insRowP(pid,'RPE r ・ m分', load+'AU')；(c) 提出率 submitted/squadN<0.8 なら lv:'info', t:'試合日チェック提出 '+submitted+'/'+squadN；(d) recovery[0].n>=3 && soreness>=3.5 なら lv:'warn', t:'試合翌日の筋肉痛が強い（平均 '+x+'/5）'。
REUSE: insRowP 883／capRows 892／insCard 契約 {lv,t,d,detail}／condDaily の日別走査パターン
RISK: D.f の soreness は任意項目（記録が無い日は n=0）→ n<3 は表示しない。

### 18. [coach] P5-C3 insHome に『試合』カテゴリ追加＋概況ヒーロー直下に前戦/次戦カード
WHERE: insHome coach/index.html:1188 の tag 列／renderHomeView 1739 heroBlock 直後（出場可リング 1741 の前）
CHANGE: 1188: `tag(insMatch(),'試合');` を先頭に追加（lv 順ソートで自然に上位化）。renderHomeView: `h+=matchHomeCards();` を 1739 の直後に。matchHomeCards(): last=lastMatchEvent(today), next=nextMatchEvent(today)。どちらも無ければ ''。`<div class="sec">`+secH('MATCH','前戦 / 次戦','タップで試合レポート')+`<div class="grid g2">`+ [前戦: rv('<div class="card card-hv" onclick="goMatch('+last.id+')"><div class="sec-eyebrow">LAST MATCH ・ MD+'+days+'</div><div style="font-weight:800;font-size:15px">'+escapeHtml(opp||title)+'</div><div style="font-size:11px;color:var(--txt-2)">'+fmt(last.date)+(venue)+'</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">'+chip('提出 '+r.submitted+'/'+r.squadN)+(r.injN?'<span class="bd bd-r">怪我 '+r.injN+(r.hiaN?'・HIA '+r.hiaN:'')+'</span>':'<span class="bd bd-g">怪我なし</span>')+(r.crampN?'<span class="bd bd-a">攣り '+r.crampN+'</span>':'')+(r.avgRpe!=null?chip('平均RPE '+r.avgRpe.toFixed(1)):'')+'</div></div>',0)] + [次戦: 'NEXT MATCH ・ MD-'+dd、opp/ko/venue、squad があれば『選出 N名 ・ 出場可 ok名 ・ 制限 lim ・ 不可 out』を injuryStatusMaps() の outP/limP で squad pid を分類して表示（rtpBuckets と同じ翻訳）、squad 無しなら 'メンバー未登録'] +'</div></div>'。goMatch(evId): window._coachMatchEv=evId; goTab('match')。
REUSE: secH 1675／rv 751／kpiTile／injuryStatusMaps 763／chip CSS 133／bd クラス／heroBlock の後続構造
RISK: dev/test_p8e_coach.js は cal 空で実行→matchHomeCards が '' を返し既存アサート不変。

### 19. [coach] P5-C4 TABS に『試合』タブ＋renderMatchView（試合レポート）
WHERE: TABS coach/index.html:2266-2273（condition と players の間に {k:'match',label:'試合'}）／render 2313-2324 に `else if(curTab==='match')renderMatchView();`／renderMatchView は renderConditionView(2061) の直後に新設
CHANGE: renderMatchView(): heroBlock('<em>試合</em>レポート','試合ごとの提出状況・出場メンバー・負荷とコンディション・回復の進みを確認します。')。evs=matchEvents().filter(date<=today).slice(-8).reverse()。0件なら『試合イベントがありません』。sel=window._coachMatchEv（無効なら evs[0].id）。セレクタ: `<div class="sec" style="display:flex;gap:6px;overflow-x:auto">`+evs.map(chip ボタン onclick="selCoachMatch(id)" 選択中は style="background:var(--accent-a22);color:var(--accent)")。r=matchReportData(ev)。(1) KPI4: 提出 r.submitted/r.squadN（unit ''・val 文字列）、怪我 r.injN（sub 'HIA '+hiaN）、攣り r.crampN、平均RPE。(2) ROSTER: secH('SQUAD','出場メンバー','背番号順')→ squad を num 昇順で row: `#num` ・ ava ・ name ・ position ・ mdRoleLabel ・ (md? '出場 '+minutes+'分 ・ RPE '+rpe+' ・ ⭐'+perf : '<span class="bd bd-n">未提出</span>') ・ フラグ（怪我 bd-r／HIA bd-r／攣り bd-a／来週不可 bd-r）、row-click→openPlayer。squad 外の提出者（role:'none'）は末尾に『メンバー外の提出 n名』として同形式。(3) LOAD: secH('LOAD','RPE・試合負荷の分布') → HTML バー4本（rpeBuckets、幅=件数/max*100%、色 var(--green)/var(--blue)/var(--amber)/var(--red)）＋ 'avg '+avgLoad+' AU / max '+maxLoad+' AU / 合計出場 '+minutesTotal+'分'。highLoad があれば insRowP リスト。(4) RECOVERY: secH('RECOVERY','回復の進み','MD+1〜+3 のコンディション(f)') → 3列 miniStat×3（n / 筋肉痛 / 睡眠 / 疲労度）を日ごとに row 表示。n=0 の日は '—'。(5) insightSec(insMatch(), 'この試合から読み取れること')。paint(h)。selCoachMatch(id): window._coachMatchEv=id; window._noAnim=true; render(); window._noAnim=false。
REUSE: kpiTile 1669／secH／rv／ava 1512／miniStat 1250／insightSec 896／openPlayer 1579／renderConditionView の構造
RISK: Chart.js を使わない（chart_counts coach:4 不変）。goTab は _seenTabs で初回のみアニメ＝既存挙動に乗る。

### 20. [coach] P5-C5 charts.cond に試合日マーカー（chart_counts 不変）
WHERE: renderConditionView coach/index.html:2076-2080（見出し）／2096-2099（new Chart の datasets）
CHANGE: `var mset={};matchEvents().forEach(function(e){mset[e.date]=1;});var isM=daily.map(function(d){return !!mset[d.date];});` を 2076 の後に。secH の sub を '直近14日'+(isM.some(Boolean)?' ・ ◆＝試合日':'') に。2097/2098 の両 dataset に `pointRadius:isM.map(function(m){return m?6:3;}),pointStyle:isM.map(function(m){return m?'rectRot':'circle';}),pointHoverRadius:isM.map(function(m){return m?8:5;})` を追加（既存 pointBackgroundColor 等はそのまま＝生 hex はJS内既存リテラルで新規追加なし）。tooltip callbacks.title に isM[ctx[0].dataIndex] なら '（試合日）' を付加。
REUSE: condDaily 823／matchEvents
RISK: Chart.js 4.4.1 は pointRadius/pointStyle の配列指定に対応。`new Chart(` の個数は変えない（閉じ括弧事故に注意）。

### 21. [coach] P5-C6 個人レポートに試合履歴＋受傷場面（scene）＋『試合で受傷』チップ
WHERE: renderPlayerReport coach/index.html:2233（コンディションカードの直後）／injEvidence 646-651／rows7 2187／renderInjuryView チップ列 1871-1874／個人レポート怪我見出し 2181
CHANGE: (1) injEvidence の戻り値に `scene:det.scene||''` を追加し、2187 の後に `if(ev7.scene)rows7.push(['場面',escapeHtml(ev7.scene)]);`。(2) 1874 と 2181 に `(inj.source==='match'?'<span class="chip" style="background:var(--red-bg);color:var(--red)">試合で受傷</span>':'')`（2181 は bd で）。(3) 試合履歴カード: `var myMd=D.md.filter(idEq(m.pid,pid)).sort(date desc);` 0件なら出さない。st=matchStatsFor(myMd) → `<div class="card" style="margin-top:12px"><div style="font-size:13px;font-weight:800;margin-bottom:10px">試合履歴 <span class="sub">'+myMd.length+'試合</span></div><div class="grid g4" style="gap:8px">'+miniStat('出場',st.caps)+miniStat('スタート',st.starts)+miniStat('合計出場',st.minutes,'var(--accent)')+miniStat('平均RPE',st.avgRpe!=null?st.avgRpe.toFixed(1):'-')+'</div>'+ myMd.slice(0,6).map(row: fmt(date) ・ opp ・ mdRoleLabel ・ minutes分 ・ 'RPE '+rpe ・ '⭐'+perf ・ 怪我/HIA/攣り bd) +'</div>' を rv(...,1) で追加。旧 md（rpe 無し）は mdFatigueStr(m) を表示。
REUSE: miniStat 1250／matchStatsFor／mdRoleLabel／mdFatigueStr／既存 rows7 構造
RISK: injEvidence は dev/test_p7c_coach.js の対象→戻り値にキーを足すだけで既存アサートは不変（要実行確認）。

### 22. [trainer] P5-T1 SK/D に md を追加＋P1a ヘルパーを trainer に配置
WHERE: trainer/index.html:214 SK／216 D／222 POS_NUM 直後（matchEvents, matchEventByDate, squadOf, squadRole, mdOf, mdRoleLabel, mdInjuryLive, mdHia, mdRoleCode）
CHANGE: SK に `md:'rm_matchday'`、D に `md:[]`。211-213 の除外方針コメントに『md は試合日のみ更新される軽量キー（P5 で追加・要ケアカード用）』を1行追記。ヘルパーは P1a のソースをそのままコピーし sync_manifest の files に 'trainer' を追加。
REUSE: startListeners 4136（Object.keys(SK) で自動購読）
RISK: 試合当夜は md 更新のたびに trainer が再描画される（isInputting/_subViewActive ガード 4152-4153 で入力中は保護済み）。md 容量は 1 試合 ≒ 23件×~40 フィールド＝数十KB/年で許容。

### 23. [trainer] P5-T2 T.home に『試合後の要ケア』カード（HIA最上段→怪我報告→攣り→痛み強い・承認待ちラベル・canPractice・リハ対象には入れない）
WHERE: trainer/index.html:1441（今日のテーピングカードの直前）に `h+=matchCareCardHtml();`／matchCareList・matchCareCardHtml は trTodoBadge(1381) の直前に新設
CHANGE: matchCareList(ev): mds=D.md.filter(evId 一致 || (evId 無し && date===ev.date))。各 m: p=D.p.find(idEq(pid)) 無ければ skip; inj=(m.injId!=null?D.i.find(idEq(id,m.injId)):null) / hiaInj=(m.hiaInjId!=null?D.i.find(...):null)。行生成: mdHia(m)→{rank:0,cls:'bd-r',label:'HIA疑い'+(hiaInj?'':'')+(hiaSymptoms.join('・')),inj:hiaInj}; mdInjuryLive(m)→{rank:1,cls:'bd-r',label:(m.injSide||'')+m.injPart+' '+m.injType+' 痛み'+m.injPainNow+'/10',inj:inj}; m.cramp→{rank:2,cls:'bd-a',label:'攣り '+(m.crampWhen||'')+' '+(m.crampParts||[]).join('・')}; (m.soreness>=4)||(m.postFatigue>=5)→{rank:3,cls:'bd-a',label:'筋肉痛 '+m.soreness+'/5'+(m.sorenessParts?' '+m.sorenessParts.join('・'):'')}。1選手が複数該当なら最小 rank の行に他ラベルを連結。approved は inj?inj.approved:null。canPractice==='参加できない' なら label に ' ・ 来週参加不可'。rank→date 降順でソート。matchCareCardHtml(): ev=matchEvents() の date<=today の末尾で today-date<=3 日のもの、無ければ ''。list 空なら `<div class="card rv"><div style="font-weight:600">'+ic('i-flag',14)+' 試合後の要ケア <span style="font-size:11px;color:var(--text-secondary)">'+fmt(ev.date)+' MD+'+d+'</span></div><div class="no">報告はありません（提出 n/N）</div></div>`。行: `<div class="log-row">'+avH(p,26)+'<div style="flex:1"><span style="font-weight:600">'+escapeHtml(p.name)+'</span> <span class="bd '+cls+'">'+escapeHtml(label)+'</span>'+(row.inj?(row.inj.approved===true?'':' <span class="bd bd-n">スタッフ承認待ち</span>'):'')+'</div>'+(row.inj&&row.inj.approved===true?'<button class="btn btn-sm" onclick="goRehabPlayer('+row.inj.id+')">カルテ</button>':'')+'</div>'。カード左ボーダー var(--maroon)、見出しに 'MATCH CARE' kicker。1465/1467/1626 のリハ対象フィルタは変更しない（承認前は名前表示のみ・リハ対象に入れない＝D7）。
REUSE: avH 1155／goRehabPlayer 2840／bd クラス／log-row／kicker CSS 117／既存 T.home のカード構造 1441-1463
RISK: trainer の bd-n が未定義なら .bd-n を追加（staff 69 と同型・var(--bg-tertiary)/var(--text-secondary)）。HIA 疑いで hiaInjId が承認済みなら trTodoBadge の脳震盪ゲート（1387）へ自然に乗る（chart.isConcussion は staff 承認時に P1 が立てる）。

### 24. [trainer] P5-T3 tapeslot.type の表示＋枠設定の試合日提案＋カルテ scene 既定『公式戦』
WHERE: T.tape trainer/index.html:1597-1609（日付カード見出し 1599・枠行 1606-1609）／T.home 1447-1449／showTapeSetupForm 4029-4033／renderChartDiagnosis 2042-2043（staff 3145-3146 も同時）
CHANGE: (1) 枠行: `var isMt=s.type==='match';` → 1606 の div に `border-left:3px solid '+(isMt?'var(--maroon)':'transparent')` を追加し、時間の後ろに `(isMt?' <span class="flag" style="background:var(--maroon);color:var(--text-primary)">試合前</span>':'')`。1599 の日付見出し: その日の slots に match があれば `<span class="flag" style="background:var(--maroon);color:var(--text-primary)">MATCH DAY</span>` を併記。T.home 1448 も同じ flag。(2) showTapeSetupForm: `var nx=matchEvents().filter(date>today).slice(0,1)[0];` があれば 4032 の日付欄の下に `<div style="font-size:11px;color:var(--text-secondary)">次の試合: '+fmt(nx.date)+' '+escapeHtml(nx.opp?'vs '+nx.opp:nx.title)+' <button type="button" class="btn btn-sm" onclick="tsUseMatch('+JSON.stringify(nx.date)+')">試合前枠にする</button></div>`。tsUseMatch(d): ts-date.value=d; ts-type.value='match'。(3) renderChartDiagnosis: `var defScene=d.scene||(inj.source==='match'?'公式戦':'');` にして option の selected 判定を defScene===x に（保存は従来通り saveChartDiagnosis 2074 のみ＝自動保存しない）。staff 3145-3146 も同じ式に。
REUSE: player 7057-7060 の試合前バッジ表現／flag CSS 34／timeOptions／matchEvents
RISK: trainer の renderChartDiagnosis が staff とマニフェスト variant 登録されている場合は --update で md5 確定。trainer では var(--maroon) が定義済み（23行）。

### 25. [staff] P5-S1 csvCell 共通化と exportCSV('matchday',evId) の試合単位・列拡張（GPS はキャッシュ由来・非同期ラッパ）
WHERE: exportCSV staff/index.html:5367-5381（matchday 分岐 5376）／新規 csvCell は 5366 の直前／新規 exportMatchdayCSV(evId) は exportCSV 直後／V.export カード 2308／goMatchDateDetail ヘッダ（P1 M6 版）に『この試合をCSV』ボタン
CHANGE: csvCell は dataModel 9。exportCSV(type,evId): matchday 分岐を書き直す。evs=evId!=null?[matchEvents().find(idEq(e.id,evId))]:matchEvents()（date 降順）。旧 md（どの ev にも紐づかない日付）は ev={id:null,date:m.date,title:''} の疑似イベントとして末尾に群化。ヘッダ: 試合日,対戦相手,会場,KO,選手,ポジション,学年,背番号,出場区分,出場分,出場分ソース,GPS距離m,GPS高強度m,GPS最高速kmh,TKL成功,TKL試行,キャリー,RPE,試合負荷AU,睡眠h,朝食,朝食内容,試合前疲労,試合後疲労,筋肉痛,筋肉痛部位,パフォーマンス,怪我,怪我部位,怪我種類,受傷時痛み,現在痛み,プレー続行,来週練習,怪我承認,攣り,攣り時間帯,攣り部位,攣り頻度,頭部衝撃,HIA症状,メモ,提出日時,修正日時,代理入力,記録者,提出。各 ev について rows=squad の順（num 昇順）＋メンバー外提出者＋未提出者（提出='未提出'・md 列は空）。値: 出場区分=mdRoleLabel(m)（HTML なら mdRoleCode→{start:'スタート',reserve:'リザーブ',none:'出場なし'}）、出場分=mdMinutesShown(m, sessRowOf(_grCache 由来の結合行)).v／ソース md|GPS|''、睡眠=m.sleepH!=null?m.sleepH:mdSleepStr(m)、試合前後疲労=旧 fatiguePre/Post なら mdFatigueStr、新は preFatigue/postFatigue、怪我承認=injId→D.i の approved（null→'承認待ち'/true→'承認'/false→'却下'）、HIA症状=(hiaSymptoms||[]).join('・')、提出日時=fmtDateTime(inputAt)、代理=proxy?'代理':''、記録者=recordedBy||''。全セルを csvCell で（escapeHtml は使わない）。fname: evId 指定時 '試合日レポート_'+ev.date+'_'+(ev.opp||ev.title||'').replace(/[\/:*?"<>|]/g,'')+'.csv'、全件は '試合日レポート_全試合.csv'。exportMatchdayCSV(evId): ev を引き mdSessLoad(sessForEvent(D.gs,ev,true),sessForEvent(D.ms,ev,false),function(){exportCSV('matchday',evId);}) ＝GPS 列をキャッシュ経由で埋める。2308 のカードは exportCSV('matchday') のまま（全件・GPS はキャッシュ済み分のみ）、goMatchDateDetail のボタンは exportMatchdayCSV(ev.id)。
REUSE: exportCSV の BOM/Blob/ダウンロード 5377-5380／fmtDateTime 1622／P1a mdRoleLabel・mdSleepStr・mdFatigueStr・mdLoad・squadOf／sessForEvent・sessRowOf・mdMinutesShown・mdSessLoad
RISK: 他 CSV 種別（players/injuries/…）は本フェーズで触らない（csvCell 化は任意の後続）。GPS 列は未ロード時に空になる仕様を CSV 画面の説明文に1行明記。

### 26. [dev] P5-S2 sync_manifest 登録・sync_check・residue・run_tests の全緑化
WHERE: dev/sync_manifest.json identical セクション／chart_counts
CHANGE: identical に追加: sessForEvent{player,staff}, sessRowOf{player,staff}, mdMinutesShown{player,staff}, mdRoleCode{player,staff,trainer,coach}, mdIsCap{player,staff,coach}, matchStatsFor{player,staff,coach}, mdHia{player,staff,trainer,coach}, MD_CAPS_MILESTONES{player,staff, kind:'var'}。P1a 群（matchEvents/matchEventByDate/squadOf/squadRole/mdOf/mdRoleLabel/mdLoad/mdInjuryLive/mdSleepStr/mdFatigueStr）の files に coach・trainer（必要分）を追加。computeAllBadges は登録済み（両方同時変更）。chart_counts は {player:14,staff:12,trainer:2,coach:4} のまま＝本フェーズで new Chart( を増やさないことを sync_check で確認。`python3 dev/sync_check.py` 緑、`--residue` 0、`python3 dev/run_tests.py` 全緑。
REUSE: dev/sync_check.py／dev/run_tests.py
RISK: identical の正規化はコメント行のみ許容→各サイトに貼るときに文字列リテラル内の文言まで一致させる。

## tests
- 【新規】dev/test_matchday_p3_staff.js（// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_matchday_p3_staff.js）: (1) sessForEvent — evId 一致で採用／evId 無し＋date 一致＋kind 'match' で採用／kind 'practice' 同日は needMatchKind=true で除外・false で採用／ev=null→[]。(2) mdMinutesShown — {minutes:70}→{v:70,src:'md'}、{minutes:null}+gps{min:63}→{v:63,src:'gps'}、minutes:0 は md 優先で {v:0,src:'md'}、両方無し→{v:null,src:null}。(3) gpsWizInit(true) の meta.evId===''／gpsPickEv(id) で meta.date と label が ev から補完され既存 label は上書きしない。(4) gpsCommit(meta.evId=41) → D.gs[0].evId===41、meta.evId 無し → 'evId' in D.gs[0] が false（dev/test_gps.js の期待値維持）。(5) mstatCommit(meta.evId=41) → D.ms[0].evId===41 かつ D.ms[0].kind===undefined（test_mstat 113 と同じ主張を再掲）。(6) gpsToStep2 — 試合タイプで evId・date 共に空なら st.err に '試合を選択' を含む。(7) goMatchDateDetail: cal=[{id:41,date:daysAgo(1),type:'match',opp:'A大',squad:[{pid:1,num:1},{pid:2,num:2}]}], md=[pid1 evId41 minutes null], _grCache[gsid]=[{pid:1,min:63,dist:7100,hsr:400},{pid:2,min:40}] を事前投入し gs=[{id:gsid,date:daysAgo(1),kind:'match',evId:41}] → 描画 HTML に 'mdd-g-41-1' プレースホルダ、コールバック実行後（__timeouts を手動 drain）に要素の innerHTML に '出場 63分' と 'GPS' バッジ、未提出 pid2 の 'mdd-u-41-2' に 'GPS出場 40分・未提出'、#mdd-gsum に '未提出 1名'。
- 【新規】dev/test_matchday_p4_player.js（player）: (1) mdRoleCode — 'スタート'→start／'リザーブ'→reserve／'出場なし（ベンチ）'→none／'start'→start／undefined→none。(2) mdIsCap — start=true／reserve minutes 0=false／reserve minutes null=true／none=false。(3) matchStatsFor — 混在 md（旧 role 文字列＋新コード・rpe 無し混在）で caps/starts/minutes/avgRpe（null 除外）。(4) computeAllBadges — D.md に pid1 の cap 5件（daysAgo(60..4)）→ byPid['1'] に label '初出場' と '5 CAPS' が各1つ・date が1件目/5件目の日付、type 'club'・cat 'caps'；同日重複 md は1キャップ；D.md 空なら caps バッジ 0（test_badges の既存期待と両立）。(5) T.match — cal 2件（evId 付き md と evId 無し旧 md）で見出しに 'vs A大' と旧 md は日付のみ、サマリーに 'CAPS' 相当の出場数、'new Chart' を含まない（HTML バーのみ）、_grCache 投入後の再描画で 'mt-g-<id>' に '7.1km'、range chip 'season'/'all' の切替で件数が変わる。(6) showMatchResult — HTML に 'FULL TIME'・ghost-num に num・'STARTING XV'／reserve なら 'FINISHER'、caps===1 で 'FIRST CAP' と pbFlash 呼出（document.body.appendChild をスタブして .pb-flash を捕捉）、mdHia(rec) で注意文言、戻りボタンが go('match')。(7) doMatch 成功後に showSub が backTab 'match' で呼ばれる（showSub をラップして引数を記録）。
- 【新規】dev/test_matchday_p5_coach.js（coach）: (1) approved:false の未resolved怪我が injuryStatusMaps/rtpBuckets(out 数)/renderHomeView KPI('現在の怪我')/renderInjuryView 一覧/renderPlayerReport 現在の怪我/renderPlayersView 健康バッジ/insInjury から除外され、approved:null は含まれる。(2) matchReportData — squad 3名・md 2名（1名 injured+injId→D.i approved null、1名 cramp、1名 hiaImpact+symptoms）＋メンバー外提出1名 → submitted 2、extraN 1、injN 1、injPending 1、hiaN 1、crampN 1、rpeBuckets、avgLoad、recovery[0] は D.f（daysAgo 相対で ev.date+1）の soreness 平均・n。(3) insMatch — 前戦が 7日以内なら '前戦' 項目・hiaN>0 で lv 'bad'、8日前なら []。insHome の出力に cat '試合' が含まれる。(4) TABS に k 'match' があり render() で curTab='match' のとき #main に 'SQUAD' と '#1' と '未提出' と 'RECOVERY' が出る、Chart 生成数が増えない（Chart をカウントするスタブ）。(5) renderHomeView に 'LAST MATCH' と 'NEXT MATCH'（次戦の squad から出場可 n 名）、cal 空なら出ない（test_p8e_coach の前提維持）。(6) renderConditionView — cal に daysAgo(3) の match があると charts.cond.config.data.datasets[0].pointRadius が配列で該当 index が 6・他は 3、無ければ配列に 6 が無い。(7) renderPlayerReport — md 3件で '試合履歴' カードと出場/スタート/合計出場、injEvidence({injDetail:{scene:'公式戦'}}).scene==='公式戦' と rows に '場面'、inj.source==='match' で '試合で受傷' チップ。
- 【新規】dev/test_matchday_p5_trainer.js（trainer）: (1) SK.md==='rm_matchday' かつ Array.isArray(D.md)。(2) matchCareList — HIA疑い(rank0)→怪我報告 approved null(rank1・'スタッフ承認待ち')→攣り(rank2)→soreness 4(rank3) の順、canPractice '参加できない' で '来週参加不可' を含む、approved true の怪我行だけ 'goRehabPlayer(' を含む。(3) T.home — ev が daysAgo(1) なら 'MATCH CARE' カードが '今日のテーピング' より前に出る、daysAgo(4) なら出ない、承認待ち怪我は '担当リハビリ選手' 側には出ない（1465 の既存フィルタ維持＝'現在怪我人はいません'）。(4) T.tape/T.home — tapeslot type 'match' の行に '試合前' と var(--maroon) 左ボーダー、'practice' には無い。(5) showTapeSetupForm — cal に未来の match があると '次の試合' と tsUseMatch、tsUseMatch 後に ts-type.value==='match'。(6) renderChartDiagnosis — inj.source 'match' かつ scene 未設定で '公式戦' option に selected、scene '練習' 保存済みなら '練習' が selected（既定で上書きしない）。
- 【新規】dev/test_matchday_csv_staff.js（staff）: Blob/URL/createElement('a').click をスタブし exportCSV('matchday',41) の出力を捕捉。(1) csvCell — null→'""'、'a"b'→'"a""b"'、数値 0→'"0"'。(2) ヘッダ行が仕様の列順で '提出' 列を末尾に持つ。(3) squad 順（num 昇順）で行が並び、未提出者の行は 提出='未提出' で md 列が空、メンバー外提出者は squad の後。(4) 旧 md（fatiguePre/Post・sleepTime/wakeTime・role 'スタート'）が mdFatigueStr/mdSleepStr/'スタート' で出力され、&amp; 等の HTML エンティティが含まれない。(5) 怪我承認列が injId→D.i の approved で '承認待ち'/'承認'/'却下'。(6) _grCache 投入済みなら 出場分 に GPS 値とソース 'GPS'、未投入なら空。(7) exportMatchdayCSV(41) は mdSessLoad 完了後に exportCSV を呼ぶ（呼出回数 1）。(8) evId 省略時は全試合＋旧 md の疑似イベント群が含まれ、fname が '全試合' を含む。
- 【既存テストへの影響】dev/test_mstat.js:113（ms索引に kind 無し）＝維持（evId は別フィールド）／dev/test_gps.js gpsCommit 期待値＝evId 未指定 meta では 'evId' キーを付けないので不変／dev/test_badges.js・test_badge_ui_*.js＝D.md 空で不変／dev/test_dash.js 74-88＝P1 M3 の改修対象（本フェーズでは触らない）／dev/test_home_p8b.js 31-38＝player ホームに未入力一覧を出さない（本フェーズは T.match/mypage のみ変更で維持）／dev/test_p8e_coach.js＝cal 空のため matchHomeCards が '' を返し不変、TABS 数のアサートがあれば 7 に更新（要確認）／dev/test_fieldmap_coach.js＝不変／dev/test_p7c_coach.js＝injEvidence にキー追加のみで不変／dev/test_dash_staff.js＝V.dash は本フェーズ未変更／dev/test_self_coach.js・test_p7d_coach.js＝renderPlayerReport は md 無しでカード非表示のため不変。全て `python3 dev/run_tests.py` で確認し、赤化したら本フェーズ側を直す（既存テストの期待値を弱めない）。

## syncManifest
- identical 追加: sessForEvent {files:[player,staff],kind:function}
- identical 追加: sessRowOf {files:[player,staff],kind:function}
- identical 追加: mdMinutesShown {files:[player,staff],kind:function}
- identical 追加: mdRoleCode {files:[player,staff,trainer,coach],kind:function}（P1a に同名があれば追加せず P1a の登録を流用）
- identical 追加: mdIsCap {files:[player,staff,coach],kind:function}
- identical 追加: matchStatsFor {files:[player,staff,coach],kind:function}
- identical 追加: mdHia {files:[player,staff,trainer,coach],kind:function}（P1a に同等があれば流用）
- identical 追加: MD_CAPS_MILESTONES {files:[player,staff],kind:var}
- identical 更新（files 拡張）: matchEvents／matchEventByDate／squadOf／squadRole／mdOf／mdRoleLabel／mdLoad／mdInjuryLive／mdSleepStr／mdFatigueStr に coach を追加、うち matchEvents／matchEventByDate／squadOf／squadRole／mdOf／mdRoleLabel／mdInjuryLive に trainer を追加（P1a で既に4ファイル登録なら変更なし）
- identical 既存（同時変更必須）: computeAllBadges {player,staff} — CAPS バッジ追加を両方に同一ソースで
- variant: renderChartDiagnosis が staff/trainer で variant 登録されている場合は scene 既定変更後に --update で md5 確定（登録が無ければ何もしない）
- chart_counts: 変更なし {player:14,staff:12,trainer:2,coach:4}（本フェーズは new Chart( を追加しない。charts.cond は既存インスタンスのオプション変更のみ）
- csvCell／mdSessLoad／matchReportData／insMatch／lastMatchEvent／nextMatchEvent／matchCareList／matchCareCardHtml／matchHomeCards／renderMatchView／showMatchResult／gpsPickEv／exportMatchdayCSV／tsUseMatch は単一サイト専用のため登録しない

## openIssues
- P1 M6 後の goMatchDateDetail の signature（date 引数のままか evId 引数か）に P3 step6/7/8/25 の呼出が依存する。P3 着手時に P1 の確定形へ合わせる（本設計は『ev を解決した後』の処理として書いてあるのでどちらでも成立）。
- CAPS の定義: リザーブで minutes===0（出番なし）はキャップに数えない、minutes 未入力（null）は数える、という mdIsCap の規則で仮置き。実運用で『ベンチ入りもキャップ』にしたい場合は mdIsCap 1関数の変更で済む設計にしてある。
- CAPS バッジの pts を BPTS.club（BIG3クラブと同点）で流用している。STD_DEFAULT.badgePts に 'caps' キーを足すと identical 3ファイル＋staff の基準設定 UI（V.standards 8948）にも波及するため本フェーズでは避けた。ポイント設計は凛人の判断待ち（0 にする案は '+0' 表示になる）。
- 『今季』の定義を暦年（date の先頭4桁＝今年）で仮置き。年度（4月〜翌3月）やシーズン開始日（cal の最初の試合）にしたい場合は T.match の range 判定1箇所を変える。
- coach の試合レポートは『試合タブ』＋『概況の前戦/次戦カード』＋insMatch の3点セットで設計した（タスク文の or に対し両方採用）。概況カードを削って軽くする選択は step18 の削除だけで可能。
- trainer が md を購読することで試合当夜の再描画が増える。isInputting/_subViewActive ガードがあるため入力破壊は起きないが、体感で気になる場合は SK から外し『要ケアカード』を staff の ann（kind:'md-remind' と同様の通知）経由に切り替える代替案がある。
- GPS/ms の同 pid 複数行（前後半で別行など）は min/dist/hsr 合算・max 最大で結合する仮定。取込データが1選手1行なら影響なし。
- exportCSV の GPS 列はキャッシュ経由（CSV 画面の全件出力ではロード済み分のみ）。全件で GPS を必ず埋めたい場合は exportMatchdayCSV を全 ev 走査版に拡張する（本フェーズでは試合単位のみ非同期ラッパ）。
- showMatchResult の HIA 注意文言は P1 の doMatch が同文言を toast/alert で出している可能性がある→P4 実装時に P1 の出力を確認し FULL TIME 画面へ一本化する。
- coach TABS に 'match' を足すことで dev/test_p8e_coach.js 等にタブ数の固定アサートがあれば更新が必要（実行して確認）。

## estimate
P3（step1-8＋test_matchday_p3_staff）0.5〜1日／P4（step9-15＋test_matchday_p4_player・test_badges 再実行）1日／P5-coach（step16-21＋test_matchday_p5_coach）1日／P5-trainer（step22-24＋test_matchday_p5_trainer）0.5日／P5-CSV＋同期・全緑化（step25-26＋test_matchday_csv_staff）0.5日 ＝ 合計 3.5〜4日（1ステップごとに extract→jsc 構文チェック→模擬実行→sync_check の手順を含む）