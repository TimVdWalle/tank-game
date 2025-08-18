import { addPlayer, removePlayer, publicMatchState, welcomePayload } from "../../game/match.js";

export function registerJoin(io, match) {
    return (socket) => {
        socket.on("join", (payload = {}) => {
            const { player, error } = addPlayer(match, socket.id, payload.name);
            if (error) {
                socket.emit("event", { type: "error", message: error });
                return;
            }
            socket.emit("welcome", welcomePayload(match, player));
            io.emit("match_state", publicMatchState(match));
        });

        socket.on("disconnect", (reason) => {
            if (removePlayer(match, socket.id)) {
                io.emit("match_state", publicMatchState(match));
            }
        });
    };
}
