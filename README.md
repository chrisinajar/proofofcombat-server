Classic Proxy

- Set `CLASSIC_HTTP_TARGET`, `CLASSIC_HTTPS_TARGET`, and `CLASSIC_SOCKET_TARGET` to point at the classic server’s three listeners.
- If only `CLASSIC_TARGET` is provided, it is used for all of HTTP, HTTPS, and Socket.IO.
- Any requests to `/classic/*` on this server are forwarded to the chosen target with the `/classic` prefix stripped (e.g., `/classic/api` -> `http://127.0.0.1:9090/api`).
- Works for HTTP(S) requests and WebSocket upgrades (e.g., `/classic/socket.io/*`).

Environment

- `CLASSIC_HTTP_TARGET`: Origin for classic over HTTP (e.g., `http://127.0.0.1:9080`).
- `CLASSIC_HTTPS_TARGET`: Origin for classic over HTTPS (e.g., `https://127.0.0.1:9443`).
- `CLASSIC_SOCKET_TARGET`: Origin for classic Socket.IO upgrades (use http/https form; e.g., `https://127.0.0.1:9096`).
- `CLASSIC_TARGET`: Fallback origin used for all three if the above are not set.
