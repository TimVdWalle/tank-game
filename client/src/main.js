import { io } from "socket.io-client";
import { createRenderer } from "./render/adapters/canvas2d_basic/index.js";

const hud = document.getElementById("hud");
const canvas = document.getElementById("game");

let renderer = null;
let lastSnapshot = { entities: [] };

// Connect via Vite proxy -> server :3000
const socket = io();

socket.on("connect", () => { hud.textContent = `connected: ${socket.id}`; });
socket.on("disconnect", () => { hud.textContent = "disconnected"; });

socket.on("config", (cfg) => {
    document.title = `${cfg.game.title} — v${cfg.game.version}`;
    renderer = createRenderer(canvas, cfg);
});

socket.on("snapshot", (snap) => { lastSnapshot = snap; });

function loop(ts) {
    if (renderer && lastSnapshot) renderer.render(lastSnapshot);
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
