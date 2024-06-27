update() {
  local modules=(
    @std/cli
    @std/http
  )
  deno add $modules
}

cache() {
  deno cache ./server.ts
}

run() {
  deno run --allow-net --allow-read ./server.ts $@
}
