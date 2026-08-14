const CACHE_NAME="suvidhi-inquiry-v3";
const APP_SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  const url=new URL(e.request.url);
  if(url.pathname.endsWith("/") || url.pathname.endsWith("/index.html")){
    e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{
      const copy=r.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)); return r;
    }).catch(()=>caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
      const copy=r.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)); return r;
    })));
  }
});