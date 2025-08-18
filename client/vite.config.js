import { defineConfig } from "vite";

export default defineConfig({
    server: {
        port: 4000,
        strictPort: true,
        open: true,
        proxy: {
            "/api": { target: "http://localhost:3000", changeOrigin: true },
            // Proxy the Socket.IO endpoint + WS upgrades
            "/socket.io": { target: "http://localhost:3000", ws: true }
        }
    }
});
