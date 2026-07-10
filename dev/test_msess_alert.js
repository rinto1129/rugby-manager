// Phase 7: player T.home の未入力アラート（測定会セッション基準）の模擬実行テスト
// 未入力→表示 / 入力済→非表示 / 記録なし(phskip)→非表示(バグ修正) / 締切後→非表示 / フォールバック / 猶予窓 / 未来除外 / ブロンコ⇔フィジカル文言
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

var _origTodayStr=todayStr;
todayStr=function(){return '2026-07-01';}; // 固定today

function resetD(){
  D.p=[{id:1,name:'選手1',position:'PR',year:2,height:'180',weight:'100'},{id:2,name:'選手2',position:'WTB',year:3,height:'175',weight:'85'}];
  D.ph=[];D.phskip=[];D.msess=[];
  D.std=[];D.offday=[];D.ann=[];D.cal=[];D.md=[];D.matchsel=[];D.i=[];D.wc=[];D.tape=[];D.pp=[];D.a=[];
  D.e1rm=[];D.rplan=[];D.r=[];D.bc=[];D.f=[];D.tlog=[];D.tmenu=[];D.tgroup=[];D.texlist=[];D.chart=[];
  if(typeof D.gs!=='undefined')D.gs=[];if(typeof D.ms!=='undefined')D.ms=[];
  myPid=1;curTab='home';
}
function renderHome(){T.home();return document.getElementById('main').innerHTML;}

var BR={fromCalType:'bronco_measure'};

print('--- ① 未締切・期間中・未入力 → 個人アラート＋チーム一覧 ---');
resetD();
D.msess=[{id:'m1',name:'ブロンコ測定会',fromCalType:'bronco_measure',startDate:'2026-06-30',endDate:'2026-07-02'}];
var h1=renderHome();
ok('個人アラート表示',has(h1,'『ブロンコ測定会』のブロンコ測定が未入力です'));
ok('チーム未入力一覧表示',has(h1,'『ブロンコ測定会』ブロンコ未入力'));
ok('チーム未入力=あと2名(名前一覧廃止)',has(h1,'あと2名'));
ok('チーム一覧に他選手名を出さない',!has(h1,'選手2'));

print('--- ② 本人が入力済 → 個人アラート消える・チームは残り1名 ---');
resetD();
D.msess=[{id:'m1',name:'ブロンコ測定会',fromCalType:'bronco_measure',startDate:'2026-06-30',endDate:'2026-07-02'}];
D.ph=[{id:1,pid:1,date:'2026-07-01',msessId:'m1',bronco:300}];
var h2=renderHome();
ok('入力済→個人アラート消える',!has(h2,'『ブロンコ測定会』のブロンコ測定が未入力です'));
ok('入力済→チームはあと1名',has(h2,'『ブロンコ測定会』ブロンコ未入力')&&has(h2,'あと1名'));

print('--- ③ 記録なし(phskip)申告済 → 個人アラート消える（バグ修正の要） ---');
resetD();
D.msess=[{id:'m1',name:'ブロンコ測定会',fromCalType:'bronco_measure',startDate:'2026-06-30',endDate:'2026-07-02'}];
D.phskip=[{pid:1,date:'2026-07-01',msessId:'m1',by:'staff'}];
var h3=renderHome();
ok('記録なし申告済→個人アラート消える',!has(h3,'『ブロンコ測定会』のブロンコ測定が未入力です'));
ok('記録なし→チームはあと1名',has(h3,'あと1名'));

print('--- ④ 締切後 → アラート・一覧とも消える ---');
resetD();
D.msess=[{id:'m1',name:'ブロンコ測定会',fromCalType:'bronco_measure',startDate:'2026-06-30',endDate:'2026-07-02',closed:true}];
var h4=renderHome();
ok('締切後→個人アラートなし',!has(h4,'『ブロンコ測定会』のブロンコ測定が未入力です'));
ok('締切後→チーム一覧なし',!has(h4,'『ブロンコ測定会』ブロンコ未入力'));

print('--- ⑤ 旧データ互換: msessId無し＆期間内日付 → done扱い ---');
resetD();
D.msess=[{id:'m1',name:'ブロンコ測定会',fromCalType:'bronco_measure',startDate:'2026-06-30',endDate:'2026-07-02'}];
D.ph=[{id:2,pid:1,date:'2026-07-01',bronco:280}]; // msessId無し・期間内
var h5=renderHome();
ok('フォールバックdone→個人アラート消える',!has(h5,'『ブロンコ測定会』のブロンコ測定が未入力です'));

print('--- ⑥ 猶予窓内（終了後14日以内）→ アラート継続 ---');
resetD();
D.msess=[{id:'m2',name:'6月ブロンコ',fromCalType:'bronco_measure',startDate:'2026-06-20',endDate:'2026-06-22'}]; // grace end 07-06
var h6=renderHome();
ok('猶予窓内→アラート継続',has(h6,'『6月ブロンコ』のブロンコ測定が未入力です'));

print('--- ⑦ 猶予超過（終了後14日超）→ アラートなし ---');
resetD();
D.msess=[{id:'m3',name:'旧ブロンコ',fromCalType:'bronco_measure',startDate:'2026-06-01',endDate:'2026-06-10'}]; // grace end 06-24 < today
var h7=renderHome();
ok('猶予超過→アラートなし',!has(h7,'『旧ブロンコ』のブロンコ測定が未入力です'));

print('--- ⑧ 未来のセッション → アラートなし ---');
resetD();
D.msess=[{id:'m4',name:'未来ブロンコ',fromCalType:'bronco_measure',startDate:'2026-07-05',endDate:'2026-07-06'}];
var h8=renderHome();
ok('未来→アラートなし',!has(h8,'『未来ブロンコ』のブロンコ測定が未入力です'));

print('--- ⑨ 非ブロンコ測定会 → 「フィジカル」文言／BIG3記録でdone ---');
resetD();
D.msess=[{id:'m5',name:'第1回MAX測定',startDate:'2026-06-30',endDate:'2026-07-02'}];
var h9=renderHome();
ok('非ブロンコ→フィジカル文言',has(h9,'『第1回MAX測定』のフィジカル測定が未入力です'));
ok('非ブロンコ→i-runでなくi-chart文脈(ブロンコ文言でない)',!has(h9,'『第1回MAX測定』のブロンコ測定が未入力です'));
resetD();
D.msess=[{id:'m5',name:'第1回MAX測定',startDate:'2026-06-30',endDate:'2026-07-02'}];
D.ph=[{id:3,pid:1,date:'2026-07-01',msessId:'m5',squat:150}]; // BIG3記録→done
var h9b=renderHome();
ok('非ブロンコ・BIG3記録→done扱いでアラート消える',!has(h9b,'『第1回MAX測定』のフィジカル測定が未入力です'));

print('--- ⑩ 複数セッション同時（ブロンコ猶予＋フィジカル期間中）→ 両方表示 ---');
resetD();
D.msess=[
  {id:'m2',name:'6月ブロンコ',fromCalType:'bronco_measure',startDate:'2026-06-20',endDate:'2026-06-22'},
  {id:'m5',name:'第1回MAX測定',startDate:'2026-06-30',endDate:'2026-07-02'}
];
var h10=renderHome();
ok('ブロンコ側アラート表示',has(h10,'『6月ブロンコ』のブロンコ測定が未入力です'));
ok('フィジカル側アラート表示',has(h10,'『第1回MAX測定』のフィジカル測定が未入力です'));

todayStr=_origTodayStr;
print(__fail===0?'ALL MSESS-ALERT TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('msess-alert tests failed');
