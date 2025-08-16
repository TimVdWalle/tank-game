import http from "http";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createIO } from "./net/io.js";
import { loadConfig } from "./util/config.js";
import { log } from "./util/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../");
const CLIENT_DIST = path.resolve(ROOT, "../client/dist");

(async function main() {
    const { cfg, clientConfig } = await loadConfig();

    const app = express();
    // Serve built client in production: `cd client && npm run build`
    app.use(express.static(CLIENT_DIST));

    const server = http.createServer(app);
    const io = createIO(server);

    // Emit trimmed config on connect
    io.on("connection", (socket) => {
        socket.emit("config", clientConfig);
    });

    // Dummy sim state
    const SIM_HZ = cfg.server?.tick_rate_hz ?? 30;
    const SNAPSHOT_HZ = cfg.server?.snapshot_rate_hz ?? 20;

    const state = {
        t: 0,
        entities: [{ id: "dummy", x: 0, y: 0, r: 0.6 }]
    };

    // 30 Hz sim: move the dot in an ellipse
    const simInterval = setInterval(() => {
        state.t += 1 / SIM_HZ;
        const { width: W, height: H } = clientConfig.map.size_units;
        const rx = (W / 2) * 0.6;
        const ry = (H / 2) * 0.5;
        state.entities[0].x = Math.cos(state.t * 0.7) * rx * 0.8;
        state.entities[0].y = Math.sin(state.t * 0.7) * ry * 0.8;
    }, 1000 / SIM_HZ);

    // 20 Hz snapshots
    const snapInterval = setInterval(() => {
        io.emit("snapshot", { now: Date.now(), entities: state.entities });
    }, 1000 / SNAPSHOT_HZ);

    // Start server on configured port
    const PORT = cfg.net?.server_port ?? 3000;
    server.listen(PORT, () => log(`HTTP + Socket.IO listening on :${PORT}`));

    // graceful shutdown
    const stop = () => {
        clearInterval(simInterval);
        clearInterval(snapInterval);
        server.close(() => process.exit(0));
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
})();
