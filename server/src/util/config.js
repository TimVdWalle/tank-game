// server/src/util/config.js
// Loads the shared YAML once at startup (no hot reload) and exposes helpers.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// From server/src/util -> project root -> shared/config/game.yaml
const defaultConfigPath = path.resolve(__dirname, "../../../shared/config/game.yaml");
const CONFIG_PATH = process.env.GAME_CONFIG_PATH
    ? path.resolve(process.env.GAME_CONFIG_PATH)
    : defaultConfigPath;

function assert(cond, msg) {
    if (!cond) throw new Error(`Config error: ${msg}`);
}

function validate(cfg) {
    assert(cfg?.net?.server_port != null, "net.server_port is missing");
    assert(cfg?.server?.tick_rate_hz != null, "server.tick_rate_hz is missing");
    assert(cfg?.server?.snapshot_rate_hz != null, "server.snapshot_rate_hz is missing");
    assert(cfg?.server?.input_hz != null, "server.input_hz is missing");
}

function loadFromDisk() {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const cfg = YAML.parse(raw);
    validate(cfg);
    return cfg;
}

// Immutable snapshot for this process lifetime
const CONFIG_SNAPSHOT = Object.freeze(loadFromDisk());

/** Returns the immutable config snapshot loaded at startup. Do not mutate. */
export function getConfig() {
    return CONFIG_SNAPSHOT;
}

/** Convenience timing helpers derived from a config (or the current snapshot). */
export function ratesFrom(cfg = CONFIG_SNAPSHOT) {
    const tick_hz = Number(cfg.server.tick_rate_hz);
    const snapshot_hz = Number(cfg.server.snapshot_rate_hz);
    const input_hz = Number(cfg.server.input_hz);
    return Object.freeze({
        tick_hz,
        snapshot_hz,
        input_hz,
        tick_ms: Math.floor(1000 / tick_hz),
        snapshot_ms: Math.floor(1000 / snapshot_hz),
        input_ms: Math.floor(1000 / input_hz),
    });
}

/** Useful for logs/tests. */
export function resolveConfigPath() {
    return CONFIG_PATH;
}
