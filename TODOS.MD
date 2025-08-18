## Step 1 — Debug env + overlay (client-only)
```Config (YAML): add defaults for the overlay so styling/fields are driven by config later.
client.ui.debug_overlay: { hotkey: "F1", start_open: false, fields: { fps: true, conn: true, env: true, map: true } }
Env:
client/.env.development: VITE_DEBUG=true
client/.env.production: VITE_DEBUG=false
Client:
If import.meta.env.VITE_DEBUG === 'true', show a toggleable modal (F1) with:
FPS (smoothed over last 30 frames)
Connection status (Socket.IO state)
Env (NODE_ENV, VITE_NODE_ENV)
Map info (id, size) once known
Clean, centered modal with semi-transparent backdrop; responsive on small screens.
```

Next TODO — Room-based matchmaking with tank battle room names
What we’ll do
Config (YAML)
server:
rooms:
capacity: 2
naming:
theme: tank_battle_sites
suffix_on_conflict: roman   # I, II, III… if we cycle
shuffle_seed: "daily"       # reshuffle list per day for variety
Data
Add shared/data/rooms/tank_battle_sites.txt (one name per line).
Server
Implement RoomManager (in-memory):
findOnePlayerRoom(), createRoom(), addPlayer(socket, name), removePlayer(socket).
Generate room name by taking the next unused name from the shuffled list; on reuse, append roman suffix.
Scope match_state broadcasts to io.to(roomName).
Update join flow to return room: { name } in welcome.
Client
Show Room: <name> under the title (and in the debug panel’s “Connection” section).
Initial curated pool (real tank battle locations)
Kursk
Prokhorovka
Khalkhin Gol
Raseiniai
Dubno
Kharkiv
El Alamein
Gazala
Tobruk
Bir Hakeim
Sidi Rezegh
Kasserine
El Guettar
Arras
Cambrai
Villers-Bocage
Caen
Falaise
Bourguébus Ridge
Sinai
Golan Heights
Valley of Tears
Lake Balaton
El Alamein (Alam Halfa)
Medjez-el-Bab
El Guettar (Djebel)
Orel
Belgorod
Ponyri
Anzio (Tank actions)
Sidi Bou Zid
Basra (73 Easting nearby Kuwait theater)
73 Easting
Qasr as-Sallum
El Agheila
If any are too niche, we’ll trim later; we can easily expand this pool.


next todo:
make debug window modular
create a json that maps the origin of the values with what to show on the debug window



## Step 2 — Join by name (no movement yet)
Config (YAML): add spawn defaults used until basecamps/paths exist.
defaults.spawn: { min_distance_from_edges: 3, max_attempts: 100 }
Server:
Add socket event join with payload { name: string }.
Create/keep a single “duel” match instance in memory.
On first player: create match, randomly place player within map bounds (respect spawn defaults), set match state=waiting.
On second player: spawn second, set state=active but still no movement in this step.
Emit welcome immediately after join with { you, map, match_state }.
Client:
Show a name input form (overlay).
On submit: connect socket if needed, emit join.
After welcome, hide form and render map background + “Waiting for opponent…” banner until state=active.

## Step 3 — Bigger map + focus on spawn
Config (YAML):
Increase maps.standard_empty_arena.size_units (e.g., { width: 300, height: 200 }) and keep bounds in sync.
Client:
Implement world→screen transform with camera centered on player spawn.
Smooth snap to spawn using current camera.smoothing_alpha.
Draw a simple grid (major lines every 5 units, minor every 1 unit) clipped to viewport.

## Step 4 — Server tick + minimal snapshots (frozen world)
Server:
Implement tick loop at server.tick_rate_hz.
Emit snapshot at server.snapshot_rate_hz containing players’ static positions and match state.
Client:
Subscribe to snapshot; update local world state; draw own tank as a circle at server position.
If VITE_DEBUG, show last snapshot tick/time in debug overlay.

## Step 5 — Basic HUD & lifecycle glue
Client:
Minimal HUD with player name, lives (placeholder from config), and match state.
Show toast/event text on second player join: “Match start!”
Server:
Handle disconnect: remove player; if one remains, return to state=waiting.

## Step 6 — Validation & UX polish
Name rules: trim, length 1–16, reject unsafe chars; server normalizes and echoes back display name.
Graceful errors: on bad join, emit event { type:'error', message }; client shows inline error near name field.
Deterministic RNG seeding per match for reproducible debugging (seed logged when DEBUG=true on server).

## Step 7 — Prep for movement (no movement yet)
Define input schema in YAML (as earlier proposed) but don’t process it yet.
Client wires a no-op input loop behind a feature flag so adding movement later is incremental.