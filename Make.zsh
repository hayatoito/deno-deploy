run() {
  deno run -A ${this_dir}/server.ts --hostname 127.0.0.1
}

git_sync() {
  git init
  git remote add origin git@github.com:hayatoito/deno-deploy-test.git
  git fetch --filter=blob:none
  git reset origin/main
}
