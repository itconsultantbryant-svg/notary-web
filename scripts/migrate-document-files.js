"use strict";
require("dotenv").config();
const fs = require("node:fs/promises");
const path = require("node:path");
const { getDb } = require("../server/db");
const { getSchema } = require("../server/schema");

(async () => {
  const db = await getDb();
  const schema = getSchema();
  if (schema) await db.exec(schema);
  const docs = await db.all("SELECT id, file_path, file_data FROM documents");
  const base = process.env.VERCEL ? "/tmp/uploads/documents" : path.join(__dirname, "../uploads/documents");
  let migrated = 0;
  let missing = 0;
  for (const doc of docs) {
    if (doc.file_data != null || !doc.file_path) continue;
    try {
      const bytes = await fs.readFile(path.join(base, path.basename(doc.file_path)));
      await db.run("UPDATE documents SET file_data = ? WHERE id = ? AND file_data IS NULL", [bytes.toString("base64"), doc.id]);
      migrated++;
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
      console.warn(`Document ${doc.id}: original file missing; re-upload required.`);
      missing++;
    }
  }
  console.log(`Migrated ${migrated} files; ${missing} originals missing.`);
})().catch(err => { console.error(err.message); process.exitCode = 1; });
