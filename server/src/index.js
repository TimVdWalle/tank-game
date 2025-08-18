import http from "http";
import express from "express";
import { attachSocket } from "./net/io.js";
import { getConfig } from "./util/config.js"; // keep your existing util

const app = express();

// Minimal API (unchanged behavior)
app.get("/api/config", (_req, res) => {
    const cfg = getConfig();
    res.json({
        game: {
            title: lets ,
            version: cfg.game?.version,
            description: cfg.game?.description
        }
    });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);
attachSocket(httpServer);

// Port is read once at startup (that’s normal for hot-reload via restart)
const PORT = Number(getConfig().net.server_port) || 3000;
httpServer.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
});

// ---- graceful shutdown for fast hot-restarts ----
function shutdown(signal) {
    console.log(`[server] ${signal} received, closing...`);
    httpServer.close((err) => {
        if (err) {
            console.error("[server] close error:", err);
            process.exit(1);
        }
        console.log("[server] closed cleanly");
        process.exit(0);
    });

    // Safety: force-exit if something hangs
    setTimeout(() => {
        console.warn("[server] forced exit after timeout");
        process.exit(0);
    }, 1000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
