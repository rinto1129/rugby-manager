// P2b: staff tlog代理編集/削除の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tlog_edit_staff.js
// 核心=staff固有の「アーカイブdoc(tla_)所在特定→そのdocだけ更新→_tlogArch手動反映→e1rmリプレイ」。
// ほか: メインdoc(tlog)編集/削除、tlogDocKeys所在判定、in-place温存、複数pid隔離、notFoundガード、Undo完全復元、
//       F1(過渡的両doc在籍→両doc掃除)、F3(pid別世代トークンで別pidのrebuild失敗を握りつぶさない)。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

// --- 共通土台 ---
if(typeof D.p==='undefined'||!D.p.length)D.p=[{id:1,name:'選手1',position:'PR',year:2},{id:2,name:'選手2',position:'CTB',year:1}];
D.tmenu=D.tmenu||[];
window._dtPid=1;
var _toasts=[];
toast=function(m,a,fn){_toasts.push({m:m,a:a,fn:fn});};   // トースト捕捉（Undoのaction関数も保持）
renderTrainTab=function(){};                                // 再描画はDOM/Chart依存のためno-op化（データ検証に集中）

function E(w){return estimateOneRM(w,5,2);}                // reps5/rir2固定のe1rm
function V(w){return{squat:{e1rm:E(w),weight:w,reps:5,rir:2}};}
function e1rec(date,vals,pid){return{id:'e'+date+'_'+(pid||1),pid:pid||1,date:date,inputAt:date+'T10:00:00.000Z',values:vals};}
function sess(date,w,opt){opt=opt||{};return{id:opt.id||('T'+date),pid:opt.pid||1,date:date,ts:opt.ts||(date+'T10:00:00.000Z'),kind:opt.kind,menuId:opt.menuId,
  results:[{exName:opt.ex||'スクワット',estBase:opt.estBase||'squat',sets:[{weight:w,reps:5,rir:2}]}],totalVolume:w*5};}
// main=D.tlog(直近), archived=_tlogArch＋対応するtla_docへも実体を置く（staffの所在特定はこのdocを触る）
function reset(mainLogs,archLogs,e1rms){
  D.tlog=mainLogs||[];__store['tlog']=JSON.stringify(D.tlog);
  D.e1rm=e1rms||[];__store['e1rm']=JSON.stringify(D.e1rm);
  // アーカイブdocを短期キーごとに束ねてサーバーモック(__store)へ配置＋メモリ_tlogArchへロード済みとして反映
  var groups={};(archLogs||[]).forEach(function(l){var k=tlaKey(l.pid,tlaHalf(l.date));(groups[k]=groups[k]||[]).push(l);});
  Object.keys(__store).forEach(function(k){if(k.indexOf('tla_')===0)delete __store[k];});
  Object.keys(groups).forEach(function(k){__store[k]=JSON.stringify(groups[k]);});
  _tlogArch=(archLogs||[]).slice();_tlogArchLoaded=true;
  _tlaCache=null;_tlaCacheSrc=null;_tlaCacheArch=null;
  _e1rmRebuildGen={};_pendingRebuild={};_toasts=[];window._etl=null;_curTLog=null;
}
function pidE1(pid){return D.e1rm.filter(function(r){return idEq(r.pid,pid);});}
function archDoc(k){return __store[k]?JSON.parse(__store[k]):[];}

// ============================================================
print('--- 1) tlogDocKeys: 所在候補の算出（新しい=tlogのみ / 古い=両doc） ---');
reset([sess(todayStr(),100,{id:'R1'})],[sess('2020-01-01',200,{id:'A1'})]);
ok("新しいメインdoc記録→['tlog']のみ", JSON.stringify(tlogDocKeys(D.tlog[0]))===JSON.stringify(['tlog']));
var ak=tlogDocKeys(_tlogArch[0]);
ok("古いアーカイブ記録→tlog+tla両doc対象", ak.length===2&&ak.indexOf('tlog')>=0&&ak.indexOf(tlaKey(1,'2020h1'))>=0);
ok('tlaHalf(1月)=h1', tlaHalf('2020-01-01')==='2020h1');
ok('tlaHalf(7月)=h2', tlaHalf('2026-07-10')==='2026h2');

// ============================================================
print('--- 2) 【核心】アーカイブdocの代理削除→そのdocだけ更新＋_tlogArch反映＋e1rm復元 ---');
// A1(3/5・w200・誤高値でe1rm=E200記録済) を削除。R1(7/10・w100)はE200に抑圧され記録なし。
reset([sess('2026-07-10',100,{id:'R1'})],[sess('2026-03-05',200,{id:'A1'})],[e1rec('2026-03-05',V(200))]);
delTlogStaff('A1');drain();
ok('tla_docからA1が消えた', !archDoc(tlaKey(1,'2026h1')).some(function(l){return idEq(l.id,'A1');}));
ok('メモリ_tlogArchからA1が消えた', !_tlogArch.some(function(l){return idEq(l.id,'A1');}));
ok('メインD.tlog(R1)は不変', D.tlog.length===1&&idEq(D.tlog[0].id,'R1'));
ok('誤高値E200がe1rmから消滅', !D.e1rm.some(function(r){return r.values&&r.values.squat&&r.values.squat.e1rm===E(200);}));
ok('抑圧されていたR1(E100)が復元し最新に', getLatestE1RM(1).squat.e1rm===E(100));
ok('削除トーストにUndoが付く', _toasts.some(function(t){return typeof t.fn==='function';}));

// ============================================================
print('--- 3) アーカイブ削除→Undoで完全復元（tla_doc・_tlogArch・e1rm） ---');
var undo3=_toasts.filter(function(t){return typeof t.fn==='function';}).pop();
undo3.fn();drain();
ok('Undo後: tla_docにA1復活', archDoc(tlaKey(1,'2026h1')).some(function(l){return idEq(l.id,'A1');}));
ok('Undo後: _tlogArchにA1復活', _tlogArch.some(function(l){return idEq(l.id,'A1');}));
ok('Undo後: e1rmがE200に回復', getLatestE1RM(1).squat.e1rm===E(200));
ok('Undo二度押しでtla_doc二重化しない', (function(){undo3.fn();drain();return archDoc(tlaKey(1,'2026h1')).filter(function(l){return idEq(l.id,'A1');}).length===1;})());

// ============================================================
print('--- 4) 【核心】アーカイブdocの代理編集（値下げ）→doc更新＋_tlogArch反映＋e1rm訂正 ---');
reset([],[sess('2026-03-05',200,{id:'A2',kind:'self',menuId:'M3',ts:'2026-03-05T09:00:00.000Z'})],[e1rec('2026-03-05',V(200))]);
editTlogStaff('A2');                                                   // フォーム状態_etl構築（DOMはmock）
_etl.results[0].sets[0].weight='120';                                  // 誤入力200→正しい120へ訂正
doEditTlogStaff('A2',mkEl());drain();
var a2=archDoc(tlaKey(1,'2026h1')).find(function(l){return idEq(l.id,'A2');});
ok('tla_doc上のA2 weight=120に更新', a2&&a2.results[0].sets[0].weight===120);
ok('_tlogArch上のA2も weight=120', _tlogArch.find(function(l){return idEq(l.id,'A2');}).results[0].sets[0].weight===120);
ok('kind温存', a2.kind==='self');
ok('menuId温存', a2.menuId==='M3');
ok('ts温存', a2.ts==='2026-03-05T09:00:00.000Z');
ok('editedAt付与', !!a2.editedAt);
ok('編集後e1rm=E120に訂正', getLatestE1RM(1).squat.e1rm===E(120));
ok('E200が消滅', !D.e1rm.some(function(r){return r.values&&r.values.squat&&r.values.squat.e1rm===E(200);}));

// ============================================================
print('--- 5) メインdoc(tlog)の代理削除→rebuild（playerと同経路） ---');
reset([sess('2026-07-01',100,{id:'M1'}),sess('2026-07-03',200,{id:'M2'}),sess('2026-07-05',120,{id:'M3'})],[],
  [e1rec('2026-07-01',V(100)),e1rec('2026-07-03',V(200))]);
delTlogStaff('M2');drain();   // 誤高値セッション削除
ok('メインdocからM2が消えた', !D.tlog.some(function(l){return idEq(l.id,'M2');}));
ok('E200消滅', !D.e1rm.some(function(r){return r.values&&r.values.squat&&r.values.squat.e1rm===E(200);}));
ok('抑圧のM3(E120)が復元し最新', getLatestE1RM(1).squat.e1rm===E(120));

// ============================================================
print('--- 6) メインdoc編集はin-place（ts/kind/menuId温存・setsのみ差替） ---');
reset([sess('2026-07-05',100,{id:'Y',kind:'self',menuId:'M9',ts:'2026-07-05T09:00:00.000Z'})],[],[]);
editTlogStaff('Y');_etl.results[0].sets[0].weight='150';
doEditTlogStaff('Y',mkEl());drain();
var recY=D.tlog.find(function(l){return idEq(l.id,'Y');});
ok('kind温存', recY.kind==='self');
ok('menuId温存', recY.menuId==='M9');
ok('ts温存', recY.ts==='2026-07-05T09:00:00.000Z');
ok('weight反映(150)', recY.results[0].sets[0].weight===150);
ok('editedAt付与', !!recY.editedAt);
ok('編集後e1rm=E150', getLatestE1RM(1).squat.e1rm===E(150));

// ============================================================
print('--- 7) 複数pid隔離（pid1のアーカイブ削除でpid2を巻き込まない） ---');
reset([],[sess('2026-03-05',100,{id:'P1',pid:1}),sess('2026-03-05',100,{id:'P2',pid:2})],
  [e1rec('2026-03-05',V(100),1),e1rec('2026-03-05',V(100),2)]);
delTlogStaff('P1');drain();
ok('pid2のe1rmは温存', pidE1(2).length===1&&pidE1(2)[0].values.squat.e1rm===E(100));
ok('pid2のtla_docは不変', archDoc(tlaKey(2,'2026h1')).some(function(l){return idEq(l.id,'P2');}));
ok('pid1はセッション消滅で該当e1rm無し', !pidE1(1).some(function(r){return r.values&&r.values.squat;}));

// ============================================================
print('--- 8) notFoundガード（存在しないid・状態喪失） ---');
reset([sess('2026-07-05',100,{id:'X'})],[],[]);
var before=D.tlog.length;
delTlogStaff('NOPE');drain();
ok('削除notFound: tlog不変', D.tlog.length===before);
ok('削除notFound: トースト', _toasts.some(function(t){return /見つかりません/.test(t.m);}));
_toasts=[];
window._etl={recId:'NOPE',results:[{exName:'スクワット',estBase:'squat',skipped:false,sets:[{weight:120,reps:5,rir:2}]}]};
doEditTlogStaff('NOPE',mkEl());drain();
ok('編集notFound: トースト', _toasts.some(function(t){return /見つかりません/.test(t.m);}));

// ============================================================
print('--- 9) fitnessは代理削除可・weight系e1rmに影響なし ---');
reset([{id:'F1',pid:1,date:'2026-07-05',ts:'2026-07-05T10:00:00.000Z',fitness:{ftype:'ランニング',minutes:30},totalVolume:0,results:[]},
  sess('2026-07-07',130,{id:'W2'})],[],[]);
rebuildE1rmFrom(1,'2026-07-01',function(){},function(){});drain();
ok('前提: squat最新=E130', getLatestE1RM(1).squat.e1rm===E(130));
delTlogStaff('F1');drain();
ok('fitness削除: tlogから消える', !D.tlog.some(function(l){return idEq(l.id,'F1');}));
ok('fitness削除: squat e1rm不変(E130)', getLatestE1RM(1).squat.e1rm===E(130));

// ============================================================
print('--- 10) 【F1】過渡的両doc在籍（起動時archiveTlog競合）→両docから確実に削除し復活しない ---');
// 移送中: R が D.tlog（未除去）と tla_doc（step①で書込済）に同時在籍。delTlogStaffは所在候補の全docを掃除する。
reset([sess('2020-01-01',100,{id:'DUAL'})],[sess('2020-01-01',100,{id:'DUAL'})],[]);
ok('tlogDocKeys: 古い記録は両doc対象', tlogDocKeys({id:'DUAL',pid:1,date:'2020-01-01'}).length===2);
delTlogStaff('DUAL');drain();
ok('メインD.tlogから消えた', !D.tlog.some(function(l){return idEq(l.id,'DUAL');}));
ok('tla_docから消えた（サーバー側で復活しない）', !archDoc(tlaKey(1,'2020h1')).some(function(l){return idEq(l.id,'DUAL');}));
ok('_tlogArch(メモリ)から消えた', !_tlogArch.some(function(l){return idEq(l.id,'DUAL');}));
ok('tlogAll()にも現れない', !tlogAll().some(function(l){return idEq(l.id,'DUAL');}));

// ============================================================
print('--- 11) 【F3】別pidのrebuildが互いのコールバックを握りつぶさない（pid別世代トークン） ---');
reset([sess('2026-07-05',100,{id:'G1',pid:1}),sess('2026-07-05',100,{id:'G2',pid:2})],[],[]);
var gdone={};
rebuildE1rmFrom(1,'2026-07-01',function(){gdone[1]=1;},function(){gdone.e1=1;});
rebuildE1rmFrom(2,'2026-07-01',function(){gdone[2]=1;},function(){gdone.e2=1;});   // pid2の新rebuildが走ってもpid1の世代は無効化されない
drain();
ok('pid1のonDoneが発火（新pid2 rebuildに握りつぶされない）', gdone[1]===1);
ok('pid2のonDoneも発火', gdone[2]===1);
ok('両pidのe1rmが独立生成される', pidE1(1).some(function(r){return r.source==='rebuild';})&&pidE1(2).some(function(r){return r.source==='rebuild';}));

if(__fail)throw new Error(__fail+' failed');
print('ALL STAFF TLOG-EDIT TESTS PASSED');
