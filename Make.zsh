update() {
  deno add @std/cli
}

run() {
  deno run --allow-net ./server.ts $@
}
