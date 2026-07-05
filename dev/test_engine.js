// 基準エンジンの模擬実行テスト（player.jsロード後に実行）
var __fail=0;
function eq(name,got,want){
  var ok;
  if(typeof want==='number'&&typeof got==='number')ok=Math.abs(got-want)<0.051;
  else ok=(got===want);
  if(!ok){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}
  else print('  ok '+name+' = '+JSON.stringify(got));
}
// ---- テストデータ投入 ----
D.p=[
  {id:1,name:'テストPR',position:'PR',year:2,height:'180',weight:'100'},
  {id:2,name:'テストWTB',position:'WTB',year:3,height:'175',weight:'85'},
  {id:3,name:'未登録SH',position:'SH',year:1,height:'',weight:''}
];
D.ph=[
  {id:11,pid:1,date:'2026-06-20',squat:150,bench:110,deadlift:180},
  {id:12,pid:1,date:'2026-05-01',squat:140},
  {id:13,pid:2,date:'2026-06-25',squat:150,bench:100}
];
D.bc=[{id:21,pid:1,date:'2026-06-28',weight:102,fat:16,muscle:48}];
D.f=[{id:31,pid:1,date:'2026-07-01',rpe:5,sleep:7,duration:60,weight:101}];
D.std=[];

print('--- getCurrentWeightInfo ---');
var w1=getCurrentWeightInfo(1);
eq('PR 30日平均体重',w1.w,101.5);
var w2=getCurrentWeightInfo(2);
eq('WTB 登録体重フォールバック',w2.w,85);
eq('WTB src',w2.src,'選手登録の体重');
eq('未登録はnull',getCurrentWeightInfo(3),null);

print('--- getLiftRankInfo (PR, SQ) ---');
var sq=getLiftRankInfo(1,'sq');
eq('goldTarget',sq.goldTarget,157.3);
eq('rank=シルバー',sq.rank&&sq.rank.k,'silver');
eq('next=ゴールド',sq.next&&sq.next.k,'gold');
eq('nextNeedKg',sq.nextNeedKg,7.5);
eq('relBW',sq.relBW,1.48);

print('--- getLiftRankInfo (PR, BP/DL) ---');
var bp=getLiftRankInfo(1,'bp');
eq('BP rank=シルバー',bp.rank&&bp.rank.k,'silver');
eq('BP nextNeed',bp.nextNeedKg,17);
var dl=getLiftRankInfo(1,'dl');
eq('DL rank=シルバー',dl.rank&&dl.rank.k,'silver');
eq('DL nextNeed',dl.nextNeedKg,13);

print('--- getLiftRankInfo (WTB=gold帯, 未測定, noWeight) ---');
var wsq=getLiftRankInfo(2,'sq');
eq('WTB SQ rank=ゴールド',wsq.rank&&wsq.rank.k,'gold');
eq('WTB SQ next=プラチナ',wsq.next&&wsq.next.k,'platinum');
eq('WTB SQ nextNeed',wsq.nextNeedKg,9);
var wdl=getLiftRankInfo(2,'dl');
eq('WTB DL未測定 oneRM',wdl.oneRM,null);
eq('WTB DL未測定 rank',wdl.rank,null);
var nw=getLiftRankInfo(3,'sq');
eq('体重なし→noWeight',nw.noWeight,true);

print('--- getWeakLift ---');
var wk=getWeakLift(1);
eq('PR弱点=BP',wk&&wk.lift,'bp');
var wk2=getWeakLift(3);
eq('データ不足はnull',wk2,null);

print('--- getAlloScore ---');
eq('PR SQ allo',getAlloScore(1,'sq'),32.7);
eq('未測定はnull',getAlloScore(2,'dl'),null);

print('--- getWeightBandInfo ---');
var b1=getWeightBandInfo(1);
eq('PR帯 下限',b1.lo,94.2);
eq('PR帯 上限',b1.hi,113.4);
eq('PR帯 状態=帯内',b1.status,'in');
var b3=getWeightBandInfo(3);
eq('身長なし→noHeight',b3.noHeight,true);

print('--- getCurrentFFMIInfo ---');
var f1=getCurrentFFMIInfo(1);
eq('PR FFMI',f1.ffmi,26.4);
eq('PR FFM',f1.ffm,85.7);
eq('体組成なしはnull',getCurrentFFMIInfo(2),null);

print('--- getStdCfg マージ ---');
D.std=[{pos:{PR:{sq:1.8}},ranks:null}];
var cfg=getStdCfg();
eq('保存値が優先',cfg.pos.PR.sq,1.8);
eq('未保存フィールドはデフォルト',cfg.pos.PR.bp,1.25);
eq('ranksはデフォルト維持',cfg.ranks.length,5);
D.std=[];
var sq2=getLiftRankInfo(1,'sq');
eq('std解除で元に戻る',sq2.goldTarget,157.3);

print(__fail===0?'ALL TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('engine tests failed');
