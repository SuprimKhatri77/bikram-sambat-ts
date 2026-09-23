// Runs the whole test suite once per timezone, each in a fresh process with
// TZ set from the start (see tests/timezone.test.ts for why).
//
// Usage: bun run test:timezones [zone ...]

const DEFAULT_ZONES = [
  "UTC",
  "Asia/Kathmandu", // UTC+05:45 (UTC+05:30 before 1986)
  "America/Los_Angeles", // DST
  "America/Sao_Paulo", // DST transitions historically at local midnight
  "Asia/Tehran", // DST transitions historically at local midnight
  "Pacific/Kiritimati", // UTC+14; skipped 1994-12-31 entirely
  "Pacific/Apia", // skipped 2011-12-30 entirely
  "Pacific/Pago_Pago", // UTC-11
  "Australia/Lord_Howe", // 30-minute DST shift
];

const zones = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_ZONES;
const failed: string[] = [];

for (const zone of zones) {
  console.log(`\n=== TZ=${zone}`);
  const result = Bun.spawnSync(["bun", "test"], {
    env: { ...process.env, TZ: zone },
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) {
    failed.push(zone);
  }
}

if (failed.length > 0) {
  console.error(`\nFailed in: ${failed.join(", ")}`);
  process.exit(1);
}
console.log(`\nAll tests passed in ${zones.length} timezones: ${zones.join(", ")}`);
