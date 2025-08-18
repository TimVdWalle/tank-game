import { io } from "socket.io-client";

const appEl = document.getElementById("app");

function render(title) {
    appEl.innerHTML = `
    <main style="min-height:100vh; display:grid; place-items:center; background:#0e0e10; color:#eaeaea;">
      <div style="text-align:center;">
        <h1 style="font-size: clamp(2rem, 6vw, 4rem); letter-spacing: .02em; margin: 0;">
          ${title}
        </h1>
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
}

boot();
