"use strict";

let transporter = null;

function getTransporter() {
  if (transporter !== null) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    transporter = false;
    return transporter;
  }

  const nodemailer = require("nodemailer");
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass }
  });
  return transporter;
}

function formatSubmissionEmail(submission) {
  const lines = [
    "New form submission — Hon. Jefferson Teah Notary Public Office",
    "",
    `Type: ${submission.form_type || "contact"}`,
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone || "—"}`,
    `Subject: ${submission.subject || "—"}`,
    "",
    "Message:",
    submission.message || "(no message)",
    ""
  ];

  if (submission.extra_data) {
    try {
      const extra = typeof submission.extra_data === "string"
        ? JSON.parse(submission.extra_data)
        : submission.extra_data;
      const keys = Object.keys(extra || {});
      if (keys.length) {
        lines.push("Additional fields:");
        for (const key of keys) {
          lines.push(`  ${key}: ${extra[key]}`);
        }
        lines.push("");
      }
    } catch {
      /* ignore parse errors */
    }
  }

  lines.push(`Submitted at: ${submission.created_at || new Date().toISOString()}`);
  lines.push("", "View all submissions in the admin dashboard: /admin");
  return lines.join("\n");
}

async function sendContactNotification(submission) {
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!to) {
    console.warn("CONTACT_NOTIFY_EMAIL not set — skipping email notification");
    return { sent: false, reason: "no-recipient" };
  }

  const transport = getTransporter();
  if (!transport) {
    console.warn("SMTP not configured — form saved to dashboard only. Set SMTP_HOST, SMTP_USER, SMTP_PASS.");
    return { sent: false, reason: "no-smtp" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `[Notary Office] ${submission.form_type === "request" ? "Service Request" : "Contact"}: ${submission.subject || submission.name}`;

  await transport.sendMail({
    from,
    to,
    replyTo: submission.email || undefined,
    subject,
    text: formatSubmissionEmail(submission)
  });

  return { sent: true };
}

module.exports = { sendContactNotification, formatSubmissionEmail };
