self.addEventListener("install", e=>{
  e.waitUntil(caches.open("music-app").then(cache=>cache.addAll([
    "index.html","register.html","app.html","settings.html",
    "style.css","theme.js","app.js"
  ])));
});
