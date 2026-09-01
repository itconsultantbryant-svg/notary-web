"use strict";

(function () {
  const API = "/api";
  let token = localStorage.getItem("admin_token") || "";
  let currentUser = null;
  let currentSection = "dashboard";
  let editingDocId = null;

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  async function api(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (token) headers.Authorization = "Bearer " + token;
    if (opts.body && !(opts.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(API + path, { ...opts, headers, credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function showAlert(container, msg, type) {
    const el = document.createElement("div");
    el.className = "alert alert-" + type;
    el.textContent = msg;
    container.prepend(el);
    setTimeout(() => el.remove(), 4000);
  }

  // ---- Auth ----
  async function login(email, password) {
    const data = await api("/auth/login", { method: "POST", body: { email, password } });
    token = data.token;
    localStorage.setItem("admin_token", token);
    currentUser = data.user;
    showApp();
  }

  function logout() {
    api("/auth/logout", { method: "POST" }).catch(() => {});
    token = "";
    localStorage.removeItem("admin_token");
    currentUser = null;
    $("#loginScreen").classList.remove("hidden");
    $("#appLayout").classList.add("hidden");
  }

  async function checkAuth() {
    if (!token) return false;
    try {
      const data = await api("/auth/me");
      currentUser = data.user;
      return true;
    } catch {
      token = "";
      localStorage.removeItem("admin_token");
      return false;
    }
  }

  function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#sidebarOverlay").classList.remove("show");
    const toggle = $("#mobileToggle");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function openSidebar() {
    $("#sidebar").classList.add("open");
    $("#sidebarOverlay").classList.add("show");
    const toggle = $("#mobileToggle");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }

  function showApp() {
    $("#loginScreen").classList.add("hidden");
    $("#appLayout").classList.remove("hidden");
    $("#userEmail").textContent = currentUser.email;
    navigate("dashboard");
  }

  function toggleSidebar() {
    if ($("#sidebar").classList.contains("open")) closeSidebar();
    else openSidebar();
  }

  // ---- Navigation ----
  function navigate(section) {
    currentSection = section;
    $$(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.section === section));
    const titles = {
      dashboard: "Dashboard",
      documents: "Document Verification",
      cms: "Content Management",
      contacts: "Contact Submissions",
      settings: "Settings"
    };
    $("#pageTitle").textContent = titles[section] || section;
    closeSidebar();

    const renderers = {
      dashboard: renderDashboard,
      documents: renderDocuments,
      cms: renderCms,
      contacts: renderContacts,
      settings: renderSettings
    };
    (renderers[section] || renderDashboard)();
  }

  // ---- Dashboard ----
  async function renderDashboard() {
    const el = $("#contentArea");
    el.innerHTML = '<div class="stats-grid" id="statsGrid"><div class="stat-card"><div class="lbl">Loading stats…</div></div></div><div class="card"><h3>Quick Actions</h3><div class="quick-actions"><button class="btn btn-primary" onclick="AdminApp.navigate(\'documents\')"><i class="fas fa-plus"></i> Add Document</button><button class="btn btn-navy" onclick="AdminApp.navigate(\'cms\')"><i class="fas fa-edit"></i> Edit Content</button><a href="/" target="_blank" rel="noopener" class="btn btn-outline"><i class="fas fa-external-link-alt"></i> View Website</a><a href="/verify" target="_blank" rel="noopener" class="btn btn-outline"><i class="fas fa-search"></i> Verify Page</a></div></div>';

    try {
      const stats = await api("/contact/stats");
      $("#statsGrid").innerHTML = `
        <div class="stat-card"><div class="num">${stats.documents}</div><div class="lbl">Total Documents</div></div>
        <div class="stat-card"><div class="num">${stats.activeDocuments}</div><div class="lbl">Active Documents</div></div>
        <div class="stat-card"><div class="num">${stats.cmsPages}</div><div class="lbl">CMS Pages</div></div>
        <div class="stat-card"><div class="num">${stats.cmsBlocks}</div><div class="lbl">Content Blocks</div></div>
        <div class="stat-card"><div class="num">${stats.contactSubmissions}</div><div class="lbl">Form Submissions</div></div>
        <div class="stat-card"><div class="num">${stats.recentSubmissions}</div><div class="lbl">This Week</div></div>
      `;
    } catch (e) {
      $("#statsGrid").innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  // ---- Documents ----
  async function renderDocuments() {
    const el = $("#contentArea");
    el.innerHTML = `
      <div class="section-toolbar">
        <p>Manage notarized documents for public verification</p>
        <button class="btn btn-primary" id="addDocBtn"><i class="fas fa-plus"></i> Add Document</button>
      </div>
      <div class="card"><div class="table-wrap" id="docTable">Loading…</div></div>
      <div id="docModal"></div>
    `;

    $("#addDocBtn").addEventListener("click", () => openDocModal());
    await loadDocuments();
  }

  async function loadDocuments() {
    try {
      const { documents } = await api("/documents");
      const table = $("#docTable");
      if (!documents.length) {
        table.innerHTML = '<div class="empty-state"><i class="fas fa-file-alt"></i><p>No documents yet. Add your first document.</p></div>';
        return;
      }
      table.innerHTML = `<table>
        <thead><tr><th>Document ID</th><th>Applicant</th><th>Type</th><th>Issued</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${documents.map((d) => `
          <tr>
            <td><strong>${esc(d.document_id)}</strong></td>
            <td>${esc(d.applicant_name)}</td>
            <td>${esc(d.document_type)}</td>
            <td>${esc(d.issue_date || "—")}</td>
            <td>${esc(d.expiry_date || "—")}</td>
            <td><span class="badge badge-${d.status === "active" ? "active" : d.status === "expired" ? "expired" : "revoked"}">${esc(d.status)}</span></td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="AdminApp.editDoc(${d.id})"><i class="fas fa-edit"></i></button>
              <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteDoc(${d.id})"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join("")}</tbody>
      </table>`;
    } catch (e) {
      $("#docTable").innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  function openDocModal(doc) {
    editingDocId = doc ? doc.id : null;
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "activeModal";
    modal.innerHTML = `
      <div class="modal-box">
        <h3>${doc ? "Edit Document" : "Add New Document"}</h3>
        <form id="docForm">
          <div class="form-row">
            <div class="form-group"><label>Document ID</label><input class="form-control" name="document_id" value="${doc ? esc(doc.document_id) : ""}" placeholder="Auto-generated if empty" /></div>
            <div class="form-group"><label>Status</label>
              <select class="form-control" name="status">
                <option value="active" ${doc?.status === "active" ? "selected" : ""}>Active</option>
                <option value="expired" ${doc?.status === "expired" ? "selected" : ""}>Expired</option>
                <option value="revoked" ${doc?.status === "revoked" ? "selected" : ""}>Revoked</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Applicant Name *</label><input class="form-control" name="applicant_name" value="${doc ? esc(doc.applicant_name) : ""}" required /></div>
          <div class="form-group"><label>Document Type *</label><input class="form-control" name="document_type" value="${doc ? esc(doc.document_type) : ""}" placeholder="e.g. Notarization Certificate" required /></div>
          <div class="form-row">
            <div class="form-group"><label>Issue Date</label><input class="form-control" type="date" name="issue_date" value="${doc?.issue_date || ""}" /></div>
            <div class="form-group"><label>Expiry Date</label><input class="form-control" type="date" name="expiry_date" value="${doc?.expiry_date || ""}" /></div>
          </div>
          <div class="form-group"><label>Notes (internal)</label><textarea class="form-control" name="notes">${doc?.notes || ""}</textarea></div>
          <div class="form-group"><label>Attach File (PDF, JPG, PNG)</label><input class="form-control" type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" /></div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button type="submit" class="btn btn-primary">${doc ? "Save Changes" : "Create Document"}</button>
            <button type="button" class="btn btn-outline" id="closeModal">Cancel</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    $("#closeModal", modal).addEventListener("click", () => modal.remove());

    $("#docForm", modal).addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        if (editingDocId) {
          await fetch(API + "/documents/" + editingDocId, {
            method: "PUT",
            headers: { Authorization: "Bearer " + token },
            body: fd,
            credentials: "include"
          }).then(async (r) => { if (!r.ok) throw new Error((await r.json()).error); });
        } else {
          await fetch(API + "/documents", {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: fd,
            credentials: "include"
          }).then(async (r) => { if (!r.ok) throw new Error((await r.json()).error); });
        }
        modal.remove();
        await loadDocuments();
      } catch (err) {
        showAlert(modal.querySelector(".modal-box"), err.message, "danger");
      }
    });
  }

  async function editDoc(id) {
    const { document: doc } = await api("/documents/" + id);
    openDocModal(doc);
  }

  async function deleteDoc(id) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    await api("/documents/" + id, { method: "DELETE" });
    await loadDocuments();
  }

  // ---- CMS ----
  let selectedPage = "index";

  async function renderCms() {
    const el = $("#contentArea");
    el.innerHTML = `
      <div class="card">
        <div class="form-row" style="align-items:end">
          <div class="form-group" style="margin:0">
            <label>Select Page</label>
            <select class="form-control" id="cmsPageSelect"></select>
          </div>
          <button class="btn btn-primary" id="saveCmsMeta"><i class="fas fa-save"></i> Save Page Meta</button>
        </div>
      </div>
      <div class="card" id="cmsMetaCard">
        <div class="form-group"><label>Page Title (SEO)</label><input class="form-control" id="cmsTitle" /></div>
        <div class="form-group"><label>Meta Description (SEO)</label><textarea class="form-control" id="cmsMetaDesc" rows="2"></textarea></div>
      </div>
      <div class="card"><h3 style="margin:0 0 16px">Content Blocks</h3><div id="cmsBlocks">Loading…</div></div>
    `;

    const { pages } = await api("/cms/pages");
    const sel = $("#cmsPageSelect");
    sel.innerHTML = pages.map((p) => `<option value="${p.slug}">${esc(p.title || p.slug)}</option>`).join("");
    sel.value = selectedPage;
    sel.addEventListener("change", () => { selectedPage = sel.value; loadCmsPage(); });
    $("#saveCmsMeta").addEventListener("click", saveCmsMeta);
    await loadCmsPage();
  }

  async function loadCmsPage() {
    selectedPage = $("#cmsPageSelect").value;
    const { page, blocks } = await api("/cms/admin/pages/" + selectedPage);
    $("#cmsTitle").value = page.title || "";
    $("#cmsMetaDesc").value = page.meta_description || "";

    const container = $("#cmsBlocks");
    if (!blocks.length) {
      container.innerHTML = '<div class="empty-state"><p>No content blocks for this page.</p></div>';
      return;
    }

    container.innerHTML = blocks.map((b) => `
      <div class="cms-block" data-key="${esc(b.block_key)}">
        <label>${esc(b.label || b.block_key)}</label>
        <div class="block-key">Key: ${esc(b.block_key)} · Type: ${esc(b.content_type)}</div>
        ${b.content_type === "html"
          ? `<textarea class="form-control cms-content" rows="4">${esc(b.content)}</textarea>`
          : `<textarea class="form-control cms-content" rows="3">${esc(b.content)}</textarea>`}
        <button class="btn btn-sm btn-primary save-block-btn" style="margin-top:8px"><i class="fas fa-save"></i> Save Block</button>
      </div>
    `).join("");

    $$(".save-block-btn", container).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const block = btn.closest(".cms-block");
        const key = block.dataset.key;
        const content = $(".cms-content", block).value;
        const orig = blocks.find((x) => x.block_key === key);
        try {
          await api(`/cms/admin/blocks/${selectedPage}/${key}`, {
            method: "PUT",
            body: { content, content_type: orig?.content_type || "text", label: orig?.label }
          });
          btn.innerHTML = '<i class="fas fa-check"></i> Saved';
          setTimeout(() => { btn.innerHTML = '<i class="fas fa-save"></i> Save Block'; }, 2000);
        } catch (e) {
          alert(e.message);
        }
      });
    });
  }

  async function saveCmsMeta() {
    try {
      await api("/cms/admin/pages/" + selectedPage, {
        method: "PUT",
        body: { title: $("#cmsTitle").value, meta_description: $("#cmsMetaDesc").value }
      });
      alert("Page meta saved. Changes appear on the website immediately.");
    } catch (e) {
      alert(e.message);
    }
  }

  // ---- Contacts ----
  async function renderContacts() {
    const el = $("#contentArea");
    el.innerHTML = '<div class="card"><div class="table-wrap" id="contactTable">Loading…</div></div>';
    try {
      const { submissions } = await api("/contact");
      const table = $("#contactTable");
      if (!submissions.length) {
        table.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No submissions yet.</p></div>';
        return;
      }
      table.innerHTML = `<table>
        <thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Phone</th><th>Subject</th><th>Type</th><th>Actions</th></tr></thead>
        <tbody>${submissions.map((s) => `
          <tr>
            <td>${esc((s.created_at || "").slice(0, 16))}</td>
            <td>${esc(s.name)}</td>
            <td><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></td>
            <td>${esc(s.phone || "—")}</td>
            <td>${esc(s.subject || "—")}</td>
            <td>${esc(s.form_type)}</td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="AdminApp.viewContact(${s.id})"><i class="fas fa-eye"></i></button>
              <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteContact(${s.id})"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join("")}</tbody>
      </table>`;
      window._contacts = submissions;
    } catch (e) {
      $("#contactTable").innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  function viewContact(id) {
    const s = (window._contacts || []).find((x) => x.id === id);
    if (!s) return;
    alert(`From: ${s.name} <${s.email}>\nPhone: ${s.phone || "—"}\nSubject: ${s.subject}\n\n${s.message}`);
  }

  async function deleteContact(id) {
    if (!confirm("Delete this submission?")) return;
    await api("/contact/" + id, { method: "DELETE" });
    renderContacts();
  }

  // ---- Settings ----
  function renderSettings() {
    $("#contentArea").innerHTML = `
      <div class="card">
        <h3>Change Password</h3>
        <form id="pwForm">
          <div class="form-group"><label>Current Password</label><input class="form-control" type="password" name="currentPassword" required /></div>
          <div class="form-group"><label>New Password (8+ characters)</label><input class="form-control" type="password" name="newPassword" required minlength="8" /></div>
          <button type="submit" class="btn btn-primary">Update Password</button>
        </form>
      </div>
      <div class="card">
        <h3>Website Info</h3>
        <p><strong>Public URL:</strong> <a href="https://www.jeffersonteahnotarypublic.com" target="_blank">www.jeffersonteahnotarypublic.com</a></p>
        <p><strong>Admin URL:</strong> <a href="/admin">/admin</a></p>
        <p><strong>Verify URL:</strong> <a href="/verify">/verify</a></p>
      </div>
    `;
    $("#pwForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api("/auth/password", {
          method: "PUT",
          body: { currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword") }
        });
        alert("Password updated successfully.");
        e.target.reset();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  function esc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---- Init ----
  window.AdminApp = { navigate, editDoc, deleteDoc, viewContact, deleteContact };

  document.addEventListener("DOMContentLoaded", async () => {
    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#loginEmail").value;
      const password = $("#loginPassword").value;
      const btn = $("#loginBtn");
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in…';
      $("#loginError").classList.add("hidden");
      try {
        await login(email, password);
      } catch (err) {
        $("#loginError").textContent = err.message;
        $("#loginError").classList.remove("hidden");
      } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    });

    $("#logoutBtn").addEventListener("click", logout);
    $$(".nav-item").forEach((n) => n.addEventListener("click", () => navigate(n.dataset.section)));
    $("#mobileToggle").addEventListener("click", toggleSidebar);
    $("#sidebarOverlay").addEventListener("click", closeSidebar);

    if (await checkAuth()) showApp();
  });
})();
