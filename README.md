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

TLS options

- `CLASSIC_HTTPS_INSECURE`: Set to `true`/`1` to allow the proxy to connect to a classic HTTPS target with a self-signed or otherwise untrusted certificate. Use only for local development.
- `CLASSIC_TLS_SERVERNAME`: Sets the SNI servername for HTTPS connections to the classic target (e.g., your origin domain). This fixes TLS hostname validation when targeting `127.0.0.1` with a certificate issued for a domain name.

Implementation notes

- The server uses `http-proxy-middleware` to safely proxy fixed paths only: `/classic/*`, `/socket.io/*`, and `/classic/socket.io/*`.
- Requests under `/classic` have the prefix stripped before forwarding.
- Proxying enables `xfwd` and `changeOrigin`, and supports WebSocket upgrades.
