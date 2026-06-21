// Yacht Charter Booking Flow - Progressive Web App (PWA) Service Worker Template
// This service worker enables fully responsive offline session modes, caching catamaran listings,
// destination guides, Leaflet map stylesheets/tiles, and booking flow states.

const sw = self as any;

const CACHE_NAME = "phuket-yacht-charter-v1";

// Assets to cache immediately on worker installation
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css",
  "/src/data.ts",
  "/src/translations.ts",
  "/api/health",
];

// Install Event: Pre-cache the main app Shell and booking components
sw.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Pre-caching core booking assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return sw.skipWaiting();
      }),
  );
});

// Activate Event: Clean up outdated caches and claim clients
sw.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("[Service Worker] Clearing old cache bundle:", cache);
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => {
        return sw.clients.claim();
      }),
  );
});

// Fetch Event: Caching and route-handling strategies
sw.addEventListener("fetch", (event: any) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Skip caching for dynamic API post requests (like AI itinerary planner or firestore sync), but provide offline fallbacks
  if (request.method === "POST") {
    if (
      url.pathname.startsWith("/api/ai-itinerary") ||
      url.pathname.startsWith("/api/translate")
    ) {
      event.respondWith(
        fetch(request).catch(() => {
          // Provide an offline JSON fallback for the Yacht Concierge / AI Planner
          return new Response(
            JSON.stringify({
              error: "Offline Mode Active",
              message:
                "Your device is currently offline. The yacht concierge and booking engines remain fully functional in Offline Mode. We will cache your preferences and schedule your itinerary draft!",
              isOfflineFallback: true,
              recommendedVesselId: "cat-lagoon-45",
              vesselReasoning:
                "Selected Lagoon 45 Catamaran from offline fleet database cache.",
              recommendedPierId: "chalong",
              routeTitle: "Offline Excursion Route Proposal",
              fullDescription:
                "Our server-side AI planner is offline, but the Phuket Private Yacht system is fully operational. We have configured your selected destinations using our local database catalog. Once network resumes, your final personalized booking quote will sync automatically.",
              stops: [
                {
                  destinationId: "ko-he-south",
                  name: "Coral Island (Koh He) South Side",
                  activity: "Pristine beach snorkeling & kayak paddleboarding",
                  durationHours: 2.5,
                  timeOfDay: "Late Morning",
                },
              ],
              totalEstimatedHours: 4,
              insiderTips: [
                "Insider Tip: Keep your offline PDF quotation downloaded to present to our harbor master.",
                "Insider Tip: The Chalong Pier checking gate supports offline security manifest scans.",
              ],
            }),
            {
              headers: { "Content-Type": "application/json" },
              status: 200,
            },
          );
        }),
      );
    }
    return;
  }

  // 2. Cache-First with Network Update Strategy for Static Assets and Yacht Images
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/) ||
    url.hostname.includes("images.unsplash.com") ||
    url.hostname.includes("unpkg.com") || // Leaflet CSS / JS
    url.pathname.includes("/assets/");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch a fresh copy in the background to update the cache (Stale-While-Revalidate)
          event.waitUntil(
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches
                    .open(CACHE_NAME)
                    .then((cache) => cache.put(request, networkResponse));
                }
              })
              .catch(() => {
                /* Handle background fetch failure silently */
              }),
          );
          return cachedResponse;
        }

        // Cache miss: Fall back to network, then cache the result
        return fetch(request)
          .then((networkResponse) => {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              (networkResponse.type !== "basic" &&
                !request.url.includes("unsplash") &&
                !request.url.includes("unpkg"))
            ) {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            return networkResponse;
          })
          .catch(() => {
            // Fallback placeholders for offline images
            if (request.url.includes("unsplash.com")) {
              return new Response(
                `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" style="background:#1e293b;color:#94a3b8;font-family:sans-serif;text-anchor:middle">
                 <rect width="100%" height="100%" fill="#1e293b" />
                 <text x="50%" y="45%" font-size="28" fill="#f8fafc" font-weight="bold">Phuket Private Yacht Charter</text>
                 <text x="50%" y="54%" font-size="18" fill="#94a3b8">Image Cached Offline (At Sea Connection)</text>
               </svg>`,
                { headers: { "Content-Type": "image/svg+xml" } },
              );
            }
          });
      }),
    );
    return;
  }

  // 3. Network-First with Cache Fallback for all other page requests
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Put successful GET page request to cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If network fails, serve from cache if available
        return caches.match(request).then((fallbackResponse) => {
          if (fallbackResponse) {
            return fallbackResponse;
          }

          // Return index.html for SPA router fallbacks
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/");
          }

          return new Response(
            "No network connection and asset is not cached.",
            {
              status: 503,
              statusText: "Service Unavailable",
            },
          );
        });
      }),
  );
});
