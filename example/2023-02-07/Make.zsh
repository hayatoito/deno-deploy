# * Example usages

# * Run Benchmark
bench() {
  for flag in "--enable-blink-features=LCPCriticalPathPredictor" "" ; do
    echo "Run $flag"
    deno run --allow-all ./run-bench.ts --browser ~/src/chrome1/src/out/Default/chrome -- $flag
  done
}
