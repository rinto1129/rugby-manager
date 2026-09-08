// カレンダー試合フィールド（opp/ko/venue/comp）と doEditCalEvent の日付/種別変更ガード・delCalEvent の削除ガード・
// doCalImport の ko 抽出（P1a）の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_matchday_cal_staff.js
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function storeCal(){return JSON.parse(__store['cal']||'[]');}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
function setInput(id,v){if(!__els[id])__els[id]=mkEl();__els[id].value=v;}

var _pushedTitle='',_pushedHtml='',_pushedFn=null,_popCount=0;
pushView=function(t,h,fn){_pushedTitle=t;_pushedHtml=h;_pushedFn=fn;};
popView=function(){_popCount++;};
var _toasts=[];toast=function(m,a,fn){_toasts.push({m:m,a:a,fn:fn});};
var _navCalCount=0;V.calendar=function(){_navCalCount++;};

function reset(){
  __els={};_pushedTitle='';_pushedHtml='';_pushedFn=null;_popCount=0;_toasts=[];__alerts.length=0;_navCalCount=0;
}

setKey('p',[{id:1,name:'選手1',position:'PR',year:2}]);

print('--- calEventFormHTML: 試合フィールドの存在とcalTypeChangedの表示切替 ---');
reset();
var formHtml=calEventFormHTML(daysAgo(0));
ok('対戦相手欄がある',has(formHtml,'id="cef-opp"'));
ok('KO欄がある',has(formHtml,'id="cef-ko"'));
ok('会場欄がある',has(formHtml,'id="cef-venue"'));
ok('試合種別欄がある',has(formHtml,'id="cef-comp"'));
ok('種別selectにcalTypeChangedが付く',has(formHtml,'onchange="calTypeChanged(this.value)"'));
setInput('cef-match',{style:{display:'grid'}});
__els['cef-match']=mkEl();
calTypeChanged('practice');
ok('practice選択でcef-matchが隠れる',__els['cef-match'].style.display==='none');
calTypeChanged('match');
ok('match選択でcef-matchが表示される',__els['cef-match'].style.display==='grid');

print('--- doAddCalEvent: opp/ko/venue/compを保存・タイトル空ならoppから自動補完 ---');
reset();
setKey('cal',[]);
setInput('cal-date',daysAgo(0));
setInput('cef-title','');
setInput('cef-type','match');
setInput('cef-detail','');
setInput('cef-opp','福岡工業大学');
setInput('cef-ko','14:00');
setInput('cef-venue','福大グラウンド');
setInput('cef-comp','official');
doAddCalEvent();drain();
var added=storeCal();
ok('1件追加された',added.length===1);
ok('タイトルはvs+oppで自動補完',added[0].title==='vs 福岡工業大学');
ok('oppが保存される',added[0].opp==='福岡工業大学');
ok('koが保存される',added[0].ko==='14:00');
ok('venueが保存される',added[0].venue==='福大グラウンド');
ok('compが保存される',added[0].comp==='official');

print('--- doAddCalEvent: 練習種別ではopp/ko/venue/compを保存しない ---');
reset();
setKey('cal',[]);
setInput('cal-date',daysAgo(0));
setInput('cef-title','通常練習');
setInput('cef-type','practice');
setInput('cef-detail','');
setInput('cef-opp','使われないはず');
doAddCalEvent();drain();
var added2=storeCal();
ok('practiceイベントにoppは付かない','opp' in added2[0]===false);

print('--- showEditCalEvent: squad登録済みなら日付変更をブロック案内・未登録なら制約なし ---');
reset();
setKey('cal',[
  {id:700,date:daysAgo(1),type:'match',title:'A戦',opp:'A大',ko:'13:00',venue:'会場A',squad:[{pid:1,num:1}]},
  {id:701,date:daysAgo(2),type:'match',title:'B戦',squad:[]}
]);
showEditCalEvent(700);
ok('squad登録済みは制約案内が出る',has(_pushedHtml,'変更できません'));
ok('メンバー表を開くボタンがある',has(_pushedHtml,"goSquadEditor('700')"));
if(_pushedFn)_pushedFn();
ok('opp欄に既存値がプリフィルされる',__els['cef-opp'].value==='A大');
ok('ko欄に既存値がプリフィルされる',__els['cef-ko'].value==='13:00');
ok('venue欄に既存値がプリフィルされる',__els['cef-venue'].value==='会場A');
reset();
showEditCalEvent(701);
ok('squad未登録では制約案内が出ない',!has(_pushedHtml,'変更できません'));

print('--- doEditCalEvent: squad登録済みイベントの日付/種別変更はブロックされる（内容変更は可） ---');
reset();
setKey('cal',[{id:700,date:daysAgo(1),type:'match',title:'A戦',opp:'A大',squad:[{pid:1,num:1}]}]);
setInput('cal-date',daysAgo(5)); // 日付を変えようとする
setInput('cef-title','A戦（改）');
setInput('cef-type','match');
setInput('cef-detail','');
setInput('cef-opp','A大学（改）');
setInput('cef-ko','');
setInput('cef-venue','');
setInput('cef-comp','');
var btnBlocked=mkEl();
doEditCalEvent(700,btnBlocked);drain();
var evAfterBlocked=storeCal().find(function(e){return idEq(e.id,700);});
ok('日付は変更されない(ブロック)',evAfterBlocked.date===daysAgo(1));
ok('ブロックのアラートが出る',__alerts.some(function(a){return has(a,'変更できません');}));
ok('ボタンはreleaseされる(busyでない)',btnBlocked.dataset.busy!=='1');
ok('squadは保全される(消えない)',evAfterBlocked.squad&&evAfterBlocked.squad.length===1);

reset();
setKey('cal',[{id:700,date:daysAgo(1),type:'match',title:'A戦',opp:'A大',squad:[{pid:1,num:1}]}]);
setInput('cal-date',daysAgo(1)); // 日付は変えない
setInput('cef-title','');
setInput('cef-type','match');
setInput('cef-detail','');
setInput('cef-opp','A大学（改称）');
setInput('cef-ko','15:00');
setInput('cef-venue','新会場');
setInput('cef-comp','official');
var btnOk=mkEl();
doEditCalEvent(700,btnOk);drain();
var evAfterOk=storeCal().find(function(e){return idEq(e.id,700);});
ok('日付を変えない編集は成功する',evAfterOk.opp==='A大学（改称）'&&evAfterOk.ko==='15:00'&&evAfterOk.venue==='新会場');
ok('squadは保全される(in-place更新)',evAfterOk.squad&&evAfterOk.squad.length===1&&evAfterOk.squad[0].pid===1);
ok('修正トーストが出る',_toasts.some(function(t){return has(t.m,'修正しました');}));

print('--- delCalEvent: squad/md登録済みの試合は削除を拒否 ---');
reset();
setKey('cal',[{id:800,date:daysAgo(1),type:'match',squad:[{pid:1,num:1}]}]);
setKey('md',[]);
delCalEvent(800);
ok('squadありは削除されずcal不変',storeCal().length===1);
ok('拒否アラートが出る',__alerts.some(function(a){return has(a,'削除できません');}));

reset();
setKey('cal',[{id:801,date:daysAgo(1),type:'match',squad:[]}]);
setKey('md',[{id:1,pid:1,date:daysAgo(1),evId:801}]);
delCalEvent(801);
ok('md登録済みも削除されずcal不変',storeCal().length===1);
ok('拒否アラートが出る(md件数)',__alerts.some(function(a){return has(a,'削除できません');}));

reset();
setKey('cal',[{id:802,date:daysAgo(1),type:'match',squad:[]}]);
setKey('md',[]);
delCalEvent(802);drain();
ok('squad/mdどちらも無い試合は削除できる',storeCal().length===0);

print('--- doCalImport: match行のtimeをkoへ抽出（他種別には付かない） ---');
reset();
setKey('cal',[]);
_calImport=[
  {type:'match',date:daysAgo(0),title:'vs C大',time:'14:00',include:true,err:false},
  {type:'practice',date:daysAgo(0),title:'通常練習',time:'16:00',include:true,err:false}
];
doCalImport();drain();
var imported=storeCal();
var matchRow=imported.find(function(e){return e.type==='match';});
var practiceRow=imported.find(function(e){return e.type==='practice';});
ok('match行にkoが付く',matchRow&&matchRow.ko==='14:00');
ok('practice行にkoは付かない','ko' in (practiceRow||{})===false);

print(__fail===0?'ALL MATCHDAY-CAL TESTS PASSED':'FAILED: '+__fail+' checks');
