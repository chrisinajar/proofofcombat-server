Classic Proxy

- Set `CLASSIC_TARGET` to a local URL (e.g., `http://127.0.0.1:9090`).
- Any requests to `/classic/*` on this server are forwarded to the target with the `/classic` prefix stripped (e.g., `/classic/api` -> `http://127.0.0.1:9090/api`).
- Works for HTTP(S) requests and WebSocket upgrades (e.g., `/classic/socket.io/*`).

Environment

- `CLASSIC_TARGET`: Full origin of the archived/classic server, including protocol and port.
