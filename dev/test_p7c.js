// P7c: 復帰フロー(doApplyReturn)＋トレーナー新規登録チップ(trainerNewInjChips)＋承認者記録(approveInjury) テスト
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_p7c.js
// 核心=(1)doApplyReturn: 選択した項目のみを server-latest に逐次反映（RTP完全復帰=chart.rtpLevel='full' / resolved=i / stage=r最終）。冪等。
//       (2)trainerNewInjChips: source:'trainer'・未resolved・未読・登録window内のみを新着チップ対象に。staff/player起票は除外。
//       (3)approveInjury: 選手/試合報告の承認時に approvedBy/approvedByRole を記録（承認ルール明文化）。
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
var TD=todayStr();
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function store(k){return JSON.parse(__store[k]||'[]');}
var _toasts=[];toast=function(m,a,fn){_toasts.push({m:m,a:a,fn:fn});};
V.dash=function(){};V.injury=function(){};V.rehab=function(){};
goRTestDetail=function(){};
function reset(){_toasts=[];__alerts.length=0;}

print('--- 1) doApplyReturn: 全チェック→RTP(chart)/resolved(i)/stage(r) を反映 ---');
reset();
setKey('i',[{id:10,pid:1,resolved:false,source:'trainer',approved:true}]);
setKey('r',[{id:11,injId:10,pid:1,stage:2,stageDates:[]}]);
setKey('chart',[{injId:10,injDetail:{},medical:{},evals:[],soaps:[],returnCriteria:{},images:[],rtpLevel:'partial_nocontact'}]);
doApplyReturn(10,{rtp:true,resolved:true,stage:true},function(){});drain();
ok('RTP完全復帰に', store('chart')[0].rtpLevel==='full');
ok('rtpLevelDate=今日', store('chart')[0].rtpLevelDate===TD);
ok('怪我resolved', store('i')[0].resolved===true);
ok('リハ段階=最終(STG.length-1)', store('r')[0].stage===STG.length-1);
ok('stageDates[最終]=今日', store('r')[0].stageDates[STG.length-1]===TD);
ok('savedRole刻む(stampWho)', store('r')[0].savedRole==='staff');

print('--- 2) doApplyReturn: 未チェックのキーは一切触らない ---');
reset();
setKey('i',[{id:20,pid:1,resolved:false,source:'player',approved:true}]);
setKey('r',[{id:21,injId:20,pid:1,stage:1,stageDates:[]}]);
setKey('chart',[{injId:20,injDetail:{},medical:{},evals:[],soaps:[],returnCriteria:{},images:[],rtpLevel:'rest'}]);
doApplyReturn(20,{rtp:true,resolved:false,stage:false},function(){});drain();
ok('RTPのみ反映(full)', store('chart')[0].rtpLevel==='full');
ok('resolvedは変えない', store('i')[0].resolved===false);
ok('stageは変えない', store('r')[0].stage===1);

print('--- 3) doApplyReturn: 冪等（既にfull/resolved/最終でも壊れない） ---');
reset();
setKey('i',[{id:30,pid:1,resolved:true}]);
setKey('r',[{id:31,injId:30,pid:1,stage:STG.length-1,stageDates:[]}]);
setKey('chart',[{injId:30,injDetail:{},medical:{},evals:[],soaps:[],returnCriteria:{},images:[],rtpLevel:'full'}]);
doApplyReturn(30,{rtp:true,resolved:true,stage:true},function(){});drain();
ok('resolved維持', store('i')[0].resolved===true);
ok('stage維持', store('r')[0].stage===STG.length-1);
ok('rtp維持', store('chart')[0].rtpLevel==='full');

print('--- 4) trainerNewInjChips: source/resolved/既読/window の絞り込み ---');
var NOW=1000000000000,DAY=86400000,W=30*DAY;
var injs=[
  {id:NOW-1*DAY, pid:1, source:'trainer', resolved:false},   // 対象
  {id:NOW-2*DAY, pid:2, source:'staff',   resolved:false},   // staff起票→除外
  {id:NOW-3*DAY, pid:3, source:'player',  resolved:false},   // player起票→除外
  {id:NOW-4*DAY, pid:4, source:'trainer', resolved:true},    // resolved→除外
  {id:NOW-40*DAY,pid:5, source:'trainer', resolved:false},   // window外(40日前登録)→除外
  {id:NOW-6*DAY, pid:6, source:'trainer', resolved:false}    // 対象
];
var chips=trainerNewInjChips(injs,[],NOW,W);
var cpids=chips.map(function(c){return c.pid;}).sort(function(a,b){return a-b;});
ok('trainer起票の新しい未resolvedを拾う(pid1,6)', cpids.indexOf(1)>=0&&cpids.indexOf(6)>=0);
ok('staff起票は除外(pid2)', cpids.indexOf(2)<0);
ok('player起票は除外(pid3)', cpids.indexOf(3)<0);
ok('resolvedは除外(pid4)', cpids.indexOf(4)<0);
ok('window外は除外(pid5)', cpids.indexOf(5)<0);
ok('該当2件', chips.length===2);
var chips2=trainerNewInjChips(injs,[NOW-1*DAY],NOW,W); // pid1のidを既読に
ok('既読は除外(pid1消える)', chips2.map(function(c){return c.pid;}).indexOf(1)<0);
ok('既読で1件に', chips2.length===1);
ok('windowMs省略なら年代フィルタなし', trainerNewInjChips(injs,[],NOW,0).some(function(c){return c.pid===5;}));

print('--- 5) approveInjury: 承認者を記録（approvedBy/approvedByRole） ---');
reset();
setKey('i',[{id:50,pid:1,resolved:false,source:'player',approved:null,notifyPlayer:false}]);
approveInjury(50);drain();
var a=store('i').filter(function(x){return x.id===50;})[0];
ok('approved=true', a.approved===true);
ok('approvedBy=スタッフ', a.approvedBy==='スタッフ');
ok('approvedByRole=staff', a.approvedByRole==='staff');
ok('approvedAt刻む(選手通知の起点)', !!a.approvedAt);
ok('notifyPlayer=true', a.notifyPlayer===true);

print('--- 6) returnFlowState: r無しは段階管理対象外＝完了扱い（レビュー確定所見の修正） ---');
ok('全完了→allDone', returnFlowState({resolved:true},{rtpLevel:'full'},{stage:STG.length-1}).allDone===true);
var s6=returnFlowState({resolved:true},{rtpLevel:'full'},null);
ok('r無しでもrtp+resolvedで完了(段階非該当)', s6.allDone===true&&s6.stageApplicable===false&&s6.stageDone===true);
var s6b=returnFlowState({resolved:true},{rtpLevel:'full'},{stage:2});
ok('r有り・段階未達→未完了かつ段階該当', s6b.allDone===false&&s6b.stageApplicable===true&&s6b.stageDone===false);
ok('未resolvedはallDone false', returnFlowState({resolved:false},{rtpLevel:'full'},null).allDone===false);
ok('rtp未fullはallDone false', returnFlowState({resolved:true},{rtpLevel:'rest'},null).allDone===false);

print('--- 7) doApplyReturn: r無しでstage指定でも安全（空振り・rを作らない） ---');
reset();
setKey('i',[{id:60,pid:1,resolved:false,source:'player',approved:true}]);
setKey('r',[]); // r無し
setKey('chart',[{injId:60,injDetail:{},medical:{},evals:[],soaps:[],returnCriteria:{},images:[],rtpLevel:'rest'}]);
doApplyReturn(60,{rtp:true,resolved:true,stage:true},function(){});drain();
ok('rtp/resolvedは反映', store('chart')[0].rtpLevel==='full'&&store('i')[0].resolved===true);
ok('r無しなら空振りでrを作らない(汚染しない)', store('r').length===0);

if(__fail)print('\n'+__fail+' FAIL');else print('\nALL P7C TESTS PASSED');
