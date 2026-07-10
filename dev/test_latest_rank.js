// Phase1: ランク最新値化（getLatest / getLiftRankInfo.oneRM=最新+bestRM / getBroncoRankInfo=最新+bestSec）
// player / staff / coach いずれの抽出JSでも同一に通ること（3ファイル同期の担保）
var __fail=0;
function eq(name,got,want){
  var ok=(typeof want==='number'&&typeof got==='number')?Math.abs(got-want)<0.051:(got===want);
  if(!ok){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}
  else print('  ok '+name+' = '+JSON.stringify(got));
}
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}

// ---- 共通土台: PR(sq=1.55,bronco310)・体重100kg(登録値) ----
D.f=[];D.bc=[];D.std=[];
D.p=[{id:1,name:'最新テスト',position:'PR',year:3,height:'180',weight:'100'}];

print('--- getLatest: date降順で最新を取る（best≠latest） ---');
// 過去にSQ180(プラチナ相当)、直近はSQ140(シルバー相当)へ後退
D.ph=[
  {id:'a1',pid:1,date:'2026-01-01',squat:180,inputAt:1000},
  {id:'a2',pid:1,date:'2026-06-01',squat:140,inputAt:2000}
];
eq('getLatest squat = 最新140',getLatest(1,'squat'),140);
eq('getBest squat = ベスト180',getBest(1,'squat'),180);

print('--- getLiftRankInfo: oneRM=最新 / bestRM=ベスト / rank=最新基準 ---');
var sq=getLiftRankInfo(1,'sq');
eq('oneRM=最新140',sq.oneRM,140);
eq('bestRM=ベスト180',sq.bestRM,180);
// gold=1.55*100=155 → 140/155=0.903 → silver(0.85以上gold未満)
eq('rank=silver(最新基準)',sq.rank.k,'silver');
ok('bestRM!==oneRM（Best併記が出る条件）',sq.bestRM!==sq.oneRM);

print('--- 同日は inputAt(ISO文字列) 降順で最新 ---');
D.ph=[
  {id:'b1',pid:1,date:'2026-06-01',squat:140,inputAt:'2026-06-01T09:00:00.000Z'},
  {id:'b2',pid:1,date:'2026-06-01',squat:145,inputAt:'2026-06-01T15:30:00.000Z'}
];
eq('同日 inputAt後=145が最新',getLatest(1,'squat'),145);

print('--- inputAt無し（player doBronco想定）は id降順で最新 ---');
D.ph=[
  {id:'c1',pid:1,date:'2026-06-01',squat:150},
  {id:'c2',pid:1,date:'2026-06-01',squat:135}
];
// idはc2>c1（文字列降順）→ c2採用=135
eq('inputAt無し同日 id降順=135',getLatest(1,'squat'),135);

print('--- 単一記録なら latest==best（Best併記は出さない条件） ---');
D.ph=[{id:'d1',pid:1,date:'2026-05-01',squat:160,inputAt:500}];
var sq1=getLiftRankInfo(1,'sq');
eq('oneRM=160',sq1.oneRM,160);
eq('bestRM=160',sq1.bestRM,160);
ok('bestRM===oneRM（併記なし）',sq1.bestRM===sq1.oneRM);

print('--- bronco: 最新340(遅い)・ベスト300(速い) ---');
D.ph=[
  {id:'e1',pid:1,date:'2026-01-01',bronco:300,inputAt:1000},
  {id:'e2',pid:1,date:'2026-06-01',bronco:340,inputAt:2000}
];
eq('getLatest bronco=最新340',getLatest(1,'bronco'),340);
eq('getBest bronco=ベスト300(Math.min)',getBest(1,'bronco'),300);
var br=getBroncoRankInfo(1);
eq('bronco best(=表示値)=最新340',br.best,340);
eq('bronco bestSec=ベスト300',br.bestSec,300);
// gold310 → 310/340=0.91 → silver
eq('bronco rank=silver(最新基準)',br.rank.k,'silver');

print('--- bronco timeSecOpt経路は不変（ランキング測定会フィルタ用） ---');
var br2=getBroncoRankInfo(1,300);
eq('timeSecOpt=300 → best=300',br2.best,300);
// 310/300=1.033 → gold
eq('timeSecOpt=300 → rank=gold',br2.rank.k,'gold');
eq('timeSecOpt経路でも bestSec=ベスト300',br2.bestSec,300);

print('--- bronco>0 ガード: 0や欠損は最新に含めない ---');
D.ph=[
  {id:'f1',pid:1,date:'2026-01-01',bronco:305,inputAt:1000},
  {id:'f2',pid:1,date:'2026-07-01',bronco:0,inputAt:3000},
  {id:'f3',pid:1,date:'2026-08-01',squat:150,inputAt:4000}
];
eq('bronco0/欠損を無視し最新は305',getLatest(1,'bronco'),305);

print('--- getWeakLift は自己ベスト基準（デロード1回で強い種目を弱点誤判定しない） ---');
// SQ: best180(ratio1.16) latest120(ratio0.77) / BP: best100(ratio0.80)。自己ベスト基準ならBPが弱点、最新基準ならSQが弱点。
D.ph=[
  {id:'w1',pid:1,date:'2026-01-01',squat:180,bench:100,inputAt:'2026-01-01T10:00:00.000Z'},
  {id:'w2',pid:1,date:'2026-06-01',squat:120,inputAt:'2026-06-01T10:00:00.000Z'}
];
var wk=getWeakLift(1);
eq('弱点=BP（自己ベスト基準・SQのデロードに引きずられない）',wk&&wk.lift,'bp');

print('--- Best併記UI（ロード中サイトの表示関数のみ検証・latest≠best） ---');
var __els={};if(typeof document!=='undefined')document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
D.i=[];D.r=[];D.rplan=[];D.rlog=[];D.a=[];D.md=[];D.tlog=[];
D.p=[{id:1,name:'UIテスト',position:'PR',year:3,height:'180',weight:'100'}];
D.ph=[{id:'u1',pid:1,date:'2026-01-01',squat:180,bench:100,deadlift:200,bronco:300,inputAt:1000},
      {id:'u2',pid:1,date:'2026-06-01',squat:140,bench:90,deadlift:170,bronco:340,inputAt:2000}];
if(typeof myPhysCardHtml==='function'){ // player
  myPid=1;
  var ph=myPhysCardHtml();
  ok('[player]myPhys 最新140を主表示',ph.indexOf('>140<')>=0);
  ok('[player]myPhys Best180を併記',ph.indexOf('Best 180')>=0);
  var pbh=broncoRankCardHtml(getBroncoRankInfo(1),getStdCfg());
  ok('[player]bronco 自己ベスト併記',pbh.indexOf('自己ベスト '+broncoFmt(300))>=0);
  D.ph=[{id:'s1',pid:1,date:'2026-05-01',squat:160,inputAt:9}];
  ok('[player]単一記録ではBest併記を出さない',myPhysCardHtml().indexOf('Best ')<0);
}
if(typeof renderStdSummaryHTML==='function'){ // staff
  var sh=renderStdSummaryHTML(1);
  ok('[staff]SQ 最新140kg主表示',sh.indexOf('SQ 140kg')>=0);
  ok('[staff](Best 180)併記',sh.indexOf('(Best 180)')>=0);
  ok('[staff]bronco (Best)併記',sh.indexOf('(Best '+broncoFmt(300)+')')>=0);
}
if(typeof renderStdBadgesCoach==='function'){ // coach
  var ch=renderStdBadgesCoach(1);
  ok('[coach]SQ 最新140kg主表示',ch.indexOf('SQ 140kg')>=0);
  ok('[coach](Best 180)併記',ch.indexOf('(Best 180)')>=0);
}

print(__fail===0?'ALL LATEST-RANK TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('latest rank tests failed');
