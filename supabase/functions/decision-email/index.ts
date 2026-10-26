import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

function json(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

const text = (v: unknown, max = 5000) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const prettyKind = (value: unknown) => {
  const kind = text(value, 80).replace(/[_-]+/g, " ");
  return kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : "Request";
};

const prettyStatus = (value: unknown) => {
  const status = text(value, 80).replace(/[_-]+/g, " ");
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Updated";
};

const emailShell = (options: {
  eyebrow: string;
  headline: string;
  intro: string;
  content: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) => {
  const cta =
    options.ctaLabel && options.ctaUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px"><tr><td bgcolor="#F07824" style="border-radius:8px;box-shadow:0 3px 0 #B84A00"><a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;padding:13px 22px;color:#111111;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;letter-spacing:.15px">${escapeHtml(options.ctaLabel)}</a></td></tr></table>`
      : "";
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(options.headline)}</title></head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:Arial,Helvetica,sans-serif;color:#171717;-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F4F5"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #E5E5E5;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.06)">
<tr><td style="background:#111111;padding:27px 30px;border-top:4px solid #F07824;border-bottom:1px solid #292929">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="color:#ffffff;font-size:20px;line-height:27px;font-weight:700;letter-spacing:-.35px">AUST <span style="font-weight:400;color:#F07824">Student Helpdesk</span></td></tr><tr><td style="padding-top:5px;color:#F07824;font-size:12px;letter-spacing:1.2px;text-transform:uppercase">African University of Science and Technology</td></tr></table>
</td></tr>
<tr><td style="padding:36px 30px 32px">
<div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#C6530B">${escapeHtml(options.eyebrow)}</div>
<h1 style="margin:10px 0 14px;color:#171717;font-size:29px;line-height:36px;font-weight:750;letter-spacing:-.7px">${escapeHtml(options.headline)}</h1>
<p style="margin:0 0 22px;color:#525252;font-size:15px;line-height:26px">${options.intro}</p>
${options.content}
${cta}
<p style="margin:26px 0 0;color:#555555;font-size:14px;line-height:23px">Kind regards,<br><strong style="color:#171717">AUST Student Helpdesk Team</strong></p>
</td></tr>
<tr><td style="padding:20px 30px;background:#F4F4F5;border-top:1px solid #EEEEEE">
<p style="margin:0;color:#525252;font-size:12px;line-height:20px">You’re receiving this email because an action was taken through the AUST Student Helpdesk.</p>
<p style="margin:8px 0 0;color:#737373;font-size:11px;line-height:18px">African University of Science and Technology (AUST)</p>
</td></tr></table>
</td></tr></table></body></html>`;
};

const statusColors = (value: unknown) => {
  const status = text(value, 80).toLowerCase().replace(/[_-]+/g, " ").trim();
  if (/\b(declined|rejected|denied)\b/.test(status)) {
    return {
      background: "#FEF2F2",
      border: "#FECACA",
      text: "#B91C1C",
      icon: "×",
    };
  }
  if (/\b(accepted|approved)\b/.test(status)) {
    return {
      background: "#ECFDF3",
      border: "#A6F4C5",
      text: "#15803D",
      icon: "✓",
    };
  }
  return {
    background: "#FFF4E8",
    border: "#FED7AA",
    text: "#9A3412",
    icon: "•",
  };
};

const detailsCard = (details: Array<[string, unknown]>) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0;border:1px solid #E5E5E5;border-radius:12px;border-collapse:separate;background:#FFFFFF"><tr><td style="padding:5px 18px">` +
  details
    .map(([label, value], index) => {
      const isStatus = label.toLowerCase() === "current status";
      const status = statusColors(value);
      const renderedValue = isStatus
        ? `<span style="display:inline-block;padding:7px 11px;border:1px solid ${status.border};border-radius:999px;background:${status.background};color:${status.text};font-size:13px;line-height:18px;font-weight:700"><span style="font-weight:800">${status.icon}</span> &nbsp;${escapeHtml(prettyStatus(value))}</span>`
        : escapeHtml(value || "Not specified");
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"${index ? ' style="border-top:1px solid #EEEEEE"' : ""}><tr><td style="padding:13px 0 4px;color:#777777;font-size:10px;line-height:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase">${escapeHtml(label)}</td></tr><tr><td style="padding:0 0 13px;color:#171717;font-size:14px;line-height:22px;font-weight:700;overflow-wrap:anywhere">${renderedValue}</td></tr></table>`;
    })
    .join("") +
  `</td></tr></table>`;

const messageCard = (label: string, value: unknown) =>
  `<div style="margin:22px 0;padding:18px 20px;background:#F7F7F7;border-left:4px solid #F07824;border-radius:8px"><div style="margin-bottom:9px;color:#777777;font-size:10px;line-height:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase">${escapeHtml(label)}</div><div style="color:#262626;font-size:14px;line-height:25px;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(value || "No additional message provided.")}</div></div>`;

const portalUrl = (Deno.env.get("PORTAL_URL") ?? "").trim();

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  // Keep production origins in the ALLOWED_ORIGINS secret (comma-separated).
  // These localhost origins support Vite development only.
  const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const developmentOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ];

  const allowed = [...new Set([...configuredOrigins, ...developmentOrigins])];

  if (req.method === "OPTIONS") {
    if (!allowed.includes(origin)) {
      return new Response("Origin not allowed", { status: 403 });
    }

    return new Response("ok", {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (!allowed.includes(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, origin);
  }

  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");

  if (!token) return json({ error: "Sign in first" }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const from = Deno.env.get("EMAIL_FROM") ?? "";

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("Missing Supabase Edge Function configuration");
    return json({ error: "Server is not configured" }, 500, origin);
  }

  const emailConfigured = Boolean(resendKey && from);

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userError } =
      await userClient.auth.getUser(token);

    if (userError || !userData.user || !userData.user.email_confirmed_at) {
      return json({ error: "A verified sign-in is required" }, 401, origin);
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body" }, 400, origin);
    }

    const service = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const action = text(body.action || "decision", 30);
    let notificationId = text(body.notification_id, 80);
    let savedDecision: {
      reference_code?: string;
      status?: string;
      notification_id?: string;
    } | null = null;
    let messageSaved = false;

    // STUDENT SUBMISSION RECEIPT
    if (action === "submission_receipt") {
      const referenceCode = text(body.reference_code, 40);

      if (!/^AUST-[0-9A-F]{32}$/.test(referenceCode)) {
        return json({ error: "Invalid reference number" }, 400, origin);
      }

      const { data, error } = await service.rpc(
        "student_receipt_email_payload",
        {
          p_reference_code: referenceCode,
          p_student_id: userData.user.id,
        },
      );

      if (error || !data) {
        console.error("Could not prepare receipt email", error?.message);
        return json(
          { error: "Could not prepare the receipt email" },
          403,
          origin,
        );
      }

      const item = data as {
        recipient_email: string;
        reference_code: string;
        title: string;
        kind: string;
        delivery_id: string;
        delivery_status: string;
      };

      if (item.delivery_status === "sent") {
        return json({ ok: true, email: "already_sent" }, 200, origin);
      }

      if (!emailConfigured) {
        await service.rpc("admin_email_delivery_result", {
          p_delivery_id: item.delivery_id,
          p_status: "failed",
          p_provider_id: "",
          p_error: "Email provider is not configured",
        });

        return json({ ok: true, email: "not_configured" }, 200, origin);
      }

      const mailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [item.recipient_email],
          subject: `AUST Student Helpdesk — Submission Received [${item.reference_code}]`,
          text: [
            "Dear Student,",
            "",
            "This is to confirm that your request has been successfully received by the AUST Student Helpdesk.",
            "",
            "SUBMISSION DETAILS",
            "------------------",
            `Request Type: ${item.kind}`,
            `Subject: ${item.title}`,
            `Reference Number: ${item.reference_code}`,
            "",
            "Please retain your reference number for future correspondence.",
            "",
            "You can sign in to the AUST Student Helpdesk portal to track the status of your submission and view responses from the appropriate team.",
            "",
            "Your submission will be reviewed by the relevant team. Updates will be communicated through the portal and, where applicable, by email.",
            "",
            "Thank you for bringing this matter to our attention.",
            "",
            "Kind regards,",
            "AUST Student Helpdesk Team",
            "African University of Science and Technology (AUST)",
          ].join("\n"),
          html: emailShell({
            eyebrow: "Submission received",
            headline: "We’ve received your request",
            intro:
              "Dear Student,<br><br>This is to confirm that your request has been successfully received by the AUST Student Helpdesk. Please keep the reference number below for future correspondence.",
            content: `<div style="margin:18px 0;padding:12px 15px;border-radius:8px;background:#FFF0E5;color:#9A3D00;font-size:13px;font-weight:700">✓ &nbsp; Submission received successfully</div>${detailsCard(
              [
                ["Request type", prettyKind(item.kind)],
                ["Subject", item.title],
                ["Reference number", item.reference_code],
              ],
            )}<p style="margin:0;color:#555555;font-size:14px;line-height:24px">Your request will be reviewed by the relevant team. You can sign in to the portal to track its status and view responses.</p>`,
            ctaLabel: "Track my request",
            ctaUrl: portalUrl || undefined,
          }),
        }),
      });

      const mailResult = (await mailResponse.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
      };

      if (!mailResponse.ok || !mailResult.id) {
        const safeError = text(
          mailResult.message ||
            `Email provider returned ${mailResponse.status}`,
          500,
        );

        await service.rpc("admin_email_delivery_result", {
          p_delivery_id: item.delivery_id,
          p_status: "failed",
          p_provider_id: "",
          p_error: safeError,
        });

        console.error("Receipt email failed", safeError);

        return json({ ok: true, email: "failed" }, 200, origin);
      }

      const { error: markError } = await service.rpc(
        "admin_email_delivery_result",
        {
          p_delivery_id: item.delivery_id,
          p_status: "sent",
          p_provider_id: mailResult.id,
          p_error: "",
        },
      );

      if (markError) {
        console.error(
          "Receipt sent but delivery record update failed",
          mailResult.id,
          markError.message,
        );

        return json({ ok: true, email: "sent_record_pending" }, 200, origin);
      }

      return json({ ok: true, email: "sent" }, 200, origin);
    }

    // ADMIN ALERT FOR A NEW STUDENT SUBMISSION
    else if (action === "admin_submission_alert") {
      const referenceCode = text(body.reference_code, 40);

      if (!/^AUST-[0-9A-F]{32}$/.test(referenceCode)) {
        return json({ error: "Invalid reference number" }, 400, origin);
      }

      // Verify that the signed-in student owns this submission.
      const { data: ownsSubmission, error: ownershipError } =
        await userClient.rpc("student_get_submission", {
          p_reference_code: referenceCode,
        });

      if (
        ownershipError ||
        !ownsSubmission ||
        typeof ownsSubmission !== "object" ||
        (ownsSubmission as Record<string, unknown>).reference_code !==
          referenceCode
      ) {
        return json({ error: "Submission not found" }, 403, origin);
      }

      // Find the admin alerts queued for this submission.
      const { data: alertIds, error: alertIdsError } = await service
        .from("notifications")
        .select("id")
        .eq("reference_code", referenceCode)
        .eq("event_type", "submission_created")
        .like("summary", "New % submission: %");

      if (alertIdsError) {
        console.error("Could not find admin alerts", alertIdsError.message);
        return json({ error: "Could not prepare admin alerts" }, 500, origin);
      }

      let sent = 0;
      let failed = 0;

      for (const alert of alertIds ?? []) {
        const { data: alertPayload, error: alertPayloadError } =
          await service.rpc("admin_submission_alert_payload", {
            p_notification_id: alert.id,
          });

        if (alertPayloadError || !alertPayload) {
          console.error(
            "Could not prepare admin alert",
            alertPayloadError?.message,
          );
          failed++;
          continue;
        }

        const item = alertPayload as {
          recipient_email: string;
          reference_code: string;
          title: string;
          kind: string;
          location: string | null;
          delivery_id: string;
          delivery_status: string;
        };

        // Do not send the same alert again if it was already delivered.
        if (item.delivery_status === "sent") {
          continue;
        }

        if (!emailConfigured) {
          await service.rpc("admin_email_delivery_result", {
            p_delivery_id: item.delivery_id,
            p_status: "failed",
            p_provider_id: "",
            p_error: "Email provider is not configured",
          });
          failed++;
          continue;
        }

        const mailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [item.recipient_email],
            subject: `[${item.reference_code}] New ${item.kind} submission`,
            text: [
              "A new submission has been received by the AUST Student Helpdesk.",
              "",
              `Request Type: ${item.kind}`,
              `Subject: ${item.title}`,
              `Reference Number: ${item.reference_code}`,
              `Location: ${item.location || "Not specified"}`,
              "",
              "Sign in to the AUST Student Helpdesk admin portal to review and handle this submission.",
              "",
              "AUST Student Helpdesk",
            ].join("\n"),
            html: emailShell({
              eyebrow: "New submission",
              headline: "A new request needs review",
              intro:
                "A student has submitted a request through the AUST Student Helpdesk. Sign in to the admin portal to review and handle it.",
              content: detailsCard([
                ["Request type", prettyKind(item.kind)],
                ["Subject", item.title],
                ["Reference number", item.reference_code],
                ["Location", item.location || "Not specified"],
              ]),
              ctaLabel: "Open admin portal",
              ctaUrl: portalUrl || undefined,
            }),
          }),
        });

        const mailResult = (await mailResponse.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
        };

        if (!mailResponse.ok || !mailResult.id) {
          await service.rpc("admin_email_delivery_result", {
            p_delivery_id: item.delivery_id,
            p_status: "failed",
            p_provider_id: "",
            p_error: text(
              mailResult.message ||
                `Email provider returned ${mailResponse.status}`,
              500,
            ),
          });

          failed++;
          continue;
        }

        const { error: markError } = await service.rpc(
          "admin_email_delivery_result",
          {
            p_delivery_id: item.delivery_id,
            p_status: "sent",
            p_provider_id: mailResult.id,
            p_error: "",
          },
        );

        if (markError) {
          console.error(
            "Could not record admin email delivery",
            markError.message,
          );
          failed++;
        } else {
          sent++;
        }
      }

      return json(
        {
          ok: true,
          admin_alerts_sent: sent,
          admin_alerts_failed: failed,
        },
        200,
        origin,
      );
    }
    // ADMIN MESSAGE TO STUDENT
    else if (action === "message") {
      const { data: role, error: roleError } =
        await userClient.rpc("current_admin_role");

      if (
        roleError ||
        !["Super Admin", "Complaint Admin", "Venue Admin"].includes(
          String(role),
        )
      ) {
        return json(
          { error: "This staff role cannot send messages" },
          403,
          origin,
        );
      }

      const referenceCode = text(body.reference_code, 40);
      const message = text(body.message, 5000);

      if (!/^AUST-[0-9A-F]{32}$/.test(referenceCode) || !message) {
        return json(
          { error: "A valid case reference and message are required" },
          400,
          origin,
        );
      }

      const { data, error } = await userClient.rpc("send_submission_message", {
        p_reference_code: referenceCode,
        p_body: message,
      });

      if (error) return json({ error: error.message }, 403, origin);

      const sent = data as { notification_id?: string | null };
      notificationId = text(sent?.notification_id, 80);
      messageSaved = true;

      if (!notificationId) {
        return json(
          { ok: true, message_saved: true, email: "not_sent" },
          200,
          origin,
        );
      }
    }

    // ADMIN DECISION / STATUS UPDATE
    else if (action === "decision") {
      if (notificationId) {
        return json(
          { error: "Do not supply a notification when making a new decision" },
          400,
          origin,
        );
      }

      const referenceCode = text(body.reference_code, 40);
      const status = text(body.status, 20);
      const response = text(body.response, 5000);

      if (!/^AUST-[0-9A-F]{32}$/.test(referenceCode)) {
        return json({ error: "Invalid reference number" }, 400, origin);
      }

      if (!["accepted", "declined", "meeting"].includes(status)) {
        return json({ error: "Choose an allowed decision" }, 400, origin);
      }

      const { data, error } = await userClient.rpc("admin_decide", {
        p_reference_code: referenceCode,
        p_status: status,
        p_response: response,
      });

      if (error) return json({ error: error.message }, 403, origin);

      savedDecision = data as {
        reference_code?: string;
        status?: string;
        notification_id?: string;
      };

      notificationId = text(savedDecision?.notification_id, 80);

      if (!notificationId) {
        return json(
          { ok: true, email: "not_sent", decision: savedDecision },
          200,
          origin,
        );
      }
    } else {
      return json({ error: "Choose a valid action" }, 400, origin);
    }

    // PREPARE THE STUDENT NOTIFICATION
    const { data: payload, error: payloadError } = await service.rpc(
      "admin_email_payload",
      {
        p_notification_id: notificationId,
        p_actor_id: userData.user.id,
      },
    );

    if (payloadError || !payload) {
      console.error(
        "Could not prepare authorized email payload",
        payloadError?.message,
      );

      return json(
        { error: "Not allowed to send this notification" },
        403,
        origin,
      );
    }

    const item = payload as {
      recipient_email: string;
      reference_code: string;
      title: string;
      kind: string;
      status: string;
      response: string;
      message_body: string;
      delivery_id: string;
      delivery_status: string;
    };

    if (item.delivery_status === "sent") {
      return json(
        {
          ok: true,
          email: "already_sent",
          decision: savedDecision,
          message_saved: messageSaved,
        },
        200,
        origin,
      );
    }

    if (!emailConfigured) {
      await service.rpc("admin_email_delivery_result", {
        p_delivery_id: item.delivery_id,
        p_status: "failed",
        p_provider_id: "",
        p_error: "Email provider is not configured",
      });

      return json(
        {
          ok: true,
          decision: savedDecision,
          message_saved: messageSaved,
          email: "not_configured",
        },
        200,
        origin,
      );
    }

    const subject =
      action === "message"
        ? `[${item.reference_code}] A message from AUST Helpdesk`
        : `[${item.reference_code}] Update on your AUST Helpdesk submission`;

    const content =
      action === "message"
        ? [
            "Dear Student,",
            "",
            "You have received a new message regarding your submission to the AUST Student Helpdesk.",
            "",
            "SUBMISSION DETAILS",
            "------------------",
            `Request Type: ${item.kind}`,
            `Subject: ${item.title}`,
            `Reference Number: ${item.reference_code}`,
            "",
            "MESSAGE FROM THE HELPDESK",
            "------------------------",
            item.message_body,
            "",
            "Please sign in to your AUST Student Helpdesk portal to review the message and respond if necessary.",
            "",
            "Kind regards,",
            "AUST Student Helpdesk Team",
            "African University of Science and Technology (AUST)",
          ].join("\n")
        : [
            "Dear Student,",
            "",
            "There has been an update to your submission with the AUST Student Helpdesk.",
            "",
            "SUBMISSION DETAILS",
            "------------------",
            `Request Type: ${item.kind}`,
            `Subject: ${item.title}`,
            `Reference Number: ${item.reference_code}`,
            `Current Status: ${item.status}`,
            "",
            item.response ? `Message from the Helpdesk:\n${item.response}` : "",
            "",
            "Please sign in to your AUST Student Helpdesk portal to view the latest information and any further instructions.",
            "",
            "Kind regards,",
            "AUST Student Helpdesk Team",
            "African University of Science and Technology (AUST)",
          ]
            .filter(Boolean)
            .join("\n");

    const mailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [item.recipient_email],
        subject,
        text: content,
        html: emailShell({
          eyebrow:
            action === "message" ? "New helpdesk message" : "Submission update",
          headline:
            action === "message"
              ? "You have a new message"
              : "There’s an update to your request",
          intro:
            action === "message"
              ? "Dear Student,<br><br>The AUST Student Helpdesk has sent you a message about your submission."
              : "Dear Student,<br><br>The status of your submission has been updated. Review the details below and follow any instructions from the helpdesk team.",
          content: `${detailsCard([["Request type", prettyKind(item.kind)], ["Subject", item.title], ["Reference number", item.reference_code], ...(action === "message" ? [] : [["Current status", prettyStatus(item.status)] as [string, unknown]])])}${messageCard(action === "message" ? "Message from the Helpdesk" : "Response from the Helpdesk", action === "message" ? item.message_body : item.response || "Please sign in to the portal to view the latest information.")}<p style="margin:0;color:#555555;font-size:14px;line-height:24px">Sign in to the AUST Student Helpdesk portal to view the latest information and any further instructions.</p>`,
          ctaLabel: "View my request",
          ctaUrl: portalUrl || undefined,
        }),
      }),
    });

    const mailResult = (await mailResponse.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!mailResponse.ok || !mailResult.id) {
      const safeError = text(
        mailResult.message || `Email provider returned ${mailResponse.status}`,
        500,
      );

      await service.rpc("admin_email_delivery_result", {
        p_delivery_id: item.delivery_id,
        p_status: "failed",
        p_provider_id: "",
        p_error: safeError,
      });

      console.error("Email delivery failed", safeError);

      if (messageSaved) {
        return json(
          { ok: true, message_saved: true, email: "failed" },
          200,
          origin,
        );
      }

      return json(
        {
          ok: false,
          decision: savedDecision,
          email: "failed",
          error:
            "Decision saved, but email could not be sent. Retry from the case.",
        },
        502,
        origin,
      );
    }

    const { error: markError } = await service.rpc(
      "admin_email_delivery_result",
      {
        p_delivery_id: item.delivery_id,
        p_status: "sent",
        p_provider_id: mailResult.id,
        p_error: "",
      },
    );

    if (markError) {
      console.error(
        "Email sent but delivery record update failed",
        mailResult.id,
        markError.message,
      );

      return json(
        {
          ok: true,
          decision: savedDecision,
          email: "sent_record_pending",
        },
        200,
        origin,
      );
    }

    return json(
      {
        ok: true,
        decision: savedDecision,
        message_saved: messageSaved,
        email: "sent",
      },
      200,
      origin,
    );
  } catch (error) {
    console.error(
      "Unexpected email function error",
      error instanceof Error ? error.message : "unknown",
    );

    return json({ error: "Request could not be completed" }, 500, origin);
  }
});
