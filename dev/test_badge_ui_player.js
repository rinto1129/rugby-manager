// Phase5: player マイデータ「獲得バッジ」セクション(renderMyBadgesHtml)の模擬実行テスト（player専用）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
todayStr=function(){return'2026-08-01';};
var __els={};document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

D.f=[];D.bc=[];D.std=[];D.phskip=[];
D.p=[{id:1,name:'自分',position:'PR',weight:'100'},{id:2,name:'相手',position:'HO',weight:'110'}];

print('--- 0件: 空状態カード ---');
D.msess=[];D.ph=[];myPid=1;
var h0=renderMyBadgesHtml();
ok('見出し「獲得バッジ」',has(h0,'獲得バッジ'));
ok('空状態メッセージ',has(h0,'まだバッジがありません'));
ok('空状態ではヒーロー非表示',!has(h0,'badge-hero'));

print('--- バッジあり: ヒーロー＋測定会別コレクション＋チップ ---');
D.msess=[
  {id:'S1',name:'第1回MAX測定',mtype:'phys',startDate:'2026-04-01',endDate:'2026-04-02'},
  {id:'S2',name:'第2回<MAX>測定',mtype:'phys',startDate:'2026-06-01',endDate:'2026-06-02'}
];
D.ph=[
  {id:'a',pid:1,date:'2026-04-01',msessId:'S1',squat:150,bench:100,deadlift:180},
  {id:'b',pid:1,date:'2026-06-01',msessId:'S2',squat:180,bench:120,deadlift:210}, // 伸び＋PB＋ランク
  {id:'c',pid:2,date:'2026-06-01',msessId:'S2',squat:160,bench:110,deadlift:190}
];
myPid=1;
var h=renderMyBadgesHtml();
ok('ヒーロー表示',has(h,'badge-hero'));
ok('合計バッジポイント文言',has(h,'合計バッジポイント'));
ok('ptヒーロー単位',has(h,'badge-hero-unit'));
ok('測定会名がescapeHtmlされる',has(h,'第2回&lt;MAX&gt;測定'));
ok('生の<MAX>は出さない',!has(h,'第2回<MAX>測定'));
ok('チップに+pts表記',/\+\d/.test(h));
ok('badge-chipクラス',has(h,'badge-chip'));
ok('折りたたみトグルhandler',has(h,'toggleMdBadge('));

print('--- 特別バッジ（クラブ）は「特別バッジ」グループへ ---');
D.ph.push({id:'big',pid:1,date:'2026-05-20',squat:230,bench:180,deadlift:240}); // best big3=... FW600クラブ狙い
// P1 best: sq max(150,180,230)=230,bp max(100,120,180)=180,dl max(180,210,240)=240 → 650 >=600 FW
var h2=renderMyBadgesHtml();
ok('特別バッジグループ',has(h2,'特別バッジ'));
ok('BIG3クラブ ラベル',has(h2,'BIG3クラブ'));

print('--- window._mdBadgeOpen 折りたたみ耐性 ---');
window._mdBadgeOpen={'S2':false};
var h3=renderMyBadgesHtml();
ok('S2を閉じたら▼表示',has(h3,'▼'));
window._mdBadgeOpen={};

print('--- ホーム控えめハイライト myBadgeHomeHtml ---');
myPid=1;
var hm=myBadgeHomeHtml();
ok('ホーム: 獲得バッジ＋pt表示',has(hm,'獲得バッジ')&&has(hm,'pt'));
ok('ホーム: タップでマイデータ',has(hm,"go('mydata')"));
ok('ホーム: チップ or 個数表示',has(hm,'badge-chip')||has(hm,'個のバッジ'));
D.msess=[];D.ph=[];
ok('ホーム: 0件は空文字(非表示)',myBadgeHomeHtml()==='');

print(__fail===0?'ALL BADGE-UI-PLAYER TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('badge ui player tests failed');
