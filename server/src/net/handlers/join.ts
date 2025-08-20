import type { Server, Socket } from "socket.io";
import type { Match } from "../../types/game.js";
import { addPlayer, removePlayer, publicMatchState, welcomePayload } from "../../game/match.js";


export function registerJoin(io: Server, match: Match) {
    return (socket: Socket) => {
        socket.on("join", (payload: { name?: string } = {}) => {
            const { player, error } = addPlayer(match, socket.id, payload.name);
            if (error) {
                socket.emit("event", { type: "error", message: error });
                return;
            }
            socket.emit("welcome", welcomePayload(match, player!));
            io.emit("match_state", publicMatchState(match));
        });

        socket.on("disconnect", () => {
            if (removePlayer(match, socket.id)) {
                io.emit("match_state", publicMatchState(match));
            }
        });
    };
}
