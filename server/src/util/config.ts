import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import type { MapCfg, SpawnCfg } from "../types/game.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultConfigPath = path.resolve(__dirname, "../../../shared/config/game.yaml");
const CONFIG_PATH = process.env.GAME_CONFIG_PATH
    ? path.resolve(process.env.GAME_CONFIG_PATH)
    : defaultConfigPath;

export type Config = {
    net: { server_port: number; client_port?: number };
    server: { tick_rate_hz: number; snapshot_rate_hz: number; input_hz: number };
    modes?: Array<{ id: string; map?: { id: string } }>;
    maps?: Record<string, any>;
    defaults?: { spawn?: { min_distance_from_edges?: number; max_attempts?: number } };
    game?: { title?: string; version?: string; description?: string };
    [k: string]: any;
};

function assert(cond: unknown, msg: string): asserts cond {
    if (!cond) throw new Error(`Config error: ${msg}`);
}

function validate(cfg: Config) {
    assert(cfg?.net?.server_port != null, "net.server_port is missing");
    assert(cfg?.server?.tick_rate_hz != null, "server.tick_rate_hz is missing");
    assert(cfg?.server?.snapshot_rate_hz != null, "server.snapshot_rate_hz is missing");
    assert(cfg?.server?.input_hz != null, "server.input_hz is missing");
}

function loadFromDisk(): Config {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const cfg = YAML.parse(raw) as Config;
    validate(cfg);
    return cfg;
}

const CONFIG_SNAPSHOT: Readonly<Config> = Object.freeze(loadFromDisk());

export function getConfig(): Readonly<Config> {
    return CONFIG_SNAPSHOT;
}

export function ratesFrom(cfg: Readonly<Config> = CONFIG_SNAPSHOT) {
    const tick_hz = Number(cfg.server.tick_rate_hz);
    const snapshot_hz = Number(cfg.server.snapshot_rate_hz);
    const input_hz = Number(cfg.server.input_hz);
    return Object.freeze({
        tick_hz,
        snapshot_hz,
        input_hz,
        tick_ms: Math.floor(1000 / tick_hz),
        snapshot_ms: Math.floor(1000 / snapshot_hz),
        input_ms: Math.floor(1000 / input_hz)
    });
}

export function resolveConfigPath() {
    return CONFIG_PATH;
}

/** Resolve mode/map/spawn using config with sensible fallbacks. */
export function resolveMatchBase(cfg: Readonly<Config> = CONFIG_SNAPSHOT): {
    mapId: string;
    mapCfg: MapCfg;
    spawnCfg: SpawnCfg;
} {
    const modes = cfg.modes ?? [];
    const mode = modes.find((m) => m.id === "duel_lives") ?? modes[0];
    const mapId = mode?.map?.id ?? "standard_empty_arena";

    // Map fallback mirrors the example YAML to keep dev deterministic.
    const mapCfg: MapCfg =
        (cfg.maps && (cfg.maps as any)[mapId]) || {
            size_units: { width: 60, height: 40 },
            bounds: { x_min: -30, x_max: 30, y_min: -20, y_max: 20 }
        };

    const spawnDefaults: SpawnCfg = { min_distance_from_edges: 3, max_attempts: 100 };
    const spawnCfg: SpawnCfg = { ...spawnDefaults, ...(cfg.defaults?.spawn ?? {}) };

    return { mapId, mapCfg, spawnCfg };
}
