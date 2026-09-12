const CACHE='ahanga-offline-v2';
const SHELL=['./','./index.html','./style.css','./app.js','./game.js','./puzzles.json','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const SONGS=Array.from({length:16},(_,i)=>753+i).flatMap(id=>[`./audio/clip_${id}.m4a`,`./audio/full_${id}.m4a`]);
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll([...SHELL,...SONGS]);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('ahanga-offline-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
async function ranged(response,range){
 const data=await response.arrayBuffer(),size=data.byteLength;
 const match=/^bytes=(\d*)-(\d*)$/.exec(range);
 if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
 let end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
 if(start>=size||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 const headers=new Headers(response.headers);headers.delete('Content-Encoding');headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
 return new Response(data.slice(start,end+1),{status:206,statusText:'Partial Content',headers});
}
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(req.url);
  if(cached)return req.headers.has('range')?ranged(cached,req.headers.get('range')):cached;
  try{return await fetch(req);}catch(error){if(req.mode==='navigate'){const shell=await cache.match('./index.html');if(shell)return shell;}throw error;}
 })());
});
