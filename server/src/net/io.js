import { Server } from "socket.io";
import { createMatch } from "../game/match.js";
import { registerJoin } from "./handlers/join.js";

/** Attach a Socket.IO server to an existing HTTP server. */
export function attachSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: true, credentials: true }
    });

    // Single-match MVP (in-memory)
    const match = createMatch();

    io.on("connection", (socket) => {
        console.log("[io] client connected:", socket.id);

        // Game-related handlers
        registerJoin(io, match)(socket);

        // Generic logging
        socket.on("disconnect", (reason) => {
            console.log("[io] client disconnected:", socket.id, reason);
        });
    });

    return io;
}
