// P9b: coach RTPフィールドマップ — fieldMapData(重い段階へ代表・却下除外・rest既定・full含む)とrtpFieldMapHtml(ドット/背番号/凡例/導線/アニメ分岐)
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_fieldmap_coach.js
var _fails=0,_runs=0;
function ok(name,cond){_runs++;if(!cond){_fails++;print('　NG '+name);}else{print('ok '+name);}}
function has(s,sub){return s.indexOf(sub)>=0;}
function count(s,sub){var c=0,i=0;while((i=s.indexOf(sub,i))>=0){c++;i+=sub.length;}return c;}

// ---- モックD ----
D.p=[
  {id:1,name:'山田',position:'SO'},
  {id:2,name:'佐藤',position:'PR'},
  {id:3,name:'鈴木',position:'FB'},
  {id:4,name:'高橋',position:'CTB'}
];
D.r=[];
D.chart=[
  {injId:10,rtpLevel:'rehab',evals:[],soaps:[],medical:{},injDetail:{}},
  {injId:11,rtpLevel:'full_nocontact',evals:[],soaps:[],medical:{},injDetail:{}},
  {injId:13,rtpLevel:'full',evals:[],soaps:[],medical:{},injDetail:{}}
];
D.i=[
  {id:10,pid:1,resolved:false,part:'膝'},                 // 山田: rehab
  {id:11,pid:1,resolved:false,part:'肩'},                 // 山田: full_nocontact（軽い方）→ rehabに代表される
  {id:12,pid:2,resolved:false,approved:false,part:'腰'},  // 佐藤: 却下済み→除外
  {id:13,pid:3,resolved:false,part:'足首'},               // 鈴木: full（トライライン表示）
  {id:14,pid:4,resolved:false,part:'太もも'}              // 高橋: chart無し→rest既定
];

// ---- fieldMapData ----
var items=fieldMapData();
ok('離脱3名(却下除外・同一選手は1件に代表)',items.length===3);
var yamada=items.filter(function(x){return idEq(x.p.id,1);})[0];
ok('山田は重い方(rehab)に代表',yamada&&yamada.lv==='rehab');
ok('佐藤(却下)は載らない',!items.some(function(x){return idEq(x.p.id,2);}));
var takahashi=items.filter(function(x){return idEq(x.p.id,4);})[0];
ok('chart無しはrest既定',takahashi&&takahashi.lv==='rest');
var suzuki=items.filter(function(x){return idEq(x.p.id,3);})[0];
ok('fullも含まれる',suzuki&&suzuki.lv==='full');

// ---- fmapNum ----
ok('fmapNum: SOは10',fmapNum({position:'SO',name:'x'})==='10');
ok('fmapNum: PRは1(1·3の先頭)',fmapNum({position:'PR',name:'x'})==='1');
ok('fmapNum: p.num優先',fmapNum({num:7,position:'SO',name:'x'})==='7');
ok('fmapNum: ポジ不明は頭文字',fmapNum({position:'??',name:'山田'})==='山');

// ---- rtpFieldMapHtml ----
window._noAnim=false;
var html=rtpFieldMapHtml();
ok('ドット3個',count(html,'fmap-dot')===3);
ok('SO背番号10のドット',has(html,'>10<'));
ok('タップで個人レポート',has(html,'openPlayer(1'));
ok('レーンラベルREST/TRY',has(html,'>REST</div>')&&has(html,'>TRY</div>'));
ok('凡例に人数',has(html,'リハビリのみ 1')&&has(html,'完全休養 1'));
ok('キャプション(トライ=完全復帰)',has(html,'トライ = 完全復帰'));
ok('ghost RTP',has(html,'ghost-num'));
ok('初回はrtp-anim付き',has(html,'class="rtp-anim"'));
ok('titleに名前と段階',has(html,'title="山田（リハビリのみ）"'));
window._noAnim=true;
var html2=rtpFieldMapHtml();
ok('_noAnim=trueでrtp-anim無し(静音再描画)',!has(html2,'rtp-anim'));
window._noAnim=false;

// ---- 空状態 ----
D.i=[];
ok('離脱ゼロは空メッセージ',has(rtpFieldMapHtml(),'離脱している選手はいません'));

// ---- レーンX位置: RTP6段階が3〜97%等間隔 ----
D.i=[{id:20,pid:1,resolved:false,part:'膝'}];D.chart=[];
var h3=rtpFieldMapHtml();
[3,21.8,40.6,59.4,78.2,97].forEach(function(x){ok('レーン '+x+'%',has(h3,'left:'+x+'%'));});

print(_fails===0?('ALL PASS ('+_runs+' assertions)'):('FAILED: '+_fails+'/'+_runs));
