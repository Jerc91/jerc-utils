self.tools={},function(){function a(){return o?Promise.resolve():caches.open(s).then((a)=>o=a)}function b(a){if(u==a.src&&p)return j(a,new Request(a.srcToRequest,{method:'POST',body:'[]'}));let b=new Request(a.srcToRequest,{method:a.method,cache:'no-cache',headers:new Headers({"Content-Type":a.mime,HEADER_JR:t}),body:JSON.stringify(a.value)});return fetch(b).then(function(b){if(!b.ok)throw`${b.status} ${b.statusText}`;let c;return c=a.cache?a.saveFile(a,b).then(i):j(a,b),c},(a)=>{throw a.message})}function c(a){return{result:a.result,path:a.src,observedId:a.observedId,ext:a.ext}}function d(a){var b,c,d=a.name.indexOf('?'),e=a.name;switch(-1<d&&(e=e.substring(0,d)),c=e.split('.'),c=c[c.length-1].toLowerCase(),c){case'jpg':case'png':b=q.BLOB,c='blob';break;case'css':b=q.CSS;break;case'js':b=q.JS;break;case'json':b=q.JSON,a.isText=!0,a.methodBody='json';break;case'txt':case'html':b=q.TEXT,a.methodBody='text',a.isText=!0;break;default:b=q.JS,c='js';}a.ext=c,a.mime=a.mime||b}function e(a){var b='Error: ';return b+=a,b+=', ',m?m(a.toString()):void 0,a}function f(a){return new Promise((b,c)=>{null===a.onerror&&(a.onerror=(b)=>c(b,a)),null===a.onsuccess?a.onsuccess=(c)=>b(c,a):b(a)})}function g(){var a,b,c;return new Promise((d)=>{a=indexedDB.open(r.NAME,r.VERSION),p=!1,a.onupgradeneeded=(a)=>{p=!0,c=a.target.result,b=c.createObjectStore(r.TABLE,{keyPath:r.KEYPATH}),b.createIndex(r.TABLE,r.KEYPATH),b.transaction.oncomplete=()=>d(c)},f(a).then((a)=>d(a.target.result))})}function h(a){function b(a){let b=n[a.name];return b&&!isNaN(a.date)?b.valueOf()>=a.date:!0}return new Promise((c)=>n?c(b(a)):void g().then((d)=>{if(u==a.src&&p)return c(!1);let e=d.transaction(r.TABLE,'readonly').objectStore(r.TABLE).getAll();return f(e).then(()=>{n={},e.result.forEach((a)=>n[a[r.KEYPATH]]=a.date),c(b(a))})}))}function i(a){return g().then((b)=>{let c=b.transaction(r.TABLE,'readwrite').objectStore(r.TABLE).put({name:a.name,date:a.date});return f(c).then(()=>(n[a[r.KEYPATH]]=a.date,a))})}function j(a,b){return b[a.methodBody]().then((b)=>(a.result=b,b instanceof Blob&&!b.type&&(a.result=b.slice(b,b.size,a.mime)),a))}function k(a){return o.match(new Request(a.srcToRequest)).then(function(c){return c?j(a,c):b(a)})}function l(a,b){return a.date=new Date,o.put(b.url,b.clone()),j(a,b)}let m,n,o,p;const q={BLOB:'application/octet-stream',CSS:'text/css; charset="utf-8"',IMG:'image/jpeg',JS:'text/javascript; charset="utf-8"',JSON:'application/json; charset="utf-8"',TEXT:'text/plain; charset="utf-8"',FORMQ:'application/x-www-form-urlencoded',FORMDATA:'multipart/form-data'},r={NAME:'jrTable',VERSION:1,TABLE:'files',KEYPATH:'name'},s='0.0.1',t='H_JR',u='assets/config/filesToUpdate.json';this.factoryError=function(a){m=a},this.getFile=function(f){let g={};return g.name=f.src.split('/'),g.name=g.name[g.name.length-1],Object.assign(g,{cache:!0,method:'GET',methodBody:'blob'},f),d(g),g.date=Date.parse(g.files[g.name]),g.srcToRequest=`${location.origin}/${f.src}`,g.getSavedFile=g.getSavedFile||k,g.saveFile=g.saveFile||l,a().then(()=>h(g).then((a)=>(a&&g.cache?g.getSavedFile(g):b(g)).then(c,e),e))},this.sendRequest=b,this.saveResponseDB=i,this.getResult=j,this.constants={HEADER_JR:t,CACHE_VERSION:s,FILESTOUPDATE:u}}.call(self.tools);