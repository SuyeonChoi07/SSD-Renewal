// DOM fixture 검사입니다. 실제 브라우저 렌더링 검사를 대신하지 않습니다.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
const listeners={},media={};let context,checks=0;
class Element{
 constructor(tag,attrs={}){this.tag=tag;this.attrs=attrs;this.children=[];this.dataset={};this.events={};this.style={setProperty(k,v){this[k]=v;}};this.inert=false;for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=v;this.classes=new Set((attrs.class||'').split(/\s+/).filter(Boolean));this.classList={add:x=>this.classes.add(x),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),contains:x=>this.classes.has(x),toggle:(x,on)=>{on??=!this.classes.has(x);on?this.classes.add(x):this.classes.delete(x)}};}
 matches(s){if(s.startsWith('.'))return s.slice(1).split('.').every(x=>this.classes.has(x));if(s.startsWith('#'))return this.attrs.id===s.slice(1);const a=s.match(/^(\w+)?\[([^=\^\]]+)(\^?=)?"?([^"\]]*)"?\]$/);if(a){if(a[1]&&this.tag!==a[1])return false;const v=this.attrs[a[2]];return a[3]?(a[3]==='^='?v?.startsWith(a[4]):v===a[4]):v!==undefined;}return this.tag===s;}
 querySelectorAll(s){if(s.includes(' ')){const[first,...rest]=s.split(/\s+/);return this.querySelectorAll(first).flatMap(x=>x.querySelectorAll(rest.join(' ')));}return this.children.flatMap(x=>[...(s.split(',').some(part=>x.matches(part.trim()))?[x]:[]),...x.querySelectorAll(s)]);}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 append(node){this.children.push(node);node.parent=this;}
 insertBefore(node,before){const i=this.children.indexOf(before);this.children.splice(i<0?this.children.length:i,0,node);node.parent=this;}
 cloneNode(deep){const node=new Element(this.tag,{...this.attrs,class:[...this.classes].join(' ')});if(deep)this.children.forEach(c=>node.append(c.cloneNode(true)));return node;}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k];}
 removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,fn){this.events[k]=fn;}
 focus(){document.activeElement=this;}
 scrollIntoView(){this.scrolled=true;}
 getBoundingClientRect(){return{top:0,bottom:1000};}
}
const root=new Element('document'),stack=[root],voids=new Set(['meta','link','img','input','br']);
for(const m of html.replace(/<style>[\s\S]*?<\/style>/,'').replace(/<script>[\s\S]*?<\/script>/,'').replace(/<!--[\s\S]*?-->/g,'').matchAll(/<(\/?)([a-z][\w-]*)\b([^>]*)>/gi)){const tag=m[2];if(m[1]){stack.pop();continue;}const attrs={};for(const a of m[3].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];const element=new Element(tag,attrs);stack.at(-1).append(element);if(!voids.has(tag))stack.push(element);}
const document={documentElement:root.querySelector('html'),body:root.querySelector('body'),querySelector:s=>root.querySelector(s),querySelectorAll:s=>root.querySelectorAll(s),addEventListener:(key,fn)=>listeners['document:'+key]=fn};
const sandbox={document,console,innerWidth:1920,innerHeight:1020,scrollY:0,location:{hash:'',href:'http://localhost/'},history:{pushState(){},replaceState(){}},navigator:{clipboard:{writeText:async()=>{}}},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:fn=>fn(),matchMedia:q=>media[q]??=( {matches:false,addEventListener(){}} )};sandbox.window=sandbox;sandbox.addEventListener=(key,fn)=>listeners[key]=fn;sandbox.scrollTo=({top})=>{sandbox.scrollY=top};context=vm.createContext(sandbox);vm.runInContext(script,context);
const el=s=>document.querySelector(s),scenes=document.querySelectorAll('.scene');const check=(value,message)=>{assert.ok(value,message);checks++};
function at(index){sandbox.scrollY=index*1020;listeners.scroll();}
check(scenes.length===19,'19 scenes');check(el('.brand-home-link').style.width==='415px','home logo');check(scenes[0].inert===false&&scenes[1].inert,'active scene');
at(1);check(el('.brand-home-link').style.width==='109px','persistent small header');check(el('.shared-layer.shared-bread').style.width==='428px','front bread');
at(2);check(el('.shared-layer.shared-bread').style.width==='386px','bread resize');
at(3.5);check(parseFloat(el('.shared-layer.shared-culture-title').style.fontSize)<240,'headline interpolation');
at(5);const before=el('.shared-layer.shared-origin-panel').style.left;at(6);check(before===el('.shared-layer.shared-origin-panel').style.left,'fixed history copy');
at(12);check(el('.header-logo-black').style.opacity===1,'cream scene dark logo');at(17);check(el('.shared-layer.shared-large-wordmark').style.width==='783px','closing wordmark');
const productLink=el('[data-target-scene="8"]');productLink.events.click({preventDefault(){}});check(sandbox.scrollY===8160,'product anchor');
media['(max-width: 900px)'].matches=true;listeners.resize();check(document.body.classList.contains('reading-mode'),'mobile reading mode');check(scenes.every(x=>!x.inert),'mobile content readable');check(document.querySelectorAll('.mobile-shared-object').length===21,'mobile shared slots');
const menu=el('.mobile-menu-toggle');menu.events.click();check(menu.getAttribute('aria-expanded')==='true','menu open');listeners['document:keydown']({key:'Escape'});check(menu.getAttribute('aria-expanded')==='false'&&document.activeElement===menu,'Escape focus');
el('.contact-newsletter').events.submit({preventDefault(){}});check(el('.action-message').textContent.includes('전송되지'),'no false submission');
console.log(JSON.stringify({status:'PASS',checks,scope:'DOM fixture, not browser visual QA'},null,2));
