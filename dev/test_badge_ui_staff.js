// Phase8: staff選手詳細のバッジ一覧(renderBadgeListStaff)の模擬実行テスト（staff専用・ライトテーマ）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
todayStr=function(){return'2026-08-01';};

D.f=[];D.bc=[];D.std=[];D.phskip=[];D.i=[];D.r=[];D.tlog=[];
D.p=[{id:1,name:'田中',position:'PR',weight:'100'},{id:2,name:'佐藤',position:'HO',weight:'110'}];

print('--- 0件: 1行「まだバッジがありません」 ---');
D.msess=[];D.ph=[];
var h0=renderBadgeListStaff(1);
ok('見出し 獲得バッジ',has(h0,'獲得バッジ'));
ok('0件メッセージ',has(h0,'まだバッジがありません'));

print('--- バッジあり: 測定会別＋合計pt＋escape ---');
D.msess=[{id:'S1',name:'第2回<測定>会',mtype:'phys',startDate:'2026-06-01',endDate:'2026-06-02'}];
D.ph=[
  {id:'a',pid:1,date:'2026-06-01',msessId:'S1',squat:180,bench:120,deadlift:210},
  {id:'b',pid:2,date:'2026-06-01',msessId:'S1',squat:150,bench:100,deadlift:180}
];
var h=renderBadgeListStaff(1);
ok('合計pt表記',has(h,'合計 ')&&has(h,'pt'));
ok('測定会名escapeHtml',has(h,'第2回&lt;測定&gt;会'));
ok('生の<測定>は出さない',!has(h,'第2回<測定>会'));
ok('チップに+pts',/\+\d/.test(h));
ok('ライトテーマ: darkenForLightで暗転色(#で始まる色指定)',has(h,'color:#'));

print('--- 特別バッジ（クラブ）グループ ---');
D.ph.push({id:'big',pid:1,date:'2026-05-20',squat:230,bench:180,deadlift:240}); // FW600クラブ
var h2=renderBadgeListStaff(1);
ok('特別バッジ',has(h2,'特別バッジ'));
ok('BIG3クラブ',has(h2,'BIG3クラブ'));

print(__fail===0?'ALL BADGE-UI-STAFF TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('badge ui staff tests failed');
