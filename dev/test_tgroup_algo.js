// ウエイトグループ分けv2 フェーズ3: 自動アルゴリズム（staff）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup_algo.js
// 仕様（dev/audit/PLAN_tgroup_v2.md #6〜#10/#15・2026-09-13改訂）:
//  - 重量=tgLiftWeights（60日窓・アーカイブ込みtlogAll）。一部の種目だけでも自動に含め、記録ゼロはプール
//  - 振分（2026-09-13再改訂・申告=5限の曜日＋far＋pref、スタッフの曜日指定=ov）: 曜日ごとに実効値v=days[d]（指定＞5限=午前）、''ならprefで数える。
//    ピン＞午前の日・午後の日の多い方（理由=多い側に指定の日があれば'指定'・無ければ5限の日があれば'5限'・無ければ'希望'）＞同数なら遠方=午後＞
//    同ユニットの少ない組=自動。ゲスト=実効値days[d]（prefではない）がホームと逆の曜日だけ
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

// ============ 3. シフト振分（申告=5限の曜日/遠方/希望＋スタッフの曜日指定ov） ============
print('--- tgAutoAssignShifts: 申告＋曜日指定→ホーム組/ゲスト曜日 ---');
// 申告レコード p.wg={f5,far,pref,upd[,ov,ovUpd]}（updは相対日時＝固定日付は書かない）
var UPD=new Date(Date.now()-3*86400000).toISOString();
function wgRec(f5,far,pref,ov){var w={f5:f5,far:!!far,pref:pref||null,upd:UPD};if(ov){w.ov=ov;w.ovUpd=UPD;}return w;}
// 数え方: 曜日ごとに実効値(指定＞5限=午前)、無ければ希望(pref)。午前の日/午後の日の多い方がホーム。
D.p=[
  {id:101,name:'a',position:'PR',wg:wgRec(['thu'],false,'pm')},                                   // 5限(木)＋午後希望 → 午前1(木5限):午後2(月火=希望)
  {id:102,name:'b',position:'PR',wg:wgRec([],false,'pm')},                                        // 5限なし・午後希望 → 午後3(希望)
  {id:103,name:'c',position:'LO',wg:wgRec([],true,null)},                                         // 5限なし・遠方 → 0:0同数→遠方
  {id:104,name:'d',position:'LO',wg:wgRec([],false,'am',{mon:'',tue:'pm',thu:''})},               // 午前希望＋火だけ午後の指定 → 午前2(月木=希望):午後1(火=指定)
  {id:105,name:'e',position:'FL',wg:wgRec(['mon'],false,null,{mon:'pm',tue:'pm',thu:'pm'})},      // 5限(月)だが指定3日とも午後 → 午後3(指定)
  {id:106,name:'f',position:'FL',wg:wgRec(['mon'],true,'pm')},                                    // 5限(月)＋午後希望＋遠方 → 午前1(月5限):午後2(火木=希望)
  {id:107,name:'g',position:'SH',wg:wgRec([],false,'pm',{mon:'am',tue:'',thu:''})},               // 午後希望＋月だけ午前の指定 → 午前1(月=指定):午後2(火木=希望)
  {id:108,name:'h',position:'SH'},                                                                // 未回答
  {id:109,name:'i',position:'SO'},                                                                // 未回答
  {id:110,name:'j',position:'HO',wg:wgRec([],false,null,{mon:'pm',tue:'pm',thu:'pm'})},           // 指定3日とも午後（ピンでAM）
  {id:111,name:'k',position:'CTB',wg:wgRec(['mon','thu'],false,null,{mon:'',tue:'pm',thu:''})},   // 5限(月・木)＋火だけ午後の指定 → 午前2(5限):午後1(指定)
  {id:112,name:'l',position:'WTB',wg:{v:2,days:{mon:'am',tue:'pm',thu:'am'}}},                    // 一時形式（曜日別3択）→ f5=[月,木]・ov火pm と同じ
  {id:113,name:'m',position:'FB',wg:wgRec(['tue'],false,'pm',{mon:'',tue:'pm',thu:''})},          // 5限(火)＋火を午後に指定＋午後希望 → 午後3(火=指定・月木=希望)
  {id:114,name:'n',position:'No.8',wg:wgRec(['tue'],false,null)}                                  // 5限(火)（ピンでPM）
];
var P6=D.p.map(function(p){return p.id;});
var W6={};P6.forEach(function(pid){W6[String(pid)]={bench:100,squat:150,deadlift:180};});
var as6=tgAutoAssignShifts(P6,W6,tgMedians(P6,W6),{'110':'am','114':'pm'});
function inAm(pid){return as6.am.indexOf(pid)>=0;}
function inPm(pid){return as6.pm.indexOf(pid)>=0;}
var gmap={};as6.guests.forEach(function(g){gmap[g.pid]=g;});
function gdays(g){return g?g.days.join(','):'';}
ok('5限(木)＋午後希望→PM希望（午前1日:午後2日で午後が多い・多い側は希望の日だけ）',inPm(101)&&as6.reason[101]==='希望');
ok('ゲスト: 101は5限の木だけAM（実効値=午前がホームと逆）',gmap[101]&&gmap[101].home==='pm'&&gdays(gmap[101])==='thu');
ok('5限なし・午後希望→PM希望（午後3日）・ゲスト無し（希望はゲストを作らない）',inPm(102)&&as6.reason[102]==='希望'&&!gmap[102]);
ok('5限なし・希望なし・遠方→PM遠方（0:0同数→遠方は午後）',inPm(103)&&as6.reason[103]==='遠方'&&!gmap[103]);
ok('午前希望＋火だけ午後の指定→AM希望（午前2日:午後1日・多い午前側は希望の日だけ）',inAm(104)&&as6.reason[104]==='希望');
ok('ゲスト: 104は指定の火だけPM {pid,home:am,days:[tue]}（希望の月・木はゲストにしない）',gmap[104]&&gmap[104].pid===104&&gmap[104].home==='am'&&gdays(gmap[104])==='tue');
ok('5限(月)＋指定3日とも午後→PM指定（指定が5限より優先＝午後3日）',inPm(105)&&as6.reason[105]==='指定');
ok('指定3日とも同じ人はゲスト無し（実効値が3日ともホームと同じ）',!gmap[105]);
ok('5限(月)＋午後希望＋遠方→PM希望（午前1日:午後2日で決まる＝遠方は同数の時だけ）',inPm(106)&&as6.reason[106]==='希望');
ok('ゲスト: 106は5限の月だけAM',gmap[106]&&gmap[106].home==='pm'&&gdays(gmap[106])==='mon');
ok('午後希望＋月だけ午前の指定→PM希望（午前1日:午後2日）',inPm(107)&&as6.reason[107]==='希望');
ok('ゲスト: 107は指定の月だけAM',gmap[107]&&gmap[107].home==='pm'&&gdays(gmap[107])==='mon');
ok('ピンは指定より優先して前回の組(AM)',inAm(110)&&as6.reason[110]==='ピン');
ok('ゲスト: ピンでAMにした110は指定の3日ともPMへ',gmap[110]&&gmap[110].home==='am'&&gdays(gmap[110])==='mon,tue,thu');
ok('ピンは5限より優先して前回の組(PM)',inPm(114)&&as6.reason[114]==='ピン');
ok('ゲスト: 午後ホームの114は5限の曜日(火)だけAMへ',gmap[114]&&gmap[114].home==='pm'&&gdays(gmap[114])==='tue');
ok('5限(月・木)＋火だけ午後の指定→AM 5限（午前2日:午後1日・多い午前側は5限の日）',inAm(111)&&as6.reason[111]==='5限');
ok('ゲスト: 111は指定の火だけPM',gmap[111]&&gmap[111].home==='am'&&gdays(gmap[111])==='tue');
ok('一時形式{v:2,days:{月am,火pm,木am}}: am→5限・pm→指定と読む→AM 5限・火だけゲスト',inAm(112)&&as6.reason[112]==='5限'&&gmap[112]&&gdays(gmap[112])==='tue');
ok('5限(火)＋火を午後に指定＋午後希望→PM指定（同じ曜日は指定が5限より優先・多い午後側に指定の日あり）',inPm(113)&&as6.reason[113]==='指定');
ok('113はゲスト無し（火の実効値=午後=ホームと同じ・月木は希望なのでゲストにならない）',!gmap[113]);
ok('未回答2名は自動',as6.reason[108]==='自動'&&as6.reason[109]==='自動');
// 自動の前: AM=104(FW)/110(FW)/111(BK)/112(BK)＝BK2・計4／PM=101,102,103,105,106,114(FW)/107,113(BK)＝BK2・計8。強さ同じ→id順
ok('バランス: 108→AM(BK2:2同数→全体の少ないAM)・109→PM(108が入ってBK3:2→BKの少ないPM)',inAm(108)&&inPm(109));
ok('未回答（自動）の人はゲストなし',!gmap[108]&&!gmap[109]);
ok('全員がどちらか一方だけ',P6.every(function(pid){return inAm(pid)!==inPm(pid);}));
ok('ゲストは計8名（101/104/106/107/110/111/112/114）・102/103/105/113は無し',as6.guests.length===8&&[101,104,106,107,110,111,112,114].every(function(pid){return !!gmap[pid];})&&!gmap[102]&&!gmap[103]&&!gmap[105]&&!gmap[113]);
ok('全員に理由が付く',P6.every(function(pid){return !!as6.reason[pid];}));

print('--- tgAutoAssignShifts: 単独の振分（人数バランスに依存しない確認） ---');
// one(): 1人だけで振分（自動になった場合はAM＝空の組同士・同数はAM）
function one(pid,pin){var W={};W[String(pid)]={bench:100,squat:150,deadlift:180};return tgAutoAssignShifts([pid],W,tgMedians([pid],W),pin||{});}
function chk(r,pid,sh,why,gd){
  var inSh=r[sh].indexOf(pid)>=0,g=r.guests.filter(function(x){return x.pid===pid;});
  var gOk=gd==null?g.length===0:(g.length===1&&g[0].home===sh&&g[0].days.join(',')===gd);
  if(!(inSh&&r.reason[pid]===why&&gOk))print('    actual: am='+r.am+' pm='+r.pm+' reason='+r.reason[pid]+' guests='+JSON.stringify(r.guests));
  return inSh&&r.reason[pid]===why&&gOk;
}
D.p.push({id:115,name:'o',position:'FB',wg:{ov:{mon:'',tue:'pm',thu:''},ovUpd:UPD}});                // 未回答＋指定だけ（updなし）
D.p.push({id:116,name:'p',position:'FB',wg:wgRec([],true,'pm',{mon:'am',tue:'am',thu:'am'})});       // 指定3日とも午前＋午後希望＋遠方
D.p.push({id:117,name:'q',position:'FB',wg:wgRec([],false,null)});                                    // 回答済だが5限なし・希望なし・近い
D.p.push(
  {id:121,position:'FB',wg:wgRec([],false,'am',{mon:'',tue:'pm',thu:''})},          // 例1 午前がいい＋火を午後に指定
  {id:122,position:'FB',wg:wgRec(['thu'],false,'pm')},                              // 例2 午後がいい＋5限(木)
  {id:123,position:'FB',wg:wgRec(['mon','thu'],false,null,{mon:'',tue:'pm',thu:''})}, // 例3 5限(月・木)＋火を午後に指定
  {id:124,position:'FB',wg:wgRec(['tue'],false,'pm',{mon:'',tue:'pm',thu:''})},     // 例4 5限(火)＋火を午後に指定＋午後がいい
  {id:125,position:'FB',wg:wgRec(['mon'],false,null,{mon:'pm',tue:'pm',thu:'pm'})}, // 例5 指定3日とも午後＋5限(月)
  {id:126,position:'FB',wg:wgRec([],false,'pm')},                                   // 例6 午後がいいだけ
  {id:127,position:'FB',wg:wgRec([],true,null)},                                    // 例7 遠方だけ
  {id:128,position:'FB',wg:wgRec(['mon'],false,null)},                              // 例8 5限(月)だけ
  {id:129,position:'FB',wg:wgRec([],false,null,{mon:'pm',tue:'pm',thu:'pm'})},      // 例9 指定3日とも午後（ピンでAM）
  {id:130,position:'FB',wg:wgRec(['mon','thu'],false,null,{mon:'',tue:'',thu:'pm'})}, // 5限(月・木)＋木を午後に指定・近い
  {id:131,position:'FB',wg:wgRec(['mon','thu'],true,null,{mon:'',tue:'',thu:'pm'})},  // 同上＋遠方
  {id:132,position:'FB',wg:wgRec(['mon'],false,'pm',{mon:'',tue:'am',thu:''})},     // 5限(月)＋火を午前に指定＋午後がいい
  {id:133,position:'FB',wg:wgRec(['mon'],false,'am')},                              // 5限(月)＋午前がいい
  {id:134,position:'FB',wg:wgRec([],false,'am')}                                    // 午前がいいだけ（ピンでPM）
);
ok('例1 午前がいい＋火を午後に指定→AM希望（午前2(希望):午後1(指定)）・ゲスト火',chk(one(121),121,'am','希望','tue'));
ok('例2 午後がいい＋5限(木)→PM希望（午前1(5限):午後2(希望)）・ゲスト木',chk(one(122),122,'pm','希望','thu'));
ok('例3 5限(月・木)＋火を午後に指定→AM 5限（午前2(5限):午後1(指定)）・ゲスト火',chk(one(123),123,'am','5限','tue'));
ok('例4 5限(火)＋火を午後に指定＋午後がいい→PM指定（火は指定が5限より優先→午後3）・ゲスト無し',chk(one(124),124,'pm','指定',null));
ok('例5 指定3日とも午後＋5限(月)→PM指定（午後3(指定)）・ゲスト無し',chk(one(125),125,'pm','指定',null));
ok('例6 午後がいいだけ→PM希望（午後3(希望)）・ゲスト無し',chk(one(126),126,'pm','希望',null));
ok('例7 遠方だけ→PM遠方（0:0同数→遠方）・ゲスト無し',chk(one(127),127,'pm','遠方',null));
ok('例8 5限(月)だけ→AM 5限（午前1:午後0・火木は希望なしで数えない）・ゲスト無し',chk(one(128),128,'am','5限',null));
ok('例9 ピンAM＋指定3日とも午後→AMピン（ピン最優先）・指定の3日ともゲスト',chk(one(129,{'129':'am'}),129,'am','ピン','mon,tue,thu'));
ok('5限(月・木)＋木を午後に指定・希望なし・近い→1:1同数→自動(AM)・木だけゲスト',chk(one(130),130,'am','自動','thu'));
ok('5限(月・木)＋木を午後に指定＋遠方→1:1同数→PM遠方・5限の月だけゲスト',chk(one(131),131,'pm','遠方','mon'));
ok('5限(月)＋火を午前に指定＋午後がいい→AM指定（午前2(5限+指定):午後1(希望)・多い側に指定の日があれば理由=指定）・ゲスト無し',chk(one(132),132,'am','指定',null));
ok('5限(月)＋午前がいい→AM 5限（午前3(5限+希望)・指定が無く5限の日があれば理由=5限）・ゲスト無し',chk(one(133),133,'am','5限',null));
ok('ピンPM＋午前がいいだけ→PMピン・ゲスト無し（希望(pref)はゲストを作らない）',chk(one(134,{'134':'pm'}),134,'pm','ピン',null));
ok('未回答(updなし)＋火を午後に指定だけ→PM指定（午前0:午後1(指定)）・ゲスト無し（実効値は火だけ＝ホームと同じ）',chk(one(115),115,'pm','指定',null));
ok('未回答＋指定だけでもwgNorm.answeredはfalse（指定はホーム決定に数えるが回答済みにはしない）',wgNorm(D.p.filter(function(p){return p.id===115;})[0].wg).answered===false);
ok('指定3日とも午前＋午後希望＋遠方→AM指定（午前3(指定)・希望は指定の無い曜日だけ）・ゲスト無し',chk(one(116),116,'am','指定',null));
ok('回答済で5限なし・希望なし・近い→0:0同数→自動・ゲスト無し',chk(one(117),117,'am','自動',null));
ok('ピンは指定3日とも同じより優先→AM・指定の3日はゲスト',chk(one(105,{'105':'am'}),105,'am','ピン','mon,tue,thu'));
ok('wgNormは入力を変更しない（105のwgはそのまま）',D.p.filter(function(p){return p.id===105;})[0].wg.f5.join(',')==='mon');

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
// AM3=5限が3日ともある（→AM 5限）／PM3=5限なし・午後希望（→PM 希望）。2は指定3日とも午前（午後希望でも指定が勝つ）・6は遠方
var AM3=wgRec(['mon','tue','thu'],false,null),PM3=wgRec([],false,'pm');
D.p=[
  {id:1,name:'F1',position:'PR',wg:AM3},{id:2,name:'F2',position:'HO',wg:wgRec([],false,'pm',{mon:'am',tue:'am',thu:'am'})},
  {id:3,name:'F3',position:'LO',wg:wgRec(['mon','tue'],false,null,{mon:'',tue:'',thu:'pm'})},   // 5限(月・火)＋木だけ午後の指定
  {id:14,name:'F14',position:'FL',wg:AM3},{id:15,name:'F15',position:'PR',wg:AM3},{id:16,name:'F16',position:'LO',wg:AM3},
  {id:4,name:'F4',position:'FL',wg:PM3},{id:5,name:'F5',position:'PR',wg:PM3},{id:6,name:'F6',position:'No.8',wg:wgRec([],true,null)},
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
ok('F3は指定した木だけPMのFW班[4,5,6]へゲスト（gi付き）',g3&&g3.day==='thu'&&g3.gi!=null&&sorted(pm.groups[g3.gi])==='4,5,6');
ok('ゲストは指定の曜日だけ（F3のゲストは木の1件・AM側にゲストは無い）',pm.guests.filter(function(x){return x.pid===3;}).length===1&&am.guests.length===0&&pm.guests.length===1);
ok('理由: 5限/指定/希望/遠方/自動',st._reason[1]==='5限'&&st._reason[3]==='5限'&&st._reason[2]==='指定'&&st._reason[4]==='希望'&&st._reason[6]==='遠方'&&st._reason[12]==='自動');

print('--- tgGenerate: ピンは再計算しても同じ班・申告/指定が変わっても組を維持 ---');
var giA=am.groups.findIndex(function(g){return g.indexOf(1)>=0;}),giB=am.groups.findIndex(function(g){return g.indexOf(14)>=0;});
am.groups[giB].splice(am.groups[giB].indexOf(14),1);am.groups[giA].push(14); // 手動で14を1の班へ
st.pinned=[1,14];
D.p.filter(function(p){return p.id===14;})[0].wg=wgRec([],false,null,{mon:'pm',tue:'pm',thu:'pm'}); // 14がスタッフの指定で3日とも午後に変わった
st.size=2;
tgGenerate();
st=window._tgState;am=st.shifts[0];pm=st.shifts[1];
ok('ピン[1,14]は同じ班（班サイズ2）',hasGroup(am,'1,14'));
ok('ピン無しは近い人で組み直し: [2,3]・[15,16]',hasGroup(am,'2,3')&&hasGroup(am,'15,16'));
ok('14は指定(3日とも午後)より前回の組(AM)を維持・理由=ピン',flat(am).indexOf(14)>=0&&st._reason[14]==='ピン');
var g14=pm.guests.filter(function(x){return x.pid===14;});
ok('ピン14の指定3日はPMへゲスト（月・火・木の3件）',g14.length===3&&g14.map(function(x){return x.day;}).sort().join(',')==='mon,thu,tue');
ok('ピン14のゲストは全てPMのFW班にgi付きで入る',g14.every(function(x){return x.gi!=null&&tgGroupUnit(pm.groups[x.gi])==='FW';}));
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
