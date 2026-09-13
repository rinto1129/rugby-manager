// ウエイトグループ分けv2 フェーズ1: 共通ヘルパー基盤の契約テスト
//   liftKeyOf/wgNorm/wgDayShift/tgLiftWeights/WG_DAYS（player/staff identical）・posUnit（player/staff/coach identical）
//   ＋#11 estBase名前補完の配線: bestE1rmPerBase（player/staff）・startTrainingFresh/addTrainingEx/finishTraining（player）・
//     メニュー編集の推定元ヒント/詳細表示（staff）・insPhysicalのFW/BK平均（coach・posUnit経由）
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_tgroup_helpers.js
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup_helpers.js
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_tgroup_helpers.js
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function has(s,t){return String(s).indexOf(t)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
drain(); // 起動時のld()チェーンを流しきる（後のdrainで画面やDが上書きされるのを防ぐ）
var SITE=(typeof showSub==='function')?'player':(typeof pushView==='function')?'staff':'coach';
print('site='+SITE);

// ============ 1. posUnit（3サイト共通） ============
print('--- posUnit ---');
['PR','HO','LO','FL','No.8'].forEach(function(p){ok('FW: '+p,posUnit(p)==='FW');});
['SH','SO','CTB','WTB','FB'].forEach(function(p){ok('BK: '+p,posUnit(p)==='BK');});
ok('null/undefined/空→null',posUnit(null)===null&&posUnit(undefined)===null&&posUnit('')===null);
ok('未知・表記ゆれは推測しない(No8/pr)',posUnit('No8')===null&&posUnit('pr')===null);
if(typeof POS!=='undefined')ok('POS全10ポジションがFW5/BK5に分かれる',POS.filter(function(p){return posUnit(p)==='FW';}).length===5&&POS.filter(function(p){return posUnit(p)==='BK';}).length===5);

if(SITE==='coach'){
  print('--- coach: insPhysicalのFW/BK平均（posUnit経由で従来と同値） ---');
  D.p=[{id:1,name:'a',position:'PR'},{id:2,name:'b',position:'No.8'},{id:3,name:'c',position:'SH'},{id:4,name:'d',position:'FB'},{id:5,name:'e',position:''}];
  D.ph=[{id:11,pid:1,date:daysAgo(10),squat:200,bench:140,deadlift:240},{id:12,pid:2,date:daysAgo(10),squat:180,bench:120,deadlift:220},
        {id:13,pid:3,date:daysAgo(10),squat:140,bench:100,deadlift:180},{id:14,pid:4,date:daysAgo(10),squat:150,bench:100,deadlift:190},
        {id:15,pid:5,date:daysAgo(10),squat:300,bench:300,deadlift:300}];
  var ins=insPhysical();
  var fwbk=ins.filter(function(x){return has(x.t,'BIG3平均: FW');})[0];
  ok('FW平均550(=(580+520)/2)・BK平均430(=(420+440)/2)・ポジション未設定は除外',fwbk&&has(fwbk.t,'FW 550kg')&&has(fwbk.t,'BK 430kg'));
}

if(SITE!=='coach'){
  // ============ 2. liftKeyOf ============
  print('--- liftKeyOf: estBase明示が最優先 ---');
  ok('明示bench（名前が変種でも）',liftKeyOf('インクラインベンチプレス','bench')==='bench');
  ok('明示squat（名前無関係）',liftKeyOf('ヒップスラスト','squat')==='squat');
  ok('明示deadlift（名前null）',liftKeyOf(null,'deadlift')==='deadlift');
  ok('BIG3以外の明示値→null（名前推定しない）',liftKeyOf('スクワット','chinning')===null);
  ok('空文字estBaseは未設定扱い→名前推定',liftKeyOf('スクワット','')==='squat');
  ok('メモ化後も明示estBaseが勝つ',liftKeyOf('フロントスクワット',null)===null&&liftKeyOf('フロントスクワット','squat')==='squat'&&liftKeyOf('フロントスクワット',null)===null);

  print('--- liftKeyOf: 本番の種目名（texlist/tmenu/tlog 2026-09-13時点） ---');
  [
    ['ベンチプレス','bench'],['ベンチプレス(スピード)','bench'],['インクラインベンチプレス',null],
    ['スクワット','squat'],['スクワット(スピード)','squat'],['バックスクワット','squat'],
    ['フロントスクワット',null],['ドロップスクワット',null],['ドロップスプリットスクワット',null],['ブルガリアンスクワット',null],
    ['ダンベルブルガリアンスクワット',null],['ダンベルジャンプスクワット',null],
    ['デットリフト','deadlift'],['デットリフト(スピード)','deadlift'],['ノーマルデッドリフト','deadlift'],
    ['ルーマニアンデットリフト',null],['ルーマニアンデッドリフト',null],['ルーマニアんデッドリフト',null],
    ['プッシュプレス',null],['ダンベルプッシュプレス',null],['チンニング(スピード)',null],['チンニング(ラットプル)',null],['ダンベルプレス',null],
    ['インクラインダンベルプレス',null],['レッグプレス',null],['ミリタリープレス',null],['ハイプル',null],['ミットサイプル',null],
    ['ベントオーバーロウ(プルのみ)',null],['ランジ',null],['ランジウォーク',null],['ノルディックハム',null],['レッグエクステンション（マシン）',null]
  ].forEach(function(c){ok(c[0]+' → '+c[1],liftKeyOf(c[0],null)===c[1]);});

  print('--- liftKeyOf: 表記ゆれ・誤検出ガード ---');
  [
    ['ｽｸﾜｯﾄ','squat'],['　スクワット 　','squat'],['ベンチ プレス','bench'],['ベンチ(スピード)','bench'],['スピードベンチ','bench'],
    ['デッド(スピード)','deadlift'],['スピードデッド','deadlift'],['デッドリフト（スピード）','deadlift'],
    ['Back Squat','squat'],['Bench Press','bench'],['DEADLIFT','deadlift'],['BP','bench'],['sq','squat'],['ＤＬ','deadlift'],
    ['ベンチディップス',null],['ベンチステップアップ',null],['デッドバグ',null],['デッドハング',null],
    ['DBベンチプレス',null],['スミスマシンスクワット',null],['マシンベンチプレス',null],['トラップバーデッドリフト',null],['スモウデッドリフト',null],
    ['ハーフスクワット',null],['エアスクワット',null],['自重スクワット',null],['ゴブレットスクワット',null],['片脚デッドリフト',null],
    ['シングルレッグRDL',null],['Romanian Deadlift',null],['Front Squat',null],['Incline Bench Press',null],['ボックススクワット',null],
    ['オーバーヘッドスクワット',null],['ジャンプスクワット',null],['スクワットジャンプ',null],['ラックデッドリフト',null],
    ['ベンチプレス(シングル)','bench'],['ナローベンチプレス','bench'],['ポーズスクワット','squat'],['デフィシットデッドリフト','deadlift'],
    ['',null],[null,null],[undefined,null]
  ].forEach(function(c){ok(String(c[0])+' → '+c[1],liftKeyOf(c[0],null)===c[1]);});

  // ============ 3. WG_DAYS / wgNorm / wgDayShift ============
  print('--- WG_DAYS ---');
  ok('対象曜日=月火木',WG_DAYS.map(function(d){return d.k;}).join(',')==='mon,tue,thu');

  print('--- wgNorm: 未回答・旧形式・v2 ---');
  ok('undefined/null→null',wgNorm(undefined)===null&&wgNorm(null)===null);
  ok('非オブジェクト→null',wgNorm('am')===null&&wgNorm(1)===null);
  var L=wgNorm({f5:['mon','thu'],far:true,pref:'pm',upd:'2026-07-01T00:00:00.000Z'});
  ok('旧: v=2に正規化',L.v===2);
  ok('旧: 5限の曜日(月木)→午前のみ(am)',L.days.mon==='am'&&L.days.thu==='am');
  ok('旧: 5限なし(火)→どちらでも("")',L.days.tue==='');
  ok('旧: far/pref/upd維持',L.far===true&&L.pref==='pm'&&L.upd==='2026-07-01T00:00:00.000Z');
  ok('旧: legacy=true（旧形式・要更新バッジ用）',L.legacy===true);
  var Wd=wgNorm({f5:['mon','wed','fri'],far:false,pref:null});
  ok('旧(月水金時代): 水金は破棄・月だけam・曜日キーは3つ',Wd.days.mon==='am'&&Wd.days.tue===''&&Wd.days.thu===''&&Object.keys(Wd.days).length===3);
  var Ex=wgNorm({f5:[],far:false,pref:'x'});
  ok('旧: 5限なし→全曜日どちらでも・不正prefはnull',Ex.days.mon===''&&Ex.days.tue===''&&Ex.days.thu===''&&Ex.pref===null&&Ex.legacy===true);
  ok('旧: f5欠落({})でも落ちない',wgNorm({}).legacy===true&&wgNorm({}).days.mon===''&&wgNorm({}).far===false&&wgNorm({}).upd===null);
  var V2=wgNorm({v:2,days:{mon:'pm',tue:'am',thu:''},far:false,pref:null,upd:'2026-09-13T00:00:00.000Z'});
  ok('v2: 曜日値そのまま',V2.days.mon==='pm'&&V2.days.tue==='am'&&V2.days.thu==='');
  ok('v2: legacy=false',V2.legacy===false);
  var J=wgNorm({v:2,days:{mon:'x',thu:'pm'},far:1,f5:['tue']});
  ok('v2: 不正値/欠落は""・farは真偽値化・v2ではf5を読まない',J.days.mon===''&&J.days.tue===''&&J.days.thu==='pm'&&J.far===true);
  ok('v2: days欠落でも落ちない',wgNorm({v:2}).days.tue===''&&wgNorm({v:2}).legacy===false);
  ok('冪等: wgNorm(wgNorm(旧))',JSON.stringify(wgNorm(L))===JSON.stringify(L));
  ok('冪等: wgNorm(wgNorm(v2))',JSON.stringify(wgNorm(V2))===JSON.stringify(V2));
  var rawWg={f5:['tue'],far:false,pref:null};var rawBefore=JSON.stringify(rawWg);
  var nw=wgNorm(rawWg);nw.days.tue='pm';
  ok('入力を変更しない・戻り値は独立したオブジェクト',JSON.stringify(rawWg)===rawBefore&&wgNorm(rawWg).days.tue==='am');

  print('--- wgDayShift ---');
  ok('旧: 火5限→tue=am',wgDayShift(rawWg,'tue')==='am');
  ok('旧: mon=""',wgDayShift(rawWg,'mon')==='');
  ok('v2: mon=pm',wgDayShift({v:2,days:{mon:'pm'}},'mon')==='pm');
  ok('未回答→""',wgDayShift(null,'mon')==='');
  ok('対象外曜日→""',wgDayShift({v:2,days:{mon:'am'}},'wed')==='');
  ok('wgNorm済みを渡しても同じ',wgDayShift(V2,'tue')==='am'&&wgDayShift(L,'thu')==='am');

  print('--- tgLiftTxt / tgDayLabel ---');
  ok('tgLiftTxt: 記録なしの種目は—',tgLiftTxt({bench:80,squat:null,deadlift:140})==='BP80 SQ— DL140'&&tgLiftTxt(null)==='BP— SQ— DL—'&&tgLiftTxt({bench:77.5,squat:0,deadlift:null})==='BP77.5 SQ0 DL—');
  ok('tgDayLabel: 月火木・対象外はそのまま',tgDayLabel('mon')==='月'&&tgDayLabel('thu')==='木'&&tgDayLabel('wed')==='wed');

  // ============ 4. tgLiftWeights ============
  print('--- tgLiftWeights: 直近60日・その種目を含む最新セッションの最高セット重量 ---');
  ok('TG_LIFT_DAYS=60（2026-09-13改訂）',TG_LIFT_DAYS===60);
  D.tlog=[
    // pid1: 最新チーム(1日前)=BP/SQ・3日前チーム=DL+BP（BPは1日前が優先）・当日の自主BP100はチーム優先で使わない
    {id:'a1',pid:1,menuId:10,date:daysAgo(1),ts:'2026-09-01T10:00:00.000Z',results:[
      {exName:'ベンチプレス(スピード)',estBase:'bench',sets:[{weight:60,reps:3},{weight:62.5,reps:3}]},
      {exName:'スクワット(スピード)',sets:[{weight:100,reps:3},{weight:105,reps:3}]},
      {exName:'フロントスクワット',sets:[{weight:150,reps:3}]},
      {exName:'プッシュプレス',sets:[{weight:70,reps:5}]}]},
    {id:'a2',pid:1,menuId:11,date:daysAgo(3),ts:'2026-09-01T10:00:00.000Z',results:[
      {exName:'デットリフト(スピード)',sets:[{weight:140,reps:2},{weight:'145',reps:'2'}]},
      {exName:'ベンチプレス',estBase:'bench',sets:[{weight:80,reps:3}]}]},
    {id:'a3',pid:1,menuId:null,kind:'self',date:daysAgo(0),ts:'2026-09-01T10:00:00.000Z',results:[
      {exName:'ベンチプレス',estBase:'bench',sets:[{weight:100,reps:1}]}]},
    // pid2: SQは自主のみ→フォールバック / skipped・欠席・0回・空重量・60日超は無視
    {id:'b1',pid:2,menuId:null,kind:'self',date:daysAgo(2),ts:'2026-09-01T10:00:00.000Z',results:[{exName:'バックスクワット',sets:[{weight:120,reps:5}]}]},
    {id:'b2',pid:2,menuId:10,date:daysAgo(1),ts:'2026-09-01T10:00:00.000Z',results:[
      {exName:'ベンチプレス(スピード)',estBase:'bench',skipped:true,sets:[{weight:90,reps:3}]},
      {exName:'デットリフト(スピード)',sets:[{weight:160,reps:0},{weight:'',reps:3}]}]},
    {id:'b3',pid:2,menuId:10,date:daysAgo(0),absent:true,results:[{exName:'ベンチプレス(スピード)',estBase:'bench',sets:[{weight:95,reps:3}]}]},
    {id:'b4',pid:2,menuId:10,date:daysAgo(61),ts:'2026-09-01T10:00:00.000Z',results:[{exName:'ベンチプレス(スピード)',estBase:'bench',sets:[{weight:85,reps:3}]}]},
    // pid3: 同日2セッション→tsが新しい方 / 文字列pid / 同セッション内の複数BP種目は最大
    {id:'c1',pid:3,menuId:10,date:daysAgo(2),ts:'2026-09-01T08:00:00.000Z',results:[{exName:'スクワット',sets:[{weight:90,reps:5}]}]},
    {id:'c2',pid:3,menuId:10,date:daysAgo(2),ts:'2026-09-01T18:00:00.000Z',results:[{exName:'スクワット',sets:[{weight:95,reps:5}]}]},
    {id:'c3',pid:'3',menuId:10,date:daysAgo(4),ts:'2026-09-01T10:00:00.000Z',results:[
      {exName:'ベンチプレス',sets:[{weight:70,reps:5}]},{exName:'ベンチプレス(スピード)',estBase:'bench',sets:[{weight:75,reps:3}]}]},
    // pid4: 40日前（アーカイブ相当）の記録も60日窓なので使う
    {id:'d1',pid:4,menuId:10,date:daysAgo(40),ts:'2026-09-01T10:00:00.000Z',results:[{exName:'ベンチプレス(スピード)',estBase:'bench',sets:[{weight:77,reps:3}]}]}
  ];
  var w1=tgLiftWeights(1);
  ok('pid1 BP=62.5（BPを含む最新チームセッション・自主は使わない）',w1.bench===62.5);
  ok('pid1 SQ=105（estBase無しでも名前補完・フロントスクワット150は数えない）',w1.squat===105);
  ok('pid1 DL=145（DLを含む最新セッション・文字列重量も数値化）',w1.deadlift===145);
  var w2=tgLiftWeights(2);
  ok('pid2 SQ=120（チームに無ければ自主から）',w2.squat===120);
  ok('pid2 BP=null（skipped/欠席/60日超は無視）',w2.bench===null);
  ok('pid4 40日前の記録も使う(77)',tgLiftWeights(4).bench===77);
  ok('pid2 DL=null（0回・空重量のセットは無視）',w2.deadlift===null);
  var w3=tgLiftWeights(3);
  ok('pid3 同日2セッション→ts新しい方(95)',w3.squat===95);
  ok('pid3 文字列pidもidEq・同セッションの複数BP種目は最大(75)',w3.bench===75);
  ok('記録無し→全null',JSON.stringify(tgLiftWeights(999))==='{"bench":null,"squat":null,"deadlift":null}');
  ok('logs引数を優先（[]→全null）',tgLiftWeights(1,[]).bench===null);
  ok('logs引数で任意の配列を渡せる',tgLiftWeights(1,[D.tlog[1]]).bench===80);
  ok('保存しない（D.tlogを変更しない）',D.tlog.length===11&&D.tlog[1].results[0].sets[1].weight==='145');

  // ============ 5. bestE1rmPerBase（#11の推定1RM記録側） ============
  print('--- bestE1rmPerBase: estBase未設定でも種目名から補完 ---');
  var bb=bestE1rmPerBase([
    {exName:'スクワット(スピード)',sets:[{weight:100,reps:3,rir:2}]},
    {exName:'デットリフト(スピード)',sets:[{weight:140,reps:2,rir:3}]},
    {exName:'フロントスクワット',sets:[{weight:200,reps:1,rir:0}]},
    {exName:'ヒップスラスト',estBase:'squat',sets:[{weight:80,reps:5,rir:2}]},
    {exName:'ベンチプレス(スピード)',estBase:'bench',skipped:true,sets:[{weight:100,reps:3,rir:0}]},
    {exName:'パワークリーン',estBase:'clean',sets:[{weight:80,reps:3,rir:2}]}
  ]);
  ok('SQ補完（名前推定と明示estBaseの最大）',bb.squat&&bb.squat.e1rm===Math.max(estimateOneRM(100,3,2),estimateOneRM(80,5,2))&&bb.squat.weight===100);
  ok('DL補完',bb.deadlift&&bb.deadlift.e1rm===estimateOneRM(140,2,3));
  ok('フロントスクワット200kgは混ざらない',bb.squat.weight!==200);
  ok('skippedは対象外',!bb.bench);
  ok('BIG3以外の明示estBaseは従来通り温存',bb.clean&&bb.clean.e1rm===estimateOneRM(80,3,2));

  // ============ 5b. 申告v2の入力部品（WG_CHOICES/wgSegHTML/wgSegPick/wgSegRead） ============
  print('--- wgSegHTML: 曜日×3択・初期選択 ---');
  ok('WG_CHOICES=午前のみ/午後のみ/どちらでも',WG_CHOICES.map(function(c){return c.v+':'+c.label;}).join(',')==='am:午前のみ,pm:午後のみ,any:どちらでも');
  var sgNone=wgSegHTML('tw',undefined);
  ok('月火木×3択のボタン',has(sgNone,'id="tw-mon-am"')&&has(sgNone,'id="tw-tue-pm"')&&has(sgNone,'id="tw-thu-any"'));
  ok('ラベル=午前のみ/午後のみ/どちらでも',has(sgNone,'>午前のみ<')&&has(sgNone,'>午後のみ<')&&has(sgNone,'>どちらでも<'));
  ok('未回答は何も選択しない（どちらでもを既定にしない）',!has(sgNone,'aria-pressed="true"')&&has(sgNone,'id="tw-mon" value=""'));
  var sgOld=wgSegHTML('tw',{f5:['tue'],far:false,pref:'pm'});
  ok('旧形式: 5限の火=午前のみ・他=どちらでもを初期選択',has(sgOld,'id="tw-tue-am" aria-pressed="true"')&&has(sgOld,'id="tw-mon-any" aria-pressed="true"')&&has(sgOld,'id="tw-thu-any" aria-pressed="true"')&&has(sgOld,'id="tw-tue" value="am"')&&has(sgOld,'id="tw-mon" value="any"'));
  var sgV2=wgSegHTML('tw',{v:2,days:{mon:'pm',tue:'',thu:'am'}});
  ok('v2: 保存値どおりに初期選択（""=どちらでも）',has(sgV2,'id="tw-mon-pm" aria-pressed="true"')&&has(sgV2,'id="tw-tue-any" aria-pressed="true"')&&has(sgV2,'id="tw-thu-am" aria-pressed="true"'));
  ok('選択は1曜日に1つだけ（計3つ）',sgV2.split('aria-pressed="true"').length-1===3);
  print('--- wgSegPick/wgSegRead ---');
  ['mon','tue','thu'].forEach(function(k){document.getElementById('tw-'+k).value='';});
  var rd0=wgSegRead('tw');
  ok('未選択→missingに曜日ラベル',rd0.missing.join('')==='月火木');
  wgSegPick('tw','mon','am');wgSegPick('tw','tue','any');
  var rd1=wgSegRead('tw');
  ok('一部未選択→missing=木のみ',rd1.missing.join('')==='木');
  ok('any→""(どちらでも)に変換',rd1.days.mon==='am'&&rd1.days.tue==='');
  wgSegPick('tw','thu','pm');wgSegPick('tw','mon','pm');
  var rd2=wgSegRead('tw');
  ok('全曜日選択→missingなし・後から変更も反映',rd2.missing.length===0&&rd2.days.mon==='pm'&&rd2.days.thu==='pm');
  ok('選んだボタンだけ強調（同じ曜日の他ボタンは解除）',__els['tw-mon-pm'].style.background==='var(--maroon)'&&__els['tw-mon-am'].style.background===''&&__els['tw-thu-pm'].style.background==='var(--maroon)');
  ok('読んだdaysはwgNormで保存形として読める',wgNorm({v:2,days:rd2.days}).days.tue===''&&wgNorm({v:2,days:rd2.days}).days.mon==='pm');
}

if(SITE==='player'){
  // ============ 6. player配線: 実施開始→種目追加→完了保存 ============
  print('--- player配線: startTrainingFresh（メニューestBase未設定→種目名補完） ---');
  myPid=1;
  D.p=[{id:1,name:'テスト選手',position:'PR',year:2,height:'180',weight:'100'}];
  D.std=[];D.offday=[];D.ann=[];D.md=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.a=[];D.e1rm=[];D.rplan=[];D.r=[];D.bc=[];D.f=[];D.tlog=[];D.chart=[];D.pp=[];D.texlist=[];D.cal=[];D.tgroup=[];
  D.ph=[{id:1,pid:1,date:daysAgo(30),squat:150}];
  _tlogArchLoaded=true;
  D.tmenu=[{id:500,name:'PULLの日',scope:'all',exercises:[
    {name:'スクワット(スピード)',sets:3,reps:3,rir:3},
    {name:'デットリフト(スピード)',sets:2,reps:2,rir:3},
    {name:'ベンチプレス(スピード)',estBase:'bench',sets:3,reps:3,rir:3},
    {name:'プッシュプレス',sets:3,reps:5,rir:2}]}];
  __store['tlog']=JSON.stringify([]);__store['e1rm']=JSON.stringify([]);__store['texlist']=JSON.stringify([]);
  __store['pp']=JSON.stringify([]);__store['tdraft']=JSON.stringify([]);__store['f']=JSON.stringify([]);
  localStorage.removeItem('rm_tdraft_1');localStorage.removeItem('rm_tdraft_1_t');
  startTrainingFresh(500);drain();
  var R=_curTLog.results;
  ok('SQ(スピード): estBase=squat補完',R[0].estBase==='squat');
  ok('SQ(スピード): ph SQ150→推定重量',R[0].oneRM===150&&R[0].estWeight===estimateWeight(150,3,3)&&R[0].estWeight>0);
  ok('SQ(スピード): 初期重量=推定重量（前回実績なし）',R[0].sets[0].weight===R[0].estWeight);
  ok('DL(スピード): estBase=deadlift補完（ph無し→1RM未登録）',R[1].estBase==='deadlift'&&!R[1].oneRM);
  ok('BP(スピード): 明示estBase温存',R[2].estBase==='bench');
  ok('プッシュプレス: 補完しない',!R[3].estBase&&!R[3].estWeight);
  var exh=__els['main'].innerHTML;
  ok('実施画面に推定重量',has(exh,'推定重量'));
  ok('実施画面にDLの1RM未登録',has(exh,'1RM未登録'));

  print('--- player配線: addTrainingEx（ラベル不一致でも種目名から補完） ---');
  document.getElementById('tr-add-ex').value='バックスクワット';
  addTrainingEx();
  var ad=_curTLog.results[_curTLog.results.length-1];
  ok('バックスクワット: estBase=squat・oneRM=ph150',ad.exName==='バックスクワット'&&ad.estBase==='squat'&&ad.oneRM===150);
  document.getElementById('tr-add-ex').value='ルーマニアンデットリフト';
  addTrainingEx();
  ok('ルーマニアンデットリフト: 補完しない',!_curTLog.results[_curTLog.results.length-1].estBase);
  document.getElementById('tr-add-ex').value='デッドリフト';
  addTrainingEx();
  ok('デッドリフト: ラベル一致の既存経路も健在',_curTLog.results[_curTLog.results.length-1].estBase==='deadlift');

  print('--- player配線: finishTraining→推定1RM自動記録がSQ/DLでも起きる ---');
  _curTLog.results.forEach(function(r){r.sets=[];});
  _curTLog.results[0].sets=[{weight:110,reps:3,rir:3,done:true}];
  _curTLog.results[1].sets=[{weight:150,reps:2,rir:3,done:true}];
  _curTLog.results[2].sets=[{weight:80,reps:3,rir:3,done:true}];
  __alerts.length=0;
  finishTraining(mkEl());drain();
  var e1=JSON.parse(__store['e1rm']);
  ok('e1rm 1件保存',e1.length===1);
  ok('e1rm: squat',e1[0]&&e1[0].values.squat&&e1[0].values.squat.e1rm===estimateOneRM(110,3,3));
  ok('e1rm: deadlift',e1[0]&&e1[0].values.deadlift&&e1[0].values.deadlift.e1rm===estimateOneRM(150,2,3));
  ok('e1rm: bench',e1[0]&&!!e1[0].values.bench);
  var tl=JSON.parse(__store['tlog']);
  ok('tlog: SQ/DL結果にestBaseが残る（staff/coachの分析も拾える）',tl.length===1&&tl[0].results[0].estBase==='squat'&&tl[0].results[1].estBase==='deadlift');
  ok('保存フローでalertなし',__alerts.length===0);
  D.tlog=tl;
  var wT=tgLiftWeights(1);
  ok('保存直後の記録からtgLiftWeights=BP80/SQ110/DL150',wT.bench===80&&wT.squat===110&&wT.deadlift===150);
}

if(SITE==='staff'){
  // ============ 7. staff: メニュー編集の推定元ヒント・詳細表示 ============
  print('--- staff: メニュー編集の推定元ヒント（#11の見える化） ---');
  _tmenuEx=[{name:'スクワット(スピード)',estBase:'',sets:'',reps:'',rir:''},{name:'プッシュプレス',estBase:'',sets:'',reps:'',rir:''},{name:'ヒップスラスト',estBase:'squat',sets:'',reps:'',rir:''}];
  var tmh=renderTMenuExList();
  ok('選択肢の既定表記=自動（種目名で判定）',has(tmh,'自動（種目名で判定）'));
  ok('ヒント要素(tm-ebh-0..2)',has(tmh,'id="tm-ebh-0"')&&has(tmh,'id="tm-ebh-2"'));
  ok('SQ(スピード)=スクワット1RMから推定＋自動判定注記',has(tmh,'スクワットの1RMから推定重量を表示（種目名から自動判定）'));
  ok('プッシュプレス=推定なし',has(tmh,'推定なし（選手が重量を手入力）'));
  ok('明示estBase(ヒップスラスト→squat)は注記なし',has(tmh,'スクワットの1RMから推定重量を表示</div>'));
  updTMenuEx(1,'name','バックスクワット');
  ok('名前入力でヒント即時更新（リスト再描画なし）',has(__els['tm-ebh-1'].innerHTML,'スクワットの1RMから推定重量を表示（種目名から自動判定）'));
  ok('入力値はモデルへ反映',_tmenuEx[1].name==='バックスクワット');
  updTMenuEx(1,'name','ブルガリアンスクワット');
  ok('変種へ変更→推定なし',has(__els['tm-ebh-1'].innerHTML,'推定なし'));
  updTMenuEx(1,'estBase','deadlift');
  ok('推定元を明示選択→注記なしで追従',has(__els['tm-ebh-1'].innerHTML,'デッドリフトの1RMから推定重量を表示')&&!has(__els['tm-ebh-1'].innerHTML,'自動判定'));
  var exRange=true;try{updTMenuEx(99,'name','x');}catch(e){exRange=false;}
  ok('範囲外indexで例外なし',exRange);

  print('--- staff: メニュー詳細の推定元表示 ---');
  D.tmenu=[{id:700,name:'PULL',scope:'all',exercises:[{name:'デットリフト(スピード)',sets:2,reps:2,rir:3},{name:'プッシュプレス',sets:3,reps:5},{name:'ベンチプレス',estBase:'bench',sets:3,reps:3}]}];
  var __pv='',__pushViewOrig=pushView;pushView=function(t,h){__pv=h;};
  goTMenuDetail(700);
  pushView=__pushViewOrig;
  ok('詳細: DL(スピード)=デッドリフトから推定（自動）',has(__pv,'デッドリフトから推定（自動）'));
  ok('詳細: 明示bench=ベンチプレスから推定（注記なし）',has(__pv,'ベンチプレスから推定</span>'));
  ok('詳細: プッシュプレス=手入力',has(__pv,'手入力'));
}

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup_helpers tests failed');}
print('\nALL TGROUP-HELPERS TESTS PASSED ('+SITE+')');
