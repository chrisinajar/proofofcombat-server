import { PassThrough, Readable, Writable } from "stream";
import http from "http";
import https from "https";
import { createClassicProxy } from "./classic-proxy";

class MockRes extends Writable {
  public chunks: Buffer[] = [];
  public statusCode: number = 0;
  public headers: http.OutgoingHttpHeaders = {};
  writeHead(statusCode: number, headers?: http.OutgoingHttpHeaders) {
    this.statusCode = statusCode;
    if (headers) this.headers = headers;
    return this;
  }
  _write(chunk: any, _enc: BufferEncoding, cb: (error?: Error | null) => void) {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    cb();
  }
  end(chunk?: any) {
    if (chunk) this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    super.end();
  }
  get body() {
    return Buffer.concat(this.chunks).toString("utf8");
  }
}

describe("classic proxy", () => {
  const originalHttpRequest = http.request;
  const originalHttpsRequest = https.request;

  afterEach(() => {
    http.request = originalHttpRequest as any;
    https.request = originalHttpsRequest as any;
  });

  it("forwards method, path, headers, and body; strips /classic and rewrites location", async () => {
    // Arrange: stub http.request to capture options and simulate a 200 response with Location header
    let captured: { options?: any; body?: string } = {};
    http.request = ((options: any, cb: (res: Readable & { statusCode?: number; headers: any }) => void) => {
      captured.options = options;
      const reqStream = new PassThrough();
      const bodyChunks: Buffer[] = [];
      reqStream.on("data", (c) => bodyChunks.push(Buffer.from(c)));
      reqStream.on("end", () => {
        captured.body = Buffer.concat(bodyChunks).toString("utf8");
      });

      const resp = new PassThrough() as Readable & { statusCode?: number; headers: any };
      resp.statusCode = 200;
      resp.headers = { "content-type": "text/plain", location: "http://127.0.0.1:9090/next" };
      // Invoke the response callback on next tick
      process.nextTick(() => {
        cb(resp);
        resp.end("ok");
      });

      return reqStream as unknown as http.ClientRequest;
    }) as any;

    const handler = createClassicProxy("http://127.0.0.1:9090");

    // Fake Express req/res
    const req = new PassThrough() as unknown as http.IncomingMessage & {
      method: string;
      url: string;
      headers: http.IncomingHttpHeaders;
      socket: any;
    };
    (req as any).method = "POST";
    (req as any).url = "/foo/bar?x=1"; // already stripped of /classic by Express mount
    (req as any).headers = { "x-test-header": "present", "content-type": "text/plain", host: "example.local" };
    (req as any).socket = { encrypted: false, remoteAddress: "127.0.0.1" };

    const res = new MockRes() as unknown as http.ServerResponse;

    // Act
    const finished = new Promise<void>((resolve) => res.on("finish", () => resolve()));
    handler(req as any, res as any, () => {});
    // Write a small body
    (req as any as PassThrough).end("hello");
    await finished;

    // Assert request forwarding
    expect(captured.options).toBeDefined();
    expect(captured.options.method).toBe("POST");
    expect(captured.options.path).toBe("/foo/bar?x=1");
    expect(captured.options.headers["x-test-header"]).toBe("present");
    expect(captured.body).toBe("hello");

    // Assert response passthrough and Location rewrite to /classic
    const out = res as unknown as MockRes;
    expect(out.statusCode).toBe(200);
    expect(out.headers["location"]).toBe("/classic/next");
    expect(out.body).toBe("ok");
  });
});

