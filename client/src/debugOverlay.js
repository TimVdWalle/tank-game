// Full-height right sidebar debug panel for development.
// Toggle: F1, Close: Esc. Exported API: { setMapInfo, setEnvText, open, close, toggle }

export function createDebugOverlay({ getConnInfo, envBadges = [] } = {}) {
    if (!document.getElementById("td-debug-style")) {
        const style = document.createElement("style");
        style.id = "td-debug-style";
        style.textContent = `
      .tdp-panel {
        position: fixed;
        top: 0; right: 0; bottom: 0;
        width: min(360px, 92vw);
        z-index: 9999;
        background: #0f1013;
        color: #ededed;
        border-left: 1px solid #2a2b31;
        box-shadow: 0 0 24px rgba(0,0,0,0.45);
        display: none;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }
      .tdp-panel.open { display: block; }
      .tdp-scroller { position: absolute; inset: 0; overflow: auto; padding: 12px 14px 18px 14px; }
      .tdp-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
      .tdp-title { font-size: 13px; font-weight: 700; letter-spacing:.02em; opacity:.95; }
      .tdp-close { border: 1px solid #2a2b31; background:#1a1b1f; color:#bbb; padding: 0 6px; border-radius: 6px; cursor:pointer; font-size:12px; line-height:22px; }
      .tdp-close:hover { color:#fff; }
      .tdp-section { border-top:1px solid #1b1c21; padding-top:10px; margin-top:10px; }
      .tdp-badges { display:flex; gap:6px; flex-wrap:wrap; }
      .tdp-badge { font-size:11px; padding:2px 6px; border-radius:999px; background:#1e1f24; border:1px solid #2a2b31; }
      .tdp-row { display:grid; grid-template-columns: 120px 1fr; gap:10px; align-items:baseline; padding:4px 0; }
      .tdp-key { opacity:.7; font-size:12px; }
      .tdp-val { font-size:12px; font-weight:600; }
      .tdp-kbd { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; border:1px solid #2a2b31; background:#1a1b1f; border-radius:6px; padding:1px 6px; font-size:11px; }
      .tdp-hint { margin-top:8px; font-size:11px; opacity:.6; }
    `;
        document.head.appendChild(style);
    }

    const panel = document.createElement("div");
    panel.className = "tdp-panel";
    panel.innerHTML = `
    <div class="tdp-scroller">
      <div class="tdp-header">
        <div class="tdp-title">Debug</div>
        <button class="tdp-close" type="button" aria-label="Close">×</button>
      </div>

      <div class="tdp-section">
        <div class="tdp-badges" id="tdp-badges"></div>
      </div>

      <div class="tdp-section" id="tdp-conn-sec">
        <div class="tdp-row"><div class="tdp-key">Status</div><div class="tdp-val" id="tdp-conn">—</div></div>
        <div class="tdp-row"><div class="tdp-key">Socket ID</div><div class="tdp-val" id="tdp-sid">—</div></div>
        <div class="tdp-row"><div class="tdp-key">Transport</div><div class="tdp-val" id="tdp-tr">—</div></div>
      </div>

      <div class="tdp-section">
        <div class="tdp-row"><div class="tdp-key">FPS (avg 30)</div><div class="tdp-val" id="tdp-fps">—</div></div>
      </div>

      <div class="tdp-section">
        <div class="tdp-row"><div class="tdp-key">Environment</div><div class="tdp-val" id="tdp-env">—</div></div>
      </div>

      <div class="tdp-section">
        <div class="tdp-row"><div class="tdp-key">Map</div><div class="tdp-val" id="tdp-map">pending</div></div>
      </div>

      <div class="tdp-hint">Toggle with <span class="tdp-kbd">F1</span>, close with <span class="tdp-kbd">Esc</span>. Dev only.</div>
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
    const sidEl = panel.querySelector("#tdp-sid");
    const trEl = panel.querySelector("#tdp-tr");
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
            const avg = samples.reduce((a, b) => a + b, 0) / samples.length || 16.67;
            const fps = Math.max(0, Math.min(240, 1000 / avg));
            fpsEl.textContent = fps.toFixed(1);

            if (typeof getConnInfo === "function") {
                const info = getConnInfo() || {};
                connEl.textContent = info.state ?? "n/a";
                sidEl.textContent = info.id ?? "—";
                trEl.textContent = info.transport ?? "n/a";
            }
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
        if (e.key === "F1") { e.preventDefault(); toggle(); }
        else if (e.key === "Escape" && panel.classList.contains("open")) { e.preventDefault(); close(); }
    };
    window.addEventListener("keydown", keyHandler);

    const api = { open, close, toggle, setMapInfo, setEnvText };
    window.__TD_DEBUG = api;
    return api;
}
