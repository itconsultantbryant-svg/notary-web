"use strict";

const path = require("path");
const fs = require("fs");

let db = null;
let driver = null;
let store = null;

const DATA_FILE = path.join(__dirname, "..", "data", "store.json");

function usePostgres() {
  return Boolean(process.env.DATABASE_URL);
}

function defaultStore() {
  return {
    admin_users: [],
    documents: [],
    cms_pages: [],
    cms_blocks: [],
    contact_submissions: [],
    _seq: { admin_users: 0, documents: 0, cms_blocks: 0, contact_submissions: 0 }
  };
}

function loadStore() {
  if (!fs.existsSync(DATA_FILE)) return defaultStore();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function persist() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function initJsonStore() {
  driver = "json";
  store = loadStore();

  db = {
    exec() {},
    get(text, params = []) {
      const t = text.toUpperCase();
      if (t.includes("COUNT(*)") && t.includes("FROM DOCUMENTS")) {
        if (t.includes("STATUS = 'ACTIVE'")) {
          return { count: store.documents.filter((d) => d.status === "active").length };
        }
        return { count: store.documents.length };
      }
      if (t.includes("COUNT(*)") && t.includes("FROM CMS_PAGES")) return { count: store.cms_pages.length };
      if (t.includes("COUNT(*)") && t.includes("FROM CMS_BLOCKS")) return { count: store.cms_blocks.length };
      if (t.includes("COUNT(*)") && t.includes("FROM CONTACT_SUBMISSIONS")) {
        if (t.includes("DATETIME")) {
          const weekAgo = Date.now() - 7 * 86400000;
          return { count: store.contact_submissions.filter((s) => new Date(s.created_at) >= weekAgo).length };
        }
        return { count: store.contact_submissions.length };
      }
      if (t.includes("FROM ADMIN_USERS") && t.includes("EMAIL")) {
        return store.admin_users.find((u) => u.email === params[0]) || null;
      }
      if (t.includes("FROM ADMIN_USERS") && t.includes("ID")) {
        return store.admin_users.find((u) => String(u.id) === String(params[0])) || null;
      }
      if (t.includes("FROM DOCUMENTS") && t.includes("UPPER(DOCUMENT_ID)")) {
        return store.documents.find((d) => d.document_id.toUpperCase() === String(params[0]).toUpperCase()) || null;
      }
      if (t.includes("FROM DOCUMENTS") && t.includes("DOCUMENT_ID =")) {
        return store.documents.find((d) => d.document_id === params[0]) || null;
      }
      if (t.includes("FROM DOCUMENTS") && t.includes("ID =")) {
        return store.documents.find((d) => String(d.id) === String(params[0])) || null;
      }
      if (t.includes("FROM CMS_PAGES") && t.includes("SLUG")) {
        return store.cms_pages.find((p) => p.slug === params[0]) || null;
      }
      if (t.includes("FROM CMS_BLOCKS") && t.includes("BLOCK_KEY")) {
        return store.cms_blocks.find((b) => b.page_slug === params[0] && b.block_key === params[1]) || null;
      }
      if (t.includes("SELECT ID FROM DOCUMENTS")) {
        return store.documents.find((d) => d.document_id.toUpperCase() === String(params[0]).toUpperCase()) || null;
      }
      if (t.includes("SELECT SLUG FROM CMS_PAGES")) {
        return store.cms_pages.find((p) => p.slug === params[0]) || null;
      }
      if (t.includes("SELECT ID FROM CMS_BLOCKS")) {
        return store.cms_blocks.find((b) => b.page_slug === params[0] && b.block_key === params[1]) || null;
      }
      return null;
    },
    all(text, params = []) {
      const t = text.toUpperCase();
      if (t.includes("BLOCK_COUNT")) {
        return store.cms_pages.map((p) => ({
          ...p,
          block_count: store.cms_blocks.filter((b) => b.page_slug === p.slug).length
        })).sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      }
      if (t.includes("FROM DOCUMENTS")) {
        return [...store.documents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      if (t.includes("FROM CONTACT_SUBMISSIONS")) {
        return [...store.contact_submissions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 200);
      }
      if (t.includes("FROM CMS_BLOCKS") && params[0]) {
        return store.cms_blocks.filter((b) => b.page_slug === params[0]).sort((a, b) => a.block_key.localeCompare(b.block_key));
      }
      if (t.includes("FROM CMS_PAGES")) {
        return [...store.cms_pages].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      }
      return [];
    },
    run(text, params = []) {
      const t = text.toUpperCase();
      const now = new Date().toISOString();

      if (t.startsWith("INSERT INTO ADMIN_USERS")) {
        store._seq.admin_users++;
        store.admin_users.push({ id: store._seq.admin_users, email: params[0], password_hash: params[1], name: params[2], created_at: now });
      } else if (t.startsWith("INSERT INTO DOCUMENTS")) {
        store._seq.documents++;
        store.documents.push({
          id: store._seq.documents, document_id: params[0], applicant_name: params[1], document_type: params[2],
          issue_date: params[3], expiry_date: params[4], status: params[5], notes: params[6],
          file_name: params[7], file_path: params[8], created_at: now, updated_at: now
        });
      } else if (t.startsWith("INSERT INTO CMS_PAGES")) {
        store.cms_pages.push({ slug: params[0], title: params[1], meta_description: params[2], updated_at: now });
      } else if (t.startsWith("INSERT INTO CMS_BLOCKS")) {
        store._seq.cms_blocks++;
        store.cms_blocks.push({ id: store._seq.cms_blocks, page_slug: params[0], block_key: params[1], content: params[2], content_type: params[3], label: params[4] });
      } else if (t.startsWith("INSERT INTO CONTACT_SUBMISSIONS")) {
        store._seq.contact_submissions++;
        store.contact_submissions.push({
          id: store._seq.contact_submissions, name: params[0], email: params[1], phone: params[2],
          subject: params[3], message: params[4], form_type: params[5], extra_data: params[6], created_at: now
        });
      } else if (t.startsWith("UPDATE DOCUMENTS")) {
        const id = params[10];
        const row = store.documents.find((d) => String(d.id) === String(id));
        if (row) Object.assign(row, {
          document_id: params[0], applicant_name: params[1], document_type: params[2],
          issue_date: params[3], expiry_date: params[4], status: params[5], notes: params[6],
          file_name: params[7], file_path: params[8], updated_at: params[9]
        });
      } else if (t.startsWith("UPDATE CMS_PAGES")) {
        const row = store.cms_pages.find((p) => p.slug === params[3]);
        if (row) { row.title = params[0]; row.meta_description = params[1]; row.updated_at = params[2]; }
      } else if (t.startsWith("UPDATE CMS_BLOCKS")) {
        const row = store.cms_blocks.find((b) => b.page_slug === params[3] && b.block_key === params[4]);
        if (row) { row.content = params[0]; row.content_type = params[1]; row.label = params[2]; }
      } else if (t.startsWith("UPDATE ADMIN_USERS")) {
        const row = store.admin_users.find((u) => String(u.id) === String(params[1]));
        if (row) row.password_hash = params[0];
      } else if (t.startsWith("DELETE FROM DOCUMENTS")) {
        store.documents = store.documents.filter((d) => String(d.id) !== String(params[0]));
      } else if (t.startsWith("DELETE FROM CMS_BLOCKS")) {
        store.cms_blocks = store.cms_blocks.filter((b) => !(b.page_slug === params[0] && b.block_key === params[1]));
      } else if (t.startsWith("DELETE FROM CONTACT_SUBMISSIONS")) {
        store.contact_submissions = store.contact_submissions.filter((s) => String(s.id) !== String(params[0]));
      }

      persist();
      return { changes: 1 };
    }
  };

  return db;
}

async function initPostgres() {
  const { neon } = require("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  driver = "postgres";

  async function query(text, params = []) {
    let i = 0;
    const pgText = text.replace(/\?/g, () => `$${++i}`);
    return sql(pgText, params);
  }

  db = {
    async exec(schema) {
      for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
        await sql(stmt);
      }
    },
    async get(text, params) {
      const rows = await query(text, params);
      return rows[0] || null;
    },
    async all(text, params) {
      return query(text, params);
    },
    async run(text, params) {
      await query(text, params);
      return { changes: 1 };
    }
  };

  return db;
}

async function getDb() {
  if (db) return db;
  if (usePostgres()) await initPostgres();
  else initJsonStore();
  return db;
}

function getDriver() {
  return driver;
}

module.exports = { getDb, getDriver, usePostgres };
