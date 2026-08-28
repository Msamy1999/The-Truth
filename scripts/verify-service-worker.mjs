/* global Response, URL, console, process */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const listeners = new Map();
const stores = new Map();
let skipWaitingCalled = false;
let clientsClaimed = false;

function key(request) {
  const raw = typeof request === "string" ? request : request.url;
  try {
    const url = new URL(raw, "https://example.test");
    return `${url.pathname}${url.search}`;
  } catch {
    return raw;
  }
}

function cache(name) {
  let entries = stores.get(name);
  if (!entries) {
    entries = new Map();
    stores.set(name, entries);
  }
  return {
    async addAll(urls) {
      for (const url of urls) entries.set(key(url), new Response(`cached ${url}`));
    },
    async put(request, response) {
      entries.set(key(request), response.clone());
    },
    async match(request) {
      return entries.get(key(request))?.clone();
    },
    async keys() {
      return [...entries.keys()].map((url) => ({ url: `https://example.test${url}` }));
    },
    async delete(request) {
      return entries.delete(key(request));
    },
  };
}

const caches = {
  open: async (name) => cache(name),
  keys: async () => [...stores.keys()],
  delete: async (name) => stores.delete(name),
  async match(request) {
    for (const name of stores.keys()) {
      const response = await cache(name).match(request);
      if (response) return response;
    }
    return undefined;
  },
};

let fetchImplementation = async () => new Response("network", { status: 200 });
const context = vm.createContext({
  URL,
  Response,
  caches,
  fetch: (...args) => fetchImplementation(...args),
  self: {
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    skipWaiting: async () => {
      skipWaitingCalled = true;
    },
    clients: {
      claim: async () => {
        clientsClaimed = true;
      },
    },
    location: { origin: "https://example.test" },
  },
});

vm.runInContext(source, context, { filename: "public/sw.js" });

async function dispatchLifecycle(type) {
  let work;
  listeners.get(type)?.({ waitUntil: (promise) => (work = promise) });
  await work;
}

async function dispatchFetch(request) {
  let responsePromise;
  const work = [];
  listeners.get("fetch")?.({
    request,
    respondWith: (promise) => {
      responsePromise = promise;
    },
    waitUntil: (promise) => work.push(promise),
  });
  const response = responsePromise ? await responsePromise : undefined;
  await Promise.all(work);
  return response;
}

function request(path, options = {}) {
  return {
    method: options.method ?? "GET",
    mode: options.mode ?? "cors",
    url: `https://example.test${path}`,
  };
}

await dispatchLifecycle("install");
assert.equal(skipWaitingCalled, true, "install should activate the new worker immediately");
assert.deepEqual(await caches.keys(), ["straight-path-v6-shell"]);
assert.ok(await caches.match("/offline"), "offline page should be precached");

stores.set("straight-path-v4", new Map([["/stale", new Response("stale")]]));
await dispatchLifecycle("activate");
assert.equal(clientsClaimed, true, "activated worker should claim existing clients");
assert.deepEqual(await caches.keys(), ["straight-path-v6-shell"]);

let observedCacheMode;
fetchImplementation = async (_request, options) => {
  observedCacheMode = options?.cache;
  return new Response("fresh article", { status: 200 });
};
const articleRequest = request("/articles/example", { mode: "navigate" });
assert.equal(await (await dispatchFetch(articleRequest)).text(), "fresh article");
assert.equal(observedCacheMode, "no-store", "navigations must bypass stale HTTP cache");
assert.equal(await (await caches.match(articleRequest)).text(), "fresh article");

const privateRequest = request("/account", { mode: "navigate" });
fetchImplementation = async () =>
  new Response("private", { status: 200, headers: { "Cache-Control": "private" } });
assert.equal(await (await dispatchFetch(privateRequest)).text(), "private");
assert.equal(await caches.match(privateRequest), undefined, "private pages must not be cached");

const queryRequest = request("/search?q=private-term", { mode: "navigate" });
fetchImplementation = async () => new Response("results", { status: 200 });
assert.equal(await (await dispatchFetch(queryRequest)).text(), "results");
assert.equal(await caches.match(queryRequest), undefined, "query strings must not be cached");

fetchImplementation = async () => {
  throw new Error("offline");
};
assert.equal(await (await dispatchFetch(articleRequest)).text(), "fresh article");
assert.match(
  await (await dispatchFetch(request("/not-cached", { mode: "navigate" }))).text(),
  /cached \/offline/,
);

const failedRequest = request("/failed", { mode: "navigate" });
fetchImplementation = async () => new Response("server error", { status: 500 });
assert.equal((await dispatchFetch(failedRequest)).status, 500);
assert.equal(await caches.match(failedRequest), undefined, "failed responses must not be cached");

const assetRequest = request("/_next/static/example.js");
fetchImplementation = async () => new Response("asset", { status: 200 });
assert.equal(await (await dispatchFetch(assetRequest)).text(), "asset");
fetchImplementation = async () => {
  throw new Error("offline");
};
assert.equal(await (await dispatchFetch(assetRequest)).text(), "asset");

fetchImplementation = async () => new Response("page", { status: 200 });
for (let index = 0; index < 41; index += 1) {
  await dispatchFetch(request(`/articles/cached-${index}`, { mode: "navigate" }));
}
assert.equal(await caches.match("/articles/cached-0"), undefined);
assert.ok(await caches.match("/articles/cached-40"));

fetchImplementation = async () => new Response("asset", { status: 200 });
for (let index = 0; index < 121; index += 1) {
  await dispatchFetch(request(`/_next/static/cached-${index}.js`));
}
assert.equal(await caches.match("/_next/static/cached-0.js"), undefined);
assert.ok(await caches.match("/_next/static/cached-120.js"));

assert.equal(await dispatchFetch(request("/api/health")), undefined);
assert.equal(await dispatchFetch(request("/admin")), undefined);
assert.equal(await dispatchFetch(request("/articles/example", { method: "POST" })), undefined);

console.log("Service-worker install, activation, cache, offline, and bypass behavior verified.");
process.exit(0);
