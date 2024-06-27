import { staticFiles } from "./deps.ts";
import { parseArgs } from "@std/cli/parse-args";

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

const args = parseArgs(Deno.args);

Deno.serve(
        { hostname: "127.0.0.1", port: args.port || 8000, handler },
);
