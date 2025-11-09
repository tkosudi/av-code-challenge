# 🧩 Ticket #1234 – Ads Not Loading (High Priority)

## 🧭 Summary

When accessing the publisher page, the ad image briefly appears and then disappears.  
Console logs display:
```
GET https://via.placeholder.com/300x250?text=Ad+Creative net::ERR_NAME_NOT_RESOLVED
```

The backend API `/api/ad` responded correctly, but the ad creative itself failed to load because the external image host (`via.placeholder.com`) is **no longer active**.  
Additionally, the HTML integration contained **two `<script>` tags** referencing the same JavaScript file, causing **duplicate executions of `fetchAd()`** and overlapping DOM updates.  

After removing the duplicate script and updating initialization to `DOMContentLoaded`, the ad now renders properly and the fallback logic (`onerror → renderFallback`) executes as expected when external images fail.

---

## 🔍 Investigation — Reproduce → Observe → Diagnose

### 1️⃣ Reproduction
- Environment started with:
  ```bash
  docker compose up -d
  ```
- Accessed `http://localhost:8080`
- Observed:
  - Ad container rendered.
  - Image initially flashes and disappears.
  - Console error:
    ```
    net::ERR_NAME_NOT_RESOLVED
    ```
  - Fallback text “Ad Unavailable” displayed.

---

### 2️⃣ Observation

| Layer | Check | Result |
|--------|--------|--------|
| Backend | `/api/ad` returns valid JSON with 200 OK | ✅ |
| Frontend (JavaScript) | `fetchAd()` logic and fallback render `<img>` correctly | ✅ |
| **HTML integration** | **Duplicate `<script type="module" src="./main.js">` entries triggered two concurrent executions of `fetchAd()`** | ⚠️ **Root cause of duplicate rendering** |
| Image host | `https://via.placeholder.com` | ❌ DNS resolution failure (external) |
| Fallback behavior | Displays “Ad Unavailable” when image fails | ✅ Works as expected |

---

## 🧠 Diagnosis

The incident had **two contributing factors**:

1. **Internal duplication** —  
   The publisher page included the same script twice:  
   ```html
   <script type="module" src="./main.js"></script>
   <script type="module" src="./main.js"></script>
   ```  
   This caused two concurrent `fetchAd()` executions, resulting in overlapping DOM updates and the ad image disappearing briefly.  
   ✅ **Fix:** Removed the duplicate `<script>` tag, added guard clauses (`if (adImage) return;`), and switched initialization from `window.onload` to `DOMContentLoaded`.

2. **External dependency failure** —  
   The ad image URL pointed to a deprecated host (`https://via.placeholder.com`) that no longer resolves via DNS.  
   This generated `net::ERR_NAME_NOT_RESOLVED` in the browser console.  
   ✅ **Fix:** Replaced the broken URL with `https://placehold.co/300x250?text=Ad+Creative` and verified fallback rendering when the image fails to load.

---

## 🧰 Technical Validation

| Test | Tool / Method | Expected Result | Actual Result |
|-------|----------------|------------------|----------------|
| `curl http://localhost:3000/api/ad` | Terminal | Returns JSON with image URL | ✅ OK |
| Access image directly | Browser | Renders placeholder image | ❌ DNS NXDOMAIN |
| Frontend log | Chrome DevTools | `ERR_NAME_NOT_RESOLVED` | ✅ Matches DNS issue |
| Duplicate script behavior | DOM inspection + console.log | Multiple `fetchAd()` calls detected | ⚠️ Confirmed and fixed |
| Fallback render | DOM inspection | `<div>Ad Unavailable</div>` | ✅ Correct behavior |

---

## 🧱 Root Cause

| Type | Description |
|------|--------------|
| **Internal duplication** | HTML contained two identical `<script src="./main.js">` tags, causing concurrent `fetchAd()` executions and DOM overwrites. |
| **External dependency failure** | The domain `via.placeholder.com` is inactive and cannot be resolved via DNS. |
| **System impact** | Ads failed to display due to simultaneous rendering conflicts and unreachable external creative source. |
| **Severity** | High (visual impact), affecting ad delivery reliability. |

---

## ⚙️ Fix Implementation

### ✅ Short-Term Mitigation
- Removed duplicate script reference from the publisher page.
- Replaced broken image domain:
  ```ts
  image: "https://placehold.co/300x250?text=Ad+Creative"
  ```
- Added guard clauses and switched event trigger:
  ```js
  document.addEventListener("DOMContentLoaded", fetchAd);
  ```

### ✅ Long-Term Solution (Recommended)
Host creatives locally under controlled infrastructure:
```ts
import fastifyStatic from "@fastify/static";
import { join } from "path";

await fastify.register(fastifyStatic, {
  root: join(process.cwd(), "public"),
  prefix: "/static/",
});
```
Then:
```ts
image: "http://localhost:3000/static/ads/ad-001.png";
```

---

## ✅ Validation and Verification

| Check | Expected Result | Status |
|--------|-----------------|--------|
| `/api/ad` returns 200 | JSON payload with new image URL | ✅ |
| Frontend renders ad | Visible `<img>` or fallback | ✅ |
| Duplicate execution | `fetchAd()` runs only once | ✅ |
| Network errors | None with new image source | ✅ |
| Fallback test | Manually trigger 404 to confirm resilience | ✅ |

---

## 🛡 Prevention and Observability

- **Dependency isolation**: Stop relying on third-party placeholder domains.  
- **Local hosting**: Store creatives under `/public/ads/` and serve via Fastify Static.  
- **Frontend safety**: Keep `DOMContentLoaded` initialization and guard clauses in place.  
- **Monitoring**: Implement `ad_load_success_rate` metric in logs for future regression tracking.  
- **Testing**: Maintain Jest + jsdom tests for DOM rendering, fallback behavior, and duplicate prevention.  

---

## 🏁 Final Outcome

✅ **Status:** Fixed and Validated  
🏷️ **Version:** `v1.0.1`  
📅 **Ticket:** #1234 – *Ad Rendering Investigation*  
🧩 **Root Cause:** Duplicate script inclusion + external dependency outage  
🧪 **Mitigation:** Removed duplicate script, improved initialization, replaced image source, verified fallback  
🚀 **Result:** Ads render consistently and the system is now resilient to both internal duplication and external image failures.
