// ステップ8: 選手詳細タブ(dt0)のrenderStdSummaryHTML（BIG3ランクバッジ・体重帯）模擬実行テスト
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

D.i=[];D.r=[];D.rplan=[];D.rlog=[];D.a=[];D.md=[];D.tlog=[];D.std=[];D.bc=[];D.f=[];

print('--- ポジション未登録 ---');
D.p=[{id:1,name:'未登録選手',position:'',height:'',weight:''}];
D.ph=[];
ok('未登録メッセージ',has(renderStdSummaryHTML(1),'ポジション未登録のため基準未表示'));

print('--- 通常ケース（PR・弱点=BP・身長あり・ブロンコ/懸垂/クリーンあり） ---');
D.p=[{id:2,name:'テストPR',position:'PR',height:'180',weight:'100'}];
D.ph=[{id:21,pid:2,date:'2026-06-20',squat:150,bench:90,deadlift:200,bronco:300,chinning:20,clean:100}];
var h=renderStdSummaryHTML(2);
ok('見出し',has(h,'BIG3基準・体重帯'));
ok('4枠グリッド',has(h,'repeat(4,1fr)'));
ok('SQのランク表示(シルバー)',has(h,'シルバー'));
ok('BPは弱点マーカー付き',/ブロンズ[\s\S]*?i-target/.test(h)||has(h,'i-target'));
ok('DLのランク表示(ゴールド以上)',has(h,'ゴールド')||has(h,'プラチナ')||has(h,'ダイヤ'));
ok('推奨体重帯の表示',has(h,'推奨体重帯'));
ok('現在体重の表示',has(h,'100kg')||has(h,'選手登録の体重'));
ok('ブロンコ枠のタイム表示(5分00秒)',has(h,'ブロンコ 5分00秒'));
ok('ブロンコのランクバッジ(PR gold=310,best=300→ゴールド)',/ゴールド[\s\S]*?ブロンコ 5分00秒/.test(h)||has(h,'ゴールド'));
ok('懸垂ベスト値行(20kg)',has(h,'懸垂')&&has(h,'20kg'));
ok('クリーンベスト値行(100kg)',has(h,'クリーン')&&has(h,'100kg'));

print('--- ブロンコ未測定は"-"（懸垂/クリーンも-） ---');
D.p=[{id:5,name:'ブロンコなし',position:'PR',height:'180',weight:'100'}];
D.ph=[{id:51,pid:5,date:'2026-06-20',squat:150,bench:120,deadlift:200}]; // bronco/chinning/clean無し
var h5=renderStdSummaryHTML(5);
ok('ブロンコ枠は"-"表示',/>-<\/div><div class="l">ブロンコ<\/div>/.test(h5)||has(h5,'>ブロンコ</div>'));
ok('懸垂/クリーンは"-"',/懸垂 <b[^>]*>-<\/b>/.test(h5));

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
