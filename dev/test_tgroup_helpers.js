// ウエイトグループ分けv2 フェーズ1: 共通ヘルパー基盤の契約テスト（2026-09-13改訂: 申告=5限の曜日＋スタッフの曜日指定(ov)・曜日タブ表示）
//   liftKeyOf/wgNorm/wgDayShift/wgF5Txt/wgOvTxt/tgDayShifts/tgDefaultDay/tgIsDay/tgDayTabsHtml/tgLiftWeights/WG_DAYS（player/staff identical）
//   ・posUnit（player/staff/coach identical）
//   ＋#11 estBase名前補完の配線: bestE1rmPerBase（player/staff）・startTrainingFresh/addTrainingEx/finishTraining（player）・
//     メニュー編集の推定元ヒント/詳細表示（staff）・insPhysicalのFW/BK平均（coach・posUnit経由）
//   ＋player: showProfileSettings（5限の曜日チェック・遠方・希望・ovの読み取り表示）/saveMyWg（ov引き継ぎ・updateFn純粋）/マイページ要約
//   ＋staff: goEditWg（申告＋曜日の指定wgSegHTML 'ewg'）/wgSegRead/doSaveWg（upd・ovUpdの更新条件）/tgWgBadges
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_tgroup_helpers.js
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup_helpers.js
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_tgroup_helpers.js
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function has(s,t){return String(s).indexOf(t)>=0;}
function cnt(s,t){return String(s).split(t).length-1;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function J(x){return JSON.stringify(x);}
var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
drain(); // 起動時のld()チェーンを流しきる（後のdrainで画面やDが上書きされるのを防ぐ）
var SITE=(typeof showSub==='function')?'player':(typeof pushView==='function')?'staff':'coach';
print('site='+SITE);
var ISO_OLD=new Date(Date.now()-30*86400000).toISOString(),ISO_OV=new Date(Date.now()-10*86400000).toISOString();

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

  // ============ 3. WG_DAYS / wgNorm / wgDayShift / wgF5Txt / wgOvTxt ============
  print('--- WG_DAYS ---');
  ok('対象曜日=月火木',WG_DAYS.map(function(d){return d.k;}).join(',')==='mon,tue,thu');

  print('--- wgNorm: 非オブジェクト・標準形{f5,far,pref,upd} ---');
  ok('undefined/null→null',wgNorm(undefined)===null&&wgNorm(null)===null);
  ok('非オブジェクト→null',wgNorm('am')===null&&wgNorm(1)===null&&wgNorm(true)===null);
  var L=wgNorm({f5:['tue','fri'],far:true,pref:'pm',upd:ISO_OLD});
  ok('f5=火のみ（対象外の金は捨てる）',J(L.f5)==='["tue"]');
  ok('days: 5限の火=am・他は""',L.days.tue==='am'&&L.days.mon===''&&L.days.thu==='');
  ok('daysのキーは月火木の3つ',Object.keys(L.days).join(',')==='mon,tue,thu');
  ok('ov=全て""・hasOv=false・ovUpd=null',L.ov.mon===''&&L.ov.tue===''&&L.ov.thu===''&&L.hasOv===false&&L.ovUpd===null);
  ok('far/pref/upd維持・answered=true',L.far===true&&L.pref==='pm'&&L.upd===ISO_OLD&&L.answered===true);
  ok('戻り値のキー構成',Object.keys(L).sort().join(',')==='answered,days,f5,far,hasOv,ov,ovUpd,pref,upd');
  ok('旧v形は付かない（v/legacyキー無し）',!('v' in L)&&!('legacy' in L));
  var Wd=wgNorm({f5:['mon','wed','fri'],far:false,pref:null,upd:ISO_OLD});
  ok('月水金時代の回答: 水金は破棄・月だけ',J(Wd.f5)==='["mon"]'&&Wd.days.mon==='am'&&Wd.days.tue===''&&Wd.days.thu==='');
  ok('f5の並びは入力順でなく月火木順',J(wgNorm({f5:['thu','tue','mon']}).f5)==='["mon","tue","thu"]');
  var Ex=wgNorm({f5:[],far:'yes',pref:'x'});
  ok('5限なし・不正prefはnull・farは真偽値化・upd無し=未回答',Ex.f5.length===0&&Ex.days.mon===''&&Ex.pref===null&&Ex.far===true&&Ex.answered===false&&Ex.upd===null);
  ok('{}でも落ちない（全て空・未回答・指定なし）',J(wgNorm({}).f5)==='[]'&&wgNorm({}).days.tue===''&&wgNorm({}).hasOv===false&&wgNorm({}).answered===false);
  ok('f5が配列でない→空',wgNorm({f5:'tue',upd:ISO_OLD}).f5.length===0);

  print('--- wgNorm: スタッフの曜日指定(ov) ---');
  var O1=wgNorm({f5:[],ov:{tue:'pm'},ovUpd:ISO_OV});
  ok('ovだけ（upd無し）: answered=false・hasOv=true',O1.answered===false&&O1.hasOv===true);
  ok('ovだけ: days.tue=pm・ovは3曜日に正規化・ovUpd維持',O1.days.tue==='pm'&&O1.ov.tue==='pm'&&O1.ov.mon===''&&O1.ov.thu===''&&O1.ovUpd===ISO_OV&&O1.upd===null);
  var O2=wgNorm({f5:['tue'],far:false,pref:null,upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV});
  ok('5限の火に指定pm→days.tue=pm（指定が5限より優先）・f5は残る',O2.days.tue==='pm'&&J(O2.f5)==='["tue"]'&&O2.answered===true&&O2.hasOv===true);
  var O3=wgNorm({f5:['mon'],upd:ISO_OLD,ov:{mon:'x',tue:'any',thu:'am',fri:'pm'}});
  ok('ovの不正値(x/any)→""・対象外曜日は捨てる・木の指定amは残る',O3.ov.mon===''&&O3.ov.tue===''&&O3.ov.thu==='am'&&!('fri' in O3.ov)&&O3.hasOv===true&&O3.days.mon==='am'&&O3.days.thu==='am');
  ok('ovが全て""→hasOv=false',wgNorm({f5:[],ov:{mon:'',tue:'',thu:''}}).hasOv===false);
  ok('ovがオブジェクトでない→指定なし',wgNorm({f5:['tue'],ov:'pm',upd:ISO_OLD}).hasOv===false&&wgNorm({f5:['tue'],ov:'pm',upd:ISO_OLD}).days.tue==='am');

  print('--- wgNorm: 一時形式{v:2,days}（2026-09-13の曜日別3択・本番1名） ---');
  var V2a=wgNorm({v:2,days:{mon:'',tue:'',thu:'am'},far:false,pref:'pm',upd:ISO_OLD});
  ok('days.thu=am→f5=木・ov全て""',J(V2a.f5)==='["thu"]'&&V2a.ov.mon===''&&V2a.ov.tue===''&&V2a.ov.thu===''&&V2a.hasOv===false);
  ok('実効値days.thu=am・他""・far/pref/upd維持',V2a.days.thu==='am'&&V2a.days.mon===''&&V2a.far===false&&V2a.pref==='pm'&&V2a.answered===true);
  var V2b=wgNorm({v:2,days:{mon:'',tue:'pm',thu:'am'},far:false,pref:null,upd:ISO_OLD});
  ok('days.tue=pm→ov.tue=pm（hasOv=true）・f5には入らない',V2b.ov.tue==='pm'&&V2b.hasOv===true&&V2b.days.tue==='pm'&&J(V2b.f5)==='["thu"]');
  ok('一時形式: ovUpdは無い(null)',V2b.ovUpd===null);
  ok('一時形式でovが既にamならそれを優先（pmで上書きしない）',wgNorm({v:2,days:{tue:'pm'},ov:{tue:'am'}}).ov.tue==='am');
  ok('一時形式でf5があっても読まない（daysが正）',J(wgNorm({v:2,days:{mon:'am'},f5:['tue']}).f5)==='["mon"]');
  ok('v:2でもdays欠落なら標準形として読む',J(wgNorm({v:2,f5:['tue'],upd:ISO_OLD}).f5)==='["tue"]');
  ok('一時形式のdays不正値(x)は無視',wgNorm({v:2,days:{mon:'x',tue:'any'}}).days.mon===''&&wgNorm({v:2,days:{mon:'x'}}).f5.length===0);

  print('--- wgNorm: 冪等・入力不変 ---');
  [L,Wd,Ex,O1,O2,O3,V2a,V2b,wgNorm({})].forEach(function(n,i){ok('冪等#'+i+': wgNorm(wgNorm(x))がdeep-equal',J(wgNorm(n))===J(n));});
  var rawWg={f5:['tue'],far:false,pref:null,upd:ISO_OLD,ov:{tue:'pm'}};var rawBefore=J(rawWg);
  var nw=wgNorm(rawWg);nw.days.tue='am';nw.f5.push('mon');nw.ov.mon='am';
  ok('入力を変更しない・戻り値は独立したオブジェクト',J(rawWg)===rawBefore&&wgNorm(rawWg).days.tue==='pm'&&wgNorm(rawWg).f5.length===1);
  var rawV2={v:2,days:{mon:'',tue:'pm',thu:'am'}};var rawV2Before=J(rawV2);wgNorm(rawV2);
  ok('一時形式の入力も変更しない',J(rawV2)===rawV2Before);

  print('--- wgDayShift ---');
  ok('5限の火→tue=am',wgDayShift({f5:['tue'],upd:ISO_OLD},'tue')==='am');
  ok('5限なしの月→""',wgDayShift({f5:['tue'],upd:ISO_OLD},'mon')==='');
  ok('指定pmが5限より優先',wgDayShift({f5:['tue'],ov:{tue:'pm'}},'tue')==='pm');
  ok('指定だけ（未回答）でも実効値',wgDayShift({ov:{thu:'am'}},'thu')==='am');
  ok('未回答→""',wgDayShift(null,'mon')===''&&wgDayShift(undefined,'tue')==='');
  ok('対象外曜日→""',wgDayShift({f5:['mon'],ov:{mon:'am'}},'wed')==='');
  ok('一時形式',wgDayShift({v:2,days:{mon:'pm'}},'mon')==='pm');
  ok('wgNorm済みを渡しても同じ',wgDayShift(O2,'tue')==='pm'&&wgDayShift(L,'tue')==='am'&&wgDayShift(V2a,'thu')==='am');

  print('--- wgF5Txt / wgOvTxt ---');
  ok('5限 火・木',wgF5Txt(wgNorm({f5:['thu','tue'],upd:ISO_OLD}))==='5限 火・木');
  ok('5限 月',wgF5Txt(wgNorm({f5:['mon'],upd:ISO_OLD}))==='5限 月');
  ok('5限なし',wgF5Txt(wgNorm({f5:[],upd:ISO_OLD}))==='5限なし');
  ok('未回答(upd無し)は""（5限の曜日があっても）',wgF5Txt(wgNorm({f5:['tue']}))===''&&wgF5Txt(wgNorm({ov:{tue:'pm'}}))==='');
  ok('null/undefined→""',wgF5Txt(null)===''&&wgF5Txt(undefined)==='');
  ok('火は午後・木は午前',wgOvTxt(wgNorm({ov:{thu:'am',tue:'pm'}}))==='火は午後・木は午前');
  ok('月は午前',wgOvTxt(wgNorm({f5:['tue'],upd:ISO_OLD,ov:{mon:'am'}}))==='月は午前');
  ok('指定なしは""',wgOvTxt(wgNorm({f5:['tue'],upd:ISO_OLD}))===''&&wgOvTxt(wgNorm({ov:{mon:'',tue:''}}))==='');
  ok('null/undefined→""',wgOvTxt(null)===''&&wgOvTxt(undefined)==='');

  print('--- tgLiftTxt / tgDayLabel ---');
  ok('tgLiftTxt: 記録なしの種目は—',tgLiftTxt({bench:80,squat:null,deadlift:140})==='BP80 SQ— DL140'&&tgLiftTxt(null)==='BP— SQ— DL—'&&tgLiftTxt({bench:77.5,squat:0,deadlift:null})==='BP77.5 SQ0 DL—');
  ok('tgDayLabel: 月火木・対象外はそのまま',tgDayLabel('mon')==='月'&&tgDayLabel('thu')==='木'&&tgDayLabel('wed')==='wed');

  // ============ 3b. tgDayShifts（曜日の実際の班構成） ============
  print('--- tgDayShifts: 2組(am/pm)・here/away/unplaced ---');
  var SHX=[
    {key:'am',label:'午前',groups:[[1,2,3],[4,5]],guests:[{pid:7,day:'tue',gi:0},{pid:8,day:'thu',gi:null}],pool:[9]},
    {key:'pm',label:'午後',groups:[[6,7,8]],guests:[{pid:2,day:'tue',gi:0},{pid:5,day:'tue',gi:null},{pid:3,day:'thu',gi:0}],pool:[]}
  ];
  var SHX_BEFORE=J(SHX);
  var TT=tgDayShifts(SHX,'tue');
  ok('組ごとの枠(si/key/label)',TT.length===2&&TT[0].si===0&&TT[0].key==='am'&&TT[0].label==='午前'&&TT[1].si===1&&TT[1].key==='pm'&&TT[1].label==='午後');
  var a0=TT[0].groups[0],a1=TT[0].groups[1],p0=TT[1].groups[0];
  ok('午前A班 here=1,3(ホーム)+7(火のゲスト)',J(a0.here)===J([{pid:1,sli:0,guest:false},{pid:3,sli:2,guest:false},{pid:7,xi:0,guest:true}]));
  ok('午前A班 away=2（火は午後A班へ・元index sli=1）',J(a0.away)===J([{pid:2,sli:1,si:1,gi:0}]));
  ok('午前B班 here=4・away=5（火は午後・未配置=gi null）',J(a1.here)===J([{pid:4,sli:0,guest:false}])&&J(a1.away)===J([{pid:5,sli:1,si:1,gi:null}]));
  ok('午後A班 here=6,8(ホーム)+2(火のゲスト xi=0)・away=7（火は午前A班へ）',J(p0.here)===J([{pid:6,sli:0,guest:false},{pid:8,sli:2,guest:false},{pid:2,xi:0,guest:true}])&&J(p0.away)===J([{pid:7,sli:1,si:0,gi:0}]));
  ok('gi=班index',a0.gi===0&&a1.gi===1&&p0.gi===0);
  ok('unplaced: 午後の火ゲスト未配置=5(xi=1)・午前は無し',J(TT[1].unplaced)===J([{xi:1,pid:5}])&&TT[0].unplaced.length===0);
  ok('pool: コピー（別オブジェクト・同内容）',J(TT[0].pool)==='[9]'&&TT[0].pool!==SHX[0].pool&&J(TT[1].pool)==='[]');
  TT[0].pool.push(99);
  ok('poolのコピーを触っても元は変わらない',SHX[0].pool.length===1);
  var TH=tgDayShifts(SHX,'thu');
  ok('木: 午前A班 here=1,2・away=3(午後A班へ)',J(TH[0].groups[0].here.map(function(x){return x.pid;}))==='[1,2]'&&J(TH[0].groups[0].away)===J([{pid:3,sli:2,si:1,gi:0}]));
  ok('木: 午前B班は全員here',J(TH[0].groups[1].here.map(function(x){return x.pid;}))==='[4,5]'&&TH[0].groups[1].away.length===0);
  ok('木: 午前のゲスト未配置=8(xi=1)',J(TH[0].unplaced)===J([{xi:1,pid:8}]));
  ok('木: 午後A班 here=6,7+3(ゲスト xi=2)・away=8(午前・未配置)',J(TH[1].groups[0].here)===J([{pid:6,sli:0,guest:false},{pid:7,sli:1,guest:false},{pid:3,xi:2,guest:true}])&&J(TH[1].groups[0].away)===J([{pid:8,sli:2,si:0,gi:null}]));
  var TM=tgDayShifts(SHX,'mon');
  ok('月: ゲスト無し→全員here・away/unplaced無し',TM.every(function(s){return s.groups.every(function(g){return g.away.length===0&&g.here.every(function(x){return !x.guest;});})&&s.unplaced.length===0;})&&J(TM[0].groups[0].here.map(function(x){return x.pid;}))==='[1,2,3]');
  var TN=tgDayShifts(SHX,null);
  ok('day=null: 全員here（ゲスト行なし・away無し）',J(TN[0].groups[0].here)===J([{pid:1,sli:0,guest:false},{pid:2,sli:1,guest:false},{pid:3,sli:2,guest:false}])&&TN[1].groups[0].here.length===3&&TN.every(function(s){return s.groups.every(function(g){return g.away.length===0;})&&s.unplaced.length===0;}));
  ok('入力shiftsを変更しない',J(SHX)===SHX_BEFORE);
  function hereCount(T,pid){var n=0;T.forEach(function(s){s.groups.forEach(function(g){g.here.forEach(function(x){if(idEq(x.pid,pid))n++;});});});return n;}
  ok('火: 各人はどこかの班に1回だけ（2/5/7も二重に出ない）',[1,2,3,4,6,7,8].every(function(pid){return hereCount(TT,pid)===1;})&&hereCount(TT,5)===0);
  var SHD=[{key:'am',label:'午前',groups:[[1,2],[3]],guests:[{pid:1,day:'mon',gi:0}]},{key:'pm',label:'午後',groups:[[4]],guests:[]}];
  var TD=tgDayShifts(SHD,'mon');
  ok('異常データ: ゲストが自分のホーム組・同じ班→重複しない（awayにもならない）',hereCount(TD,1)===1&&J(TD[0].groups[0].here.map(function(x){return x.pid;}))==='[1,2]'&&TD[0].groups[0].away.length===0);
  // 2026-09-13改訂: ゲストは「自分のホーム組（班またはpoolにいる組）以外の組」の分だけ有効。ホーム組を指すゲスト行は無視
  // （here/away/unplacedのどこにも出さない＝異常データでも同じ人を二重に出さない）。
  function awayCount(T,pid){var n=0;T.forEach(function(s){s.groups.forEach(function(g){g.away.forEach(function(x){if(idEq(x.pid,pid))n++;});});});return n;}
  function unplacedCount(T,pid){var n=0;T.forEach(function(s){s.unplaced.forEach(function(x){if(idEq(x.pid,pid))n++;});});return n;}
  var SHD2=[{key:'am',label:'午前',groups:[[1,2],[3]],guests:[{pid:1,day:'mon',gi:1}]},{key:'pm',label:'午後',groups:[[4]],guests:[]}];
  var TD2=tgDayShifts(SHD2,'mon');
  ok('異常データ: ゲストが自分のホーム組の別の班→ホーム班に1回だけ（行き先班には出ない）',hereCount(TD2,1)===1&&J(TD2[0].groups[0].here)===J([{pid:1,sli:0,guest:false},{pid:2,sli:1,guest:false}])&&J(TD2[0].groups[1].here.map(function(x){return x.pid;}))==='[3]');
  ok('異常データ: ホーム組を指すゲストはawayにもunplacedにも出ない',awayCount(TD2,1)===0&&unplacedCount(TD2,1)===0);
  var SHD3=[{key:'am',label:'午前',groups:[[1,2]],guests:[{pid:2,day:'tue',gi:null}]},{key:'pm',label:'午後',groups:[[4]],guests:[]}];
  var TD3=tgDayShifts(SHD3,'tue');
  ok('異常データ: ホーム組を指す班未定ゲスト(gi:null)→unplacedに出ない・ホーム班here・awayなし',TD3[0].unplaced.length===0&&hereCount(TD3,2)===1&&awayCount(TD3,2)===0&&J(TD3[0].groups[0].here.map(function(x){return x.pid;}))==='[1,2]');
  var SHP=[
    {key:'am',label:'午前',groups:[[1]],guests:[{pid:9,day:'mon',gi:0}],pool:[9]},
    {key:'pm',label:'午後',groups:[[4]],guests:[{pid:9,day:'tue',gi:0},{pid:8,day:'tue',gi:null}],pool:[8]}
  ];
  var TP=tgDayShifts(SHP,'tue');
  ok('ホームがpoolの人(9=午前pool)のゲスト(火・午後A班)は有効→午後A班hereにゲストで出る',J(TP[1].groups[0].here)===J([{pid:4,sli:0,guest:false},{pid:9,xi:0,guest:true}])&&hereCount(TP,9)===1);
  ok('poolの人は班にいないのでawayには出ない・poolはそのまま',awayCount(TP,9)===0&&J(TP[0].pool)==='[9]');
  ok('ホームが午後poolの人(8)の午後の班未定ゲストは異常データ→unplacedに出ない',TP[1].unplaced.length===0&&unplacedCount(TP,8)===0);
  var TPm=tgDayShifts(SHP,'mon');
  ok('ホームがpoolの組(午前)を指すゲスト(9・月・午前A班)は無視→午前A班に出ない',J(TPm[0].groups[0].here.map(function(x){return x.pid;}))==='[1]'&&hereCount(TPm,9)===0&&unplacedCount(TPm,9)===0);
  ok('文字列pidと数値pidはidEqで同一視（ゲスト重複判定）',hereCount(tgDayShifts([{key:'am',label:'午前',groups:[['1']],guests:[{pid:1,day:'mon',gi:0}]}],'mon'),1)===1);
  ok('guests/pool/groups欠落・空配列でも落ちない',J(tgDayShifts([{key:'all',label:''}],'mon'))===J([{si:0,key:'all',label:'',groups:[],pool:[],unplaced:[]}])&&tgDayShifts([],'mon').length===0&&tgDayShifts(null,'mon').length===0);
  ok('guestsのnull要素は無視',tgDayShifts([{key:'am',groups:[[1]],guests:[null,{pid:1,day:'mon',gi:0}]}],'mon')[0].groups[0].here.length===1);

  print('--- tgDayShifts: 空の班・範囲外の班を指すゲストは班未定(gi:null)扱い ---');
  var SHE=[
    {key:'am',label:'午前',groups:[[1,2],[3]],guests:[]},
    {key:'pm',label:'午後',groups:[[4],[],[5]],guests:[{pid:1,day:'tue',gi:1},{pid:3,day:'tue',gi:7},{pid:2,day:'tue',gi:2}]}
  ];
  var SHE_BEFORE=J(SHE),TE=tgDayShifts(SHE,'tue');
  ok('空の班(B班)を指す1→ホームの午前A班でaway gi:null（2はC班=gi:2のまま）',J(TE[0].groups[0].away)===J([{pid:1,sli:0,si:1,gi:null},{pid:2,sli:1,si:1,gi:2}]));
  ok('範囲外(gi:7)を指す3→午前B班でaway gi:null',J(TE[0].groups[1].away)===J([{pid:3,sli:0,si:1,gi:null}]));
  ok('空の午後B班のhereは空（ゲストを出さない）・午後C班には2がゲストで出る',TE[1].groups[1].here.length===0&&TE[1].groups[1].away.length===0&&J(TE[1].groups[2].here)===J([{pid:5,sli:0,guest:false},{pid:2,xi:2,guest:true}]));
  ok('unplaced=1(xi0)・3(xi1)（空の班/範囲外）',J(TE[1].unplaced)===J([{xi:0,pid:1},{xi:1,pid:3}])&&TE[0].unplaced.length===0);
  ok('1/3はどの班のhereにも出ない・入力は変更しない（giは1/7のまま）',hereCount(TE,1)===0&&hereCount(TE,3)===0&&J(SHE)===SHE_BEFORE);
  ok('班の配列がnull→空の班と同じく班未定',J(tgDayShifts([{key:'am',groups:[[1]],guests:[]},{key:'pm',groups:[[4],null],guests:[{pid:1,day:'mon',gi:1}]}],'mon')[1].unplaced)===J([{xi:0,pid:1}]));
  ok('別の曜日（木）には空の班のゲストは出ない',tgDayShifts(SHE,'thu').every(function(s){return s.unplaced.length===0&&s.groups.every(function(g){return g.away.length===0&&g.here.every(function(x){return !x.guest;});});}));
  ok('空でない班を指すゲストは従来どおり（午後A班を指す→here）',J(tgDayShifts([{key:'am',groups:[[1]],guests:[]},{key:'pm',groups:[[4],[]],guests:[{pid:1,day:'mon',gi:0}]}],'mon')[1].groups[0].here)===J([{pid:4,sli:0,guest:false},{pid:1,xi:0,guest:true}]));

  // ============ 3c. tgDefaultDay / tgIsDay / tgDayTabsHtml ============
  print('--- tgDefaultDay / tgIsDay / tgDayTabsHtml ---');
  ok('月→mon',tgDefaultDay(new Date(2026,8,14))==='mon');
  ok('火→tue',tgDefaultDay(new Date(2026,8,15))==='tue');
  ok('水→thu',tgDefaultDay(new Date(2026,8,16))==='thu');
  ok('木→thu',tgDefaultDay(new Date(2026,8,17))==='thu');
  ok('金/土/日→mon',tgDefaultDay(new Date(2026,8,18))==='mon'&&tgDefaultDay(new Date(2026,8,19))==='mon'&&tgDefaultDay(new Date(2026,8,20))==='mon');
  ok('引数省略でも月火木のどれか',tgIsDay(tgDefaultDay()));
  ok('tgIsDay',tgIsDay('mon')&&tgIsDay('tue')&&tgIsDay('thu')&&!tgIsDay('wed')&&!tgIsDay('')&&!tgIsDay(null)&&!tgIsDay(undefined));
  var tabs=tgDayTabsHtml('tue','agSetDay');
  ok('ボタン3つ（月/火/木）',cnt(tabs,'<button')===3&&has(tabs,'>月</button>')&&has(tabs,'>火</button>')&&has(tabs,'>木</button>'));
  ok('選択中(火)だけaria-pressed="true"',cnt(tabs,'aria-pressed="true"')===1&&cnt(tabs,'aria-pressed="false"')===2&&has(tabs,'aria-pressed="true" onclick="agSetDay(\'tue\')"'));
  ok('onclick=fn(曜日キー)',has(tabs,'onclick="agSetDay(\'mon\')"')&&has(tabs,'onclick="agSetDay(\'thu\')"'));
  ok('関数名は引数どおり（tgSetDay）',cnt(tgDayTabsHtml('mon','tgSetDay'),'tgSetDay(')===3&&has(tgDayTabsHtml('mon','tgSetDay'),'aria-pressed="true" onclick="tgSetDay(\'mon\')"'));
  ok('生hex/rgba無し（トークンのみ）',!/#[0-9a-fA-F]{3,6}\b|rgba?\(/.test(tabs));
  ok('未知の曜日→どれも選択されない',cnt(tgDayTabsHtml('wed','f'),'aria-pressed="true"')===0);

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

  // ============ 6b. player: showProfileSettings（5限の曜日チェック＋遠方＋希望・ovは読み取り表示のみ） ============
  print('--- showProfileSettings: 未回答 ---');
  D.p[0].wg=undefined;subView=null;
  showProfileSettings();
  var ps0=__els['main'].innerHTML;
  ok('5限の曜日チェック wg-mon/tue/thu（未checked）',has(ps0,'id="wg-mon">')&&has(ps0,'id="wg-tue">')&&has(ps0,'id="wg-thu">')&&!has(ps0,'id="wg-mon" checked')&&!has(ps0,' checked'));
  ok('見出し「月・火・木で5限がある曜日」',has(ps0,'月・火・木で5限がある曜日'));
  ok('遠方チェック wg-far・希望セレクト wg-pref（どちらでも/午前がいい/午後がいい）',has(ps0,'id="wg-far">')&&has(ps0,'id="wg-pref"')&&has(ps0,'>どちらでも<')&&has(ps0,'>午前がいい<')&&has(ps0,'>午後がいい<'));
  ok('曜日別3択ボタン(wg-mon-am等)は出さない',!has(ps0,'id="wg-mon-am"')&&!has(ps0,'id="wg-tue-pm"')&&!has(ps0,'id="wg-thu-any"')&&!has(ps0,'wgSegPick(')&&!has(ps0,'午前のみ')&&!has(ps0,'午後のみ'));
  ok('ovが無ければ「スタッフの設定」は出ない',!has(ps0,'スタッフの設定'));
  ok('保存ボタン saveMyWg(this)・subView=true',has(ps0,'saveMyWg(this)')&&subView===true);
  ok('旧形式の注意（要更新/前の形式）は出さない',!has(ps0,'前の形式')&&!has(ps0,'要更新'));

  print('--- showProfileSettings: 回答済み（5限 火／遠方／午後希望） ---');
  D.p[0].wg={f5:['tue'],far:true,pref:'pm',upd:ISO_OLD};subView=null;
  showProfileSettings();
  var ps1=__els['main'].innerHTML;
  ok('火だけchecked',has(ps1,'id="wg-tue" checked')&&!has(ps1,'id="wg-mon" checked')&&!has(ps1,'id="wg-thu" checked'));
  ok('遠方checked',has(ps1,'id="wg-far" checked'));
  ok('希望pmがselected',has(ps1,'value="pm" selected')&&!has(ps1,'value="am" selected'));
  ok('ovが無ければ「スタッフの設定」は出ない',!has(ps1,'スタッフの設定'));

  print('--- showProfileSettings: スタッフの曜日指定あり（読み取り表示） ---');
  D.p[0].wg={f5:['tue','thu'],far:false,pref:null,upd:ISO_OLD,ov:{thu:'pm'},ovUpd:ISO_OV};subView=null;
  showProfileSettings();
  var ps2=__els['main'].innerHTML;
  ok('火・木checked',has(ps2,'id="wg-tue" checked')&&has(ps2,'id="wg-thu" checked')&&!has(ps2,'id="wg-mon" checked'));
  ok('「スタッフの設定」＋wgOvTxt（木は午後）',has(ps2,'スタッフの設定')&&has(ps2,'木は午後'));
  ok('指定は編集部品にしない（ewg/wgSegPick無し）',!has(ps2,'wgSegPick(')&&!has(ps2,'id="wg-thu-pm"'));
  ok('一時形式(v:2)でも「スタッフの設定」が出る',(function(){D.p[0].wg={v:2,days:{mon:'',tue:'pm',thu:'am'},far:false,pref:null,upd:ISO_OLD};subView=null;showProfileSettings();var h=__els['main'].innerHTML;return has(h,'スタッフの設定')&&has(h,'火は午後')&&has(h,'id="wg-thu" checked')&&!has(h,'id="wg-tue" checked');})());

  // ============ 6c. player: saveMyWg（{f5,far,pref,upd}・ov/ovUpdはサーバー最新から引き継ぐ・updateFn純粋） ============
  print('--- saveMyWg: updateFnの契約（svSafeUpdate捕捉） ---');
  function setWgForm(f5,far,pref){WG_DAYS.forEach(function(d){document.getElementById('wg-'+d.k).checked=f5.indexOf(d.k)>=0;});document.getElementById('wg-far').checked=far;document.getElementById('wg-pref').value=pref;}
  var __origSSU=svSafeUpdate,__cap=null;
  svSafeUpdate=function(k,fn,okCb,errCb){__cap={k:k,fn:fn,okCb:okCb,errCb:errCb};};
  setWgForm(['mon','thu'],false,'am');
  var btn0=mkEl();btn0.innerHTML='時間帯を保存';
  saveMyWg(btn0);
  ok('svSafeUpdate("p")を呼ぶ・ボタンは二重送信ガード中',__cap&&__cap.k==='p'&&btn0.dataset.busy==='1'&&btn0.disabled===true);
  var LAT=function(wg){return [{id:1,name:'テスト選手',position:'PR',height:'180',wg:wg},{id:2,name:'他',position:'LO'}];};
  var r1=__cap.fn(LAT({f5:['tue'],far:true,pref:'pm',upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV}));
  var w1s=r1.find(function(x){return x.id===1;}).wg;
  ok('保存形は{f5,far,pref,upd}＋引き継いだov/ovUpd（キー構成）',Object.keys(w1s).sort().join(',')==='f5,far,ov,ovUpd,pref,upd');
  ok('f5=月・木（画面のチェック）・far=false・pref=am',J(w1s.f5)==='["mon","thu"]'&&w1s.far===false&&w1s.pref==='am');
  ok('updは新しいISO（サーバーの旧updではない）',typeof w1s.upd==='string'&&w1s.upd!==ISO_OLD&&!isNaN(Date.parse(w1s.upd)));
  ok('サーバー最新のov(火:pm)/ovUpdを引き継ぐ（3曜日に正規化）',J(w1s.ov)===J({mon:'',tue:'pm',thu:''})&&w1s.ovUpd===ISO_OV);
  ok('v/days/legacyは書かない',!('v' in w1s)&&!('days' in w1s)&&!('legacy' in w1s));
  ok('他選手・他フィールド不変',!r1.find(function(x){return x.id===2;}).wg&&r1[0].name==='テスト選手'&&r1[0].height==='180');
  var r1b=__cap.fn(JSON.parse(J(r1)));
  ok('updateFnを2回適用しても同じ結果（純粋・再実行可）',J(r1b)===J(r1));
  var r2=__cap.fn(LAT({v:2,days:{mon:'',tue:'pm',thu:'am'},far:false,pref:null,upd:ISO_OLD}));
  var w2s=r2.find(function(x){return x.id===1;}).wg;
  ok('サーバー最新が一時形式(days.tue=pm)→ov.tue=pmとして引き継ぐ・ovUpdはnull','ov' in w2s&&w2s.ov.tue==='pm'&&w2s.ov.mon===''&&w2s.ovUpd===null&&J(w2s.f5)==='["mon","thu"]');
  var r3=__cap.fn(LAT({f5:['tue'],far:true,pref:'pm',upd:ISO_OLD}));
  var w3s=r3.find(function(x){return x.id===1;}).wg;
  ok('サーバー最新にovが無ければov/ovUpdキーを書かない',!('ov' in w3s)&&!('ovUpd' in w3s)&&J(w3s.f5)==='["mon","thu"]');
  var r4=__cap.fn(LAT({f5:[],ov:{mon:'',tue:'',thu:''},ovUpd:ISO_OV}));
  ok('ovが全て""（hasOv=false）なら引き継がない',!('ov' in r4[0].wg)&&!('ovUpd' in r4[0].wg));
  var r5=__cap.fn(LAT(undefined));
  ok('サーバー最新が未回答でも保存できる',r5[0].wg&&J(r5[0].wg.f5)==='["mon","thu"]'&&!('ov' in r5[0].wg));
  ok('自分がlatestに居なければ何もしない',J(__cap.fn([{id:2,name:'他'}]))===J([{id:2,name:'他'}]));
  ok('希望「どちらでも」→pref=null',(function(){setWgForm([],false,'');saveMyWg();var r=__cap.fn(LAT(undefined));return r[0].wg.pref===null&&r[0].wg.f5.length===0;})());
  print('--- saveMyWg: 失敗コールバックでreleaseSubmit ---');
  svSafeUpdate=function(k,fn,okCb,errCb){if(errCb)errCb(new Error('offline'));};
  __alerts.length=0;
  var btnE=mkEl();btnE.innerHTML='時間帯を保存';
  saveMyWg(btnE);
  ok('失敗: ボタン復帰（busy解除・ラベル復元）＋alert',btnE.dataset.busy===''&&btnE.disabled===false&&btnE.innerHTML==='時間帯を保存'&&__alerts.length===1&&has(__alerts[0],'保存できませんでした'));
  svSafeUpdate=__origSSU;

  print('--- saveMyWg: 実フロー（Firestoreモック）→保存後サブ画面維持・D.p更新 ---');
  D.p[0].wg={f5:['tue'],far:true,pref:'pm',upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV};
  __store['p']=J(D.p);
  subView=null;showProfileSettings();
  setWgForm(['thu'],false,'');
  __alerts.length=0;
  saveMyWg(mkEl());drain();
  var st1=JSON.parse(__store['p']).find(function(x){return x.id===1;}).wg;
  ok('保存: f5=木・far=false・pref=null・upd更新・ov引き継ぎ',J(st1.f5)==='["thu"]'&&st1.far===false&&st1.pref===null&&st1.upd!==ISO_OLD&&st1.ov.tue==='pm'&&st1.ovUpd===ISO_OV);
  ok('D.pもメモリ更新・サブ画面維持・alertなし',D.p[0].wg.f5[0]==='thu'&&subView===true&&__alerts.length===0);

  // ============ 6d. player: マイページ要約（T.mypage） ============
  print('--- T.mypage: ウエイト時間帯の要約 ---');
  D.p[0].wg={f5:['tue'],far:false,pref:'pm',upd:ISO_OLD};subView=null;T.mypage();
  var mp1=__els['main'].innerHTML;
  ok('回答済: 5限 火／午後希望・未回答は出ない',has(mp1,'5限 火／午後希望')&&!has(mp1,'未回答'));
  ok('スタッフ設定は出ない・要更新は出ない',!has(mp1,'スタッフ設定')&&!has(mp1,'要更新'));
  D.p[0].wg={f5:[],far:true,pref:null,upd:ISO_OLD};subView=null;T.mypage();
  ok('5限なし・希望なしは「5限なし」だけ',has(__els['main'].innerHTML,'5限なし')&&!has(__els['main'].innerHTML,'希望'));
  D.p[0].wg=undefined;subView=null;T.mypage();
  ok('未回答は赤の「未回答」',has(__els['main'].innerHTML,'color:var(--red);font-weight:700">未回答'));
  D.p[0].wg={f5:['tue','thu'],far:false,pref:null,upd:ISO_OLD,ov:{thu:'pm'},ovUpd:ISO_OV};subView=null;T.mypage();
  var mp3=__els['main'].innerHTML;
  ok('指定あり: 5限 火・木 ＋ 木は午後（スタッフ設定）',has(mp3,'5限 火・木')&&has(mp3,'木は午後（スタッフ設定）'));
  D.p[0].wg={ov:{tue:'am'},ovUpd:ISO_OV};subView=null;T.mypage();
  var mp4=__els['main'].innerHTML;
  ok('指定だけ（未回答）: 未回答 ＋ 火は午前（スタッフ設定）',has(mp4,'未回答')&&has(mp4,'火は午前（スタッフ設定）'));
  ok('プロフィール設定への導線は維持',has(mp4,'showProfileSettings()'));
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

  // ============ 8. staff: 曜日の指定の入力部品（WG_CHOICES/wgSegHTML/wgSegPick/wgSegRead） ============
  print('--- wgSegHTML: 曜日×（自動/午前/午後）・現在のovを初期選択 ---');
  ok('WG_CHOICES=自動("")/午前(am)/午後(pm)',WG_CHOICES.map(function(c){return c.v+':'+c.label;}).join(',')===':自動,am:午前,pm:午後');
  var sgNone=wgSegHTML('tw',null);
  ok('月火木×3ボタン（id=pfx-曜日-auto|am|pm）',has(sgNone,'id="tw-mon-auto"')&&has(sgNone,'id="tw-tue-am"')&&has(sgNone,'id="tw-thu-pm"')&&cnt(sgNone,'<button')===9);
  ok('ラベル=自動/午前/午後（「〜のみ」「どちらでも」は無い）',has(sgNone,'>自動<')&&has(sgNone,'>午前<')&&has(sgNone,'>午後<')&&!has(sgNone,'のみ')&&!has(sgNone,'どちらでも'));
  ok('指定なし→3曜日とも「自動」が選択・hidden(pfx-ov-曜日) value=""',cnt(sgNone,'aria-pressed="true"')===3&&has(sgNone,'id="tw-mon-auto" aria-pressed="true"')&&has(sgNone,'type="hidden" id="tw-ov-mon" value=""')&&has(sgNone,'id="tw-ov-tue" value=""')&&has(sgNone,'id="tw-ov-thu" value=""'));
  ok('hiddenは旧id(pfx-曜日)を使わない（5限チェックボックスとID衝突しない）',!has(sgNone,'id="tw-mon"')&&!has(sgNone,'id="tw-tue"')&&!has(sgNone,'id="tw-thu"')&&cnt(sgNone,'type="hidden"')===3);
  ok('onclick=wgSegPick(pfx,曜日,値)',has(sgNone,'wgSegPick(\'tw\',\'tue\',\'pm\')')&&has(sgNone,'wgSegPick(\'tw\',\'mon\',\'\')'));
  var sgOv=wgSegHTML('tw',wgNorm({f5:['tue'],upd:ISO_OLD,ov:{tue:'pm',thu:'am'}}));
  ok('ov: 火=午後・木=午前・月=自動を初期選択',has(sgOv,'id="tw-tue-pm" aria-pressed="true"')&&has(sgOv,'id="tw-thu-am" aria-pressed="true"')&&has(sgOv,'id="tw-mon-auto" aria-pressed="true"')&&has(sgOv,'id="tw-ov-tue" value="pm"')&&has(sgOv,'id="tw-ov-thu" value="am"')&&has(sgOv,'id="tw-ov-mon" value=""'));
  ok('5限の火(am実効)は指定ではないので「自動」（ovだけ見る）',has(wgSegHTML('tw',wgNorm({f5:['tue'],upd:ISO_OLD})),'id="tw-tue-auto" aria-pressed="true"'));
  ok('選択は1曜日に1つだけ（計3つ）',cnt(sgOv,'aria-pressed="true"')===3);
  ok('生hex/rgba無し（トークンのみ）',!/#[0-9a-fA-F]{3,6}\b|rgba?\(/.test(sgOv));
  print('--- wgSegPick/wgSegRead ---');
  ['mon','tue','thu'].forEach(function(k){document.getElementById('tw-ov-'+k).value='';document.getElementById('tw-'+k).value='';});
  ok('全て自動→{mon:"",tue:"",thu:""}',J(wgSegRead('tw'))===J({mon:'',tue:'',thu:''}));
  wgSegPick('tw','tue','pm');wgSegPick('tw','thu','am');
  ok('選択を読む',J(wgSegRead('tw'))===J({mon:'',tue:'pm',thu:'am'}));
  ok('wgSegPickはhidden(pfx-ov-曜日)に書く・旧id(pfx-曜日)には書かない',__els['tw-ov-tue'].value==='pm'&&__els['tw-ov-thu'].value==='am'&&__els['tw-tue'].value===''&&__els['tw-thu'].value==='');
  document.getElementById('tw-mon').value='pm';
  ok('wgSegReadは旧id(pfx-曜日)を読まない',wgSegRead('tw').mon==='');
  document.getElementById('tw-mon').value='';
  ok('選んだボタンだけ強調（同じ曜日の他ボタンは解除）',__els['tw-tue-pm'].style.background==='var(--maroon)'&&__els['tw-tue-am'].style.background===''&&__els['tw-tue-auto'].style.background==='');
  wgSegPick('tw','tue','');
  ok('自動に戻す→""・強調は自動ボタンへ',wgSegRead('tw').tue===''&&__els['tw-tue-auto'].style.background==='var(--maroon)'&&__els['tw-tue-pm'].style.background==='');
  document.getElementById('tw-ov-mon').value='x';document.getElementById('tw-ov-thu').value='any';
  ok('不正値(x/any)は""',J(wgSegRead('tw'))===J({mon:'',tue:'',thu:''}));
  ok('missingは返さない（未選択の概念なし）',!('missing' in wgSegRead('tw'))&&!('days' in wgSegRead('tw')));
  ok('読んだ値はp.wg.ovとしてwgNormで読める',wgNorm({f5:[],ov:(function(){wgSegPick('tw','thu','pm');return wgSegRead('tw');})()}).days.thu==='pm');

  // ============ 9. staff: goEditWg / doSaveWg ============
  print('--- goEditWg: 申告（5限の曜日/遠方/希望）＋曜日の指定(ewg) ---');
  D.p=[{id:201,name:'代理対象',position:'PR',year:2,height:'180',wg:{f5:['thu'],far:true,pref:null,upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV}},{id:202,name:'他',position:'LO',year:3},{id:203,name:'未回答',position:'SH',year:1}];
  __store['p']=J(D.p);
  var __pvH='',__pvOrig=pushView;pushView=function(t,h){__pvH=h;};
  goEditWg(201);
  ok('5限の曜日チェック ewg-mon/tue/thu・木だけchecked',has(__pvH,'id="ewg-mon">')&&has(__pvH,'id="ewg-tue">')&&has(__pvH,'id="ewg-thu" checked')&&!has(__pvH,'id="ewg-mon" checked'));
  ok('遠方checked・希望セレクト ewg-pref（どちらでもselected）',has(__pvH,'id="ewg-far" checked')&&has(__pvH,'id="ewg-pref"')&&has(__pvH,'value="" selected'));
  ok('曜日の指定 wgSegHTML(ewg): ボタンid ewg-tue-pm等・火=午後がaria-pressed・hidden ewg-ov-tue=pm',has(__pvH,'id="ewg-tue-pm" aria-pressed="true"')&&has(__pvH,'id="ewg-mon-auto" aria-pressed="true"')&&has(__pvH,'id="ewg-thu-auto" aria-pressed="true"')&&has(__pvH,'id="ewg-tue-am"')&&has(__pvH,'id="ewg-ov-tue" value="pm"')&&has(__pvH,'id="ewg-ov-mon" value=""')&&has(__pvH,'id="ewg-ov-thu" value=""'));
  ok('ID衝突なし: id="ewg-mon"/"ewg-tue"/"ewg-thu"は各1回だけ（5限チェックボックスのみ）',cnt(__pvH,'id="ewg-mon"')===1&&cnt(__pvH,'id="ewg-tue"')===1&&cnt(__pvH,'id="ewg-thu"')===1);
  function dupIds(h){var seen={},dup=[];(String(h).match(/ id="[^"]+"/g)||[]).forEach(function(m){if(seen[m])dup.push(m);seen[m]=1;});return dup;}
  ok('ID衝突なし: 画面内の全idが一意',dupIds(__pvH).length===0);
  ok('見出し「曜日の指定（スタッフ用）」・保存ボタン doSaveWg(201,this)',has(__pvH,'曜日の指定（スタッフ用）')&&has(__pvH,'doSaveWg(201,this)'));
  ok('説明文: 午前の日・午後の日の多い方が基本の組／例: 午前がいい＋火曜を午後に指定',has(__pvH,'午前の日・午後の日の多い方が基本の組')&&has(__pvH,'午前がいい＋火曜を午後に指定'));
  ok('回答済みなので未回答の注意なし・ewg-ans無し・旧形式の注意なし・「〜のみ/どちらでも」ボタン無し',!has(__pvH,'未回答です')&&!has(__pvH,'id="ewg-ans"')&&!has(__pvH,'旧形式')&&!has(__pvH,'午前のみ')&&!has(__pvH,'id="ewg-mon-any"'));
  var noTok=function(b){var c=JSON.parse(J(b));delete c.tok;return c;};
  ok('_ewgBase=開いた時点の値{pid,tok,f5,far,pref,ov}',J(noTok(window._ewgBase))===J({pid:201,f5:['thu'],far:true,pref:null,ov:{mon:'',tue:'pm',thu:''}})&&typeof window._ewgBase.tok==='string'&&window._ewgBase.tok.length>0);
  ok('編集画面の目印: hidden ewg-tok の値=_ewgBase.tok（1回だけ）',has(__pvH,'id="ewg-tok" value="'+window._ewgBase.tok+'"')&&cnt(__pvH,'id="ewg-tok"')===1);
  goEditWg(203);
  ok('未回答の選手: 注意「未回答です（曜日の指定だけなら未回答のまま）」・checked無し・指定は全て自動',has(__pvH,'未回答です')&&has(__pvH,'曜日の指定だけなら未回答のまま')&&!has(__pvH,' checked')&&cnt(__pvH,'aria-pressed="true"')===3&&has(__pvH,'id="ewg-tue-auto" aria-pressed="true"'));
  ok('未回答の選手だけ ewg-ans「選手に聞いた回答として記録する」（未checked）',cnt(__pvH,'id="ewg-ans"')===1&&has(__pvH,'選手に聞いた回答として記録する')&&!has(__pvH,'id="ewg-ans" checked'));
  ok('未回答でもID衝突なし',dupIds(__pvH).length===0&&cnt(__pvH,'id="ewg-tue"')===1);
  var tok201=null;
  ok('_ewgBase(未回答)={pid:203,f5:[],far:false,pref:null,ov全て""}・開くたびに新しいtok',J(noTok(window._ewgBase))===J({pid:203,f5:[],far:false,pref:null,ov:{mon:'',tue:'',thu:''}})&&typeof window._ewgBase.tok==='string');
  goEditWg(999);
  ok('居ない選手は何もしない',has(__pvH,'未回答です')&&window._ewgBase.pid===203); // 直前の描画のまま
  pushView=__pvOrig;
  ok('wgSegRead("ewg")→{mon,tue,thu}',(function(){['mon','tue','thu'].forEach(function(k){document.getElementById('ewg-ov-'+k).value='';});wgSegPick('ewg','tue','pm');var r=wgSegRead('ewg');return J(r)===J({mon:'',tue:'pm',thu:''});})());

  print('--- doSaveWg: upd/ovUpdの更新条件 ---');
  // 画面の入れ替わりを再現: pushViewで描画HTMLのewg-tok（無ければ''）がDOMに入り、popViewで編集画面が消える（ewg-tok=''）
  var tokDom=function(v){document.getElementById('ewg-tok').value=v;};
  var __popOrig=popView,__toastOrig=toast,__popN=0,__toastMsg=[];popView=function(){__popN++;tokDom('');};toast=function(m){__toastMsg.push(m);};
  var __pvOrig2=pushView;pushView=function(t,h){__pvH=h;var m=/id="ewg-tok" value="([^"]*)"/.exec(h);tokDom(m?m[1]:'');};
  // フォーム値を入れる（jscのDOMモックはinnerHTMLを解釈しないので、描画された初期値もここで再現する）。hidden=ewg-ov-曜日・ans=ewg-ans
  function setEwg(f5,far,pref,ov,ans){WG_DAYS.forEach(function(d){document.getElementById('ewg-'+d.k).checked=f5.indexOf(d.k)>=0;document.getElementById('ewg-'+d.k).value='';document.getElementById('ewg-ov-'+d.k).value=ov[d.k]||'';});document.getElementById('ewg-far').checked=far;document.getElementById('ewg-pref').value=pref;document.getElementById('ewg-ans').checked=!!ans;}
  function resetP(wg){window._ewgBase=null;tokDom('');D.p=[{id:201,name:'代理対象',position:'PR',year:2,height:'180'},{id:202,name:'他',position:'LO',year:3}];if(wg!==undefined)D.p[0].wg=wg;__store['p']=J(D.p);}
  function storeWg(wg){var arr=JSON.parse(__store['p']);arr.forEach(function(x){if(x.id===201)x.wg=wg;});__store['p']=J(arr);} // 別端末の保存（D.pは古いまま）
  var ISO_NEW=new Date(Date.now()-60000).toISOString(),ISO_OV2=new Date(Date.now()-120000).toISOString();
  function savedWg(){return JSON.parse(__store['p']).find(function(x){return x.id===201;}).wg;}
  // (a) 申告(f5)を変えて保存→updが新しくなる・ovは触っていないのでovUpdそのまま
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV});
  goEditWg(201);
  setEwg(['mon','thu'],true,'',{tue:'pm'});
  __alerts.length=0;__popN=0;
  doSaveWg(201,mkEl());drain();
  var sa=savedWg();
  ok('(a) f5=月・木で保存・far/pref維持',J(sa.f5)==='["mon","thu"]'&&sa.far===true&&sa.pref===null);
  ok('(a) updが新しい（旧updと違うISO）',typeof sa.upd==='string'&&sa.upd!==ISO_OLD&&!isNaN(Date.parse(sa.upd)));
  ok('(a) ovは維持・ovUpdは変わらない',J(sa.ov)===J({mon:'',tue:'pm',thu:''})&&sa.ovUpd===ISO_OV);
  ok('(a) 保存形にv/daysは無い・他選手/他フィールド不変・popView・alertなし',!('v' in sa)&&!('days' in sa)&&!JSON.parse(__store['p'])[1].wg&&JSON.parse(__store['p'])[0].height==='180'&&__popN===1&&__alerts.length===0);
  ok('(a) D.pもメモリ更新',D.p[0].wg.f5.length===2);
  // (b1) 回答済みの選手: ovだけ変えて保存→updは変わらず・ovUpdが入る
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD});
  setEwg(['thu'],true,'',{tue:'pm'});
  doSaveWg(201,mkEl());drain();
  var sb=savedWg();
  ok('(b1) ovだけ変更: upd据え置き',sb.upd===ISO_OLD&&J(sb.f5)==='["thu"]');
  ok('(b1) ovが保存されovUpdは新しいISO',J(sb.ov)===J({mon:'',tue:'pm',thu:''})&&typeof sb.ovUpd==='string'&&!isNaN(Date.parse(sb.ovUpd)));
  // (b2) 未回答(upd無し)の選手: 指定だけ→未回答のまま(upd=null)
  resetP(undefined);
  setEwg([],false,'',{thu:'am'});
  doSaveWg(201,mkEl());drain();
  var sb2=savedWg();
  ok('(b2) 未回答に指定だけ: upd=null（未回答のまま）・ov.thu=am・ovUpdあり',sb2.upd===null&&sb2.ov.thu==='am'&&typeof sb2.ovUpd==='string'&&J(sb2.f5)==='[]'&&sb2.far===false&&sb2.pref===null);
  ok('(b2) wgNormで読むとanswered=false・hasOv=true',wgNorm(sb2).answered===false&&wgNorm(sb2).hasOv===true);
  ok('(b2) 申告一覧バッジは未回答＋指定',has(tgWgBadges({wg:sb2}),'未回答')&&has(tgWgBadges({wg:sb2}),'指定 木:午前'));
  // (c) 何も変えず保存→upd/ovUpdとも変わらない
  resetP({f5:['thu'],far:true,pref:'pm',upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV});
  setEwg(['thu'],true,'pm',{tue:'pm'});
  doSaveWg(201,mkEl());drain();
  var sc=savedWg();
  ok('(c) 変更なし: upd/ovUpdとも据え置き',sc.upd===ISO_OLD&&sc.ovUpd===ISO_OV&&J(sc.f5)==='["thu"]'&&sc.far===true&&sc.pref==='pm'&&J(sc.ov)===J({mon:'',tue:'pm',thu:''}));
  // (c2) 一時形式(v:2)を何も変えず保存→標準形になる（upd据え置き・ovUpdは無かったので新規）
  resetP({v:2,days:{mon:'',tue:'pm',thu:'am'},far:false,pref:null,upd:ISO_OLD});
  setEwg(['thu'],false,'',{tue:'pm'});
  doSaveWg(201,mkEl());drain();
  var sc2=savedWg();
  ok('(c2) 一時形式→標準形{f5:[thu],ov:{tue:pm}}・upd据え置き',!('v' in sc2)&&!('days' in sc2)&&J(sc2.f5)==='["thu"]'&&sc2.ov.tue==='pm'&&sc2.upd===ISO_OLD);
  // (d) 指定を全て自動に戻す→ov/ovUpdキーが無い
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV});
  setEwg(['thu'],true,'',{});
  doSaveWg(201,mkEl());drain();
  var sd=savedWg();
  ok('(d) 全て自動: ov/ovUpdキーを書かない・updは据え置き',!('ov' in sd)&&!('ovUpd' in sd)&&sd.upd===ISO_OLD&&J(sd.f5)==='["thu"]');
  ok('(d) 読むとhasOv=false',wgNorm(sd).hasOv===false);
  // (e) far/prefの変更もupdを更新
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD});
  setEwg(['thu'],false,'am',{});
  doSaveWg(201,mkEl());drain();
  ok('(e) far/prefの変更でもupd更新',savedWg().upd!==ISO_OLD&&savedWg().far===false&&savedWg().pref==='am');

  // (g) 成功: releaseSubmit・_ewgBase=null・popView・toast
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD});
  goEditWg(201);
  ok('(g) goEditWgで_ewgBaseが控えられる',window._ewgBase&&window._ewgBase.pid===201);
  setEwg(['thu'],true,'',{mon:'am'});
  __alerts.length=0;__popN=0;__toastMsg.length=0;
  var btnG=mkEl();btnG.innerHTML='保存';
  doSaveWg(201,btnG);
  ok('(g) 保存中は二重送信ガード',btnG.dataset.busy==='1');
  drain();
  ok('(g) 成功: releaseSubmit（busy解除・ラベル復元・disabled解除）',btnG.dataset.busy===''&&btnG.disabled===false&&btnG.innerHTML==='保存');
  ok('(g) 成功: _ewgBase=null・popView 1回・toast「保存しました」・alertなし',window._ewgBase===null&&__popN===1&&__toastMsg.length===1&&__toastMsg[0]==='保存しました'&&__alerts.length===0);
  ok('(g) 保存内容: ov.mon=am・ovUpd新・upd据え置き',savedWg().ov.mon==='am'&&savedWg().ovUpd&&savedWg().upd===ISO_OLD);

  // (h1) 競合: 開いている間に選手が別端末で再回答→スタッフは指定だけ変えて保存→選手の新しい申告は残り、ovだけ更新
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV});
  goEditWg(201);
  setEwg(['thu'],true,'',{tue:'pm'}); // 開いた時点の描画どおり
  storeWg({f5:['mon','tue'],far:false,pref:'am',upd:ISO_NEW,ov:{tue:'pm'},ovUpd:ISO_OV}); // 選手の再回答（D.pは古いまま）
  ok('(h1) 前提: D.pは古い申告のまま',J(D.p[0].wg.f5)==='["thu"]'&&D.p[0].wg.upd===ISO_OLD);
  wgSegPick('ewg','thu','am'); // スタッフは指定だけ変える
  __alerts.length=0;
  doSaveWg(201,mkEl());drain();
  var sh1=savedWg();
  ok('(h1) 選手の新しいf5/far/pref/updを保つ（巻き戻さない）',J(sh1.f5)==='["mon","tue"]'&&sh1.far===false&&sh1.pref==='am'&&sh1.upd===ISO_NEW);
  ok('(h1) ovだけ更新: {tue:pm,thu:am}・ovUpd=今（旧ovUpdではない）',J(sh1.ov)===J({mon:'',tue:'pm',thu:'am'})&&typeof sh1.ovUpd==='string'&&sh1.ovUpd!==ISO_OV&&!isNaN(Date.parse(sh1.ovUpd)));
  ok('(h1) D.pもサーバー結果に追従・alertなし',D.p[0].wg.upd===ISO_NEW&&J(D.p[0].wg.f5)==='["mon","tue"]'&&__alerts.length===0);

  // (h2) 競合（逆）: スタッフが申告を変えて保存→フォーム値＋upd=今。指定は触っていないのでサーバー最新のov/ovUpdを保つ
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV});
  goEditWg(201);
  setEwg(['thu'],true,'',{tue:'pm'});
  storeWg({f5:['mon','tue'],far:false,pref:'am',upd:ISO_NEW,ov:{thu:'am'},ovUpd:ISO_OV2}); // 選手の再回答＋別スタッフの指定変更
  document.getElementById('ewg-tue').checked=true;document.getElementById('ewg-pref').value='pm'; // 申告を変える（f5=火木・pref=pm）
  var tBefore=Date.now();
  doSaveWg(201,mkEl());drain();
  var sh2=savedWg();
  ok('(h2) 申告を変えた→フォーム値(f5=火・木/far=true/pref=pm)で保存',J(sh2.f5)==='["tue","thu"]'&&sh2.far===true&&sh2.pref==='pm');
  ok('(h2) upd=今（選手の再回答のupdでも旧updでもない）',sh2.upd!==ISO_NEW&&sh2.upd!==ISO_OLD&&Date.parse(sh2.upd)>=tBefore-1000);
  ok('(h2) 指定は触っていない→サーバー最新のov{thu:am}/ovUpdを保つ（開いた時点の{tue:pm}に巻き戻さない）',J(sh2.ov)===J({mon:'',tue:'',thu:'am'})&&sh2.ovUpd===ISO_OV2);

  // (h3) _ewgBaseが別選手のもの（古い控え）→D.pの値を基準にする
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD});
  window._ewgBase={pid:203,f5:['mon'],far:false,pref:'am',ov:{mon:'pm',tue:'',thu:''}};
  setEwg(['thu'],true,'',{});
  doSaveWg(201,mkEl());drain();
  ok('(h3) 別pidの_ewgBaseは使わない→D.pと同じ入力なので変更なし（upd据え置き・ovキーなし）',savedWg().upd===ISO_OLD&&J(savedWg().f5)==='["thu"]'&&!('ov' in savedWg()));

  // (i) 未回答でewg-ans ON・全て既定値（5限なし/遠方でない/どちらでも）→回答済みになる
  resetP(undefined);
  goEditWg(201);
  ok('(i) 前提: 未回答なのでewg-ansが描画される',has(__pvH,'id="ewg-ans"'));
  setEwg([],false,'',{},true);
  doSaveWg(201,mkEl());drain();
  var si=savedWg();
  ok('(i) ewg-ans ON: upd=今・f5=[]・far=false・pref=null',si&&typeof si.upd==='string'&&!isNaN(Date.parse(si.upd))&&J(si.f5)==='[]'&&si.far===false&&si.pref===null);
  ok('(i) wgNormでanswered=true・ov/ovUpdキーなし',wgNorm(si).answered===true&&!('ov' in si)&&!('ovUpd' in si));
  ok('(i) 申告一覧バッジ=5限なし（未回答ではない）',has(tgWgBadges({wg:si}),'5限なし')&&!has(tgWgBadges({wg:si}),'未回答'));

  // (j) 未回答でewg-ans OFF・指定だけ→未回答のまま
  resetP(undefined);
  goEditWg(201);
  setEwg([],false,'',{mon:'pm'},false);
  doSaveWg(201,mkEl());drain();
  var sj=savedWg();
  ok('(j) ewg-ans OFF・指定だけ: upd=null（未回答のまま）・ov.mon=pm・ovUpdあり',sj.upd===null&&sj.ov.mon==='pm'&&typeof sj.ovUpd==='string'&&J(sj.f5)==='[]');
  ok('(j) wgNormでanswered=false・hasOv=true',wgNorm(sj).answered===false&&wgNorm(sj).hasOv===true);

  // (k) updateFnは純粋: DOM値・nowは外で確定し、再実行しても同じ結果
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV});
  goEditWg(201);
  setEwg(['mon'],true,'',{tue:'pm',thu:'am'});
  var __origSSU3=svSafeUpdate,__capW=null;
  svSafeUpdate=function(k,fn,okCb,errCb){__capW={k:k,fn:fn};};
  doSaveWg(201,mkEl());
  svSafeUpdate=__origSSU3;
  setEwg(['tue'],false,'pm',{}); // 保存ボタン押下後にフォームが変わってもupdateFnの結果は変わらない
  var latK=function(){return [{id:201,name:'代理対象',wg:{f5:['thu'],far:true,pref:null,upd:ISO_OLD,ov:{tue:'pm'},ovUpd:ISO_OV}},{id:202,name:'他'}];};
  var k1=__capW&&__capW.fn(latK()),k2=__capW&&__capW.fn(latK()),k3=__capW&&__capW.fn(JSON.parse(J(k1)));
  ok('(k) svSafeUpdate("p")・2回実行しても同じ結果・結果に再適用しても同じ',__capW&&__capW.k==='p'&&J(k1)===J(k2)&&J(k3)===J(k1));
  ok('(k) 押下時のフォーム値(f5=月・ov火pm木am)が使われる・upd=ovUpd=同じnow',J(k1[0].wg.f5)==='["mon"]'&&J(k1[0].wg.ov)===J({mon:'',tue:'pm',thu:'am'})&&k1[0].wg.upd===k1[0].wg.ovUpd&&k1[0].wg.upd!==ISO_OLD);
  ok('(k) latestに居なければそのまま',J(__capW.fn([{id:202,name:'他'}]))===J([{id:202,name:'他'}]));

  // (f) 保存失敗→ボタン復帰＋alert（_ewgBaseは残す＝入力内容は残っている）
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD});
  goEditWg(201);
  setEwg(['mon'],true,'',{});
  var __origSSU2=svSafeUpdate;
  svSafeUpdate=function(k,fn,okCb,errCb){if(errCb)errCb(new Error('offline'));};
  __alerts.length=0;__popN=0;
  var btnF=mkEl();btnF.innerHTML='保存';
  doSaveWg(201,btnF);
  ok('(f) 失敗: releaseSubmit＋alert',btnF.dataset.busy===''&&btnF.disabled===false&&btnF.innerHTML==='保存'&&__alerts.length===1&&has(__alerts[0],'保存できませんでした'));
  ok('(f) 失敗: popViewしない・_ewgBaseは残る（再試行で同じ基準）',__popN===0&&window._ewgBase&&window._ewgBase.pid===201);
  svSafeUpdate=__origSSU2;
  ok('居ない選手のdoSaveWgは何もしない',(function(){var n=__popN;doSaveWg(999,mkEl());drain();return __popN===n;})());
  // (l) 保存の完了前に別の選手の編集画面を開いた→完了で閉じない（完了時に「保存した編集画面の目印ewg-tok」がまだ表示中かを見る）
  print('--- doSaveWg: 保存中に別の選手の編集画面を開いたら、完了時に閉じない ---');
  var __heldOk=[],__origSSU4=svSafeUpdate;
  svSafeUpdate=function(k,fn,okCb,errCb){__origSSU4(k,fn,function(){__heldOk.push(okCb);},errCb);}; // 保存は実行し、完了コールバックだけ控える
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD});
  goEditWg(201);
  setEwg(['mon'],true,'',{});
  __alerts.length=0;__popN=0;__toastMsg.length=0;
  var btnL=mkEl();btnL.innerHTML='保存';
  doSaveWg(201,btnL);drain();
  ok('(l) 前提: 201の保存はstoreに反映・完了コールバックは未実行（ボタンはガード中・popView/toastなし）',J(savedWg().f5)==='["mon"]'&&__heldOk.length===1&&btnL.dataset.busy==='1'&&__popN===0&&__toastMsg.length===0);
  goEditWg(202);
  ok('(l) 前提: 202の編集画面を開いた（_ewgBase=202）',window._ewgBase&&window._ewgBase.pid===202);
  setEwg([],false,'',{tue:'am'},false);
  var btnL2=mkEl();btnL2.innerHTML='保存';
  doSaveWg(202,btnL2);drain();
  ok('(l) 前提: 202も保存中（完了コールバック2件を控えている）',__heldOk.length===2&&btnL2.dataset.busy==='1');
  var errL=null;try{__heldOk.shift()();}catch(e){errL=e;}
  ok('(l) 201の完了: 例外なし・popViewしない・_ewgBaseは202のまま',errL===null&&__popN===0&&window._ewgBase&&window._ewgBase.pid===202&&J(window._ewgBase.f5)==='[]');
  ok('(l) 201の完了: トースト「代理対象 の時間帯を保存しました」・201のボタン復帰・alertなし',__toastMsg.length===1&&__toastMsg[0]==='代理対象 の時間帯を保存しました'&&btnL.dataset.busy===''&&btnL.disabled===false&&btnL.innerHTML==='保存'&&__alerts.length===0);
  __heldOk.shift()();
  ok('(l) 202の完了: 従来どおり popView 1回・toast「保存しました」・_ewgBase=null・ボタン復帰',__popN===1&&__toastMsg.length===2&&__toastMsg[1]==='保存しました'&&window._ewgBase===null&&btnL2.dataset.busy===''&&btnL2.disabled===false);
  ok('(l) 保存内容: 201=f5月・202=ov火am（互いに上書きしない）',J(savedWg().f5)==='["mon"]'&&!('ov' in savedWg())&&JSON.parse(__store['p']).find(function(x){return x.id===202;}).wg.ov.tue==='am');
  // (m) 保存中に「戻る」で離れて同じ選手の編集画面を開き直した→新しい画面（別の目印）は閉じない（開き直した画面の入力を消さない）
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD});
  goEditWg(201);setEwg(['tue'],true,'',{});
  var tokM1=window._ewgBase.tok;
  __popN=0;__toastMsg.length=0;
  doSaveWg(201,mkEl());drain();
  popView();goEditWg(201);__popN=0;
  ok('(m) 前提: 201を開き直した（_ewgBase=201・目印は新しい）',window._ewgBase&&window._ewgBase.pid===201&&window._ewgBase.tok!==tokM1&&__heldOk.length===1);
  var tokM2=window._ewgBase.tok;
  __heldOk.shift()();
  ok('(m) 開き直した画面は閉じない: popView 0回・トーストは名前入り・_ewgBaseは新しい画面のまま',__popN===0&&__toastMsg.length===1&&__toastMsg[0]==='代理対象 の時間帯を保存しました'&&window._ewgBase&&window._ewgBase.tok===tokM2);
  // (n) 保存中にキャンセルで離れ、別の入力画面（pushView）を開いた→完了でその画面を閉じない（レビュー確定の再現手順）
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD});
  goEditWg(201);setEwg(['tue'],true,'',{});
  __toastMsg.length=0;
  doSaveWg(201,mkEl());drain();
  popView();pushView('選手を追加','<div class="form-box"><input id="np-name"></div>');__popN=0;
  ok('(n) 前提: キャンセル後に別の入力画面を表示中（ewg-tok無し）・完了は未実行',document.getElementById('ewg-tok').value===''&&__heldOk.length===1&&has(__pvH,'np-name'));
  var errN=null;try{__heldOk.shift()();}catch(e){errN=e;}
  ok('(n) 完了: 例外なし・popView 0回（別の入力画面を閉じない）・トーストは名前入り',errN===null&&__popN===0&&__toastMsg.length===1&&__toastMsg[0]==='代理対象 の時間帯を保存しました');
  ok('(n) 保存内容は反映済み（f5=火）',J(savedWg().f5)==='["tue"]');
  // (o) 目印が無い画面から保存（DOMに編集画面が無い）→閉じない・落ちない
  resetP({f5:['thu'],far:true,pref:null,upd:ISO_OLD});
  setEwg(['mon'],true,'',{});__popN=0;__toastMsg.length=0;
  var errO=null;try{doSaveWg(201,mkEl());drain();__heldOk.shift()();}catch(e){errO=e;}
  ok('(o) ewg-tok無し: 例外なし・popView 0回・名前入りトースト',errO===null&&__popN===0&&__toastMsg[0]==='代理対象 の時間帯を保存しました');
  ok('(n)(o) 控えた完了コールバックは使い切り',__heldOk.length===0);
  svSafeUpdate=__origSSU4;
  popView=__popOrig;toast=__toastOrig;pushView=__pvOrig2;window._ewgBase=null;

  // ============ 10. staff: tgWgBadges / tgReasonBadge ============
  print('--- tgWgBadges ---');
  ok('未回答（wg無し/null/upd無し）',has(tgWgBadges({}),'未回答')&&has(tgWgBadges({wg:null}),'未回答')&&has(tgWgBadges({wg:{f5:['tue']}}),'未回答'));
  var b1=tgWgBadges({wg:{f5:['thu','tue'],far:true,pref:'pm',upd:ISO_OLD}});
  ok('5限 火・木／遠方／午後希望・未回答は無い',has(b1,'5限 火・木')&&has(b1,'>遠方<')&&has(b1,'>午後希望<')&&!has(b1,'未回答')&&!has(b1,'指定'));
  var b2=tgWgBadges({wg:{f5:[],far:false,pref:null,upd:ISO_OLD}});
  ok('5限なし・遠方/希望なし',has(b2,'5限なし')&&!has(b2,'遠方')&&!has(b2,'希望'));
  ok('午前希望',has(tgWgBadges({wg:{f5:[],pref:'am',upd:ISO_OLD}}),'>午前希望<'));
  var b3=tgWgBadges({wg:{f5:['tue'],far:false,pref:null,upd:ISO_OLD,ov:{tue:'pm',thu:'am'},ovUpd:ISO_OV}});
  ok('指定 火:午後・指定 木:午前（紫）',has(b3,'>指定 火:午後<')&&has(b3,'>指定 木:午前<')&&has(b3,'var(--purple)')&&has(b3,'5限 火'));
  var b4=tgWgBadges({wg:{ov:{mon:'am'},ovUpd:ISO_OV}});
  ok('指定だけ: 未回答＋指定 月:午前',has(b4,'未回答')&&has(b4,'>指定 月:午前<'));
  ok('旧v2表記（午前のみ/どちらでも/旧形式・要更新）は出ない',!has(b1,'のみ')&&!has(b1,'どちらでも')&&!has(b1,'要更新')&&!has(tgWgBadges({wg:{v:2,days:{mon:'am'},upd:ISO_OLD}}),'のみ'));
  ok('一時形式は5限/指定に読み替え',has(tgWgBadges({wg:{v:2,days:{mon:'am',tue:'pm',thu:''},upd:ISO_OLD}}),'5限 月')&&has(tgWgBadges({wg:{v:2,days:{mon:'am',tue:'pm',thu:''},upd:ISO_OLD}}),'>指定 火:午後<'));
  print('--- tgReasonBadge ---');
  window._tgState={_reason:{5:'指定',6:'5限',7:'希望',8:'遠方',9:'自動',10:'手動',11:'ピン'}};
  ok('指定=紫・5限=青・希望=緑・遠方=amber・自動=tertiary・手動=紫・ピン=maroon',has(tgReasonBadge(5),'>指定<')&&has(tgReasonBadge(5),'var(--purple)')&&has(tgReasonBadge(6),'>5限<')&&has(tgReasonBadge(6),'var(--blue)')&&has(tgReasonBadge(7),'var(--green)')&&has(tgReasonBadge(8),'var(--amber)')&&has(tgReasonBadge(9),'var(--text-tertiary)')&&has(tgReasonBadge(10),'var(--purple)')&&has(tgReasonBadge(11),'var(--maroon)'));
  ok('理由なし→""',tgReasonBadge(999)==='');
  window._tgState=undefined;

  // ============ 11. staff: tgPruneGuests（ゲスト行の整理: 生成直後・読み込み時・保存時） ============
  print('--- tgPruneGuests: 班にいる選手の「ホーム組以外の組」の行だけ残す ---');
  var PG=[
    {groups:[[1,2],[3]],pool:[9],guests:[{pid:4,day:'mon',gi:0},{pid:1,day:'tue',gi:1},{pid:9,day:'thu',gi:0},{pid:3,day:'thu',gi:null},null]},
    {groups:[[4],['5'],[]],guests:[{pid:1,day:'thu',gi:0},{pid:9,day:'tue',gi:null},{pid:4,day:'mon',gi:null},{pid:77,day:'mon',gi:0},{pid:'2',day:'tue',gi:2},{pid:5,day:'thu',gi:null},{pid:3,day:'tue',gi:null}]}
  ];
  var pgG0=PG[0].groups,pgPool=PG[0].pool;
  tgPruneGuests(PG);
  ok('形{groups,guests}だけで動く（key/label無し）・午前: 4(月)だけ残る（1/3=ホーム組を指す行・9=未配置の人・null要素は落ちる）',J(PG[0].guests)===J([{pid:4,day:'mon',gi:0}]));
  ok('午後: 1(木)・"2"(火・gi:2=空の班でも触らない)・3(火・未定)が残る／9=pool・4=ホーム組・77=どこにも居ない・5=文字列"5"で班にいる(ホーム組)は落ちる',J(PG[1].guests)===J([{pid:1,day:'thu',gi:0},{pid:'2',day:'tue',gi:2},{pid:3,day:'tue',gi:null}]));
  ok('groups/poolは変更しない',PG[0].groups===pgG0&&J(PG[0].groups)==='[[1,2],[3]]'&&PG[0].pool===pgPool&&J(PG[0].pool)==='[9]'&&J(PG[1].groups)==='[[4],["5"],[]]');
  var pgOnce=J(PG);tgPruneGuests(PG);
  ok('二重実行しても同じ結果',J(PG)===pgOnce);
  var PGp=[{groups:[[1]],pool:[2],guests:[]},{groups:[[3]],pool:[],guests:[{pid:2,day:'mon',gi:0},{pid:1,day:'mon',gi:0}]}];
  tgPruneGuests(PGp);
  ok('poolはホームに数えない（未配置の人の行は逆の組でも落ちる）',J(PGp[1].guests)===J([{pid:1,day:'mon',gi:0}]));
  var PGm=[{groups:[[1]]},{groups:[[2]]}];tgPruneGuests(PGm);
  ok('guests欠落→[]になる',J(PGm[0].guests)==='[]'&&J(PGm[1].guests)==='[]');
  var PGn=[{guests:[{pid:1,day:'mon',gi:0}]}];tgPruneGuests(PGn);
  ok('groups欠落（班が無い）→行は全て落ちる',J(PGn[0].guests)==='[]');
  var pgThrow=false;try{tgPruneGuests(null);tgPruneGuests(undefined);tgPruneGuests([]);}catch(e){pgThrow=true;}
  ok('null/undefined/[]でも落ちない',!pgThrow);
  var PGs=[{groups:[['1']],guests:[]},{groups:[[2]],guests:[{pid:1,day:'tue',gi:0},{pid:'2',day:'tue',gi:0}]}];tgPruneGuests(PGs);
  ok('文字列pid/数値pidは同一視（"1"の班にいる1の午後の行は残る・2のホーム組を指す"2"の行は落ちる）',J(PGs[1].guests)===J([{pid:1,day:'tue',gi:0}]));
  var PGd=[{groups:[[1,2]],guests:[]},{groups:[[3]],guests:[{pid:1,day:'mon',gi:0},{pid:2,day:'tue',gi:null}]}],pgDs=['mon','tue','thu'].map(function(d){return J(tgDayShifts(PGd,d));}).join('|');
  tgPruneGuests(PGd);
  ok('有効な行だけの入力は変わらない（tgDayShiftsの結果も同じ）',PGd[1].guests.length===2&&['mon','tue','thu'].map(function(d){return J(tgDayShifts(PGd,d));}).join('|')===pgDs);
}

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup_helpers tests failed');}
print('\nALL TGROUP-HELPERS TESTS PASSED ('+SITE+')');
