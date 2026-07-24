/* global AbortSignal, console, fetch, process */

const baseUrl = (process.env.BASE_URL ?? process.argv[2] ?? "").replace(/\/$/, "");

if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  console.error("Usage: npm run smoke:test -- https://your-site.example");
  process.exit(2);
}

const checks = [
  { path: "/", type: "text/html" },
  { path: "/healthz", type: "application/json" },
  { path: "/api/health", type: "application/json" },
  { path: "/islam-overview", type: "text/html" },
  { path: "/articles/who-is-jesus", type: "text/html" },
  { path: "/sitemap.xml", type: "application/xml" },
];

let failed = false;

for (const check of checks) {
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    const contentType = response.headers.get("content-type") ?? "";
    const ok = response.ok && contentType.includes(check.type);
    console.log(
      `${ok ? "PASS" : "FAIL"} ${response.status} ${check.path} ${contentType}`,
    );
    failed ||= !ok;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${check.path} ${error.message}`);
  }
}

process.exit(failed ? 1 : 0);
