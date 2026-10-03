// Prints eslint findings one per line. Usage: npx eslint . -f json | node tests/lint-summary.mjs
let d = "";
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  for (const f of JSON.parse(d)) {
    for (const m of f.messages) {
      const file = f.filePath.split("HouseCore")[1].replaceAll("\\", "/");
      console.log(`${m.severity === 2 ? "E" : "W"} ${file}:${m.line} ${m.ruleId} - ${m.message.split("\n")[0].slice(0, 100)}`);
    }
  }
});
