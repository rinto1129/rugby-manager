// ブロンコ基準エンジン(getBroncoRankInfo / broncoFmt / STD_DEFAULT.bronco)の模擬実行テスト
// player / staff / coach いずれの抽出JSにロード後も同一に通ること（3ファイル同期の担保）
var __fail=0;
function eq(name,got,want){
  var ok;
  if(typeof want==='number'&&typeof got==='number')ok=Math.abs(got-want)<0.051;
  else ok=(got===want);
  if(!ok){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}
  else print('  ok '+name+' = '+JSON.stringify(got));
}
// ---- テストデータ ----
D.p=[
  {id:1,name:'PR ゴールド',position:'PR'},   // bronco基準 gold=310
  {id:2,name:'PR シルバー',position:'PR'},
  {id:3,name:'PR ダイヤ',position:'PR'},
  {id:4,name:'PR ランク外',position:'PR'},
  {id:5,name:'PR 未測定',position:'PR'},
  {id:6,name:'PR 複数記録',position:'PR'},
  {id:7,name:'ポジ無し',position:''},
  {id:8,name:'未定義ポジ',position:'ZZ'}
];
D.ph=[
  {id:11,pid:1,date:'2026-06-20',bronco:310},        // ちょうどgold
  {id:12,pid:2,date:'2026-06-20',bronco:311},        // gold-1sec→silver
  {id:13,pid:3,date:'2026-06-20',bronco:258},        // 310/258=1.20→diamond
  {id:14,pid:4,date:'2026-06-20',bronco:443},        // 310/443<0.70→ランク外
  // id5は記録なし
  {id:16,pid:6,date:'2026-06-01',bronco:320},        // 複数→minが採用される
  {id:17,pid:6,date:'2026-06-20',bronco:305}
];
D.bc=[];D.f=[];D.std=[];

print('--- STD_DEFAULT に bronco が入っているか ---');
var cfg0=getStdCfg();
eq('PR bronco gold=310',cfg0.pos.PR.bronco,310);
eq('HO bronco gold=310',cfg0.pos.HO.bronco,310);
eq('SH bronco gold=265',cfg0.pos.SH.bronco,265);
eq('WTB bronco gold=270',cfg0.pos.WTB.bronco,270);
eq('No.8 bronco gold=290',cfg0.pos['No.8'].bronco,290);

print('--- broncoFmt ---');
eq('290秒=4分50秒',broncoFmt(290),'4分50秒');
eq('310秒=5分10秒',broncoFmt(310),'5分10秒');
eq('265秒=4分25秒',broncoFmt(265),'4分25秒');
eq('0秒=0分00秒',broncoFmt(0),'0分00秒');
eq('null=-',broncoFmt(null),'-');

print('--- getBroncoRankInfo 基本ランク判定 ---');
var g=getBroncoRankInfo(1);
eq('best=310',g.best,310);
eq('goldSec',g.goldSec,310);
eq('ratio=1.0',g.ratio,1.0);
eq('rank=gold',g.rank&&g.rank.k,'gold');
eq('achieved=true',g.achieved,true);
eq('next=platinum',g.next&&g.next.k,'platinum');

var s=getBroncoRankInfo(2);
eq('311→rank=silver',s.rank&&s.rank.k,'silver');
eq('311→next=gold',s.next&&s.next.k,'gold');
eq('311→achieved=false',s.achieved,false);

var dia=getBroncoRankInfo(3);
eq('258→rank=diamond',dia.rank&&dia.rank.k,'diamond');
eq('258→next=null(最高)',dia.next,null);
eq('258→achieved=true',dia.achieved,true);
eq('258→nextTargetSec=null',dia.nextTargetSec,null);
eq('258→nextNeedSec=null',dia.nextNeedSec,null);

var ov=getBroncoRankInfo(4);
eq('443→rank=null(ランク外)',ov.rank,null);
eq('443→next=bronze',ov.next&&ov.next.k,'bronze');
eq('443→achieved=false',ov.achieved,false);

print('--- 記録なし ---');
var nb=getBroncoRankInfo(5);
eq('未測定→best=null',nb.best,null);
eq('未測定→ratio=0',nb.ratio,0);
eq('未測定→rank=null',nb.rank,null);
eq('未測定→next=bronze',nb.next&&nb.next.k,'bronze');
eq('未測定→achieved=false',nb.achieved,false);

print('--- getBest は bronco で min（速い方） ---');
var mr=getBroncoRankInfo(6);
eq('複数記録→best=305(min)',mr.best,305);

print('--- timeSecOpt 指定が getBest より優先 ---');
var to=getBroncoRankInfo(1,258); // 実記録310を無視して258で判定
eq('timeSecOpt=258→best=258',to.best,258);
eq('timeSecOpt=258→rank=diamond',to.rank&&to.rank.k,'diamond');

print('--- nextTargetSec / nextNeedSec ---');
// best=320（記録上書き）: 310/320=0.96875→next=gold, target=floor(310/1.0)=310, need=320-310=10
D.ph.push({id:18,pid:5,date:'2026-06-20',bronco:320});
var nt=getBroncoRankInfo(5);
eq('320→rank=silver',nt.rank&&nt.rank.k,'silver');
eq('320→next=gold',nt.next&&nt.next.k,'gold');
eq('320→nextTargetSec=310',nt.nextTargetSec,310);
eq('320→nextNeedSec=10',nt.nextNeedSec,10);

print('--- ポジション無し / 未定義ポジ → null ---');
eq('ポジ空→null',getBroncoRankInfo(7),null);
eq('未定義ポジ→null',getBroncoRankInfo(8),null);

print('--- getStdCfg 部分保存マージ（PRだけ300・HOはデフォルト310） ---');
D.std=[{pos:{PR:{bronco:300}}}];
var cfg1=getStdCfg();
eq('部分保存 PR bronco=300',cfg1.pos.PR.bronco,300);
eq('部分保存 HO bronco=310(デフォルト)',cfg1.pos.HO.bronco,310);
var g2=getBroncoRankInfo(1); // best=310, gold=300 → ratio=300/310=0.9677→silver
eq('PR基準300で310は silver',g2.rank&&g2.rank.k,'silver');
D.std=[];
var g3=getBroncoRankInfo(1);
eq('std解除でgoldに戻る',g3.rank&&g3.rank.k,'gold');

print('--- bronco:0 は無効値として除外（getBest >0 ガード） ---');
D.std=[];
D.p.push({id:9,name:'PR ゼロのみ',position:'PR'});
D.ph.push({id:19,pid:9,date:'2026-06-20',bronco:0}); // 0のみ→未測定扱い
var z=getBroncoRankInfo(9);
eq('bronco:0のみ→best=null',z.best,null);
eq('bronco:0のみ→rank=null',z.rank,null);
eq('bronco:0のみ→next=bronze',z.next&&z.next.k,'bronze');
D.p.push({id:10,name:'PR ゼロ混在',position:'PR'});
D.ph.push({id:20,pid:10,date:'2026-06-19',bronco:0});   // 無効
D.ph.push({id:21,pid:10,date:'2026-06-20',bronco:305}); // 有効
var zm=getBroncoRankInfo(10);
eq('0混在→best=305（0はmin誤検出せず除外）',zm.best,305);

print('--- broncoRanks: デフォルトは ranks と同値5件（挙動不変） ---');
D.std=[];
var cfgD=getStdCfg();
eq('broncoRanks 件数=5',cfgD.broncoRanks.length,5);
eq('broncoRanks[2]=gold',cfgD.broncoRanks[2].k,'gold');
eq('broncoRanks gold pct=1.00',cfgD.broncoRanks[2].pct,1.00);

print('--- broncoRanks: 専用閾値で判定（BIG3 ranks とは独立） ---');
D.std=[{broncoRanks:[
  {k:'bronze',label:'ブロンズ',pct:0.70,color:'#E8A05C'},
  {k:'silver',label:'シルバー',pct:0.90,color:'#C9D4E4'},
  {k:'gold',label:'ゴールド',pct:1.05,color:'#FFD24A'},
  {k:'platinum',label:'プラチナ',pct:1.15,color:'#6FE3E1'},
  {k:'diamond',label:'ダイヤ',pct:1.25,color:'#C084FC'}
]}];
var cfgB=getStdCfg();
eq('専用 broncoRanks gold pct=1.05',cfgB.broncoRanks[2].pct,1.05);
eq('BIG3 ranks gold pct=1.00 据置',cfgB.ranks[2].pct,1.00);
var bb=getBroncoRankInfo(1); // best=310 ratio=310/310=1.0 → 専用閾値gold(1.05)未満→silver
eq('専用閾値 310→rank=silver',bb.rank&&bb.rank.k,'silver');
eq('専用閾値 310→next=gold',bb.next&&bb.next.k,'gold');
D.std=[];
var bb2=getBroncoRankInfo(1); // 閾値解除→従来gold
eq('broncoRanks解除→rank=gold',bb2.rank&&bb2.rank.k,'gold');

print('--- broncoRanks: 空配列は ranks へフォールバック（従来同一） ---');
D.std=[{broncoRanks:[]}];
var cfgE=getStdCfg();
eq('空broncoRanks→ranksへフォールバックで5件',cfgE.broncoRanks.length,5);
eq('空→gold pct=1.00',cfgE.broncoRanks[2].pct,1.00);
var bb3=getBroncoRankInfo(1);
eq('空broncoRanks→従来gold',bb3.rank&&bb3.rank.k,'gold');
D.std=[];

print(__fail===0?'ALL TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('bronco std tests failed');
