// server/src/net/io.js
import { Server } from "socket.io";

/** Attach a Socket.IO server to an existing HTTP server. */
export function attachSocket(httpServer) {
    const io = new Server(httpServer, {
        // With Vite proxy we don't strictly need CORS here, but this keeps it flexible.
        cors: { origin: true, credentials: true }
    });

    io.on("connection", (socket) => {
        console.log("[io] client connected:", socket.id);
        socket.on("disconnect", (reason) => {
            console.log("[io] client disconnected:", socket.id, reason);
        });
    });

    return io;
}
