import { getConfig } from "../util/config.js";

export type Bounds = { x_min: number; x_max: number; y_min: number; y_max: number };
export type MapCfg = { size_units: { width: number; height: number }; bounds: Bounds };
export type SpawnCfg = { min_distance_from_edges?: number; max_attempts?: number };

export type Player = { id: string; name: string; x: number; y: number };
export type MatchState = "waiting" | "active";

export interface Match {
    state: MatchState;
    players: Map<string, Player>;
    mapId: string;
    mapCfg: MapCfg;
    spawnCfg: SpawnCfg;
}

export function createMatch(): Match {
    const cfg = getConfig();
    const mode = (cfg.modes || []).find((m: any) => m.id === "duel_lives") || cfg.modes?.[0];
    const mapId: string = mode?.map?.id || "standard_empty_arena";
    const mapCfg: MapCfg = cfg.maps?.[mapId];
    const spawnCfg: SpawnCfg = cfg?.defaults?.spawn ?? { min_distance_from_edges: 3, max_attempts: 100 };
    return {
        state: "waiting",
        players: new Map<string, Player>(),
        mapId,
        mapCfg,
        spawnCfg
    };
}

export function sanitizeName(raw: unknown): string | null {
    const s = String(raw ?? "").trim().slice(0, 16);
    if (!s) return null;
    if (!/^[\w \-]+$/u.test(s)) return null;
    return s;
}

export function randomSpawn(bounds: Bounds, edge: number, attempts = 100): { x: number; y: number } {
    const xMin = bounds.x_min + edge;
    const xMax = bounds.x_max - edge;
    const yMin = bounds.y_min + edge;
    const yMax = bounds.y_max - edge;
    for (let i = 0; i < attempts; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const y = yMin + Math.random() * (yMax - yMin);
        return { x, y };
    }
    // Fallback center
    return { x: (bounds.x_min + bounds.x_max) / 2, y: (bounds.y_min + bounds.y_max) / 2 };
}

export function computeState(match: Match): MatchState {
    match.state = match.players.size >= 2 ? "active" : "waiting";
    return match.state;
}

export function addPlayer(match: Match, socketId: string, rawName: unknown) {
    if (match.players.size >= 2) return { error: "Match is full. Please try later." };
    const name = sanitizeName(rawName);
    if (!name) return { error: "Invalid name. Use 1–16 letters/numbers/space/-/_." };

    const { x, y } = randomSpawn(
        match.mapCfg.bounds,
        Number(match.spawnCfg.min_distance_from_edges) || 0,
        Number(match.spawnCfg.max_attempts) || 100
    );

    const player: Player = { id: socketId, name, x, y };
    match.players.set(socketId, player);
    computeState(match);
    return { player };
}

export function removePlayer(match: Match, socketId: string) {
    const existed = match.players.delete(socketId);
    if (existed) computeState(match);
    return existed;
}

export function publicMatchState(match: Match) {
    return {
        state: match.state,
        players: Array.from(match.players.values()).map((p) => ({ id: p.id, name: p.name }))
    };
}

export function welcomePayload(match: Match, player: Player) {
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
