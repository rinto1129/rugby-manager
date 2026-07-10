// Phase 2: ppAutoFlip（チームウエイト完了→当日PUSH/PULL自動確定）のテスト
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_pp_auto.js
// 仕様（プランPhase 2節・レビューHigh-3①②/Medium-1反映）:
//  - ガード: 欠席/kind='self'/過去日付/個別scope/pp未初期化/カレンダー本日weightなし → 何もしない
//  - 当日の重複抑止は last.date===today && last.by==='auto' のみ（手動flip/ppStart当日でも完了で確定は走る）
//  - todayType = mn.ptype || last.type の逆を {id,type,date,by:'auto'} でpush・100件cap維持
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var TODAY=todayStr();
var YESTERDAY=(function(){var d=new Date();d.setDate(d.getDate()-1);return toDateStr(d);})();
myPid=1;
D.p=[{id:1,name:'選手A',position:'PR',year:2}];
D.tmenu=[
  {id:101,name:'PUSHスロット',scope:'all',ptype:'push',exercises:[{name:'ベンチプレス',estBase:'bench',sets:3,reps:5,rir:2}]},
  {id:102,name:'汎用メニュー',scope:'all',exercises:[{name:'スクワット'}]},
  {id:103,name:'専用メニュー',scope:1,exercises:[{name:'リハビリ'}]},
  {id:104,name:'PULLスロット',scope:'all',ptype:'pull',exercises:[{name:'デッドリフト'}]}
];
D.cal=[{id:1,date:TODAY,type:'weight'}];

function setPP(arr){D.pp=JSON.parse(JSON.stringify(arr));__store['pp']=JSON.stringify(arr);}
function ppNow(){return JSON.parse(__store['pp']||'[]');}
function teamLog(over){
  var l={id:'L1',pid:1,menuId:101,date:TODAY,results:[],totalVolume:0};
  for(var k in over)if(Object.prototype.hasOwnProperty.call(over,k))l[k]=over[k];
  return l;
}

print('--- ppAutoFlip: ガード（何もしないケース） ---');
// 1) pp空（ppStart未実施）
setPP([]);
ppAutoFlip(teamLog());drain();
ok('pp空 → flipしない',ppNow().length===0);
// 2) 欠席記録
setPP([{id:1,type:'push',date:'2026-07-04',by:'staff'}]);
ppAutoFlip(teamLog({absent:true,absentReason:'体調不良'}));drain();
ok('absent → flipしない',ppNow().length===1);
// 3) 自主トレ（kind='self'）
ppAutoFlip(teamLog({kind:'self',menuId:null}));drain();
ok("kind='self' → flipしない",ppNow().length===1);
// 4) 過去日付の記録
ppAutoFlip(teamLog({date:YESTERDAY}));drain();
ok('date≠today → flipしない',ppNow().length===1);
// 5) 個別scopeメニュー
ppAutoFlip(teamLog({menuId:103}));drain();
ok('個別scope → flipしない',ppNow().length===1);
// 6) メニューが見つからない
ppAutoFlip(teamLog({menuId:999}));drain();
ok('menuId不明 → flipしない',ppNow().length===1);
// 7) カレンダーに本日weightなし（High-3①: オフ日の個人消化で反転させない）
D.cal=[{id:1,date:TODAY,type:'off'}];
ppAutoFlip(teamLog());drain();
ok('非weight日 → flipしない',ppNow().length===1);
D.cal=[{id:1,date:TODAY,type:'weight'}];

print('--- ppAutoFlip: 正常系 ---');
// 8) 正常flip（ptype=pushのメニュー完了 → 次はpull・by:auto・date=today）
setPP([{id:1,type:'push',date:'2026-07-04',by:'staff'}]);
ppAutoFlip(teamLog());drain();
var a8=ppNow();
ok('正常flip: 1件追記',a8.length===2);
ok('正常flip: 次はPULL',a8[1].type==='pull');
ok("正常flip: by='auto'",a8[1].by==='auto');
ok('正常flip: date=today',a8[1].date===TODAY);
ok('正常flip: D.ppも更新',D.pp.length===2&&D.pp[1].by==='auto');
// 9) 当日2人目の完了 → 重複しない（last.by==='auto'で抑止）
ppAutoFlip(teamLog({id:'L2',pid:2}));drain();
ok('当日重複 → 2回目はflipしない',ppNow().length===2);
// 10) ptype無しメニュー → last.typeの逆へ（従来メニュー互換）
setPP([{id:1,type:'pull',date:'2026-07-04',by:'staff'}]);
ppAutoFlip(teamLog({menuId:102}));drain();
var a10=ppNow();
ok('ptype無し: last.type=pullの逆=pushを追記',a10.length===2&&a10[1].type==='push'&&a10[1].by==='auto');

print('--- ppAutoFlip: High-3②（手動操作当日でも確定は走る） ---');
// 11) スタッフが朝に手動修正（by:'staff'・date=today）→ 夕方の完了で自動確定が走る（翌日ずれ防止）
setPP([{id:1,type:'push',date:'2026-07-01',by:'staff'},{id:2,type:'pull',date:TODAY,by:'staff'}]);
ppAutoFlip(teamLog({menuId:104}));drain(); // 今日はPULL日→PULLスロット完了
var a11=ppNow();
ok('手動flip当日+完了 → 自動確定が走る',a11.length===3);
ok('手動flip当日+完了 → 次はPUSH',a11[2].type==='push'&&a11[2].by==='auto');
// 12) ppStart当日+完了 → 確定が走る
setPP([{id:1,type:'push',date:TODAY,by:'staff'}]);
ppAutoFlip(teamLog());drain();
var a12=ppNow();
ok('ppStart当日+完了 → flipする',a12.length===2&&a12[1].type==='pull'&&a12[1].by==='auto');

print('--- ppAutoFlip: 100件cap（trainer互換） ---');
var big=[];for(var i=0;i<100;i++)big.push({id:i,type:i%2?'pull':'push',date:'2026-06-01',by:'staff'});
setPP(big);
ppAutoFlip(teamLog({menuId:102}));drain();
var a13=ppNow();
ok('100件cap維持',a13.length===100);
ok('capでも末尾はauto記録',a13[99].by==='auto');

print('--- ppCardHtml: 自動確定の表示 ---');
setPP([{id:1,type:'push',date:'2026-07-01',by:'staff'},{id:2,type:'pull',date:'2026-07-04',by:'auto'}]);
var card=ppCardHtml(false);
ok('byLabel: 自動確定',card.indexOf('自動確定')>=0);
ok('metaTxt: 前回:形式（lastRec=pullの逆=PUSHが前回実施済み）',card.indexOf('前回: PUSH')>=0);
setPP([{id:1,type:'push',date:'2026-07-01',by:'staff'}]);
var card2=ppCardHtml(false);
ok('開始記録1件のみ → 開始:形式',card2.indexOf('開始:')>=0&&card2.indexOf('前回:')<0);
ok('開始記録: スタッフ表記',card2.indexOf('スタッフ')>=0);

print('--- finishTraining統合: 成功経路とe1rm失敗経路の両方でppAutoFlipが走る（Medium-1） ---');
// 成功経路
D.cal=[{id:1,date:TODAY,type:'weight'}];
D.tlog=[];__store['tlog']=JSON.stringify([]);
D.e1rm=[];__store['e1rm']=JSON.stringify([]);
setPP([{id:1,type:'push',date:'2026-07-04',by:'staff'}]);
_curTLog={id:'FT1',pid:1,menuId:101,date:TODAY,ts:'2026-07-07T10:00:00.000Z',results:[
  {exName:'ベンチプレス',estBase:'bench',targetReps:5,targetRir:2,sets:[{weight:100,reps:5,rir:2}],skipped:false,skipReason:''}
],totalVolume:0};
finishTraining(mkEl());drain();
var tlogsA=JSON.parse(__store['tlog']||'[]');
ok('統合(成功): tlog保存済み',tlogsA.length===1&&tlogsA[0].id==='FT1');
var aI1=ppNow();
ok('統合(成功): ppAutoFlipが走った',aI1.length===2&&aI1[1].by==='auto'&&aI1[1].type==='pull');
// e1rm失敗経路（tlog成功+e1rm失敗でも記録成立→この経路でも確定する）
setPP([{id:1,type:'push',date:'2026-07-04',by:'staff'}]);
D.tlog=[];__store['tlog']=JSON.stringify([]);
D.e1rm=[];__store['e1rm']=JSON.stringify([]);
var __origCol=db.collection;
db.collection=function(name){
  var c=__origCol.call(db,name);
  return{doc:function(k){
    var r=c.doc(k);
    if(k==='e1rm'){r.set=function(){throw new Error('mock e1rm fail');};}
    return r;
  }};
};
_curTLog={id:'FT2',pid:1,menuId:101,date:TODAY,ts:'2026-07-07T11:00:00.000Z',results:[
  {exName:'ベンチプレス',estBase:'bench',targetReps:5,targetRir:2,sets:[{weight:120,reps:5,rir:2}],skipped:false,skipReason:''}
],totalVolume:0};
finishTraining(mkEl());drain();
db.collection=__origCol;
var tlogsB=JSON.parse(__store['tlog']||'[]');
ok('統合(e1rm失敗): tlogは保存済み',tlogsB.length===1&&tlogsB[0].id==='FT2');
ok('統合(e1rm失敗): e1rmは保存されていない',JSON.parse(__store['e1rm']||'[]').length===0);
var aI2=ppNow();
ok('統合(e1rm失敗): この経路でもppAutoFlipが走った',aI2.length===2&&aI2[1].by==='auto'&&aI2[1].type==='pull');
ok('統合: alertなし（確定失敗時もトレ記録成立を邪魔しない）',__alerts.length===0);

print('--- 日跨ぎ対応: ppNext（当日autoは実施タイプを凍結・翌日反転・手動は即時） ---');
// A) auto当日 → 表示は当日実施タイプ(push)を維持（last.type=pullの逆）
setPP([{id:1,type:'push',date:'2026-07-01',by:'staff'},{id:2,type:'pull',date:TODAY,by:'auto'}]);
ok('auto当日: ppNextは当日実施タイプpushを凍結',ppNext()==='push');
// B) auto翌日（date≠today）→ 反転後pullを返す
setPP([{id:1,type:'push',date:'2026-07-01',by:'staff'},{id:2,type:'pull',date:YESTERDAY,by:'auto'}]);
ok('auto翌日: ppNextは反転後pullを返す',ppNext()==='pull');
// C) 手動flip当日 → 即時反映（pull）
setPP([{id:1,type:'push',date:'2026-07-01',by:'staff'},{id:2,type:'pull',date:TODAY,by:'staff'}]);
ok('手動flip当日: ppNextは即時pull',ppNext()==='pull');

print('--- 日跨ぎ対応: ppNextWeightDay（当日autoは当日を次ウエイト日に維持・手動は前進） ---');
var TOMORROW=(function(){var d=new Date();d.setDate(d.getDate()+7);return toDateStr(d);})();
D.cal=[{id:1,date:TODAY,type:'weight'},{id:2,date:TOMORROW,type:'weight'}];
// D) auto当日 → 次のウエイト日は当日のまま（isToday=true）
setPP([{id:1,type:'push',date:'2026-07-01',by:'staff'},{id:2,type:'pull',date:TODAY,by:'auto'}]);
var wdAuto=ppNextWeightDay();
ok('auto当日: 次ウエイト日は当日維持(isToday)',!!wdAuto&&wdAuto.isToday===true&&wdAuto.date===TODAY);
// E) 手動flip当日 → 次のウエイト日は翌ウエイト日へ前進
setPP([{id:1,type:'push',date:'2026-07-01',by:'staff'},{id:2,type:'pull',date:TODAY,by:'staff'}]);
var wdMan=ppNextWeightDay();
ok('手動flip当日: 次ウエイト日は翌回へ前進(isToday=false)',!!wdMan&&wdMan.isToday===false&&wdMan.date===TOMORROW);

if(__fail===0)print('ALL PP-AUTO TESTS PASSED');else print(__fail+' TESTS FAILED');
