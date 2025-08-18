// In-memory match model and helpers for MVP 1v1
import { getConfig } from "../util/config.js";

export function createMatch() {
    const cfg = getConfig();
    const mode = (cfg.modes || []).find(m => m.id === "duel_lives") || cfg.modes?.[0];
    const mapId = mode?.map?.id || "standard_empty_arena";
    const mapCfg = cfg.maps?.[mapId];
    const spawnCfg = cfg?.defaults?.spawn ?? { min_distance_from_edges: 3, max_attempts: 100 };
    return {
        state: "waiting",           // 'waiting' | 'active'
        players: new Map(),         // socket.id -> { id, name, x, y }
        mapId,
        mapCfg,
        spawnCfg
    };
}

export function sanitizeName(raw) {
    const s = String(raw ?? "").trim().slice(0, 16);
    if (!s) return null;
    if (!/^[\w \-]+$/u.test(s)) return null;
    return s;
}

export function randomSpawn(bounds, edge, attempts = 100) {
    const xMin = bounds.x_min + edge;
    const xMax = bounds.x_max - edge;
    const yMin = bounds.y_min + edge;
    const yMax = bounds.y_max - edge;
    for (let i = 0; i < attempts; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const y = yMin + Math.random() * (yMax - yMin);
        return { x, y };
    }
    return { x: (bounds.x_min + bounds.x_max) / 2, y: (bounds.y_min + bounds.y_max) / 2 };
}

export function computeState(match) {
    match.state = match.players.size >= 2 ? "active" : "waiting";
    return match.state;
}

export function addPlayer(match, socketId, rawName) {
    if (match.players.size >= 2) return { error: "Match is full. Please try later." };
    const name = sanitizeName(rawName);
    if (!name) return { error: "Invalid name. Use 1–16 letters/numbers/space/-/_." };

    const { x, y } = randomSpawn(
        match.mapCfg.bounds,
        Number(match.spawnCfg.min_distance_from_edges) || 0,
        Number(match.spawnCfg.max_attempts) || 100
    );

    const player = { id: socketId, name, x, y };
    match.players.set(socketId, player);
    computeState(match);
    return { player };
}

export function removePlayer(match, socketId) {
    const existed = match.players.delete(socketId);
    if (existed) computeState(match);
    return existed;
}

export function publicMatchState(match) {
    return {
        state: match.state,
        players: Array.from(match.players.values()).map(p => ({ id: p.id, name: p.name }))
    };
}

export function welcomePayload(match, player) {
    return {
        you: { id: player.id, name: player.name, spawn: { x: player.x, y: player.y } },
        map: {
            id: match.mapId,
            size_units: match.mapCfg.size_units,
            bounds: match.mapCfg.bounds
        },
        match_state: publicMatchState(match)
    };
}
