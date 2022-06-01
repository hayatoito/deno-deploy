import { serve, staticFiles } from "./deps.ts";

function setHeaders(headers: Headers, path: string, _stats?: Deno.FileInfo) {
  if (path.endsWith(".wbn")) {
    headers.set("Content-Type", "application/webbundle");
    headers.set("X-Content-Type-Options", "nosniff");
  }
}

function handler(req: Request): Promise<Response> {
  return staticFiles("static", { setHeaders })({
    request: req,
    respondWith: (r: Response) => r,
  });
}

await serve(handler);
