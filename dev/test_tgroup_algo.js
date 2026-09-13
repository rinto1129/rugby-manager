// ウエイトグループ分けv2 フェーズ3: 自動アルゴリズム（staff）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup_algo.js
// 仕様（dev/audit/PLAN_tgroup_v2.md #6〜#10/#15・2026-09-13改訂）:
//  - 重量=tgLiftWeights（60日窓・アーカイブ込みtlogAll）。一部の種目だけでも自動に含め、記録ゼロはプール
//  - 振分: ピン＞3日同じ=固定＞多い方=申告＞同数は希望＞遠方(午後)＞同ユニットの少ない組。ホームと逆の「〜のみ」の曜日はゲスト
//  - 班: FW/BK分離(既定)・強い順にシード→加えた後の班内最大差が最小の人を班サイズまで・端数1人は合流（大きく広がるなら分割/1人のまま）
//  - ゲスト: 逆の組の同ユニット班のうち最も差が小さい班へ（記録ゼロは未配置）
//  - ピン: 再計算で同じ班の核として残る（記録ゼロのピン選手は推定重量で相手を選ぶ）
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function has(s,t){return String(s).indexOf(t)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
pushView=function(){};popView=function(){};toast=function(){};
drain();
function Wmap(o){var W={};Object.keys(o).forEach(function(k){var a=o[k];W[k]={bench:a[0],squat:a[1],deadlift:a[2]};});return W;}
function ids(groups){return groups.map(function(g){return g.join(',');}).join(' | ');}
D.p=[];D.i=[];D.ph=[];D.e1rm=[];D.tmenu=[];D.tlog=[];D.tgroup=[];

// ============ 1. 物差し: 中央値・強さ・班内の差 ============
print('--- tgMedians / tgStrength / tgGroupSpread ---');
var W1=Wmap({1:[100,150,200],2:[80,null,160],3:[120,180,null],4:[null,null,null]});
var med1=tgMedians([1,2,3,4],W1);
ok('中央値: BP=100(80,100,120)・SQ=165(150,180)・DL=180(160,200)',med1.bench===100&&med1.squat===165&&med1.deadlift===180);
ok('強さ=記録のある種目の重量÷中央値の平均',Math.abs(tgStrength(W1['2'],med1)-(0.8+160/180)/2)<1e-9);
ok('記録ゼロの強さはnull',tgStrength(W1['4'],med1)===null);
var sp=tgGroupSpread([1,2,3],W1);
ok('班内の差: BP=40・SQ=30・DL=40・max=40・sum=110・n=3',sp.bench===40&&sp.squat===30&&sp.deadlift===40&&sp.max===40&&sp.sum===110&&sp.n===3);
var sp2=tgGroupSpread([2,3],W1);
ok('2人以上に記録がある種目だけ比べる（BPだけ40・SQ/DLはnull）',sp2.bench===40&&sp2.squat===null&&sp2.deadlift===null&&sp2.n===1&&sp2.max===40);
ok('1人班の差は0',tgGroupSpread([1],W1).max===0&&tgGroupSpread([1],W1).n===0);

// ============ 2. 1バケットの班づくり ============
print('--- tgBuildBucket: 強い順にシード→班内最大差が最小の人を追加 ---');
var W2=Wmap({1:[120,180,220],2:[118,175,215],3:[100,150,190],4:[122,182,225],5:[98,148,185],6:[80,120,150],7:[82,125,155]});
var P2=[1,2,3,4,5,6,7],med2=tgMedians(P2,W2);
var b2=tgBuildBucket(P2,[],W2,W2,med2,3);
ok('班=[4,1,2]|[3,5]|[7,6]（端数1人を合流すると差40kg→直前の班と2班に分けると5kg）',ids(b2.groups)==='4,1,2 | 3,5 | 7,6');
ok('プールなし',b2.pool.length===0);
ok('決定的（同じ入力なら同じ結果）',ids(tgBuildBucket(P2.slice().reverse(),[],W2,W2,med2,3).groups)===ids(b2.groups));

var W3=Wmap({1:[100,150,190],2:[100,150,185],3:[97.5,147.5,185],4:[95,145,180]});
var b3=tgBuildBucket([1,2,3,4],[],W3,W3,tgMedians([1,2,3,4],W3),3);
ok('端数1人が近ければ合流（差10kgの4人班・分けても5kgしか縮まない）',ids(b3.groups)==='1,2,3,4');

var W5=Wmap({1:[100,150,190],2:[99,149,189],3:[98,148,188],4:[97,147,187],5:[70,100,130],6:[69,99,129],7:[68,98,128],8:[67,97,127]});
var P5=[1,2,3,4,5,6,7,8];
ok('班サイズ4: [1,2,3,4]|[5,6,7,8]',ids(tgBuildBucket(P5,[],W5,W5,tgMedians(P5,W5),4).groups)==='1,2,3,4 | 5,6,7,8');
ok('班サイズ2: [1,2]|[3,4]|[5,6]|[7,8]',ids(tgBuildBucket(P5,[],W5,W5,tgMedians(P5,W5),2).groups)==='1,2 | 3,4 | 5,6 | 7,8');

print('--- tgBuildBucket: 記録ゼロ=プール・一部種目だけでも自動 ---');
var W4=Wmap({1:[100,150,190],2:[100,null,null],3:[null,null,null],4:[60,90,120]});
var b4=tgBuildBucket([1,2,3,4],[],W4,W4,tgMedians([1,2,3,4],W4),2);
ok('記録ゼロ(3)はプール',b4.pool.length===1&&b4.pool[0]===3);
ok('BPだけの選手(2)もBPが同じ1と組む・遠い4は合流させず1人のまま（差70kg）',ids(b4.groups)==='1,2 | 4');

print('--- tgBuildBucket: ピンの核は崩さず最適な相手で埋める ---');
var b5=tgBuildBucket(P2,[[6,1]],W2,W2,med2,3);
ok('核[6,1]は同じ班のまま・強さが核の平均に近い3で埋まる',ids(b5.groups)==='4,2 | 6,1,3 | 5,7');
ok('全員が1回ずつ配置（重複・欠落なし）',[].concat.apply([],b5.groups).sort().join(',')==='1,2,3,4,5,6,7'&&b5.pool.length===0);
ok('記録ゼロでもピンの核ならプールに行かない',tgBuildBucket([1,3],[[3]],W4,W4,tgMedians([1,3],W4),2).pool.length===0);

// ============ 3. シフト振分（曜日別申告） ============
print('--- tgAutoAssignShifts: 曜日別申告→ホーム組/ゲスト曜日 ---');
D.p=[
  {id:101,name:'a',position:'PR',wg:{v:2,days:{mon:'am',tue:'am',thu:'am'}}},
  {id:102,name:'b',position:'PR',wg:{v:2,days:{mon:'pm',tue:'pm',thu:'pm'}}},
  {id:103,name:'c',position:'LO',wg:{v:2,days:{mon:'am',tue:'am',thu:'pm'}}},
  {id:104,name:'d',position:'LO',wg:{v:2,days:{mon:'pm',tue:'',thu:''}}},
  {id:105,name:'e',position:'FL',wg:{v:2,days:{mon:'am',tue:'pm',thu:''},pref:'pm'}},
  {id:106,name:'f',position:'FL',wg:{v:2,days:{mon:'',tue:'',thu:''},far:true}},
  {id:107,name:'g',position:'SH',wg:{f5:['thu'],pref:null}},
  {id:108,name:'h',position:'SH'},
  {id:109,name:'i',position:'SO'},
  {id:110,name:'j',position:'HO',wg:{v:2,days:{mon:'pm',tue:'pm',thu:'pm'}}}
];
var P6=D.p.map(function(p){return p.id;});
var W6={};P6.forEach(function(pid){W6[String(pid)]={bench:100,squat:150,deadlift:180};});
var as6=tgAutoAssignShifts(P6,W6,tgMedians(P6,W6),{'110':'am'});
function inAm(pid){return as6.am.indexOf(pid)>=0;}
function inPm(pid){return as6.pm.indexOf(pid)>=0;}
ok('3日とも午前のみ→AM固定',inAm(101)&&as6.reason[101]==='固定');
ok('3日とも午後のみ→PM固定',inPm(102)&&as6.reason[102]==='固定');
ok('午前のみ2日>午後のみ1日→AM申告',inAm(103)&&as6.reason[103]==='申告');
ok('午後のみ1日＋どちらでも2日→PM申告',inPm(104)&&as6.reason[104]==='申告');
ok('午前のみ1対午後のみ1の同数→希望(PM)',inPm(105)&&as6.reason[105]==='希望');
ok('0対0→遠方はPM',inPm(106)&&as6.reason[106]==='遠方');
ok('旧形式(木5限)→木=午前のみ→AM申告',inAm(107)&&as6.reason[107]==='申告');
ok('ピン留めは申告より優先して前回の組(AM)',inAm(110)&&as6.reason[110]==='ピン');
ok('未回答2名は自動',as6.reason[108]==='自動'&&as6.reason[109]==='自動');
ok('バランス: 108→PM(同ユニットBKが少ない)・109→AM(BK同数なら全体の少ない組)',inPm(108)&&inAm(109));
ok('全員がどちらか一方だけ',P6.every(function(pid){return inAm(pid)!==inPm(pid);}));
var gmap={};as6.guests.forEach(function(g){gmap[g.pid]=g;});
ok('ゲスト: 103(AM)は木だけPM',gmap[103]&&gmap[103].home==='am'&&gmap[103].days.join(',')==='thu');
ok('ゲスト: 105(PM)は月だけAM',gmap[105]&&gmap[105].home==='pm'&&gmap[105].days.join(',')==='mon');
ok('ゲスト: ピンでAMにした110は午後のみ3日がゲスト',gmap[110]&&gmap[110].days.join(',')==='mon,tue,thu');
ok('固定・どちらでもの人はゲストなし（計3名）',!gmap[101]&&!gmap[102]&&!gmap[104]&&!gmap[106]&&!gmap[107]&&!gmap[108]&&as6.guests.length===3);

// ============ 4. ゲスト配置 ============
print('--- tgPlaceGuests: 逆の組の同ユニットで最も差が小さい班へ ---');
D.p=[{id:201,position:'PR'},{id:202,position:'PR'},{id:203,position:'PR'},{id:204,position:'PR'},{id:211,position:'SH'},{id:212,position:'SH'},
     {id:221,position:'LO'},{id:222,position:'SO'},{id:223,position:'LO'},{id:231,position:'SH'},{id:232,position:'SH'},{id:241,position:'SO'}];
var W7=Wmap({201:[120,180,220],202:[118,178,218],203:[80,120,150],204:[82,122,152],211:[100,150,190],212:[98,148,188],
  221:[81,121,151],222:[99,149,189],223:[null,null,null],231:[100,150,190],232:[98,148,188],241:[99,149,189]});
var sh7=[{key:'am',label:'午前',groups:[],pool:[],guests:[]},{key:'pm',label:'午後',groups:[[201,202],[203,204],[211,212]],pool:[],guests:[]}];
tgPlaceGuests(sh7,[{pid:221,home:'am',days:['mon']},{pid:222,home:'am',days:['thu']},{pid:223,home:'am',days:['tue']}],W7,true);
function gOf(sh,pid){return sh.guests.filter(function(x){return x.pid===pid;})[0];}
ok('FWゲスト(81kg級)→PMのFW班のうち近い[203,204](gi=1)',gOf(sh7[1],221)&&gOf(sh7[1],221).gi===1&&gOf(sh7[1],221).day==='mon');
ok('BKゲスト(99kg級)→BK班[211,212](gi=2)。重量が近くてもFW班には入れない',gOf(sh7[1],222)&&gOf(sh7[1],222).gi===2);
ok('記録ゼロのゲスト→未配置(gi=null)',gOf(sh7[1],223)&&gOf(sh7[1],223).gi===null);
ok('ホーム組(am)側にはゲストを置かない',sh7[0].guests.length===0);
var sh8=[{key:'am',label:'午前',groups:[[201,202]],pool:[],guests:[]},{key:'pm',label:'午後',groups:[[211,212],[203,204]],pool:[],guests:[]}];
tgPlaceGuests(sh8,[{pid:222,home:'am',days:['mon']}],W7,false);
ok('FW/BK分離OFF: 全班から最も近い班(gi=0)',sh8[1].guests[0].gi===0);
var sh9=[{key:'am',label:'午前',groups:[],pool:[],guests:[]},{key:'pm',label:'午後',groups:[[201,202],[203,204]],pool:[],guests:[]}];
tgPlaceGuests(sh9,[{pid:222,home:'am',days:['mon']}],W7,true);
ok('同ユニット(BK)の班が無ければ全班から最も近い班（[201,202]=差31kg）',sh9[1].guests[0].gi===0);
var sh10=[{key:'am',label:'午前',groups:[],pool:[],guests:[]},{key:'pm',label:'午後',groups:[[211,212],[231,232]],pool:[],guests:[]}];
tgPlaceGuests(sh10,[{pid:222,home:'am',days:['mon']},{pid:241,home:'am',days:['mon']}],W7,true);
ok('同じ曜日のゲストは差が同じなら人数の少ない班へ散らす',sh10[1].guests[0].gi===0&&sh10[1].guests[1].gi===1);

// ============ 5. 推定重量（ヒント/記録ゼロのピン選手の参照） ============
print('--- tgEstWeights: 1RM(実測ph＞推定1RM)×スロットメニューの回数/RIR ---');
D.p=[{id:301,position:'PR'},{id:302,position:'PR'}];
D.ph=[{id:1,pid:301,date:daysAgo(30),bench:100,squat:160}];
D.e1rm=[{pid:301,date:daysAgo(5),values:{deadlift:{e1rm:200}}},{pid:302,date:daysAgo(5),values:{bench:{e1rm:90}}}];
D.tmenu=[{id:1,name:'PUSH',scope:'all',ptype:'push',ptypeTs:'2026-09-01T00:00:00Z',exercises:[{name:'ベンチプレス(スピード)',estBase:'bench',reps:5,rir:3},{name:'スクワット(スピード)',reps:5,rir:4}]},
         {id:2,name:'PULL',scope:'all',ptype:'pull',ptypeTs:'2026-09-01T00:00:00Z',exercises:[{name:'デットリフト(スピード)',reps:4,rir:4}]}];
var ew=tgEstWeights(301);
ok('BP=ph100×5回RIR3',ew.bench===estimateWeight(100,5,3));
ok('SQ=ph160×5回RIR4（estBase無しでも種目名で処方を拾う）',ew.squat===estimateWeight(160,5,4));
ok('DL=phが無ければ推定1RM200×4回RIR4',ew.deadlift===estimateWeight(200,4,4));
var ew2=tgEstWeights(302);
ok('302: BP=推定1RM90から・SQ/DLはnull',ew2.bench===estimateWeight(90,5,3)&&ew2.squat===null&&ew2.deadlift===null);
D.tmenu=[];
ok('スロットメニューが無ければ5回RIR2で推定',tgEstWeights(301).bench===estimateWeight(100,5,2));

// ============ 6. tgGenerate 通し ============
print('--- tgGenerate: 午前/午後×FW/BK分離・全員1回ずつ・ゲスト・プール・アーカイブ ---');
function mkLog(id,pid,ago,bp,sq,dl){
  var r=[];
  if(bp!=null)r.push({exName:'ベンチプレス(スピード)',estBase:'bench',sets:[{weight:bp,reps:3}]});
  if(sq!=null)r.push({exName:'スクワット(スピード)',sets:[{weight:sq,reps:3}]});
  if(dl!=null)r.push({exName:'デットリフト(スピード)',sets:[{weight:dl,reps:2}]});
  return {id:id,pid:pid,menuId:1,date:daysAgo(ago),ts:'2026-09-01T10:00:00.000Z',results:r};
}
var AM3={v:2,days:{mon:'am',tue:'am',thu:'am'}},PM3={v:2,days:{mon:'pm',tue:'pm',thu:'pm'}};
D.p=[
  {id:1,name:'F1',position:'PR',wg:AM3},{id:2,name:'F2',position:'HO',wg:AM3},
  {id:3,name:'F3',position:'LO',wg:{v:2,days:{mon:'am',tue:'am',thu:'pm'}}},
  {id:14,name:'F14',position:'FL',wg:{v:2,days:{mon:'am',tue:'am',thu:'am'}}},{id:15,name:'F15',position:'PR',wg:AM3},{id:16,name:'F16',position:'LO',wg:AM3},
  {id:4,name:'F4',position:'FL',wg:PM3},{id:5,name:'F5',position:'PR',wg:PM3},{id:6,name:'F6',position:'No.8',wg:PM3},
  {id:7,name:'B7',position:'SH',wg:AM3},{id:8,name:'B8',position:'SO',wg:AM3},{id:9,name:'B9',position:'CTB',wg:AM3},
  {id:10,name:'B10',position:'WTB',wg:PM3},{id:11,name:'B11',position:'FB',wg:PM3},
  {id:12,name:'B12',position:'CTB'},
  {id:13,name:'怪我',position:'PR'}
];
D.i=[{id:1,pid:13,resolved:false}];
D.ph=[];D.e1rm=[];D.tmenu=[];
D.tlog=[mkLog('l1',1,2,120,180,220),mkLog('l2',2,2,118,175,215),mkLog('l3',3,2,100,150,null),
        mkLog('l14',14,2,80,120,150),mkLog('l15',15,2,82,122,152),mkLog('l16',16,2,99,149,188),
        mkLog('l4',4,3,100,150,190),mkLog('l5',5,3,98,148,185),mkLog('l6',6,3,80,120,150),
        mkLog('l7',7,2,90,130,160),mkLog('l8',8,2,88,128,158),mkLog('l9',9,2,70,100,130),mkLog('l10',10,3,85,125,155),
        mkLog('l13',13,2,150,200,250)];
_tlogArch=[mkLog('a11',11,40,84,124,150)];_tlogArchLoaded=true;_tlaCbs=null;_tlaCache=null;
D.tgroup=[];window._tgState=undefined;
tgInit(true);
var st=window._tgState;
ok('初期: size3・FW/BK分離ON・ピン空・怪我13は除外',st.size===3&&st.splitUnit===true&&st.pinned.length===0&&st.excluded.indexOf(13)>=0);
tgGenerate();
st=window._tgState;
var am=st.shifts[0],pm=st.shifts[1];
function flat(sh){return [].concat.apply([],sh.groups);}
function sorted(g){return g.slice().sort(function(a,b){return a-b;}).join(',');}
function hasGroup(sh,set){return sh.groups.some(function(g){return sorted(g)===set;});}
ok('2シフト(am/pm)・生成済み',st.generated===true&&st.shifts.length===2&&am.key==='am'&&pm.key==='pm');
ok('対象15名が1回ずつ（班orプール）・除外13は居ない',flat(am).concat(flat(pm)).concat(am.pool).concat(pm.pool).sort(function(a,b){return a-b;}).join(',')==='1,2,3,4,5,6,7,8,9,10,11,12,14,15,16');
ok('どの班もFWとBKが混ざらない',st.shifts.every(function(sh){return sh.groups.every(function(g){return tgGroupUnit(g)!==null;});}));
ok('AM FW=[1,2,3]（3はBP/SQだけでも自動）・[14,15,16]',hasGroup(am,'1,2,3')&&hasGroup(am,'14,15,16'));
ok('PM FW=[4,5,6]',hasGroup(pm,'4,5,6'));
ok('AM BK=[7,8,9]',hasGroup(am,'7,8,9'));
ok('PM BK=[10,11]（11はアーカイブ(40日前)の記録で自動）',hasGroup(pm,'10,11'));
ok('記録なし(12)はPMのプール（同ユニットBKが少ない組へ振分）',pm.pool.length===1&&pm.pool[0]===12&&am.pool.length===0);
ok('班は強い順（AM FWは[1,2,3]が先）',sorted(am.groups[0])==='1,2,3');
var g3=pm.guests.filter(function(x){return x.pid===3;})[0];
ok('F3は木だけPMのFW班[4,5,6]へゲスト',g3&&g3.day==='thu'&&sorted(pm.groups[g3.gi])==='4,5,6');
ok('理由: 固定/申告/自動',st._reason[1]==='固定'&&st._reason[3]==='申告'&&st._reason[12]==='自動');

print('--- tgGenerate: ピンは再計算しても同じ班・申告が変わっても組を維持 ---');
var giA=am.groups.findIndex(function(g){return g.indexOf(1)>=0;}),giB=am.groups.findIndex(function(g){return g.indexOf(14)>=0;});
am.groups[giB].splice(am.groups[giB].indexOf(14),1);am.groups[giA].push(14); // 手動で14を1の班へ
st.pinned=[1,14];
D.p.filter(function(p){return p.id===14;})[0].wg={v:2,days:{mon:'pm',tue:'pm',thu:'pm'}}; // 14の申告が午後のみに変わった
st.size=2;
tgGenerate();
st=window._tgState;am=st.shifts[0];pm=st.shifts[1];
ok('ピン[1,14]は同じ班（班サイズ2）',hasGroup(am,'1,14'));
ok('ピン無しは近い人で組み直し: [2,3]・[15,16]',hasGroup(am,'2,3')&&hasGroup(am,'15,16'));
ok('14は申告(午後のみ)より前回の組(AM)を維持・理由=ピン',flat(am).indexOf(14)>=0&&st._reason[14]==='ピン');
ok('ピン14の午後のみ3日はPMへゲスト',pm.guests.filter(function(x){return x.pid===14;}).length===3);
ok('サイズ2: PM FWは[4,5]と1人の[6]（合流すると差40kg）',hasGroup(pm,'4,5')&&hasGroup(pm,'6'));

print('--- 記録なしを手動配置→自動ピン→再計算でも班に残る（推定重量で近い相手） ---');
D.ph=[{id:9,pid:12,date:daysAgo(20),bench:100}];
var pi12=pm.pool.indexOf(12),giBK=pm.groups.findIndex(function(g){return tgGroupUnit(g)==='BK';});
tgPoolTap(1,pi12);tgMoveTo(1,giBK);
st=window._tgState;
ok('手動配置した12は自動ピン',st.pinned.indexOf(12)>=0&&st.shifts[1].pool.indexOf(12)<0);
tgGenerate();
st=window._tgState;pm=st.shifts[1];
var g12=pm.groups.filter(function(g){return g.indexOf(12)>=0;})[0];
ok('再計算後も12は班に居る（プールに戻らない）',!!g12&&pm.pool.indexOf(12)<0);
ok('12の班はBK（推定BP80で10/11と組む）',g12&&tgGroupUnit(g12)==='BK'&&sorted(g12)==='10,11,12');

print('--- tgSave: v2フィールド・空の班を詰めてゲストのgiを付け替え ---');
pm.groups.unshift([]);
pm.guests=pm.guests.map(function(x){return {pid:x.pid,day:x.day,gi:x.gi!=null?x.gi+1:null};});
__store['tgroup']=JSON.stringify([]);window._tgAnnOff=true; // お知らせはtest_tgroup_save.jsで検証
tgSave();drain();
var sv=JSON.parse(__store['tgroup']);
ok('1件保存',sv.length===1);
ok('size/splitUnit/pinnedを保存',sv[0].size===2&&sv[0].splitUnit===true&&sv[0].pinned.indexOf(12)>=0&&sv[0].pinned.indexOf(1)>=0);
ok('空の班は保存しない',sv[0].shifts[1].groups.every(function(g){return g.length>0;})&&sv[0].shifts[1].groups.length===pm.groups.length-1);
var gsv=sv[0].shifts[1].guests.filter(function(x){return x.pid===3;})[0];
ok('ゲストのgiは詰めた後の同じ班を指す',gsv&&gsv.gi!=null&&sorted(sv[0].shifts[1].groups[gsv.gi])===sorted(pm.groups[gsv.gi+1]));
ok('poolは保存しない',sv[0].shifts[0].pool===undefined&&sv[0].shifts[1].pool===undefined);

print('--- tgGenerate: 単一モード・FW/BK分離OFF ---');
window._tgState=undefined;D.tgroup=[];tgInit(true);
st=window._tgState;st.mode='single';st.splitUnit=false;
tgGenerate();
st=window._tgState;
ok('単一モード=1シフト(all)・ゲストなし',st.shifts.length===1&&st.shifts[0].key==='all'&&st.shifts[0].guests.length===0);
ok('分離OFFならFW/BK混在の班もできる',st.shifts[0].groups.some(function(g){return tgGroupUnit(g)===null;}));

print('--- tgGenerate: アーカイブ未読込なら読み込んでから組む ---');
_tlogArch=[];_tlogArchLoaded=false;_tlaCbs=null;_tlaCache=null;
__store[tlaKey(11,tlaHalf(daysAgo(40)))]=JSON.stringify([mkLog('a11',11,40,84,124,150)]);
window._tgState=undefined;D.tgroup=[];tgInit(true);
tgGenerate();
ok('読込前は生成しない',window._tgState.generated===false);
drain();
ok('読込完了後に自動で生成（アーカイブだけの11も班に入る）',window._tgState.generated===true&&flat(window._tgState.shifts[1]).indexOf(11)>=0);

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup_algo tests failed');}
print('\nALL TGROUP-ALGO TESTS PASSED');
