// ✅ Service Worker: ทำให้แอปติดตั้งได้ (Install) จริง ไม่ใช่แค่ "เพิ่มไปยังหน้าจอโฮม"
// Cache-first สำหรับไฟล์หลักของแอป, ปล่อยผ่านเสมอสำหรับ database.json / Apps Script (ต้องข้อมูลสดใหม่)

const CACHE_NAME = "box-finder-v1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // อย่า cache ข้อมูล database / Apps Script — ต้องได้ค่าล่าสุดเสมอ ปล่อยผ่านให้ fetch ปกติ
  if (req.url.includes("database.json") || req.url.includes("script.google.com")) {
    return;
  }

  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
