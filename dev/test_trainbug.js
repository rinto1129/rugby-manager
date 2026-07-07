// Phase 1: 種目推移セレクタのoption valueバグ修正テスト（staff:renderTrainTab / coach:buildTrendCoach 両対応）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_trainbug.js
//       jsc dev/prelude.js /tmp/coach.js dev/test_trainbug.js
// バグ: <option>にvalue属性が無く「種目名 (手入力)」の表示テキストがvalueになる
//       → setTrEx/setTrExCの.trim()では接尾辞が消えずexAggに一致せず、選択が既定種目へ巻き戻る
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
if(typeof window.scrollY==='undefined')window.scrollY=0;

// ブラウザのvalue解決を模擬: value属性があればそれ、無ければテキスト（タグ除去後）がvalue
function optFor(html,name){
  var re=/<option([^>]*)>([\s\S]*?)<\/option>/g,m;
  while((m=re.exec(html))){
    var attrs=m[1],text=m[2].replace(/<[^>]*>/g,'');
    if(text.indexOf(name)!==0)continue;
    var vm=attrs.match(/value="([^"]*)"/);
    return{hasValueAttr:!!vm,value:vm?vm[1]:text,text:text,selected:attrs.indexOf('selected')>=0};
  }
  return null;
}

// 共通データ: estBaseあり(ベンチプレス)・なし=手入力(懸垂)・全null系列(ヒップスラスト)
var IS_STAFF=(typeof renderTrainTab==='function');
var IS_COACH=(typeof buildTrendCoach==='function');
D.p=[{id:1,name:'選手A',position:'PR',year:2}];
D.tlog=[
 {id:'t1',pid:1,date:'2026-07-01',ts:'2026-07-01T10:00:00.000Z',results:[
   {exName:'ベンチプレス',estBase:'bench',sets:[{weight:100,reps:5,rir:1}],volume:500},
   {exName:'懸垂',sets:[{weight:10,reps:8}],volume:80},
   {exName:'ヒップスラスト',sets:[{weight:null,reps:null,rir:null}],volume:0}
 ],totalVolume:580},
 {id:'t2',pid:1,date:'2026-07-04',ts:'2026-07-04T10:00:00.000Z',results:[
   {exName:'ベンチプレス',estBase:'bench',sets:[{weight:102.5,reps:5,rir:1}],volume:512},
   {exName:'懸垂',sets:[{weight:12,reps:8}],volume:96}
 ],totalVolume:608}
];

function renderHtml(){
  if(IS_STAFF){renderTrainTab();return __els['dt5'].innerHTML;}
  return buildTrendCoach(1);
}

if(IS_STAFF){
  print('--- staff: 種目推移セレクタ（renderTrainTab/setTrEx） ---');
  window._dtPid=1;
}else{
  print('--- coach: 種目推移セレクタ（buildTrendCoach/setTrExC） ---');
  _detailPid=1;
  // setTrExCが呼ぶ全画面再構築はスタブ（本テストの対象はセレクタ選択の保持のみ）
  renderPlayerReport=function(){};
}
ok('対象サイトを認識(staff/coachのどちらか)',IS_STAFF!==IS_COACH);

window._trEx=null;window._trMetric='top';
var html=renderHtml();
ok('既定選択=estBaseあり種目(ベンチプレス)',window._trEx==='ベンチプレス');
var optManual=optFor(html,'懸垂');
ok('手入力種目のoptionが存在',!!optManual);
ok('optionにvalue属性がある',optManual&&optManual.hasValueAttr);
ok('valueは種目名そのもの（接尾辞なし）',optManual&&optManual.value==='懸垂');
ok('表示テキストには「 (手入力)」が付く',optManual&&optManual.text.indexOf('(手入力)')>=0);
var optEst=optFor(html,'ベンチプレス');
ok('estBaseあり種目もvalue属性あり+接尾辞なし',optEst&&optEst.hasValueAttr&&optEst.value==='ベンチプレス'&&optEst.selected);

// 選択操作の模擬: onchange="setTrEx(this.value)" 相当（巻き戻らないこと）
if(IS_STAFF)setTrEx(optManual.value);else setTrExC(optManual.value);
ok('選択が保持される（巻き戻らない）',window._trEx==='懸垂');
var html2=renderHtml();
ok('再描画後も選択状態が維持される',window._trEx==='懸垂'&&optFor(html2,'懸垂').selected&&!optFor(html2,'ベンチプレス').selected);

// e1rm→topフォールバック: estBase無し種目では推定1RM指標が使えずtopへ
window._trMetric='e1rm';
renderHtml();
ok('estBase無し種目でe1rm→topフォールバック',window._trMetric==='top');

// estBaseあり種目に戻すとe1rm指標は維持できる
if(IS_STAFF)setTrEx('ベンチプレス');else setTrExC('ベンチプレス');
window._trMetric='e1rm';
renderHtml();
ok('estBaseあり種目ではe1rm維持',window._trMetric==='e1rm');

// 全null系列で例外なし
var threw=false,html3='';
if(IS_STAFF)try{setTrEx('ヒップスラスト');html3=__els['dt5'].innerHTML;}catch(e){threw=true;print('  exception: '+e.message);}
else try{setTrExC('ヒップスラスト');html3=buildTrendCoach(1);}catch(e){threw=true;print('  exception: '+e.message);}
ok('全null系列(weight/reps/rir=null)で例外なし',!threw&&window._trEx==='ヒップスラスト'&&html3.length>0);

if(__fail===0)print('ALL TRAINBUG TESTS PASSED');else print(__fail+' TESTS FAILED');
