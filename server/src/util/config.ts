import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";

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
