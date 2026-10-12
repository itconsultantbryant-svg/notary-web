"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

test("document bytes survive login, edits and application restart", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "notary-files-"));
  fs.cpSync(path.join(__dirname, "../server"), path.join(root, "server"), { recursive: true });
  fs.symlinkSync(path.join(__dirname, "../node_modules"), path.join(root, "node_modules"));
  const oldUrl = process.env.DATABASE_URL;
  const oldVercel = process.env.VERCEL;
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  let server;
  let base;
  let cookie;
  async function start() {
    const app = require(path.join(root, "server/api-app"))();
    server = await new Promise(resolve => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
    base = `http://127.0.0.1:${server.address().port}/api`;
  }
  async function stop() {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
  async function login() {
    const res = await fetch(base + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "test@example.com", password: "test-password" }) });
    assert.equal(res.status, 200);
    cookie = res.headers.get("set-cookie").split(";")[0];
  }
  async function request(url, opts = {}) {
    return fetch(base + url, { ...opts, headers: { Cookie: cookie, ...opts.headers } });
  }
  function form(name, bytes, docId) {
    const f = new FormData();
    f.set("applicant_name", "Test Applicant");
    f.set("document_type", "Test");
    if (docId) f.set("document_id", docId);
    if (name) f.set("file", new Blob([bytes]), name);
    return f;
  }
  try {
    const db = await require(path.join(root, "server/db")).getDb();
    await db.run("INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)", ["test@example.com", await require("bcryptjs").hash("test-password", 4), "Test"]);
    await start();
    await login();
    const docs = [];
    for (const ext of ["pdf", "doc", "docx", "png", "jpeg", "jpg"]) {
      const bytes = Buffer.from(`binary-${ext}\x00\xff`);
      const res = await request("/documents", { method: "POST", body: form(`example.${ext}`, bytes) });
      assert.equal(res.status, 201);
      const { document: doc } = await res.json();
      assert.equal(doc.file_data, undefined);
      docs.push({ id: doc.id, bytes, ext });
    }
    await request("/auth/logout", { method: "POST" });
    assert.equal((await fetch(base + `/documents/${docs[0].id}/file`)).status, 401);
    await stop();
    for (const key of Object.keys(require.cache)) if (key.startsWith(root)) delete require.cache[key];
    await start();
    await login();
    for (const doc of docs) {
      for (const suffix of ["", "?download=1"]) {
        const res = await request(`/documents/${doc.id}/file${suffix}`);
        assert.equal(res.status, 200);
        assert.deepEqual(Buffer.from(await res.arrayBuffer()), doc.bytes);
        assert.match(res.headers.get("content-disposition"), suffix ? /^attachment/ : /^inline/);
        assert.equal(res.headers.get("cache-control"), "private, no-store");
      }
      assert.equal((await request(`/documents/${doc.id}`, { method: "PUT", body: form() })).status, 200);
      assert.deepEqual(Buffer.from(await (await request(`/documents/${doc.id}/file`)).arrayBuffer()), doc.bytes);
    }
    const restartedDb = await require(path.join(root, "server/db")).getDb();
    fs.mkdirSync(path.join(root, "uploads/documents"), { recursive: true });
    fs.writeFileSync(path.join(root, "uploads/documents/legacy.pdf"), "legacy bytes");
    await restartedDb.run("INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", ["LEGACY", "Test", "Test", null, null, "active", null, "legacy.pdf", "/uploads/documents/legacy.pdf"]);
    const legacy = await restartedDb.get("SELECT * FROM documents WHERE document_id = ?", ["LEGACY"]);
    assert.equal(await (await request(`/documents/${legacy.id}/file`)).text(), "legacy bytes");
    fs.unlinkSync(path.join(root, "uploads/documents/legacy.pdf"));
    assert.equal(await (await request(`/documents/${legacy.id}/file`)).text(), "legacy bytes");
    await restartedDb.run("INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", ["MISSING", "Test", "Test", null, null, "active", null, "missing.pdf", "missing.pdf"]);
    const missing = await restartedDb.get("SELECT * FROM documents WHERE document_id = ?", ["MISSING"]);
    assert.equal((await request(`/documents/${missing.id}/file`)).status, 404);
    const id = docs[0].id;
    assert.equal((await request(`/documents/${id}`, { method: "PUT", body: form("replacement.png", "replacement") })).status, 200);
    assert.equal(await (await request(`/documents/${id}/file`)).text(), "replacement");
    assert.equal((await request(`/documents/${id}`, { method: "PUT", body: form("bad.exe", "invalid") })).status, 400);
    assert.equal(await (await request(`/documents/${id}/file`)).text(), "replacement");
    assert.equal((await request(`/documents/${id}`, { method: "PUT", body: form("replacement.pdf", "must not save", "LEGACY") })).status, 409);
    assert.equal(await (await request(`/documents/${id}/file`)).text(), "replacement");
    const listing = await (await request("/documents")).json();
    assert.ok(listing.documents.every(d => !("file_data" in d)));
    assert.equal((await request(`/documents/${id}`, { method: "DELETE" })).status, 200);
    assert.equal((await request(`/documents/${id}/file`)).status, 404);
  } finally {
    if (server?.listening) await stop();
    fs.rmSync(root, { recursive: true, force: true });
    if (oldUrl !== undefined) process.env.DATABASE_URL = oldUrl;
    if (oldVercel !== undefined) process.env.VERCEL = oldVercel;
  }
});
