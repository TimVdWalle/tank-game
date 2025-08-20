import "dotenv/config";

import http from "http";
import express from "express";
import { attachSocket } from "./net/io.js";
import { api } from "./http/routes.js"; // <-- new

const app = express();

app.use("/api", api); // <-- moved routes here

const httpServer = http.createServer(app);
attachSocket(httpServer);

const PORT = Number(process.env.PORT || 0) || 3000;
httpServer.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
});
