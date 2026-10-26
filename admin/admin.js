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

  function bindPasswordToggles(container = document) {
    $$("[data-password-toggle]", container).forEach((button) => button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle) || $("#" + button.dataset.passwordToggle, container);
      if (!input) return;
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
      button.innerHTML = `<i class="fas fa-eye${visible ? "-slash" : ""}"></i>`;
    }));
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
    $$(".nav-item").forEach((item) => {
      const required = { dashboard: "dashboard", analytics: "analytics", documents: "documents.view", cms: "cms.view", contacts: "contacts.view", staff: "staff.manage" }[item.dataset.section];
      item.classList.toggle("hidden", required && !can(required));
    });
    loadSidebarStats();
    navigate("dashboard");
  }

  function can(permission) { return (currentUser?.permissions || []).includes(permission); }

  async function loadSidebarStats() {
    try {
      const s = await api("/analytics/summary");
      $("#sbVisitors").textContent = s.visitorsToday;
      $("#sbViews").textContent = s.pageViewsToday;
      $("#sbVerifications").textContent = s.verificationsToday;
    } catch {
      $("#sbVisitors").textContent = "—";
      $("#sbViews").textContent = "—";
      $("#sbVerifications").textContent = "—";
    }
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
      analytics: "Analytics & Logs",
      documents: "Document Verification",
      cms: "Content Management",
      contacts: "Contact Submissions",
      staff: "Staff & Access",
      settings: "Settings"
    };
    $("#pageTitle").textContent = titles[section] || section;
    closeSidebar();

    const renderers = {
      dashboard: renderDashboard,
      analytics: renderAnalytics,
      documents: renderDocuments,
      cms: renderCms,
      contacts: renderContacts,
      staff: renderStaff,
      settings: renderSettings
    };
    (renderers[section] || renderDashboard)();
  }

  // ---- Dashboard ----
  async function renderDashboard() {
    const el = $("#contentArea");
    el.innerHTML = '<div class="stats-grid" id="statsGrid"><div class="stat-card"><div class="lbl">Loading stats…</div></div></div><div class="stats-grid" id="analyticsGrid"></div><div class="card"><h3>Quick Actions</h3><div class="quick-actions"><button class="btn btn-primary" onclick="AdminApp.navigate(\'documents\')"><i class="fas fa-plus"></i> Add Document</button><button class="btn btn-navy" onclick="AdminApp.navigate(\'analytics\')"><i class="fas fa-chart-line"></i> View Analytics</button><button class="btn btn-navy" onclick="AdminApp.navigate(\'cms\')"><i class="fas fa-edit"></i> Edit Content</button><a href="/" target="_blank" rel="noopener" class="btn btn-outline"><i class="fas fa-external-link-alt"></i> View Website</a><a href="/verify" target="_blank" rel="noopener" class="btn btn-outline"><i class="fas fa-search"></i> Verify Page</a></div></div>';

    try {
      const [stats, analytics] = await Promise.all([
        api("/contact/stats"),
        api("/analytics/stats")
      ]);
      $("#statsGrid").innerHTML = `
        <div class="stat-card"><div class="num">${stats.documents}</div><div class="lbl">Total Documents</div></div>
        <div class="stat-card"><div class="num">${stats.activeDocuments}</div><div class="lbl">Active Documents</div></div>
        <div class="stat-card"><div class="num">${stats.contactSubmissions}</div><div class="lbl">Form Submissions</div></div>
        <div class="stat-card"><div class="num">${stats.recentSubmissions}</div><div class="lbl">Submissions (7 days)</div></div>
        <div class="stat-card"><div class="num">${analytics.visitorsToday}</div><div class="lbl">Visitors Today</div></div>
        <div class="stat-card"><div class="num">${analytics.verificationsToday}</div><div class="lbl">Verifications Today</div></div>
      `;
      $("#analyticsGrid").innerHTML = `
        <div class="stat-card"><div class="num">${analytics.pageViewsWeek}</div><div class="lbl">Page Views (7 days)</div></div>
        <div class="stat-card"><div class="num">${analytics.uniqueVisitorsWeek}</div><div class="lbl">Unique Visitors (7 days)</div></div>
        <div class="stat-card"><div class="num">${formatDuration(analytics.avgDurationSeconds)}</div><div class="lbl">Avg. Visit Duration</div></div>
        <div class="stat-card"><div class="num">${analytics.verificationsWeek}</div><div class="lbl">Verifications (7 days)</div></div>
      `;
      loadSidebarStats();
    } catch (e) {
      $("#statsGrid").innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return "—";
    if (seconds < 60) return seconds + "s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + "m " + s + "s";
  }

  // ---- Analytics ----
  async function renderAnalytics() {
    const el = $("#contentArea");
    el.innerHTML = '<div class="stats-grid" id="analyticsStats"><div class="stat-card"><div class="lbl">Loading…</div></div></div><div class="analytics-grid" id="analyticsPanels"></div>';
    try {
      const a = await api("/analytics/stats");
      $("#analyticsStats").innerHTML = `
        <div class="stat-card"><div class="num">${a.visitorsToday}</div><div class="lbl">Visitors Today</div></div>
        <div class="stat-card"><div class="num">${a.pageViewsToday}</div><div class="lbl">Page Views Today</div></div>
        <div class="stat-card"><div class="num">${a.uniqueVisitorsWeek}</div><div class="lbl">Unique Visitors (7d)</div></div>
        <div class="stat-card"><div class="num">${formatDuration(a.avgDurationSeconds)}</div><div class="lbl">Avg. Duration (7d)</div></div>
        <div class="stat-card"><div class="num">${a.verificationsWeek}</div><div class="lbl">Verifications (7d)</div></div>
        <div class="stat-card"><div class="num">${a.successfulVerifications}</div><div class="lbl">Successful (7d)</div></div>
      `;

      const topPages = (a.topPages || []).map((p) =>
        `<li><span>${esc(p.page_path)}</span><strong>${p.views}</strong></li>`
      ).join("") || '<li><span class="text-muted">No data yet</span></li>';

      const topLocs = (a.topLocations || []).map((l) =>
        `<li><span>${esc([l.city, l.country].filter(Boolean).join(", ") || "Unknown")}</span><strong>${l.views}</strong></li>`
      ).join("") || '<li><span class="text-muted">No location data yet</span></li>';

      const verifLogs = (a.recentVerifications || []).map((v) => `
        <tr>
          <td>${esc((v.created_at || "").slice(0, 16))}</td>
          <td><strong>${esc(v.document_id || "—")}</strong></td>
          <td>${v.found ? '<span class="badge badge-active">Found</span>' : '<span class="badge badge-expired">Not found</span>'}</td>
          <td>${esc(v.status || "—")}</td>
          <td>${esc([v.city, v.country].filter(Boolean).join(", ") || "—")}</td>
        </tr>
      `).join("") || '<tr><td colspan="5" class="text-muted">No verification attempts yet</td></tr>';

      const pageLogs = (a.recentPageViews || []).map((p) => `
        <tr>
          <td>${esc((p.created_at || "").slice(0, 16))}</td>
          <td>${esc(p.page_path)}</td>
          <td>${esc([p.city, p.country].filter(Boolean).join(", ") || "—")}</td>
          <td>${p.duration_seconds ? formatDuration(p.duration_seconds) : "—"}</td>
        </tr>
      `).join("") || '<tr><td colspan="4" class="text-muted">No page views yet</td></tr>';

      $("#analyticsPanels").innerHTML = `
        <div class="card"><h3>Top Pages (7 days)</h3><ul class="analytics-list">${topPages}</ul></div>
        <div class="card"><h3>Top Locations (7 days)</h3><ul class="analytics-list">${topLocs}</ul></div>
        <div class="card" style="grid-column:1/-1"><h3>Verification Logs</h3><div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Document ID</th><th>Result</th><th>Status</th><th>Location</th></tr></thead>
          <tbody>${verifLogs}</tbody>
        </table></div></div>
        <div class="card" style="grid-column:1/-1"><h3>Recent Page Views</h3><div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Page</th><th>Location</th><th>Duration</th></tr></thead>
          <tbody>${pageLogs}</tbody>
        </table></div></div>
      `;
      loadSidebarStats();
    } catch (e) {
      $("#analyticsStats").innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  // ---- Documents ----
  async function renderDocuments() {
    const el = $("#contentArea");
    el.innerHTML = `
      <div class="section-toolbar">
        <p>Manage notarized documents for public verification</p>
        ${can("documents.manage") ? '<button class="btn btn-primary" id="addDocBtn"><i class="fas fa-plus"></i> Add Document</button>' : ""}
      </div>
      <div class="card"><div class="table-wrap" id="docTable">Loading…</div></div>
      <div id="docModal"></div>
    `;

    $("#addDocBtn")?.addEventListener("click", () => openDocModal());
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
        <thead><tr><th>Document ID</th><th>Applicant</th><th>Type</th><th>Uploaded</th><th>Status</th><th>File</th><th>Actions</th></tr></thead>
        <tbody>${documents.map((d) => `
          <tr>
            <td><strong>${esc(d.document_id)}</strong></td>
            <td>${esc(d.applicant_name)}</td>
            <td>${esc(d.document_type)}</td>
            <td>${esc((d.created_at || "").slice(0, 10) || "—")}</td>
            <td><span class="badge badge-${badgeClass(d.status)}">${esc(d.status)}</span></td>
            <td>${d.file_name ? '<i class="fas fa-paperclip" title="' + esc(d.file_name) + '"></i> ' + esc(d.file_name) : "—"}</td>
            <td>
              <button class="btn btn-sm btn-outline" title="View" onclick="AdminApp.viewDoc(${d.id})"><i class="fas fa-eye"></i></button>
              ${can("documents.manage") ? `<button class="btn btn-sm btn-outline" title="Edit" onclick="AdminApp.editDoc(${d.id})"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-danger" title="Delete" onclick="AdminApp.deleteDoc(${d.id})"><i class="fas fa-trash"></i></button>` : ""}
            </td>
          </tr>
        `).join("")}</tbody>
      </table>`;
    } catch (e) {
      $("#docTable").innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  function badgeClass(status) {
    if (status === "active") return "active";
    if (status === "expired") return "expired";
    if (status === "pending") return "pending";
    return "revoked";
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
                <option value="pending" ${doc?.status === "pending" ? "selected" : ""}>Pending Review</option>
                <option value="active" ${doc?.status === "active" ? "selected" : ""}>Active (public verification)</option>
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
          <div class="form-group"><label>Attach File (PDF, JPG, JPEG, PNG, DOC, DOCX)</label><input class="form-control" type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            ${doc?.file_name ? `<div class="file-info-box"><strong>Current file:</strong> ${esc(doc.file_name)}<div class="file-actions"><button type="button" class="btn btn-sm btn-outline" id="previewFileBtn"><i class="fas fa-eye"></i> Preview</button><button type="button" class="btn btn-sm btn-navy" id="downloadFileBtn"><i class="fas fa-download"></i> Download</button></div></div>` : "<small class=\"text-muted\">Upload a scanned copy for your records. Files are not publicly downloadable.</small>"}
          </div>
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

    if (doc?.file_name && editingDocId) {
      $("#previewFileBtn", modal)?.addEventListener("click", () => openFilePreview(editingDocId, doc.file_name));
      $("#downloadFileBtn", modal)?.addEventListener("click", () => downloadDocFile(editingDocId, doc.file_name));
    }

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

  async function viewDoc(id) {
    const { document: doc } = await api("/documents/" + id);
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-box" style="max-width:720px">
        <h3>Document Review — ${esc(doc.document_id)}</h3>
        <div class="detail-grid">
          <div class="detail-item"><label>Applicant</label><span>${esc(doc.applicant_name)}</span></div>
          <div class="detail-item"><label>Document Type</label><span>${esc(doc.document_type)}</span></div>
          <div class="detail-item"><label>Issue Date</label><span>${esc(doc.issue_date || "—")}</span></div>
          <div class="detail-item"><label>Expiry Date</label><span>${esc(doc.expiry_date || "—")}</span></div>
          <div class="detail-item"><label>Status</label><span class="badge badge-${badgeClass(doc.status)}">${esc(doc.status)}</span></div>
          <div class="detail-item"><label>Uploaded</label><span>${esc((doc.created_at || "").slice(0, 16) || "—")}</span></div>
          <div class="detail-item"><label>Last Updated</label><span>${esc((doc.updated_at || "").slice(0, 16) || "—")}</span></div>
          <div class="detail-item"><label>Attached File</label><span>${esc(doc.file_name || "None")}</span></div>
        </div>
        ${doc.notes ? `<div class="verify-notice"><strong>Internal notes:</strong> ${esc(doc.notes)}</div>` : ""}
        <div id="docPreviewArea"></div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:20px">
          ${doc.file_name ? `<button type="button" class="btn btn-outline" id="viewPreviewBtn"><i class="fas fa-eye"></i> Preview File</button><button type="button" class="btn btn-navy" id="viewDownloadBtn"><i class="fas fa-download"></i> Download</button>` : ""}
           ${doc.status === "pending" && can("documents.manage") ? `<button type="button" class="btn btn-primary" id="approveDocBtn"><i class="fas fa-check"></i> Approve &amp; Activate</button>` : ""}
           ${can("documents.manage") ? '<button type="button" class="btn btn-outline" id="editFromView"><i class="fas fa-edit"></i> Edit</button>' : ""}
          <button type="button" class="btn btn-outline" id="closeViewModal">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    $("#closeViewModal", modal).addEventListener("click", () => modal.remove());
    $("#editFromView", modal)?.addEventListener("click", () => { modal.remove(); openDocModal(doc); });
    if (doc.file_name) {
      $("#viewPreviewBtn", modal).addEventListener("click", () => openFilePreview(id, doc.file_name, $("#docPreviewArea", modal)));
      $("#viewDownloadBtn", modal).addEventListener("click", () => downloadDocFile(id, doc.file_name));
    }
    if (doc.status === "pending") {
      $("#approveDocBtn", modal).addEventListener("click", async () => {
        const fd = new FormData();
        fd.append("status", "active");
        fd.append("applicant_name", doc.applicant_name);
        fd.append("document_type", doc.document_type);
        fd.append("document_id", doc.document_id);
        await fetch(API + "/documents/" + id, { method: "PUT", headers: { Authorization: "Bearer " + token }, body: fd, credentials: "include" });
        modal.remove();
        await loadDocuments();
      });
    }
  }

  async function fetchDocumentFile(id, download) {
    const res = await fetch(API + "/documents/" + encodeURIComponent(id) + "/file" + (download ? "?download=1" : ""), {
      headers: token ? { Authorization: "Bearer " + token } : {},
      credentials: "include",
      cache: "no-store"
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Could not load file. Please try again.");
    }
    return res.blob();
  }

  async function openFilePreview(id, fileName, container) {
    // Create the preview synchronously so popup blockers cannot discard it.
    const panel = document.createElement("div");
    panel.className = "modal-overlay";
    panel.innerHTML = `<div class="modal-box"><div class="modal-header"><h3>File preview</h3><button type="button" class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><div class="preview-content">Loading file…</div><button type="button" class="btn btn-navy">Download original</button></div></div>`;
    document.body.appendChild(panel);
    let url;
    let closed = false;
    panel.querySelector(".modal-close").onclick = () => {
      closed = true;
      if (url) URL.revokeObjectURL(url);
      panel.remove();
    };
    panel.querySelector(".btn").onclick = () => downloadDocFile(id, fileName);
    const target = panel.querySelector(".preview-content");
    try {
      const blob = await fetchDocumentFile(id, false);
      if (closed) return;
      const ext = (fileName || "").split(".").pop().toLowerCase();
      url = URL.createObjectURL(blob);
      if (ext === "pdf") {
        target.innerHTML = `<iframe class="file-preview-frame" src="${url}" title="Document preview"></iframe>`;
      } else if (["jpg", "jpeg", "png"].includes(ext)) {
        target.innerHTML = `<img src="${url}" alt="Document preview" style="max-width:100%;border-radius:8px" />`;
      } else {
        target.textContent = "Download this Word document to view or edit it in Microsoft Word or another compatible application. To save changes in the system, upload the edited file using Edit document.";
      }
    } catch (err) {
      target.textContent = err.message;
    }
  }

  async function downloadDocFile(id, fileName) {
    try {
      const blob = await fetchDocumentFile(id, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      alert(err.message);
    }
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
          ${can("cms.manage") ? '<button class="btn btn-primary" id="saveCmsMeta"><i class="fas fa-save"></i> Save Page Meta</button>' : ""}
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
    $("#saveCmsMeta")?.addEventListener("click", saveCmsMeta);
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
         ${can("cms.manage") ? '<button class="btn btn-sm btn-primary save-block-btn" style="margin-top:8px"><i class="fas fa-save"></i> Save Block</button>' : ""}
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
              ${can("contacts.manage") ? `<button class="btn btn-sm btn-danger" onclick="AdminApp.deleteContact(${s.id})"><i class="fas fa-trash"></i></button>` : ""}
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
          <div class="form-group"><label>Current Password</label><div class="password-input"><input class="form-control" id="currentPassword" type="password" name="currentPassword" required /><button class="password-toggle" type="button" data-password-toggle="currentPassword" aria-label="Show password"><i class="fas fa-eye"></i></button></div></div>
          <div class="form-group"><label>New Password (8+ characters)</label><div class="password-input"><input class="form-control" id="newPassword" type="password" name="newPassword" required minlength="8" maxlength="128" autocomplete="new-password" /><button class="password-toggle" type="button" data-password-toggle="newPassword" aria-label="Show password"><i class="fas fa-eye"></i></button></div></div>
          <div class="form-group"><label>Confirm New Password</label><div class="password-input"><input class="form-control" id="confirmPassword" type="password" name="confirmPassword" required minlength="8" maxlength="128" autocomplete="new-password" /><button class="password-toggle" type="button" data-password-toggle="confirmPassword" aria-label="Show password"><i class="fas fa-eye"></i></button></div></div>
          <button type="submit" class="btn btn-primary">Update Password</button>
        </form>
      </div>
      ${currentUser.role !== "administrator" ? '<div class="card"><h3>Request Password Change</h3><p>Send a request to an administrator. They will set a new password for your account.</p><button type="button" class="btn btn-outline" id="requestPasswordChange">Request Password Change</button></div>' : ""}
      <div class="card">
        <h3>Website Info</h3>
        <p><strong>Public URL:</strong> <a href="https://www.jeffersonteahnotarypublic.com" target="_blank">www.jeffersonteahnotarypublic.com</a></p>
        <p><strong>Admin URL:</strong> <a href="/admin">/admin</a></p>
        <p><strong>Verify URL:</strong> <a href="/verify">/verify</a></p>
      </div>
      <div class="card">
        <h3>Email Notifications</h3>
        <p>Form submissions are saved in <strong>Submissions</strong> and emailed to <code>CONTACT_NOTIFY_EMAIL</code> when SMTP is configured in Vercel environment variables.</p>
        <p class="text-muted" style="font-size:.88rem;margin:0">Set <code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>, and optionally <code>SMTP_FROM</code>.</p>
      </div>
    `;
    bindPasswordToggles($("#contentArea"));
    $("#pwForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        if (fd.get("newPassword") !== fd.get("confirmPassword")) throw new Error("New passwords do not match");
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
    $("#requestPasswordChange")?.addEventListener("click", async (e) => {
      e.currentTarget.disabled = true;
      try { const result = await api("/auth/password-request", { method: "POST" }); alert(result.message); }
      catch (err) { alert(err.message); e.currentTarget.disabled = false; }
    });
  }

  // ---- Staff and access ----
  async function renderStaff() {
    const el = $("#contentArea");
    if (!can("staff.manage")) { el.innerHTML = '<div class="alert alert-danger">You do not have permission to manage staff users.</div>'; return; }
    el.innerHTML = '<div class="section-toolbar"><p>Create staff accounts, assign a role, and tailor their access.</p><button class="btn btn-primary" id="addStaffBtn"><i class="fas fa-user-plus"></i> Add Staff User</button></div><div class="card"><div class="table-wrap" id="staffTable">Loading staff users…</div></div>';
    $("#addStaffBtn").addEventListener("click", () => openStaffModal());
    await loadStaff();
  }

  async function loadStaff() {
    try {
      const { users } = await api("/users"); window._staffUsers = users;
      $("#staffTable").innerHTML = users.length ? `<table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Access</th><th>Status</th><th>Actions</th></tr></thead><tbody>${users.map((u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.role)}</td><td>${esc((u.permissions || []).join(", ") || "None")}</td><td><span class="badge badge-${u.active ? "active" : "expired"}">${u.active ? "Active" : "Disabled"}</span>${u.password_reset_requested_at ? '<br><small class="text-muted">Password request pending</small>' : ""}</td><td>${u.role === "administrator" ? "Protected" : `<button class="btn btn-sm btn-outline" onclick="AdminApp.editStaff(${u.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-navy" onclick="AdminApp.resetStaffPassword(${u.id})"><i class="fas fa-key"></i></button> <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteStaff(${u.id})"><i class="fas fa-trash"></i></button>`}</td></tr>`).join("")}</tbody></table>` : '<div class="empty-state"><p>No staff users yet.</p></div>';
    } catch (err) { $("#staffTable").innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`; }
  }

  async function openStaffModal(user) {
    const modal = document.createElement("div"); modal.className = "modal-overlay";
    let config;
    try { config = await api("/users/permissions"); } catch (err) { alert(err.message); return; }
    const roles = Object.keys(config.roles).filter((r) => r !== "administrator");
    const selected = new Set(user?.permissions || config.roles[user?.role || "clerk"] || []);
    modal.innerHTML = `<div class="modal-box"><h3>${user ? "Edit Staff User" : "Add Staff User"}</h3><form id="staffForm">
      <div class="form-row"><div class="form-group"><label>Full Name *</label><input class="form-control" name="name" required maxlength="255" value="${esc(user?.name || "")}" /></div><div class="form-group"><label>Email / Sign-in Username *</label><input class="form-control" name="email" type="email" required value="${esc(user?.email || "")}" /><small class="text-muted">Changing this changes the email used for the user’s next sign-in.</small></div></div>
      ${user ? "" : '<div class="form-group"><label>Temporary Password *</label><div class="password-input"><input class="form-control" id="staffPassword" name="password" type="password" required minlength="8" maxlength="128" autocomplete="new-password" /><button class="password-toggle" type="button" data-password-toggle="staffPassword" aria-label="Show password"><i class="fas fa-eye"></i></button></div></div>'}
      <div class="form-group"><label>Role</label><select class="form-control" name="role">${roles.map((r) => `<option value="${r}" ${user?.role === r ? "selected" : ""}>${r[0].toUpperCase() + r.slice(1)}</option>`).join("")}</select></div>
      <div class="form-group"><label>Permissions</label><div class="permission-list">${config.permissions.filter((p) => p !== "staff.manage").map((p) => `<label><input type="checkbox" name="permissions" value="${p}" ${selected.has(p) ? "checked" : ""} /> ${esc(p)}</label>`).join("")}</div></div>
      <div class="form-group"><label><input type="checkbox" name="active" ${user?.active === false ? "" : "checked"} /> Account is active</label></div>
      <div style="display:flex;gap:12px"><button class="btn btn-primary" type="submit">${user ? "Save Changes" : "Create Staff User"}</button><button class="btn btn-outline" type="button" id="closeStaffModal">Cancel</button></div></form></div>`;
    document.body.appendChild(modal); bindPasswordToggles(modal); $("#closeStaffModal", modal).onclick = () => modal.remove();
    $("#staffForm", modal).addEventListener("submit", async (e) => { e.preventDefault(); const fd = new FormData(e.target); const body = { name: fd.get("name"), email: fd.get("email"), role: fd.get("role"), active: fd.get("active") === "on", permissions: fd.getAll("permissions") }; if (!user) body.password = fd.get("password"); try { await api(user ? `/users/${user.id}` : "/users", { method: user ? "PUT" : "POST", body }); modal.remove(); loadStaff(); } catch (err) { showAlert($(".modal-box", modal), err.message, "danger"); } });
  }

  function editStaff(id) { const user = (window._staffUsers || []).find((u) => u.id === id); if (user) openStaffModal(user); }
  async function deleteStaff(id) { if (!confirm("Delete this staff user? They will no longer be able to sign in.")) return; try { await api(`/users/${id}`, { method: "DELETE" }); loadStaff(); } catch (err) { alert(err.message); } }
  async function resetStaffPassword(id) { const password = prompt("Enter a new temporary password (8–128 characters):"); if (password === null) return; if (password.length < 8 || password.length > 128) return alert("Password must be between 8 and 128 characters."); try { await api(`/users/${id}/password`, { method: "PUT", body: { password } }); alert("Staff password updated. Share it securely with the user."); loadStaff(); } catch (err) { alert(err.message); } }

  function esc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---- Init ----
  window.AdminApp = { navigate, editDoc, deleteDoc, viewDoc, viewContact, deleteContact, editStaff, deleteStaff, resetStaffPassword };

  document.addEventListener("DOMContentLoaded", async () => {
    bindPasswordToggles();
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
