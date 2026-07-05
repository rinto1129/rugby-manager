// ステップ8: 選手詳細タブ(dt0)のrenderStdSummaryHTML（BIG3ランクバッジ・体重帯）模擬実行テスト
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

D.i=[];D.r=[];D.rplan=[];D.rlog=[];D.a=[];D.md=[];D.tlog=[];D.std=[];D.bc=[];D.f=[];

print('--- ポジション未登録 ---');
D.p=[{id:1,name:'未登録選手',position:'',height:'',weight:''}];
D.ph=[];
ok('未登録メッセージ',has(renderStdSummaryHTML(1),'ポジション未登録のため基準未表示'));

print('--- 通常ケース（PR・弱点=BP・身長あり） ---');
D.p=[{id:2,name:'テストPR',position:'PR',height:'180',weight:'100'}];
D.ph=[{id:21,pid:2,date:'2026-06-20',squat:150,bench:90,deadlift:200}];
var h=renderStdSummaryHTML(2);
ok('見出し',has(h,'BIG3基準・体重帯'));
ok('SQのランク表示(シルバー)',has(h,'シルバー'));
ok('BPは弱点マーカー付き',/ブロンズ[^<]*🎯/.test(h)||has(h,'🎯'));
ok('DLのランク表示(ゴールド以上)',has(h,'ゴールド')||has(h,'プラチナ')||has(h,'ダイヤ'));
ok('推奨体重帯の表示',has(h,'推奨体重帯'));
ok('現在体重の表示',has(h,'100kg')||has(h,'選手登録の体重'));

print('--- 身長未登録 ---');
D.p=[{id:3,name:'身長なし',position:'SH',height:'',weight:'70'}];
D.ph=[{id:31,pid:3,date:'2026-06-20',squat:100,bench:70,deadlift:130}];
var h3=renderStdSummaryHTML(3);
ok('身長未登録の案内',has(h3,'身長未登録のため推奨体重帯は非表示'));
ok('SQ等のランクは出る',has(h3,'ブロンズ')||has(h3,'シルバー')||has(h3,'ゴールド')||has(h3,'プラチナ')||has(h3,'ダイヤ')||has(h3,'未到達'));

print('--- 1RM未測定種目は"-"表示 ---');
D.p=[{id:4,name:'未測定',position:'WTB',height:'170',weight:'75'}];
D.ph=[{id:41,pid:4,date:'2026-06-20',squat:120}]; // BP/DL未測定
var h4=renderStdSummaryHTML(4);
ok('未測定は-表示',(h4.match(/>-</g)||[]).length>=2);

print(__fail===0?'ALL STAFF-PDETAIL-STD TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('staff-pdetail-std tests failed');
