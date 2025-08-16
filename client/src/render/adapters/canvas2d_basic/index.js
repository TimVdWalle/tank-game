export function createRenderer(canvas, cfg) {
    const ctx = canvas.getContext("2d");
    const PPU = cfg.render.pixels_per_unit;
    const map = cfg.map;

    function worldToScreen(x, y) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        return [cx + x * PPU, cy - y * PPU]; // y up
    }

    function drawGrid() {
        const step = 1;
        const { x_min, x_max, y_min, y_max } = map.bounds;
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = "#6b7280";
        ctx.lineWidth = 1;

        for (let x = Math.ceil(x_min); x <= x_max; x += step) {
            const [sxTop, syTop] = worldToScreen(x, y_max);
            const [sxBot, syBot] = worldToScreen(x, y_min);
            ctx.beginPath(); ctx.moveTo(sxTop, syTop); ctx.lineTo(sxBot, syBot); ctx.stroke();
        }
        for (let y = Math.ceil(y_min); y <= y_max; y += step) {
            const [sxL, syL] = worldToScreen(x_min, y);
            const [sxR, syR] = worldToScreen(x_max, y);
            ctx.beginPath(); ctx.moveTo(sxL, syL); ctx.lineTo(sxR, syR); ctx.stroke();
        }
        ctx.restore();
    }

    function drawBounds() {
        const { x_min, x_max, y_min, y_max } = map.bounds;
        const [sx0, sy0] = worldToScreen(x_min, y_min);
        const [sx1, sy1] = worldToScreen(x_max, y_max);
        ctx.save();
        ctx.strokeStyle = "#9ca3af";
        ctx.lineWidth = 2;
        ctx.strokeRect(sx0, sy1, sx1 - sx0, sy0 - sy1);
        ctx.restore();
    }

    function drawEntities(entities) {
        for (const e of entities) {
            const [sx, sy] = worldToScreen(e.x, e.y);
            ctx.beginPath();
            ctx.arc(sx, sy, e.r * PPU, 0, Math.PI * 2);
            ctx.fillStyle = "#34d399";
            ctx.fill();
        }
    }

    function clear() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

    function render(state) {
        clear();
        drawGrid();
        drawBounds();
        drawEntities(state.entities || []);
    }

    return { render, worldToScreen };
}
