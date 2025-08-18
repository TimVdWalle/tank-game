import { io } from "socket.io-client";
import { createDebugOverlay } from "./debugOverlay.js";

const appEl = document.getElementById("app");

// ---- Env gating (client reads Vite-exposed vars) ----
const VITE_NODE_ENV = import.meta.env.VITE_NODE_ENV || "";
const IS_DEV =
    VITE_NODE_ENV.toLowerCase() === "development" ||
    import.meta.env.DEV === true;

// ---- Socket (connection status for overlay) ----
const socket = io();
let connState = "connecting";
socket.on("connect", () => (connState = "connected"));
socket.on("disconnect", () => (connState = "disconnected"));
socket.on("connect_error", () => (connState = "error"));

function render(title) {
    appEl.innerHTML = `
    <main style="min-height:100vh; display:grid; place-items:center; background:#0e0e10; color:#eaeaea;">
      <div style="text-align:center;">
        <h1 style="font-size: clamp(2rem, 6vw, 4rem); letter-spacing: .02em; margin: 0;">
          ${title}
        </h1>
        ${IS_DEV ? `<p style="opacity:.7; font-size:12px; margin-top:10px;">Press <span style="border:1px solid #444; border-radius:6px; padding:2px 6px;">F1</span> for Debug</p>` : ""}
      </div>
    </main>
  `;
}

async function loadAndRender() {
    let title = "Tank Duel";
    try {
        const res = await fetch("/api/config", { cache: "no-store" });
        const data = await res.json();
        title = data?.game?.title ?? title;
    } catch (e) {
        console.warn("Failed to load /api/config:", e);
    }
    render(title);
}

async function boot() {
    await loadAndRender();
    if (IS_DEV) {
        const envBadges = [
            `VITE_NODE_ENV=${VITE_NODE_ENV || "n/a"}`,
            `MODE=${import.meta.env.MODE}`
        ];
        const overlay = createDebugOverlay({
            getConnState: () => connState,
            envBadges
        });
        // Example hook: when map is known later, call:
        // overlay.setMapInfo("standard_empty_arena 60x40");
        overlay.setEnvText(`${VITE_NODE_ENV || "n/a"} (mode=${import.meta.env.MODE})`);
    }
}

boot();
