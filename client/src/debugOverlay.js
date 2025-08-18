// client/src/debugOverlay.js
// Discrete bottom-right debug panel for development.
// Toggle: F1, Close: Esc. Exported API: { setMapInfo, open, close, toggle }

export function createDebugOverlay({ getConnState, envBadges = [] } = {}) {
    // ---- Styles (once) ----
    if (!document.getElementById("td-debug-style")) {
        const style = document.createElement("style");
        style.id = "td-debug-style";
        style.textContent = `
      .tdp-panel {
        position: fixed;
        right: 12px;
        bottom: 12px;
        z-index: 9999;
        width: min(320px, 92vw);
        background: #121214;
        color: #ededed;
        border: 1px solid #2a2b31;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        padding: 10px 12px;
        display: none;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }
      .tdp-panel.open { display: block; }

      .tdp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
      .tdp-title { font-size: 13px; font-weight: 700; letter-spacing: .02em; opacity: .95; }
      .tdp-close {
        border: 1px solid #2a2b31; background: #1a1b1f; color: #bbb;
        padding: 0 6px; border-radius: 6px; cursor: pointer; font-size: 12px; line-height: 20px;
      }
      .tdp-close:hover { color: #fff; }

      .tdp-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
      .tdp-badge { font-size: 11px; padding: 2px 6px; border-radius: 999px; background: #1e1f24; border: 1px solid #2a2b31; }

      .tdp-row { display: grid; grid-template-columns: 110px 1fr; gap: 10px; align-items: baseline; padding: 4px 0; }
      .tdp-key { opacity: .7; font-size: 12px; }
      .tdp-val { font-size: 12px; font-weight: 600; }

      .tdp-hint { margin-top: 6px; font-size: 11px; opacity: .6; display:flex; justify-content: space-between; }
      .tdp-kbd { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                 border:1px solid #2a2b31; background:#1a1b1f; border-radius:6px; padding:1px 6px; font-size:11px; }
    `;
        document.head.appendChild(style);
    }

    // ---- DOM ----
    const panel = document.createElement("div");
    panel.className = "tdp-panel";
    panel.innerHTML = `
    <div class="tdp-header">
      <div class="tdp-title">Debug</div>
      <button class="tdp-close" type="button" aria-label="Close">×</button>
    </div>
    <div class="tdp-badges" id="tdp-badges"></div>
    <div class="tdp-row"><div class="tdp-key">FPS (avg 30)</div><div class="tdp-val" id="tdp-fps">—</div></div>
    <div class="tdp-row"><div class="tdp-key">Connection</div><div class="tdp-val" id="tdp-conn">—</div></div>
    <div class="tdp-row"><div class="tdp-key">Environment</div><div class="tdp-val" id="tdp-env">—</div></div>
    <div class="tdp-row"><div class="tdp-key">Map</div><div class="tdp-val" id="tdp-map">pending</div></div>
    <div class="tdp-hint">
      <span>Dev only</span>
      <span><span class="tdp-kbd">F1</span> toggle • <span class="tdp-kbd">Esc</span> close</span>
    </div>
  `;
    document.body.appendChild(panel);

    // Badges
    const badgesEl = panel.querySelector("#tdp-badges");
    for (const txt of envBadges) {
        const b = document.createElement("span");
        b.className = "tdp-badge";
        b.textContent = txt;
        badgesEl.appendChild(b);
    }

    // Elements
    const fpsEl = panel.querySelector("#tdp-fps");
    const connEl = panel.querySelector("#tdp-conn");
    const envEl = panel.querySelector("#tdp-env");
    const mapEl = panel.querySelector("#tdp-map");

    // Close
    panel.querySelector(".tdp-close").addEventListener("click", () => close());

    // FPS tracker
    const samples = [];
    const maxSamples = 30;
    let lastTs = performance.now();
    function onFrame(ts) {
        const dt = ts - lastTs;
        lastTs = ts;
        samples.push(dt);
        if (samples.length > maxSamples) samples.shift();
        if (panel.classList.contains("open")) {
            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            const fps = Math.max(0, Math.min(240, 1000 / (avg || 16.67)));
            fpsEl.textContent = fps.toFixed(1);
            connEl.textContent = typeof getConnState === "function" ? getConnState() : "n/a";
        }
        requestAnimationFrame(onFrame);
    }
    requestAnimationFrame(onFrame);

    // API
    function open() { panel.classList.add("open"); }
    function close() { panel.classList.remove("open"); }
    function toggle() { panel.classList.toggle("open"); }
    function setMapInfo(text) { mapEl.textContent = text; }
    function setEnvText(text) { envEl.textContent = text; }

    // Keys
    const keyHandler = (e) => {
        if (e.key === "F1" || e.key === "h") { e.preventDefault(); toggle(); }
        else if (e.key === "Escape" && panel.classList.contains("open")) { e.preventDefault(); close(); }
    };
    window.addEventListener("keydown", keyHandler);

    // Expose for console use in dev
    const api = { open, close, toggle, setMapInfo, setEnvText };
    window.__TD_DEBUG = api;
    return api;
}
