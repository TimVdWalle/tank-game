import { io } from "socket.io-client";
import { createDebugOverlay } from "./debugOverlay.js";

const appEl = document.getElementById("app");

// ---- Env gating (client reads Vite-exposed vars) ----
const VITE_NODE_ENV = import.meta.env.VITE_NODE_ENV || "";
const IS_DEV =
    VITE_NODE_ENV.toLowerCase() === "development" ||
    import.meta.env.DEV === true;

// ---- Socket ----
const socket = io();
let connState = "connecting";
socket.on("connect", () => (connState = "connected"));
socket.on("disconnect", () => (connState = "disconnected"));
socket.on("connect_error", () => (connState = "error"));

// ---- Simple state ----
let you = null;
let mapInfo = null;
let matchState = { state: "waiting", players: [] };

// ---- Name overlay (minimal and accessible) ----
function installNameOverlay(onSubmit) {
    const style = document.createElement("style");
    style.textContent = `
    .join-wrap{position:fixed;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.35);z-index:50; margin-top: 350px;}
    .join-card{background:#121214;color:#ededed;border:1px solid #2a2b31;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.35);padding:16px 18px;width:min(420px,92vw);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
    .join-card h2{margin:0 0 8px 0;font-size:16px}
    .join-row{display:flex;gap:8px;margin-top:8px}
    .join-input{flex:1;background:#0f1013;border:1px solid #2a2b31;border-radius:8px;color:#fff;padding:8px 10px;font-size:14px;outline:none}
    .join-btn{background:#1f6feb;border:1px solid #2a2b31;color:#fff;border-radius:8px;padding:8px 12px;font-size:14px;cursor:pointer}
    .join-btn:hover{filter:brightness(1.05)}
    .join-err{color:#ff8383;font-size:12px;margin-top:6px;min-height:14px}
  `;
    document.head.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "join-wrap";
    wrap.innerHTML = `
    <div class="join-card" role="dialog" aria-modal="true" aria-label="Join match">
      <h2>Enter your name</h2>
      <div class="join-row">
        <input class="join-input" type="text" maxlength="16" placeholder="Your name" />
        <button class="join-btn" type="button">Join</button>
      </div>
      <div class="join-err" aria-live="polite"></div>
    </div>
  `;
    document.body.appendChild(wrap);

    const input = wrap.querySelector(".join-input");
    const btn = wrap.querySelector(".join-btn");
    const err = wrap.querySelector(".join-err");
    input.focus();

    function submit() {
        const name = String(input.value || "").trim();
        if (!name) {
            err.textContent = "Please enter a name.";
            return;
        }
        if (!/^[\w \-]+$/u.test(name)) {
            err.textContent = "Use letters/numbers/space/-/_ (max 16).";
            return;
        }
        err.textContent = "";
        onSubmit(name, (message) => (err.textContent = message || ""));
    }

    btn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

    return { destroy: () => wrap.remove(), setError: (m) => (err.textContent = m || "") };
}

function render(title) {
    appEl.innerHTML = `
    <main style="min-height:100vh; display:grid; place-items:center; background:#0e0e10; color:#eaeaea;">
      <div style="text-align:center;">
        <h1 style="font-size: clamp(2rem, 6vw, 4rem); letter-spacing: .02em; margin: 0;">
          ${title}
        </h1>
        <p style="opacity:.8; margin-top:10px;">${matchState.state === "waiting" ? "Waiting for opponent…" : "Match is active (frozen for now)"}${you ? ` — You are: ${you.name}` : ""}</p>
        ${IS_DEV ? `<p style="opacity:.6; font-size:12px; margin-top:8px;">Press <span style="border:1px solid #444; border-radius:6px; padding:2px 6px;">F1</span> for Debug</p>` : ""}
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

    // Debug panel (dev only)
    let overlay = null;
    if (IS_DEV) {
        const envBadges = [
            `VITE_NODE_ENV=${VITE_NODE_ENV || "n/a"}`,
            `MODE=${import.meta.env.MODE}`
        ];
        overlay = createDebugOverlay({
            getConnState: () => connState,
            envBadges
        });
        overlay.setEnvText(`${VITE_NODE_ENV || "n/a"} (mode=${import.meta.env.MODE})`);
    }

    // Name entry overlay
    const joinOverlay = installNameOverlay((name, setError) => {
        socket.emit("join", { name });
        // Handle errors via 'event'
        socket.once("event", (ev) => {
            if (ev?.type === "error") {
                setError(ev.message || "Join failed.");
            }
        });
        // 'welcome' arrives on success
        socket.once("welcome", (payload) => {
            you = payload?.you;
            mapInfo = payload?.map;
            matchState = payload?.match_state || matchState;
            joinOverlay.destroy();
            render(document.title || "Tank Duel MVP");
            if (IS_DEV && overlay && mapInfo) {
                overlay.setMapInfo(`${mapInfo.id} ${mapInfo.size_units.width}x${mapInfo.size_units.height}`);
            }
        });
    });

    // Match state updates (when second player joins / someone leaves)
    socket.on("match_state", (state) => {
        matchState = state || matchState;
        render(document.title || "Tank Duel MVP");
    });
}

boot();
