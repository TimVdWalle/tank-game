import "dotenv/config";

import http from "http";
import express from "express";
import { attachSocket } from "./net/io.js";
import { getConfig } from "./util/config.js";

const app = express();

app.get("/api/config", (_req, res) => {
    const cfg = getConfig();
    res.json({
        game: {
            title: cfg.game?.title,
            version: cfg.game?.version,
            description: cfg.game?.description
        }
    });
});

app.get("/api/health", (_req, res) =>
    res.json({ ok: true, env: process.env.NODE_ENV || "development" })
);

const httpServer = http.createServer(app);
attachSocket(httpServer);

const PORT = Number(getConfig().net?.server_port ?? 3000);
httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${PORT}`);
});
