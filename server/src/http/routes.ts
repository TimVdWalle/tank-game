import express from "express";
import { getConfig } from "../util/config.js";

export const api = express.Router();

api.get("/config", (_req, res) => {
    const cfg = getConfig();
    res.json({
        game: {
            title: cfg.game?.title,
            version: cfg.game?.version,
            description: cfg.game?.description
        }
    });
});

api.get("/health", (_req, res) =>
    res.json({ ok: true, env: process.env.NODE_ENV || "development" })
);
