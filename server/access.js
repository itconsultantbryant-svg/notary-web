"use strict";

const PERMISSIONS = ["dashboard", "analytics", "documents.view", "documents.manage", "cms.view", "cms.manage", "contacts.view", "contacts.manage", "staff.manage"];
const ROLE_PERMISSIONS = {
  administrator: PERMISSIONS,
  manager: ["dashboard", "analytics", "documents.view", "documents.manage", "cms.view", "cms.manage", "contacts.view", "contacts.manage"],
  clerk: ["dashboard", "documents.view", "documents.manage", "contacts.view"],
  viewer: ["dashboard", "analytics", "documents.view", "cms.view", "contacts.view"]
};

function permissionsFor(user) {
  if (!user) return [];
  if ((user.role || "administrator") === "administrator") return PERMISSIONS;
  let custom = user.permissions;
  if (typeof custom === "string") { try { custom = JSON.parse(custom); } catch { custom = []; } }
  return Array.isArray(custom) ? custom.filter((p) => PERMISSIONS.includes(p)) : (ROLE_PERMISSIONS[user.role] || []);
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role || "administrator", permissions: permissionsFor(user), active: user.active !== false && user.active !== 0, password_reset_requested_at: user.password_reset_requested_at || null, created_at: user.created_at };
}

module.exports = { PERMISSIONS, ROLE_PERMISSIONS, permissionsFor, publicUser };
