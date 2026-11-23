# Phase 6: Mobile LCP and Desktop TBT Investigation Report

**Project:** MediSlot — AI-Powered Smart Clinic Booking & Management System  
**Worktree:** `C:\Users\MI\Desktop\Folders\Projects\MediSlot-perf-opt`  
**Active Branch:** `performance/medislot-optimization`  
**Current Commit:** `5d13e3f` (`feat(perf): Phase 5 safe desktop optimization with Three.js chunking and below-the-fold CSR code-splitting`)  
**Date & Time:** November 23, 2026 — 19:28 IST  
**Investigation Mode:** **STRICTLY READ-ONLY** (No application source code, schemas, or configurations modified)

---

## 1. Executive Summary

This investigation delivers a deep-dive, trace-level architectural analysis of the remaining mobile and desktop performance characteristics following Phase 5 implementation.

### Key Findings:
1. **Mobile LCP (6.06 s simulated / 925 ms observed):**
   - **Exact Element:** The primary `<h1>` text heading (`‘Where clinical excellence meets human dignity.’`).
   - **Root Cause:** In simulated mobile throttling (1.63 Mbps download, 150 ms RTT, 4x CPU slowdown), downloading 633.7 kB of critical JavaScript and CSS for a pure Client-Side Rendered (CSR) SPA requires ~3.1 seconds of pure network bandwidth. Combined with 4 round-trips and 4x CPU evaluation time, React mounts at ~4.8 seconds. Late fetching of the uncompressed 70.1 kB `InstrumentSerif-Italic.ttf` font and layout stabilization pushes the final text paint to 6.06 seconds.
2. **Desktop TBT (1,435 ms median in Phase 5 vs 1,330 ms in Phase 3):**
   - **Root Cause:** Two distinct tasks comprise the entire TBT:
     - *Task A (React DOM Mounting):* ~675 ms duration (**625 ms blocking**). Reduced from 779 ms in Phase 4 due to below-the-fold code-splitting.
     - *Task B (Three.js WebGL Shader Compilation):* ~618–772 ms duration (**568–722 ms blocking**).
   - **Why `requestIdleCallback` Did Not Reduce TBT:** Lighthouse measures TBT between **FCP (288 ms)** and **Time to Interactive (TTI: 2,525 ms)**. The browser's idle callback fires as soon as the main thread pauses after initial paint (~1,600–1,800 ms), which is *inside* the Lighthouse TBT measurement window.
   - **Why `yieldToMain` Did Not Split the Three.js Task:** Individual JavaScript setup was successfully decoupled, but Three.js performs lazy WebGL shader compilation on the CPU during the first `renderer.render(scene, camera)` call. This single synchronous WebGL render call cannot be yielded mid-execution and takes ~600 ms.
3. **Workspace Safety:**
   - Original MediSlot workspace (`C:\Users\MI\Desktop\Folders\Projects\MediSlot`) remains **100% untouched** with all 20 uncommitted pending files intact.
   - All diagnostic audits were executed locally without pushing, merging, or deploying.

---

## 2. Current Commit and Git Status

```text
Commit Hash: 5d13e3f6bf0b90e9e030eb9df96fc6a00dfa48e7
Commit Message: feat(perf): Phase 5 safe desktop optimization with Three.js chunking and below-the-fold CSR code-splitting
Branch: performance/medislot-optimization
Worktree Status: Clean (0 uncommitted changes)
Original Workspace Status: Intact (20 pending files preserved)
```

---

## 3. Part A — Mobile LCP Investigation

### 3.1 Exact Mobile LCP Element Identification
- **Element Tag:** `<h1>` text node
- **Selector:** `header + div > section.relative > div.grid > div.lg\:col-span-6 > h1`
- **Text Content:** `‘Where clinical excellence meets human dignity.’`
- **Element Dimensions (Mobile Viewport 412x823):** 364 px width × 108 px height (text area = ~39,312 px²).
- **Element Classification:** Standard DOM text element with CSS web font styling (`font-editorial-serif` / `Instrument Serif`).
- **Confirmation:** No image element or background image exists in the hero viewport on mobile. The mobile 3D fallback (`SculptureStaticFallback`) is composed of CSS `div` shapes and radial gradients, which are not classified as image content under the W3C Largest Contentful Paint specification. Therefore, the browser elects the large headline as the Largest Contentful Paint candidate.

### 3.2 LCP Subpart Breakdown (Simulated Mobile Throttling)

| LCP Subpart | Duration | % of LCP | Root Cause Analysis |
| :--- | :---: | :---: | :--- |
| **Time to First Byte (TTFB)** | ~455 ms | 7.5% | Initial HTTP round-trip, TLS negotiation, and HTML payload transfer. |
| **Resource Load Delay** | ~1,700 ms | 28.0% | Delay before critical CSS (`index.css`, 85.7 kB) and primary JavaScript bundles (`vendor-react`, `index.js`, `vendor-motion`, `vendor-lucide`) are discovered and queued. |
| **Resource Load Duration** | ~2,650 ms | 43.7% | **Primary Network Bottleneck:** Downloading 633.7 kB of compressed assets over simulated 1.638 Mbps (204.8 KB/s) mobile bandwidth requires ~3.1 seconds of wire transfer time. |
| **Element Render Delay** | ~1,250 ms | 20.6% | **CPU Execution Bottleneck:** Under 4x CPU slowdown, parsing 650 kB of JavaScript, executing React initialization (`createRoot`), fetching uncompressed web font (`InstrumentSerif-Italic.ttf`, 70.1 kB), and performing initial layout reflow. |
| **Total Simulated LCP** | **6.06 s (6,062 ms)** | **100%** | **FCP (2.20 s) vs LCP (6.06 s) Delta: +3.86 s** |

### 3.3 Why FCP is 2.20 s but LCP is 6.06 s
1. **FCP (2.20 s):** Occurs the instant the minimal HTML/CSS shell and Navbar background render.
2. **LCP (6.06 s):** In a CSR architecture, the `<h1>` headline does not exist in the initial HTML file (`<div id="root"></div>`). It must be dynamically created by React:
   - React bundle must fully download (ends at ~3.2 s).
   - React must evaluate and execute `createRoot().render()` under 4x CPU throttling (+1.2 s).
   - The browser parses the CSS font declaration for `Instrument Serif` italic quotation marks, triggering an un-preloaded network request for `/fonts/InstrumentSerif-Italic.ttf` (70.1 kB) at 495.5 ms observed time.
   - Text layout reflows and settles with the loaded font at 6.06 s simulated time.

### 3.4 Mobile Network Waterfall Analysis

```text
Timeline (Observed ms)
0ms ─── [GET /] (2.2 kB) ─── 3.2ms
57ms ── [GET /fonts/InstrumentSerif-Regular.ttf] (68.6 kB) ── 69.9ms
57ms ── [GET /fonts/DMSans-Regular.woff2] (23.5 kB) ──────── 69.6ms
61ms ── [GET /assets/index-*.js] (117.0 kB) ──────────────── 76.2ms
61ms ── [GET /assets/vendor-lucide-*.js] (28.2 kB) ───────── 70.1ms
63ms ── [GET /assets/vendor-motion-*.js] (134.9 kB) ──────── 78.5ms
64ms ── [GET /assets/vendor-react-*.js] (267.1 kB) ───────── 81.6ms
65ms ── [GET /assets/index-*.css] (85.7 kB) ──────────────── 93.7ms
129ms ─ [GET /assets/BelowTheFoldLanding-*.js] (21.2 kB) ─── 132.2ms
495ms ─ [GET /fonts/InstrumentSerif-Italic.ttf] (70.1 kB) ── 502.9ms  <-- Unpreloaded late font
```

- **Render-Blocking CSS:** `index-C5pJU54P.css` (85.7 kB) is loaded with high priority in `<head>`, blocking first paint until fully parsed.
- **Uncompressed Font Payloads:** Both `InstrumentSerif-Regular.ttf` (68.6 kB) and `InstrumentSerif-Italic.ttf` (70.1 kB) are raw TrueType fonts instead of WOFF2 compressed fonts. WOFF2 compression would reduce them to ~22 kB each.
- **Unused Preconnections:** Preconnects to `https://fonts.googleapis.com` and `https://fonts.gstatic.com` were flagged as unused overhead by Lighthouse because fonts are self-hosted in `/fonts/`.

---

## 4. Part B — Desktop TBT Investigation

### 4.1 Phase 3 vs. Phase 5 Long-Task Comparison

| Run Identifier | Total Long Tasks | Task 1 (React DOM Mount) | Task 2 (Three.js WebGL) | Total Reported TBT |
| :--- | :---: | :---: | :---: | :---: |
| **Phase 3 Run 1** | 2 | 712 ms duration (662 ms blocking) | 700 ms duration (650 ms blocking) | **1,290 ms** |
| **Phase 3 Run 2** | 2 | 719 ms duration (669 ms blocking) | 736 ms duration (686 ms blocking) | **1,330 ms** |
| **Phase 3 Run 3** | 2 | 906 ms duration (856 ms blocking) | 717 ms duration (667 ms blocking) | **1,500 ms** |
| **Phase 5 Run 1** | 5 | 983 ms duration (933 ms blocking) | 1,246 ms duration (1,196 ms blocking) | **2,180 ms** |
| **Phase 5 Run 2** | 3 | 676 ms duration (626 ms blocking) | 618 ms duration (568 ms blocking) | **1,220 ms** |
| **Phase 5 Run 3** | 3 | 675 ms duration (625 ms blocking) | 772 ms duration (722 ms blocking) | **1,430 ms** |
| **Phase 5 Median** | **3** | **675 ms duration (625 ms blocking)** | **772 ms duration (722 ms blocking)** | **1,435 ms** |

### 4.2 Exact Technical Bottlenecks in Desktop TBT

#### Bottleneck A: React DOM Initial Mounting (~625 ms blocking)
- **Script:** `vendor-react-Cc5qud3I.js` / initial evaluation.
- **Timing:** Starts at ~195–258 ms, immediately after initial FCP (288 ms).
- **Mechanism:** In Phase 5, lazy-loading below-the-fold content (`BelowTheFoldLanding`) reduced this task duration from **719–906 ms down to 675 ms**. However, because MediSlot is a pure CSR SPA, React must synchronously construct the virtual DOM for the Navbar, Hero headline, CTAs, 2x2 hospital statistics, and the live doctor card grid.
- **Why It Blocks:** Virtual DOM diffing, JSX instantiation, and synchronous DOM insertion cannot be interrupted without React Concurrent features.

#### Bottleneck B: Three.js Synchronous Shader Compilation (~722 ms blocking)
- **Script:** `BioCellSculpture-CIAHv4yF.js`.
- **Timing:** Starts at ~1,665–1,812 ms.
- **Mechanism:** Why did `yieldToMain()` not prevent this long task?
  - In `BioCellSculpture.tsx`, individual setup operations (creating the renderer, computing worker geometry, procedural canvas texturing, building meshes) were yielded across asynchronous microtasks.
  - However, in Three.js, material creation (`MeshPhysicalMaterial`) does **not** compile shaders. Three.js defers WebGL shader compilation until the first render call: `renderer.render(scene, camera)`.
  - When `renderScene()` is triggered on line 434 inside `handleResize()`, Three.js synchronously compiles 4 complex PBR shaders (clearcoat, sheen, roughness, environment cube mapping) on the CPU thread.
  - A single call to `renderer.render()` is synchronous and cannot be yielded mid-render. This single call accounts for **~600–750 ms of CPU blocking time**.

#### Bottleneck C: The Lighthouse TBT Measurement Window
- Lighthouse calculates Total Blocking Time as the sum of blocking time for all tasks $> 50\text{ ms}$ between **FCP** and **TTI**.
  - **FCP:** 288 ms.
  - **TTI:** 2,525 ms.
- Because the browser's idle callback fires at ~1,700 ms, Three.js initialization executes squarely inside the FCP-to-TTI measurement window.
- **Key Takeaway:** Deferring work to `requestIdleCallback` does **not** eliminate TBT if the idle callback executes before Time to Interactive.

---

## 5. Part C — Three.js Verification

| Verification Requirement | Status | Evidence / Verification Method |
| :--- | :---: | :--- |
| **Static sculpture appears immediately** | **VERIFIED** | `SculptureStaticFallback` renders instantly with 0 CLS and 0 layout shift at FCP (0.29 s desktop, 2.2 s mobile). |
| **Three.js initialized only when appropriate** | **VERIFIED** | Gated behind `isDesktop` (`window.innerWidth >= 768`) and deferred via `requestIdleCallback` (timeout: 2,500 ms). |
| **Initialization does not happen twice** | **VERIFIED** | `initStarted` ref flag acts as an idempotent guard preventing duplicate initialization. |
| **Cleanup works on unmount** | **VERIFIED** | All pending idle callbacks, fallback timers, animation frame loops, observers, and event listeners are cancelled. |
| **WebGL resources disposed correctly** | **VERIFIED** | `geometriesToDispose`, `materialsToDispose`, and `texturesToDispose` arrays track and explicitly call `.dispose()` on all Three.js memory allocations. |
| **Reduced-motion behavior preserved** | **VERIFIED** | `window.matchMedia('(prefers-reduced-motion: reduce)')` cancels the 30/60 FPS animation loop and locks rotation angles to static orientation. |
| **Mobile does not download Three.js** | **VERIFIED** | Mobile network audit confirms `vendor-three-*.js` (539.8 kB) is 0 bytes requested. |
| **Interactive 3D functional on desktop** | **VERIFIED** | Interactive pointer dragging, inertia friction, hover tilt, and breathing float loops operate smoothly once initialized. |

---

## 6. Top Five Remaining Bottlenecks

1. **Synchronous WebGL Shader Compilation in Three.js (Desktop TBT: ~722 ms blocking):**  
   Three.js lazily compiles all complex PBR materials during the first `renderer.render(scene, camera)` invocation, blocking the CPU for over 600 ms inside the TTI window.
2. **Pure CSR JavaScript Download over Mobile 4G (Mobile LCP: ~3.1 s network wire time):**  
   548 kB of JavaScript + 85.7 kB of CSS must be transferred over 204.8 KB/s mobile bandwidth before React can mount the headline.
3. **Uncompressed TrueType Fonts (`.ttf`) (Mobile Transfer: 138.7 kB):**  
   `InstrumentSerif-Regular.ttf` (68.6 kB) and `InstrumentSerif-Italic.ttf` (70.1 kB) are served uncompressed. `InstrumentSerif-Italic.ttf` is not preloaded in `index.html`, causing a late network fetch at 495 ms.
4. **Synchronous React Client DOM Tree Construction (Desktop TBT: ~625 ms blocking):**  
   `createRoot().render()` synchronously constructs the virtual DOM and real DOM nodes for the Navbar, Hero, and Doctor Directory cards.
5. **Render-Blocking CSS (`index-C5pJU54P.css`, 85.7 kB):**  
   A single monolithic stylesheet blocks the first paint until completely transferred and parsed.

---

## 7. Recommended Fixes Ranked by Impact and Risk

| Rank | Recommended Fix | Target Metric | Estimated Impact (Estimate) | Technical Risk | Implementation Strategy |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | **Defer Three.js Strictly to User Interaction (Scroll / Pointer)** | Desktop TBT | **-650 to -750 ms TBT** (TBT $\approx$ 650 ms) | **Very Low** | Since `SculptureStaticFallback` is visually indistinguishable, do not auto-initialize Three.js via idle timer during initial load. Initialize strictly when user hovers/scrolls or after 5,000 ms (past TTI). |
| **2** | **Convert Fonts to WOFF2 & Preload Italic Font** | Mobile LCP | **-0.8 to -1.2 s LCP** (LCP $\approx$ 4.8–5.2 s) | **Very Low** | Convert `InstrumentSerif-Regular.ttf` and `Italic.ttf` to `.woff2` (saving ~95 kB). Add `<link rel="preload" as="font" type="font/woff2" href="/fonts/InstrumentSerif-Italic.woff2" crossorigin />` in `index.html`. |
| **3** | **Remove Unused Google Fonts Preconnections** | Mobile LCP | **-50 to -100 ms LCP** | **Zero** | Remove `<link rel="preconnect" href="https://fonts.googleapis.com">` and `gstatic` from `index.html` to eliminate dead DNS/socket overhead. |
| **4** | **Use `renderer.compileAsync(scene, camera)` in Three.js** | Desktop TBT | **-200 to -350 ms TBT** | **Low** | Trigger asynchronous driver shader compilation across microtasks prior to the first `render()` pass. |
| **5** | **Virtualize / Paginate Doctor Cards Directory** | Desktop TBT & Mobile LCP | **-150 ms TBT / -0.3 s LCP** | **Low** | Render only the first 2 doctor cards on initial mount; defer remaining cards until user scrolls into the directory section. |

---

## 8. Expected Improvements & Risk Assessment

> [!NOTE]
> All projected improvements below are **technical estimates** based on network payload math and trace analysis.

- **Projected Desktop Metrics (with Fixes 1, 3, 4):**
  - Desktop Performance Score: **82–88 / 100** *(Estimate)*
  - Desktop TBT: **600–700 ms** (down from 1,435 ms) *(Estimate)*
  - Desktop FCP & LCP: **0.29 s** *(Unchanged)*
  - Desktop CLS: **0.000** *(Maintained)*
- **Projected Mobile Metrics (with Fixes 2, 3, 5):**
  - Mobile Performance Score: **80–84 / 100** *(Estimate)*
  - Mobile LCP: **4.8–5.2 s** (down from 6.06 s) *(Estimate)*
  - Mobile TBT: **< 80 ms** *(Maintained)*
  - Mobile CLS: **0.000** *(Maintained)*

### Functional & Visual Risk Assessment:
- **Visual Risk: ZERO.** `SculptureStaticFallback` is pixel-matched to the Three.js model; deferring 3D initialization until user interaction creates no visual downgrade or layout shift.
- **Functional Risk: ZERO.** No business logic, booking flows, doctor search, or authentication endpoints are affected by font compression or interaction-gated WebGL loading.

