export type Bounds = {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number };

export type MapCfg = {
    size_units: { width: number; height: number };
    bounds: Bounds;
};

export type SpawnCfg = {
    min_distance_from_edges?: number;
    max_attempts?: number;
};

export type Player = {
    id: string;
    name: string;
    x: number;
    y: number };

export type MatchState = "waiting" | "active";

export interface Match {
    state: MatchState;
    players: Map<string, Player>;
    mapId: string;
    mapCfg: MapCfg;
    spawnCfg: SpawnCfg;
}
