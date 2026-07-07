// Phase 2: 「今日のプログラム」カード（T.training）+ ホーム導線（T.home）のテスト
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_today_prog.js
// 仕様: cal本日weight ∧ ppNext()≠null → 今日のタイプのスロットメニューを1タップ開始。
//       ホームのppカード/「TODAY: PUSH DAY」ヒーローはタップでgo('training')直行。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};

var TODAY=todayStr();
myPid=1;
D.p=[{id:1,name:'テストPR',position:'PR',year:2,height:'180',weight:'100'}];
D.std=[];D.offday=[];D.ann=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.a=[];D.e1rm=[];D.rplan=[];D.r=[];D.ph=[];D.bc=[];D.f=[];D.tlog=[];D.chart=[];
D.tmenu=[
  {id:101,name:'PUSHプログラム',scope:'all',ptype:'push',ptypeTs:'2026-07-01T00:00:00.000Z',exercises:[{name:'ベンチプレス',estBase:'bench',sets:3,reps:5,rir:2},{name:'OHP'}]},
  {id:102,name:'PULLプログラム',scope:'all',ptype:'pull',ptypeTs:'2026-07-01T00:00:00.000Z',exercises:[{name:'デッドリフト',estBase:'deadlift',sets:3,reps:5,rir:2}]},
  {id:103,name:'汎用メニュー',scope:'all',exercises:[{name:'スクワット'}]}
];
D.cal=[{id:1,date:TODAY,type:'weight'}];
D.pp=[{id:1,type:'push',date:'2026-07-04',by:'staff'}];

print('--- T.training: 今日のプログラムカード ---');
T.training();
var h=__els['main'].innerHTML;
ok('カード表示: TODAY: PUSH DAY',has(h,'TODAY: PUSH DAY'));
ok('カード表示: スロットメニュー名',has(h,'PUSHプログラム'));
ok('カード表示: 種目数',has(h,'2種目'));
ok('開始ボタン→startTraining(スロットmenuId)',has(h,"startTraining('101')"));
ok('未実施なら実施済バッジなし',!has(h,'本日実施済')||h.indexOf('本日実施済')>h.indexOf('配布されたメニュー'));

// 本日実施済
D.tlog=[{id:'t1',pid:1,menuId:101,date:TODAY,results:[],totalVolume:0}];
T.training();
h=__els['main'].innerHTML;
ok('実施済: カード内に本日実施済バッジ',h.indexOf('本日実施済')>=0&&h.indexOf('本日実施済')<h.indexOf('配布されたメニュー'));
D.tlog=[];

// PULL日
D.pp=[{id:1,type:'pull',date:'2026-07-04',by:'auto'}];
T.training();
h=__els['main'].innerHTML;
ok('PULL日: TODAY: PULL DAY + PULLスロット',has(h,'TODAY: PULL DAY')&&has(h,"startTraining('102')"));

print('--- T.training: カードを出さないケース ---');
// 非weight日
D.pp=[{id:1,type:'push',date:'2026-07-04',by:'staff'}];
D.cal=[{id:1,date:TODAY,type:'practice'}];
T.training();
ok('非weight日 → カードなし',!has(__els['main'].innerHTML,'TODAY: PUSH DAY'));
D.cal=[{id:1,date:TODAY,type:'weight'}];
// pp未初期化
D.pp=[];
T.training();
ok('pp未初期化 → カードなし',!has(__els['main'].innerHTML,'TODAY:'));
D.pp=[{id:1,type:'push',date:'2026-07-04',by:'staff'}];
// スロット未設定
var saved=D.tmenu;
D.tmenu=[{id:103,name:'汎用メニュー',scope:'all',exercises:[{name:'スクワット'}]}];
T.training();
ok('スロット未設定 → カードなし',!has(__els['main'].innerHTML,'TODAY:'));
// 配布対象外スロット（異常データ: scope個別）
D.tmenu=[{id:101,name:'他人専用PUSH',scope:99,ptype:'push',exercises:[]}];
T.training();
ok('配布対象外scopeのスロット → カードなし',!has(__els['main'].innerHTML,'TODAY:'));
D.tmenu=saved;

print('--- T.home: ヒーロー/ppカードのトレーニング導線 ---');
D.ann=[{id:1,date:TODAY,text:'連絡',targetPid:1,readBy:[]}]; // ベルバッジを出す
T.home();
var hh=__els['main'].innerHTML;
ok('ヒーローkickがTODAY: PUSH DAY',has(hh,'TODAY: PUSH DAY'));
ok("ヒーローにgo('training')導線",has(hh,'hero tex-noise rv" onclick="go(\'training\')"'));
ok('ベルバッジはstopPropagationでマイページ維持',has(hh,'event.stopPropagation();go(\'mypage\')'));
ok("ppカードがgo('training')ラップ",has(hh,'<div onclick="go(\'training\')" style="cursor:pointer"><div class="card"'));
// 非weight日はヒーロー導線なし
D.cal=[{id:1,date:TODAY,type:'practice'}];
T.home();
hh=__els['main'].innerHTML;
ok('非weight日: ヒーローに導線なし',!has(hh,'hero tex-noise rv" onclick'));
ok('非weight日でもppカード導線は維持',has(hh,'<div onclick="go(\'training\')" style="cursor:pointer">'));
// pp空: ppCardHtml(false)は'' → 空ラップdivを出さない
D.pp=[];
T.home();
hh=__els['main'].innerHTML;
ok('pp空: 空のラップdivを出さない',!has(hh,'<div onclick="go(\'training\')" style="cursor:pointer"></div>'));

if(__fail===0)print('ALL TODAY-PROG TESTS PASSED');else print(__fail+' TESTS FAILED');
