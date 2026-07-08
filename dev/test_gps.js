// Phase 9-A (staff側): GPS取込エンジン（パーサ / 名前照合 / 保存）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_gps.js
// 仕様（プランPhase 9-A節）:
//  - normName=NFKC+空白除去 / surnameKey=姓トークン / gpsNum=単位混在耐性
//  - parseGpsGrid=固定列プリセット・合計列採用・データ開始後の非採用行で打ち切り・km→m
//  - matchGpsRows=gmap辞書>姓一意=auto / 姓重複=ambig / 不一致=none
//  - gpsCommit=gr_<id>直set→gs索引svSafeUpdate(冪等)→gmap学習 / gpsLoadRows / gpsDelSession
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function eq(name,got,want){var e;if(typeof want==='number'&&typeof got==='number')e=Math.abs(got-want)<0.051;else e=(got===want);if(!e){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}else print('  ok '+name+' = '+JSON.stringify(got));}
function drain(){for(var i=0;i<8;i++){if(typeof drainMicrotasks==='function')drainMicrotasks();}}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
alert=function(){};confirm=function(){return true;};

// ============ 0. SK/D ============
print('--- SK/D: gs/ms/gmap ---');
ok('SKにgs',SK.gs==='rm_gps_sessions');
ok('SKにms',SK.ms==='rm_match_stats');
ok('SKにgmap',SK.gmap==='rm_gps_namemap');
ok('D.gs配列',Array.isArray(D.gs));
ok('D.ms配列',Array.isArray(D.ms));
ok('D.gmap配列',Array.isArray(D.gmap));

// ============ 1. normName / surnameKey / gpsNum ============
print('--- normName / surnameKey / gpsNum ---');
eq('NFKC全角英数→半角',normName('ＡＢＣ１２３'),'ABC123');
eq('半角/全角空白除去',normName('宮本 　偉申'),'宮本偉申');
eq('surnameKey=姓(半角空白)',surnameKey('宮本 偉申'),'宮本');
eq('surnameKey=姓(全角空白)',surnameKey('前原　泰生'),'前原');
eq('surnameKey=複合姓',surnameKey('堀ノ内 悠'),'堀ノ内');
eq('gpsNum 数値そのまま',gpsNum(2.03),2.03);
eq('gpsNum 文字列小数',gpsNum('25.1'),25.1);
eq('gpsNum カンマ/単位除去',gpsNum('1,856m'),1856);
eq('gpsNum 全角数字',gpsNum('９０'),90);
ok('gpsNum 空はNaN',isNaN(gpsNum('')));
ok('gpsNum 非数はNaN',isNaN(gpsNum('－')));

// ============ 2. parseGpsGrid（実xlsxレイアウト再現） ============
print('--- parseGpsGrid ---');
// row0=結合ヘッダ / row1=列N / row2=前半後半合計(colB空) / row3〜=データ / 末尾=打ち切り
function mkrow(name,min,km,wr,hsr,hsrN,spr,sprN,max,z){
  var r=[];for(var i=0;i<34;i++)r[i]='';
  r[0]=1;r[1]=name;
  r[2]=0;r[3]=0;r[4]=min;      // 出場時間 前/後/合計
  r[5]=0;r[6]=0;r[7]=km;       // 総計距離km
  r[8]=0;r[9]=0;r[10]=wr;      // ワークレート
  r[11]=0;r[12]=0;r[13]=hsr;   // 力走(m)
  r[14]=0;r[15]=0;r[16]=hsrN;  // 力走努力(回)
  r[17]=0;r[18]=0;r[19]=spr;   // スプリント(m)
  r[20]=0;r[21]=0;r[22]=sprN;  // スプリント努力(回)
  r[23]=0;r[24]=0;r[25]=max;   // 最高速度(m/s)
  r[26]=1;r[27]=name;          // 第2ブロック #+名前
  for(var zi=0;zi<6;zi++)r[28+zi]=z[zi];
  return r;
}
var hdr0=[];hdr0[1]='名前';
var hdr1=[];hdr1[1]='列2';hdr1[4]='列5';           // 『列N』ヘッダ（数字を含むが名前ではない）
var hdr2=[];hdr2[1]='';hdr2[2]='前半';hdr2[3]='後半';hdr2[4]='合計'; // colB空
var grid=[
  hdr0,hdr1,hdr2,
  mkrow('宮本',90,2.03,25.1,0,0,0,0,5.2,[1856,153,24,0,0,0]),
  mkrow('田中',80,6.5,81.3,420,12,180,6,7.85,[3000,1500,1200,500,180,120]),
  mkrow('新人',0,0,0,0,0,0,0,0,[0,0,0,0,0,0]),         // 0分出場（実名）→採用される
  [], // 空行 → データ開始後なので打ち切り
  mkrow('みやもと',99,9.9,99,99,9,99,9,9.9,[9,9,9,9,9,9]) // 打ち切り後なので拾わない（ふりがな別表想定）
];
var pg=parseGpsGrid(grid);
eq('採用行数=3',pg.rows.length,3);
ok('データ開始後の空行で打ち切り',/^row/.test(pg.stopped));
eq('宮本 min',pg.rows[0].min,90);
eq('宮本 dist(km→m)',pg.rows[0].dist,2030);
eq('宮本 wr',pg.rows[0].wr,25.1);
eq('宮本 max',pg.rows[0].max,5.2);
eq('宮本 zone合計',pg.rows[0].z.join(','),'1856,153,24,0,0,0');
eq('田中 dist',pg.rows[1].dist,6500);
eq('田中 hsr',pg.rows[1].hsr,420);
eq('田中 spr',pg.rows[1].spr,180);
eq('田中 sprN',pg.rows[1].sprN,6);
eq('田中 max',pg.rows[1].max,7.85);
eq('0分選手も採用(min0)',pg.rows[2].min,0);
eq('『列N』ヘッダ行を採用しない(先頭は宮本)',pg.rows[0].name,'宮本');
// 空グリッド
eq('空グリッドは0行',parseGpsGrid([]).rows.length,0);

// ============ 3. parseGpsTSV ============
print('--- parseGpsTSV ---');
function tsvrow(name,min,km){var r=[];for(var i=0;i<34;i++)r[i]='';r[0]=1;r[1]=name;r[4]=min;r[7]=km;r[10]=20;r[27]=name;for(var zi=0;zi<6;zi++)r[28+zi]=0;return r.join('\t');}
var tsv=['\t名前','',tsvrow('黒岩',70,3.2),tsvrow('平山',65,2.8)].join('\n');
var pt=parseGpsTSV(tsv);
eq('TSV採用行数=2',pt.rows.length,2);
eq('TSV 黒岩 dist',pt.rows[0].dist,3200);
eq('TSV 平山 min',pt.rows[1].min,65);

// ============ 4. matchGpsRows ============
print('--- matchGpsRows ---');
var players=[{id:1,name:'宮本 偉申'},{id:2,name:'田中 太郎'},{id:3,name:'古賀 一'},{id:4,name:'古賀 渉斗'},{id:5,name:'渡邉 陽平'}];
var mrows=[{name:'宮本'},{name:'田中'},{name:'古賀'},{name:'知らない'}];
var m1=matchGpsRows(mrows,players,{});
eq('宮本 一意→auto pid1',m1[0].status+':'+m1[0].pid,'auto:1');
eq('田中 一意→auto pid2',m1[1].status+':'+m1[1].pid,'auto:2');
eq('古賀 重複→ambig',m1[2].status,'ambig');
eq('古賀 候補=[3,4]',m1[2].cand.join(','),'3,4');
ok('古賀 pidはnull',m1[2].pid===null);
eq('知らない→none',m1[3].status,'none');
// gmap辞書で重複を解決
var m2=matchGpsRows(mrows,players,{'古賀':4});
eq('gmap辞書で古賀→auto pid4',m2[2].status+':'+m2[2].pid,'auto:4');
// gmapが実在しないpidを指す場合は無視して姓照合へフォールバック
var m3=matchGpsRows([{name:'宮本'}],players,{'宮本':999});
eq('gmap無効pidは姓照合へ',m3[0].status+':'+m3[0].pid,'auto:1');

// ============ 5. gpsNameMap ============
print('--- gpsNameMap ---');
D.gmap=[{id:'namemap',map:{'渡邉':47}}];
eq('gpsNameMap読み出し',gpsNameMap()['渡邉'],47);
D.gmap=[];
eq('gmap空→空オブジェクト',Object.keys(gpsNameMap()).length,0);

// ============ 6. gpsCommit（保存・冪等・学習） ============
print('--- gpsCommit ---');
__store={};D.gs=[];D.gmap=[];_grCache={};
D.p=players;
var committed=null;
var matched=matchGpsRows([{name:'宮本'},{name:'田中'},{name:'知らない'}],players,{});
// 3行目(知らない)はpid null → 保存対象外
gpsCommit(matched.map(function(m,i){m.row=pg.rows[Math.min(i,2)]||{min:0,dist:0,wr:0,hsr:0,hsrN:0,spr:0,sprN:0,max:0,z:[0,0,0,0,0,0]};return m;}),
  {id:999,date:'2026-07-01',kind:'practice',label:'火曜練習',team:''},
  function(id,n){committed={id:id,n:n};});
drain();
ok('onDone発火',committed!==null);
eq('保存人数=2(pid確定のみ)',committed&&committed.n,2);
ok('gr_999がstoreに存在',__store['gr_999']!=null);
eq('gr_999 行数=2',JSON.parse(__store['gr_999']||'[]').length,2);
eq('gr_999 先頭pid=1',JSON.parse(__store['gr_999']||'[]')[0].pid,1);
eq('D.gs 索引1件',D.gs.length,1);
eq('gs.id=999',D.gs[0].id,999);
eq('gs.n=2',D.gs[0].n,2);
eq('gs.date',D.gs[0].date,'2026-07-01');
eq('gs.kind',D.gs[0].kind,'practice');
// gmap学習: 宮本→1, 田中→2（知らないは学習しない）
var nm=gpsNameMap();
eq('gmap学習 宮本→1',nm['宮本'],1);
eq('gmap学習 田中→2',nm['田中'],2);
ok('gmap学習 知らないは含まない',nm['知らない']===undefined);
// 冪等: 同id再コミット→gs重複しない
gpsCommit(matched,{id:999,date:'2026-07-01',kind:'practice',label:'火曜練習',team:''},function(){});
drain();
eq('冪等: 同id再コミットでもgsは1件',D.gs.length,1);

// ============ 7. gpsLoadRows（オンデマンド読み） ============
print('--- gpsLoadRows ---');
delete _grCache[999];
var loaded=null;
gpsLoadRows(999,function(rows){loaded=rows;});
drain();
ok('gpsLoadRowsで復元',loaded&&loaded.length===2);
eq('復元先頭pid',loaded[0].pid,1);
// キャッシュ経由
var cached=null;gpsLoadRows(999,function(rows){cached=rows;});drain();
ok('2回目はキャッシュ',cached&&cached.length===2);

// ============ 8. gpsDelSession ============
print('--- gpsDelSession ---');
gpsDelSession(999);
drain();
eq('削除後gs=0件',D.gs.length,0);
eq('gr_999は空化',__store['gr_999'],'[]');
ok('キャッシュも破棄',_grCache[999]===undefined);

// ============ 9. gmap学習ガード（HIGH所見の回帰）: 曖昧姓は学習しない / 一意姓・異体字は学習する ============
print('--- gmap学習ガード（曖昧姓） ---');
__store={};D.gs=[];D.gmap=[];_grCache={};D.p=players; // players に 古賀×2 と 渡邉 を含む
var dummyRow={min:70,dist:4000,wr:55,hsr:150,hsrN:4,spr:80,sprN:2,max:6.5,z:[0,0,0,0,0,0]};
var amb=[
  {name:'宮本',key:'宮本',row:dummyRow,pid:1,status:'auto',cand:[]},
  {name:'古賀',key:'古賀',row:dummyRow,pid:3,status:'manual',cand:[3,4]},      // 同姓2名を手動解決
  {name:'渡邊',key:normName('渡邊'),row:dummyRow,pid:5,status:'manual',cand:[]}  // 異体字(rosterは渡邉)→姓照合不能を手動解決
];
gpsCommit(amb,{id:1001,date:'2026-07-03',kind:'practice',label:'',team:''},function(){});
drain();
var nm2=gpsNameMap();
ok('曖昧姓(古賀×2)はgmapに学習しない',nm2['古賀']===undefined);
eq('一意姓(宮本)は学習する',nm2['宮本'],1);
eq('異体字(渡邊)は学習する',nm2[normName('渡邊')],5);
eq('曖昧姓の行自体は保存される(3名)',D.gs[0].n,3);

print(__fail===0?'\nALL PASS (test_gps)':'\n'+__fail+' FAILED (test_gps)');
