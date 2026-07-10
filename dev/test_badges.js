// Phase4: computeAllBadges エンジン＋getWeightInfoAt の模擬実行テスト（player/staff 双方で同一に通ること）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function eq(name,got,want){var o=(typeof want==='number'&&typeof got==='number')?Math.abs(got-want)<0.051:(got===want);if(!o){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}else print('  ok '+name+' = '+JSON.stringify(got));}

todayStr=function(){return'2026-08-01';};

// ---- 選手（無指定は登録体重を使用＝getWeightInfoAtが登録値へフォールバック） ----
D.p=[
  {id:1,name:'P1',position:'PR',weight:'100'}, // FW
  {id:2,name:'P2',position:'HO',weight:'110'}, // FW
  {id:3,name:'P3',position:'SH',weight:'75'},  // BK
  {id:4,name:'P4',position:'SO',weight:'80'}   // BK
];
D.f=[];D.bc=[];D.std=[];D.phskip=[];
D.msess=[
  {id:'S1',name:'第1回MAX測定',mtype:'phys',startDate:'2026-04-01',endDate:'2026-04-02'}, // 確定(猶予超)
  {id:'S2',name:'第2回MAX測定',mtype:'phys',startDate:'2026-06-01',endDate:'2026-06-02'}, // 確定
  {id:'S3',name:'第1回ブロンコ',mtype:'bronco',startDate:'2026-06-10',endDate:'2026-06-11'}, // 確定
  {id:'S4',name:'第3回MAX測定',mtype:'phys',startDate:'2026-07-25',endDate:'2026-07-26'}  // 未確定(猶予内)
];
D.ph=[
  // S1 phys
  {id:'r1',pid:1,date:'2026-04-01',msessId:'S1',squat:150,bench:100,deadlift:180},
  {id:'r2',pid:2,date:'2026-04-01',msessId:'S1',squat:160,bench:110,deadlift:190},
  {id:'r3',pid:3,date:'2026-04-01',msessId:'S1',squat:120,bench:90,deadlift:150},
  {id:'r4',pid:4,date:'2026-04-01',msessId:'S1',squat:110,bench:85,deadlift:140},
  // S2 phys
  {id:'r5',pid:1,date:'2026-06-01',msessId:'S2',squat:180,bench:120,deadlift:210},
  {id:'r6',pid:2,date:'2026-06-01',msessId:'S2',squat:165,bench:112,deadlift:192},
  {id:'r7',pid:3,date:'2026-06-01',msessId:'S2',squat:125,bench:92,deadlift:152},
  {id:'r8',pid:4,date:'2026-06-01',msessId:'S2',squat:110,bench:85,deadlift:140},
  // S3 bronco
  {id:'r9',pid:1,date:'2026-06-10',msessId:'S3',bronco:300},
  {id:'r10',pid:3,date:'2026-06-10',msessId:'S3',bronco:260},
  // クラブ用: P2の期間外(どの確定会にも属さない)高記録 → getBestBIG3(P2)=610 → FW600クラブ
  {id:'rc',pid:2,date:'2026-05-20',squat:220,bench:160,deadlift:230},
  // S4 未確定 → 種目/1位/PB/皆勤バッジは生成されない（best基準のクラブには影響するため値は控えめに）
  {id:'r11',pid:1,date:'2026-07-25',msessId:'S4',squat:170,bench:115,deadlift:205}
];
// P4はS3ブロンコを「測定なし」申告 → 皆勤救済
D.phskip=[{pid:4,date:'2026-06-10',msessId:'S3',reason:'怪我'}];

var res=computeAllBadges();
function badgesOf(pid){return res.byPid[String(pid)]||[];}
function fB(pid,pred){return badgesOf(pid).filter(pred);}

print('--- 確定測定会の抽出（S4=未確定は除外・昇順） ---');
eq('確定会は3件',res.sessions.length,3);
eq('昇順先頭=S1',res.sessions[0].id,'S1');
eq('昇順末尾=S3',res.sessions[2].id,'S3');
ok('S4のバッジは一切生成されない',[1,2,3,4].every(function(p){return fB(p,function(b){return b.sessId==='S4';}).length===0;}));

print('--- ランク到達（当時体重＝登録100kg・S2 P1） ---');
ok('P1 S2 SQ=プラチナ(180/155=1.16)',fB(1,function(b){return b.type==='rank'&&b.sessId==='S2'&&b.cat==='squat'&&b.rankK==='platinum';}).length===1);
ok('P1 S2 DL=プラチナ(210/190=1.11)',fB(1,function(b){return b.type==='rank'&&b.sessId==='S2'&&b.cat==='deadlift'&&b.rankK==='platinum';}).length===1);
ok('P1 S2 BP=シルバー(120/125=0.96)',fB(1,function(b){return b.type==='rank'&&b.sessId==='S2'&&b.cat==='bench'&&b.rankK==='silver';}).length===1);
eq('ランク到達バッジに当時体重100',(fB(1,function(b){return b.type==='rank'&&b.sessId==='S2'&&b.cat==='squat';})[0]||{}).weight,100);
ok('P1 プラチナ=4点',(fB(1,function(b){return b.type==='rank'&&b.sessId==='S2'&&b.cat==='squat';})[0]||{}).pts===4);

print('--- ブロンコ ランク到達（S3・体重非依存） ---');
ok('P1 ブロンコ=ゴールド(310/300=1.03)',fB(1,function(b){return b.type==='rank'&&b.sessId==='S3'&&b.cat==='bronco'&&b.rankK==='gold';}).length===1);
ok('P3 ブロンコ=ゴールド(265/260=1.02)',fB(3,function(b){return b.type==='rank'&&b.sessId==='S3'&&b.cat==='bronco'&&b.rankK==='gold';}).length===1);

print('--- 種目1位(全体)＆ポジ別1位（S2） ---');
ok('P1 S2 SQ 種目1位',fB(1,function(b){return b.type==='top1'&&b.sessId==='S2'&&b.cat==='squat';}).length===1);
ok('P1 S2 BIG3 種目1位',fB(1,function(b){return b.type==='top1'&&b.sessId==='S2'&&b.cat==='big3';}).length===1);
ok('全体1位のP1にはポジ別1位SQを出さない',fB(1,function(b){return b.type==='posTop1'&&b.sessId==='S2'&&b.cat==='squat';}).length===0);
ok('P3 S2 SQ ポジ別1位(BK)',fB(3,function(b){return b.type==='posTop1'&&b.sessId==='S2'&&b.cat==='squat'&&b.label.indexOf('BK')>=0;}).length===1);
ok('P3 S2 BIG3 ポジ別1位(BK)',fB(3,function(b){return b.type==='posTop1'&&b.sessId==='S2'&&b.cat==='big3';}).length===1);

print('--- ブロンコ 種目1位（min=最速がP3・S3） ---');
ok('P3 ブロンコ 種目1位(最速260)',fB(3,function(b){return b.type==='top1'&&b.sessId==='S3'&&b.cat==='bronco';}).length===1);
ok('P1はブロンコ全体1位でない',fB(1,function(b){return b.type==='top1'&&b.sessId==='S3'&&b.cat==='bronco';}).length===0);
ok('P1 ブロンコ ポジ別1位(FW)',fB(1,function(b){return b.type==='posTop1'&&b.sessId==='S3'&&b.cat==='bronco'&&b.label.indexOf('FW')>=0;}).length===1);

print('--- 伸び率MVP（phys: S1→S2 で P1が最大18.6%） ---');
ok('P1 phys MVP(S2)',fB(1,function(b){return b.type==='mvp'&&b.sessId==='S2'&&b.cat==='phys';}).length===1);
ok('他選手はphys MVPを取らない',[2,3,4].every(function(p){return fB(p,function(b){return b.type==='mvp'&&b.sessId==='S2';}).length===0;}));
ok('S1(初回phys)はMVPなし',[1,2,3,4].every(function(p){return fB(p,function(b){return b.type==='mvp'&&b.sessId==='S1';}).length===0;}));
ok('S3(初回bronco)はMVPなし',[1,2,3,4].every(function(p){return fB(p,function(b){return b.type==='mvp'&&b.sessId==='S3';}).length===0;}));

print('--- 自己ベスト更新（PB・初回対象外） ---');
ok('P1 S2 SQ PB(180>150)',fB(1,function(b){return b.type==='pb'&&b.sessId==='S2'&&b.cat==='squat';}).length===1);
ok('P1 S1(初回)はPBなし',fB(1,function(b){return b.type==='pb'&&b.sessId==='S1';}).length===0);
ok('P4 S2 SQ は同値(110=110)でPBなし',fB(4,function(b){return b.type==='pb'&&b.sessId==='S2'&&b.cat==='squat';}).length===0);

print('--- BIG3クラブ（ベスト基準・測定会非依存） ---');
ok('P2 FW600クラブ(best610)',fB(2,function(b){return b.type==='club';}).length===1);
ok('P1はクラブ未達(best510)',fB(1,function(b){return b.type==='club';}).length===0);
eq('クラブは10点',(fB(2,function(b){return b.type==='club';})[0]||{}).pts,10);

print('--- 皆勤賞（年ごと・skip救済・無断未入力NG） ---');
ok('P1 皆勤2026(全確定会done)',fB(1,function(b){return b.type==='allYear'&&b.year==='2026';}).length===1);
ok('P4 皆勤2026(S3はskip申告で救済)',fB(4,function(b){return b.type==='allYear'&&b.year==='2026';}).length===1);
ok('P2 皆勤なし(S3無断未入力)',fB(2,function(b){return b.type==='allYear';}).length===0);

print('--- totalPts整合（byPidのpts合計と一致） ---');
[1,2,3,4].forEach(function(p){
  var sum=badgesOf(p).reduce(function(s,b){return s+b.pts;},0);
  eq('P'+p+' totalPts=バッジpts合計',res.totalPts[String(p)]||0,sum);
});

print('--- getWeightInfoAt（当時体重の日付窓） ---');
D.f=[{pid:9,date:'2026-05-20',weight:'88'},{pid:9,date:'2026-05-25',weight:'92'},{pid:9,date:'2026-03-01',weight:'80'}];
D.bc=[];D.p.push({id:9,name:'W',position:'PR',weight:'100'});
var wi=getWeightInfoAt(9,'2026-06-02'); // 05-20,05-25が30日窓内 → 平均90
eq('30日窓の平均=90',wi.w,90);
var wi2=getWeightInfoAt(9,'2026-04-10'); // 窓内なし→それ以前直近実測03-01=80
eq('窓外は直近実測=80',wi2.w,80);
var wi3=getWeightInfoAt(9,'2026-01-01'); // 実測なし→登録100
eq('実測皆無は登録体重=100',wi3.w,100);

print(__fail===0?'ALL BADGES TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('badges tests failed');
