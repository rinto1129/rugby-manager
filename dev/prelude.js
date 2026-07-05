// jsc用ブラウザ/Firebaseモック（実行=構文＋ロード時エラー検出、模擬実行用）
var window=this;
if(typeof console==='undefined'||!console.log){var console={log:print,error:print,warn:print,info:print};}
var __timeouts=[];
function setTimeout(fn,ms){__timeouts.push(fn);return __timeouts.length;}
function clearTimeout(id){}
function setInterval(fn,ms){return 0;}
function clearInterval(id){}
function requestAnimationFrame(fn){return 0;}
var __alerts=[];
function alert(m){__alerts.push(String(m));}
function confirm(m){return true;}
var localStorage={_d:{},getItem:function(k){return Object.prototype.hasOwnProperty.call(this._d,k)?this._d[k]:null;},setItem:function(k,v){this._d[k]=String(v);},removeItem:function(k){delete this._d[k];}};
var navigator={userAgent:'jsc-mock'};
var location={href:'',reload:function(){}};
var history={pushState:function(){},replaceState:function(){},back:function(){}};
function Event(t){this.type=t;}
function Image(){this.onload=null;}
function FileReader(){this.onload=null;this.readAsDataURL=function(){};}
function mkEl(){
  return{innerHTML:'',textContent:'',value:'',id:'',checked:false,disabled:false,
    style:{},dataset:{},files:[],
    classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},
    setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},
    appendChild:function(){},removeChild:function(){},insertBefore:function(){},
    addEventListener:function(){},removeEventListener:function(){},
    focus:function(){},blur:function(){},click:function(){},scrollIntoView:function(){},
    dispatchEvent:function(){},contains:function(){return false;},
    getContext:function(){return{createLinearGradient:function(){return{addColorStop:function(){}};},clearRect:function(){},fillRect:function(){}};},
    querySelectorAll:function(){return[];},querySelector:function(){return null;},
    offsetHeight:0,offsetWidth:0,parentElement:null};
}
var document={
  getElementById:function(id){var e=mkEl();e.id=id;return e;},
  querySelectorAll:function(){return[];},
  querySelector:function(){return null;},
  createElement:function(){return mkEl();},
  addEventListener:function(){},
  activeElement:null,
  body:mkEl(),documentElement:mkEl(),
  title:''
};
function Chart(el,cfg){this.config=cfg;this.data=cfg&&cfg.data;this.destroy=function(){};this.update=function(){};}
Chart.defaults={color:'',borderColor:'',scale:{grid:{color:''}}};
// Firestoreモック: __storeにJSON文字列で保持
var __store={};
var firebase={
  initializeApp:function(){},
  firestore:function(){
    return{
      enablePersistence:function(){return Promise.resolve();},
      collection:function(name){
        return{doc:function(k){
          var ref={
            _k:k,
            get:function(){return Promise.resolve({exists:__store[k]!=null,data:function(){return{data:__store[k]};}});},
            set:function(v){__store[k]=v.data;return Promise.resolve();},
            onSnapshot:function(cb,errCb){}
          };
          return ref;
        }};
      },
      runTransaction:function(fn){
        var tx={get:function(ref){return ref.get();},set:function(ref,v){ref.set(v);}};
        return Promise.resolve(fn(tx));
      }
    };
  }
};
var fetch=function(){return Promise.resolve({ok:true,json:function(){return Promise.resolve({});},text:function(){return Promise.resolve('');}});};
