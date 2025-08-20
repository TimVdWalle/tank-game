import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { createMatch } from "../game/match.js";
import { registerJoin } from "./handlers/join.js";

/** Attach a Socket.IO server to an existing HTTP server. */
export function attachSocket(httpServer: HttpServer) {
    const io = new IOServer(httpServer, {
        cors: { origin: true, credentials: true }
    });

    // Single-match MVP (in-memory)
    const match = createMatch();

    io.on("connection", (socket) => {
        // eslint-disable-next-line no-console
        console.log("[io] client connected:", socket.id);

        // Game-related handlers
        registerJoin(io, match)(socket);

        // Generic logging
        socket.on("disconnect", (reason) => {
            // eslint-disable-next-line no-console
            console.log("[io] client disconnected:", socket.id, reason);
        });
    });

    return io;
}
