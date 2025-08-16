import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import { err } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "../../.."); // repo root
const CONFIG_PATH = path.join(ROOT, "shared", "config", "game.yaml");

export async function loadConfig() {
    try {
        const raw = await fs.readFile(CONFIG_PATH, "utf8");
        const cfg = YAML.parse(raw);

        // Active mode = first listed
        const mode = cfg.modes?.[0] ?? {};
        const mapId = mode.map?.id ?? "standard_empty_arena";
        const mapDef = cfg.maps?.[mapId] ?? {};

        // Trimmed client config for handshake
        const clientConfig = {
            game: {
                title: cfg.game?.title ?? "Tank Duel MVP",
                version: cfg.game?.version ?? "0.1",
                description: cfg.game?.description ?? ""
            },
            net: {
                snapshot_rate_hz: cfg.server?.snapshot_rate_hz ?? 20
            },
            render: {
                pixels_per_unit: cfg.client?.render?.pixels_per_unit ?? 18,
                max_fps: cfg.client?.render?.max_fps ?? 60
            },
            camera: {
                mode: cfg.client?.camera?.mode ?? "follow_player",
                clamp_to_map: cfg.client?.camera?.clamp_to_map ?? true,
                smoothing: cfg.client?.camera?.smoothing ?? "lerp",
                smoothing_alpha: cfg.client?.camera?.smoothing_alpha ?? 0.15
            },
            map: {
                id: mapId,
                size_units: mapDef.size_units ?? { width: 60, height: 40 },
                bounds: mapDef.bounds ?? { x_min: -30, x_max: 30, y_min: -20, y_max: 20 },
                walls: {
                    boundary: {
                        thickness_units: mapDef?.walls?.boundary?.thickness_units ?? 1.0
                    }
                }
            }
        };

        return { cfg, clientConfig };
    } catch (e) {
        err("Failed to load YAML:", e);
        throw e;
    }
}
