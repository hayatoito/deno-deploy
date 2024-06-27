// Ref: https://jsr.io/@std
import { parseArgs } from "@std/cli/parse-args";
import { serveDir } from "@std/http/file-server";

function handler(req: Request): Promise<Response> {
  const headers = [];
  if ((new URL(req.url)).pathname.endsWith(".wbn")) {
    headers.push("Content-Type: application/webbundle");
    headers.push("X-Content-Type-Options: nosniff");
  }
  return serveDir(req, {
    fsRoot: "static",
    showDirListing: true,
    showIndex: true,
    headers,
  });
}

const args = parseArgs(Deno.args);

Deno.serve(
  { hostname: "127.0.0.1", port: args.port || 8000, handler },
);
