// メンバー表エディタ（goSquadEditor系。P1a・matchsel完全離脱＝goSelectMatchMembers等は削除済み）の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_matchday_squad_staff.js
// 核心: 背番号提案(POS_NUM→SQUAD_RES_NUM→16..23→1..23)・重複番号は保存拒否・未設定/範囲外は1回警告で続行可・
//       matchselキーには一切書き込まない・前回のメンバー表コピー（不在pidは除外）・保存はUndoトースト付き
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function storeCal(){return JSON.parse(__store['cal']||'[]');}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

var _pushedTitle='',_pushedHtml='',_pushedFn=null,_popCount=0;
pushView=function(t,h,fn){_pushedTitle=t;_pushedHtml=h;_pushedFn=fn;};
popView=function(){_popCount++;};
var _toasts=[];toast=function(m,a,fn){_toasts.push({m:m,a:a,fn:fn});};

function reset(){
  __els={};
  _pushedTitle='';_pushedHtml='';_pushedFn=null;_popCount=0;_toasts=[];__alerts.length=0;
  _squadTemp={};_squadSaveWarned=false;
}

setKey('p',[
  {id:1,name:'PR1',position:'PR',year:2},
  {id:2,name:'PR2',position:'PR',year:1},
  {id:3,name:'PR3',position:'PR',year:3},
  {id:4,name:'HO1',position:'HO',year:2},
  {id:5,name:'SO1',position:'SO',year:2}
]);

print('--- squadProposeNum: POS_NUM→SQUAD_RES_NUM→16..23→1..23の順で未使用の最初を提案 ---');
reset();
ok('PR1人目は1か3(POS_NUM PR=1・3)',[1,3].indexOf(squadProposeNum(D.p[0]))>=0);
_squadTemp[1]=squadProposeNum(D.p[0]);
var second=squadProposeNum(D.p[1]);
ok('PR2人目はもう片方の1/3',[1,3].indexOf(second)>=0&&second!==_squadTemp[1]);
_squadTemp[2]=second;
var third=squadProposeNum(D.p[2]);
ok('PR3人目はSQUAD_RES_NUM(17か18)',[17,18].indexOf(third)>=0);

print('--- goSquadEditor: 描画内容・既存メンバーの反映・orphan(不在pid)除外 ---');
reset();
setKey('cal',[{id:900,date:daysAgo(1),type:'match',title:'テスト戦',squad:[{pid:1,num:1},{pid:999,num:5}]}]);
goSquadEditor(900);
ok('タイトルに「メンバー表」を含む',has(_pushedTitle,'メンバー表'));
ok('説明文に1〜15/16〜23の案内',has(_pushedHtml,'1〜15')&&has(_pushedHtml,'16〜23'));
ok('存在しないpid999は除外案内が出る',has(_pushedHtml,'選手一覧に存在しない'));
ok('_squadTempにpid999は含まれない',!Object.prototype.hasOwnProperty.call(_squadTemp,999));
ok('_squadTempにpid1は含まれる(num1)',_squadTemp[1]===1);
if(_pushedFn)_pushedFn();
ok('sq-sumに合計1名が表示される',has(__els['sq-sum'].innerHTML,'合計 1名'));

print('--- squadToggle/squadSetNum: 選択・番号変更でrole判定(境界値) ---');
reset();
setKey('cal',[{id:901,date:daysAgo(1),type:'match',squad:[]}]);
goSquadEditor(901);
if(_pushedFn)_pushedFn();
squadToggle(1);
ok('選択で提案番号が入る',_squadTemp[1]!=null&&_squadTemp[1]!=='');
squadSetNum(1,'15');
ok('num=15(境界)でスタート判定',__els['sq-role-1'].textContent==='スタート');
squadSetNum(1,'16');
ok('num=16(境界)でリザーブ判定',__els['sq-role-1'].textContent==='リザーブ');
squadSetNum(1,'99');
ok('num=99で範囲外判定',__els['sq-role-1'].textContent==='範囲外'&&__els['sq-role-1'].className==='bd bd-r');
squadToggle(1);
ok('再度toggleで解除',!Object.prototype.hasOwnProperty.call(_squadTemp,1));

print('--- saveSquad: 重複番号は保存を拒否（matchselキーには一切書かない） ---');
reset();
setKey('cal',[{id:902,date:daysAgo(1),type:'match',squad:[]}]);
goSquadEditor(902);
if(_pushedFn)_pushedFn();
squadToggle(1);squadSetNum(1,'5');
squadToggle(2);squadSetNum(2,'5');
var btnDup=mkEl();
saveSquad(902,btnDup);drain();
ok('重複エラーが出る',__alerts.some(function(a){return has(a,'重複');}));
ok('保存されていない(squadが空のまま)',!storeCal().some(function(e){return idEq(e.id,902)&&e.squad&&e.squad.length;}));
ok('matchselキーは書かれていない',__store['matchsel']===undefined);
ok('popViewは呼ばれていない',_popCount===0);

print('--- saveSquad: 未設定/範囲外は1回警告→もう一度押すと保存できる ---');
reset();
setKey('cal',[{id:903,date:daysAgo(1),type:'match',squad:[]}]);
goSquadEditor(903);
if(_pushedFn)_pushedFn();
squadToggle(1);squadSetNum(1,''); // 未設定のまま
var btn1=mkEl();
saveSquad(903,btn1);drain();
ok('1回目は警告のみで保存されない',__alerts.some(function(a){return has(a,'未設定');}));
ok('1回目はguardSubmitに到達していない(busyでない)',btn1.dataset.busy!=='1');
var btn2=mkEl();
saveSquad(903,btn2);drain();
ok('2回目は保存される',storeCal().some(function(e){return idEq(e.id,903)&&e.squad&&e.squad.length===1;}));
ok('保存後はpopViewが呼ばれる',_popCount===1);
ok('保存トーストにUndoアクションが付く',_toasts.length>0&&_toasts[_toasts.length-1].a==='元に戻す'&&typeof _toasts[_toasts.length-1].fn==='function');
ok('matchselキーは書かれていない',__store['matchsel']===undefined);

print('--- saveSquad: 24名(重複無し)でも保存できる・番号範囲外は警告のみ・Undoで元に戻る ---');
reset();
var many=[];for(var i=1;i<=24;i++){many.push({id:100+i,name:'選手'+i,position:'SH',year:2});}
setKey('p',many);
setKey('cal',[{id:904,date:daysAgo(1),type:'match',squad:[]}]);
goSquadEditor(904);
if(_pushedFn)_pushedFn();
many.forEach(function(p,idx){squadToggle(p.id);squadSetNum(p.id,String(idx+1));});
var btn3=mkEl();
saveSquad(904,btn3);drain();
ok('24人目(#24)は範囲外(1-23)警告が出る',__alerts.some(function(a){return has(a,'範囲外');}));
var btn4=mkEl();
saveSquad(904,btn4);drain();
var savedEv=storeCal().find(function(e){return idEq(e.id,904);});
ok('24名全員保存できる(重複が無ければ範囲外はブロックしない)',savedEv&&savedEv.squad&&savedEv.squad.length===24);
var undoFn=_toasts[_toasts.length-1].fn;
ok('Undoコールバックが取得できる',typeof undoFn==='function');
undoFn();drain();
var afterUndo=storeCal().find(function(e){return idEq(e.id,904);});
ok('Undoで保存前(squad空)に戻る',afterUndo&&(!afterUndo.squad||afterUndo.squad.length===0));

print('--- squadCopyPrevious: 前回のメンバー表をコピー(不在pid・未選出選手は除外) ---');
reset();
setKey('p',[{id:1,name:'選手1',position:'PR',year:2},{id:2,name:'選手2',position:'HO',year:2}]);
setKey('cal',[
  {id:905,date:daysAgo(10),type:'match',squad:[{pid:1,num:1},{pid:999,num:9}]},
  {id:906,date:daysAgo(1),type:'match',squad:[]}
]);
goSquadEditor(906);
if(_pushedFn)_pushedFn();
squadCopyPrevious(906);
ok('前回のsquad(pid1)がコピーされる',_squadTemp[1]===1);
ok('前回に存在しないpid999は除外される',!Object.prototype.hasOwnProperty.call(_squadTemp,999));
ok('前回選出されていない選手2は含まれない',!Object.prototype.hasOwnProperty.call(_squadTemp,2));
ok('コピー成功のトーストが出る',_toasts.some(function(t){return has(t.m,'コピーしました');}));

print('--- 旧関数(matchsel系)の完全撤去確認 ---');
ok('goSelectMatchMembersは未定義',typeof goSelectMatchMembers==='undefined');
ok('toggleMatchSelは未定義',typeof toggleMatchSel==='undefined');
ok('matchSelAllは未定義',typeof matchSelAll==='undefined');
ok('saveMatchSelは未定義',typeof saveMatchSel==='undefined');

print(__fail===0?'ALL MATCHDAY-SQUAD TESTS PASSED':'FAILED: '+__fail+' checks');
