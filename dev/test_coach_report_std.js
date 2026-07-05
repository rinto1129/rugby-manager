// player大幅リニューアル ステップ⑧(coach)確認: renderStdBadgesCoach と renderPlayerReportのコンディション拡張(mood/stress/soreness平均)
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

function resetD(){
  D.p=[];D.i=[];D.r=[];D.ph=[];D.a=[];D.f=[];D.md=[];D.wc=[];D.bc=[];D.ann=[];D.offday=[];D.cal=[];
  D.matchsel=[];D.tape=[];D.tapeslot=[];D.trainers=[];D.rtpl=[];D.rplan=[];D.rlog=[];D.phskip=[];
  D.rtest_tpl=[];D.rtest=[];D.msess=[];D.injcomm=[];D.chart=[];D.taperec=[];D.tmenu=[];D.tlog=[];
  D.texlist=[];D.e1rm=[];D.std=[];
}

print('=== renderStdBadgesCoach（直接呼び出し） ===');
resetD();
print('--- ポジション未登録 ---');
D.p=[{id:1,name:'未登録選手',position:'',height:'',weight:''}];
ok('未登録メッセージ',has(renderStdBadgesCoach(1),'ポジション未登録のため基準未表示'));

print('--- 通常ケース（PR・弱点=BP・身長あり） ---');
D.p=[{id:2,name:'テストPR',position:'PR',height:'180',weight:'100'}];
D.ph=[{id:21,pid:2,date:'2026-06-20',squat:150,bench:90,deadlift:200}];
var h=renderStdBadgesCoach(2);
ok('見出し',has(h,'BIG3基準・体重帯'));
ok('SQのランク表示(シルバー)',has(h,'シルバー'));
ok('BPは弱点マーカー付き',/ブロンズ[^<]*🎯/.test(h)||has(h,'🎯'));
ok('DLのランク表示(ゴールド以上)',has(h,'ゴールド')||has(h,'プラチナ')||has(h,'ダイヤ'));
ok('推奨体重帯の表示',has(h,'推奨体重帯'));
ok('現在体重の表示',has(h,'100kg')||has(h,'選手登録の体重'));

print('--- 身長未登録 ---');
D.p=[{id:3,name:'身長なし',position:'SH',height:'',weight:'70'}];
D.ph=[{id:31,pid:3,date:'2026-06-20',squat:100,bench:70,deadlift:130}];
var h3=renderStdBadgesCoach(3);
ok('身長未登録の案内',has(h3,'身長未登録のため推奨体重帯は非表示'));
ok('SQ等のランクは出る',has(h3,'ブロンズ')||has(h3,'シルバー')||has(h3,'ゴールド')||has(h3,'プラチナ')||has(h3,'ダイヤ')||has(h3,'未到達'));

print('--- 1RM未測定種目は"-"表示 ---');
D.p=[{id:4,name:'未測定',position:'WTB',height:'170',weight:'75'}];
D.ph=[{id:41,pid:4,date:'2026-06-20',squat:120}]; // BP/DL未測定
var h4=renderStdBadgesCoach(4);
ok('未測定は-表示',(h4.match(/>-</g)||[]).length>=2);

print('=== renderPlayerReport 統合（BIG3バッジ埋め込み確認） ===');
resetD();
D.p=[{id:5,name:'レポート選手',position:'PR',year:2,height:'180',weight:'100'}];
D.ph=[{id:51,pid:5,date:'2026-06-20',squat:150,bench:90,deadlift:200}];
renderPlayerReport(5);
var hReport=document.getElementById('main').innerHTML;
ok('レポート内にBIG3基準バッジが埋め込まれる',has(hReport,'BIG3基準・体重帯'));
ok('コンソールエラー相当の例外なし完走',true); // renderPlayerReportが例外なく完走した時点でPASS扱い

print('--- ポジション未登録選手のレポートでも基準カードにフォールバック文言が出る ---');
resetD();
D.p=[{id:6,name:'ポジ未登録',position:'',year:1,height:'',weight:''}];
renderPlayerReport(6);
var hReport6=document.getElementById('main').innerHTML;
ok('フォールバック文言が埋め込まれる',has(hReport6,'ポジション未登録のため基準未表示'));

print('=== renderPlayerReport コンディション拡張(mood/stress/soreness) ===');
resetD();
D.p=[{id:10,name:'コンディション太郎',position:'PR',year:2,height:'180',weight:'100'}];

print('--- 拡張項目すべて記録あり ---');
D.f=[
  {id:1,pid:10,date:agoStr(1),rpe:7,sleep:7,mood:4,stress:2,soreness:3},
  {id:2,pid:10,date:agoStr(3),rpe:5,sleep:6,mood:5,stress:1,soreness:2}
];
renderPlayerReport(10);
var hA=document.getElementById('main').innerHTML;
ok('見出し「直近7日平均」あり',has(hA,'直近7日平均'));
ok('平均睡眠 6.5h',has(hA,'平均睡眠')&&has(hA,'6.5h'));
ok('平均疲労度 6.0',has(hA,'平均疲労度')&&has(hA,'6.0'));
ok('平均気分 4.5',has(hA,'平均気分')&&has(hA,'4.5'));
ok('平均ストレス 1.5',has(hA,'平均ストレス')&&has(hA,'1.5'));
ok('平均筋肉痛 2.5',has(hA,'平均筋肉痛')&&has(hA,'2.5'));

print('--- 拡張項目の記録が無い日のみ（基本項目のみ表示） ---');
D.f=[{id:3,pid:10,date:agoStr(2),rpe:6,sleep:7}];
renderPlayerReport(10);
var hB=document.getElementById('main').innerHTML;
ok('見出し「直近7日平均」あり',has(hB,'直近7日平均'));
ok('平均睡眠は表示',has(hB,'平均睡眠'));
ok('平均気分は表示されない',!has(hB,'平均気分'));
ok('平均ストレスは表示されない',!has(hB,'平均ストレス'));
ok('平均筋肉痛は表示されない',!has(hB,'平均筋肉痛'));

print('--- 直近7日間の記録が0件（カード自体が出ない） ---');
D.f=[{id:4,pid:10,date:agoStr(10),rpe:8,sleep:5,mood:1,stress:5,soreness:5}];
renderPlayerReport(10);
var hC=document.getElementById('main').innerHTML;
ok('コンディションカード自体が出ない',!has(hC,'直近7日平均'));

print(__fail===0?'ALL COACH-REPORT-STD TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('coach-report-std tests failed');
