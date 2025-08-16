import { Server } from "socket.io";
import { log } from "../util/logger.js";

export function createIO(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: "*" } // dev simplicity; vite proxy handles ws
    });

    io.on("connection", (socket) => {
        log("client connected", socket.id);
        socket.on("disconnect", (reason) => log("client disconnected", socket.id, reason));
    });

    return io;
}
