import { authUser } from "./auth";
import { isSupabaseMode, supabase } from "./supabase";
import { state as demoState, type Kind, type Status } from "./store";
import { compressEvidence } from "./evidence";

export type CaseRecord = {
  id: string;
  reference_code: string;
  kind: Kind;
  status: Status;
  title: string;
  location: string | null;
  details: Record<string, unknown>;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  messages?: Array<{
    id: string;
    from: string;
    body: string;
    created_at: string;
  }>;
};

export type NoticeRecord = {
  id: string;
  reference_code: string | null;
  event_type: string;
  summary: string;
  read_at: string | null;
  created_at: string;
};

export type TeamRecord = {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  active: boolean;
};

export type LogRecord = {
  id: number;
  action: string;
  reference_code: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function demoCases(): CaseRecord[] {
  const user = authUser.value;
  if (!user) return [];

  const raw = localStorage.getItem("aust-helpdesk-v1");
  const stored = raw
    ? (JSON.parse(raw) as { submissions?: Array<Record<string, unknown>> })
    : (demoState as unknown as {
        submissions?: Array<Record<string, unknown>>;
      });

  if (user.role) {
    return (stored.submissions ?? []).map((x) => ({
      id: String(x.id),
      reference_code: String(x.id),
      kind: x.kind as Kind,
      status: x.status as Status,
      title: String(x.title),
      location: (x.location as string) ?? null,
      details: (x.fields as Record<string, unknown>) ?? {},
      admin_response: (x.adminResponse as string) ?? null,
      created_at: String(x.createdAt),
      updated_at: String(x.createdAt),
    }));
  }

  return (stored.submissions ?? [])
    .filter((x) => {
      const applicant = x.applicant as { email?: string } | undefined;
      return applicant?.email === user.email;
    })
    .map((x) => ({
      id: String(x.id),
      reference_code: String(x.id),
      kind: x.kind as Kind,
      status: x.status as Status,
      title: String(x.title),
      location: (x.location as string) ?? null,
      details: (x.fields as Record<string, unknown>) ?? {},
      admin_response: (x.adminResponse as string) ?? null,
      created_at: String(x.createdAt),
      updated_at: String(x.createdAt),
    }));
}

async function rpc<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);

  return data as T;
}

export const backend = {
  async registerSubmission(input: {
    kind: Kind;
    title: string;
    location: string;
    details: Record<string, unknown>;
  }) {
    if (!isSupabaseMode) {
      const { submit } = await import("./store");
      const user = authUser.value;

      if (!user) {
        throw new Error("Sign in first to submit in demo mode.");
      }

      const id = submit({
        kind: input.kind,
        title: input.title,
        location: input.location,
        fields: Object.fromEntries(
          Object.entries(input.details).map(([k, v]) => [k, String(v ?? "")]),
        ),
        applicant: {
          fullName: user.name,
          email: user.email,
          idNumber: "",
          phone: "",
        },
      });

      return {
        id,
        reference_code: id,
        status: "pending" as const,
      };
    }

    const created = await rpc<{
      id: string;
      reference_code: string;
      status: "pending";
    }>("student_create_submission", {
      p_kind: input.kind,
      p_title: input.title,
      p_location: input.location || null,
      p_details: input.details,
    });

    // 1. Send the existing student submission receipt.
    let email: "sent" | "failed" | "not_configured" = "failed";

    try {
      if (!supabase) {
        throw new Error("Supabase client is not configured.");
      }

      const { data, error } = await supabase.functions.invoke(
        "decision-email",
        {
          body: {
            action: "submission_receipt",
            reference_code: created.reference_code,
          },
        },
      );

      if (error) throw error;

      email =
        data?.email === "sent" || data?.email === "already_sent"
          ? "sent"
          : data?.email === "not_configured"
            ? "not_configured"
            : "failed";

      if (data?.error) {
        console.error("Student receipt email error:", data.error);
      }
    } catch (error) {
      console.error(
        "Request saved, but receipt email could not be confirmed:",
        error,
      );
    }

    // 2. Send alerts to admins eligible for this submission type.
    try {
      if (!supabase) {
        throw new Error("Supabase client is not configured.");
      }

      const { data, error } = await supabase.functions.invoke(
        "decision-email",
        {
          body: {
            action: "admin_submission_alert",
            reference_code: created.reference_code,
          },
        },
      );

      if (error) {
        const context = (error as any).context;

        let details = "No error details returned";

        if (context instanceof Response) {
          details = await context.clone().text();
        }

        console.error("Admin alert invocation failed:", {
          message: error.message,
          details,
        });

        throw error;
      }

      if (data?.error) {
        console.error("Admin alert returned an error:", data.error);
      } else {
        console.info("Admin alert response:", data);

        if (data?.admin_alerts_sent === 0 && data?.admin_alerts_failed === 0) {
          console.warn(
            "No admin alert emails were sent. Check admin eligibility and queued notifications.",
          );
        }

        if (data?.admin_alerts_failed > 0) {
          console.warn(
            `${data.admin_alerts_failed} admin alert email(s) failed.`,
          );
        }
      }
    } catch (error) {
      console.error(
        "Submission saved, but admin alert emails could not be confirmed:",
        error,
      );
    }

    return { ...created, email };
  },

  async uploadEvidence(
    submissionId: string,
    referenceCode: string,
    files: FileList | File[],
  ) {
    if (!isSupabaseMode || !supabase) {
      throw new Error(
        "Private evidence upload needs Supabase. It is not available in demo mode.",
      );
    }

    const images = await compressEvidence(files);
    const paths: string[] = [];

    for (const image of images) {
      const path = `${submissionId}/${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("helpdesk-evidence")
        .upload(path, image, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { error: attachError } = await supabase.rpc(
        "student_attach_evidence",
        {
          p_reference_code: referenceCode,
          p_object_path: path,
        },
      );

      if (attachError) throw new Error(attachError.message);

      paths.push(path);
    }

    return paths;
  },

  async evidenceUrl(path: string) {
    if (!supabase) return null;

    const { data, error } = await supabase.storage
      .from("helpdesk-evidence")
      .createSignedUrl(path, 120);

    if (error) throw new Error(error.message);

    return data.signedUrl;
  },

  async studentSubmissions() {
    if (!isSupabaseMode) return demoCases();

    return rpc<CaseRecord[]>("student_list_submissions");
  },

  async studentSubmission(referenceCode: string) {
    if (!isSupabaseMode) {
      return (
        demoCases().find((x) => x.reference_code === referenceCode) ?? null
      );
    }

    return rpc<CaseRecord>("student_get_submission", {
      p_reference_code: referenceCode,
    });
  },

  async adminSubmissions(kind?: Kind, status?: Status) {
    if (!isSupabaseMode) {
      return demoCases().filter(
        (x) => (!kind || x.kind === kind) && (!status || x.status === status),
      );
    }

    return rpc<CaseRecord[]>("admin_list_submissions", {
      p_kind: kind ?? null,
      p_status: status ?? null,
    });
  },

  async adminSubmission(referenceCode: string) {
    if (!isSupabaseMode) {
      return (
        demoCases().find((x) => x.reference_code === referenceCode) ?? null
      );
    }

    return rpc<CaseRecord>("admin_get_submission", {
      p_reference_code: referenceCode,
    });
  },

  async decide(
    referenceCode: string,
    status: Exclude<Status, "pending">,
    response: string,
  ) {
    if (!isSupabaseMode) {
      const { decide: demoDecide } = await import("./store");
      const target = demoCases().find(
        (x) => x.reference_code === referenceCode,
      );

      if (!target) throw new Error("Submission not found.");

      demoDecide(target.id, status, response, {
        to: "",
        subject: "Demo decision",
        body: response,
      });

      return { reference_code: referenceCode, status };
    }

    if (!supabase) {
      throw new Error("Supabase client is not configured.");
    }

    const { data, error } = await supabase.functions.invoke("decision-email", {
      body: { reference_code: referenceCode, status, response },
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(String(data.error));

    return data;
  },

  async sendMessage(referenceCode: string, body: string) {
    if (!isSupabaseMode) {
      throw new Error("Messages are available after Supabase is connected.");
    }

    if (authUser.value?.role) {
      if (!supabase) {
        throw new Error("Supabase client is not configured.");
      }

      const { data, error } = await supabase.functions.invoke(
        "decision-email",
        {
          body: {
            action: "message",
            reference_code: referenceCode,
            message: body,
          },
        },
      );

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(String(data.error));

      return data;
    }

    return rpc("send_submission_message", {
      p_reference_code: referenceCode,
      p_body: body,
    });
  },

  async notifications() {
    if (!isSupabaseMode) return [] as NoticeRecord[];

    return rpc<NoticeRecord[]>("student_list_notifications");
  },

  async profile() {
    if (!isSupabaseMode) {
      return {
        display_name: authUser.value?.name ?? "",
        phone: "",
      };
    }

    if (!supabase) {
      throw new Error("Supabase client is not configured.");
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name,phone")
      .single();

    if (error) throw new Error(error.message);

    return data as {
      display_name: string;
      phone: string | null;
    };
  },

  async updateProfile(displayName: string, phone: string) {
    if (!isSupabaseMode) {
      throw new Error(
        "Profile editing is available after Supabase is connected.",
      );
    }

    if (!supabase) {
      throw new Error("Supabase client is not configured.");
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        phone: phone.trim() || null,
      })
      .eq("user_id", authUser.value?.id);

    if (error) throw new Error(error.message);
  },

  async adminNotifications() {
    if (!isSupabaseMode) return [] as NoticeRecord[];

    return rpc<NoticeRecord[]>("admin_list_notifications", {
      p_limit: 100,
    });
  },

  async markNotificationsRead() {
    if (!isSupabaseMode) return;

    await rpc("student_mark_notifications_read");
  },

  async team() {
    if (!isSupabaseMode) return [] as TeamRecord[];

    return rpc<TeamRecord[]>("admin_list_team");
  },

  async setAdmin(
    userId: string,
    role: string,
    active: boolean,
    displayName: string,
  ) {
    if (!isSupabaseMode) {
      throw new Error("Admin provisioning is disabled in demo mode.");
    }

    return rpc("super_admin_set_admin", {
      p_user_id: userId,
      p_role: role,
      p_active: active,
      p_display_name: displayName,
    });
  },

  async setAdminByEmail(
    email: string,
    role: string,
    active: boolean,
    displayName: string,
  ) {
    if (!isSupabaseMode) {
      throw new Error("Admin provisioning is disabled in demo mode.");
    }

    return rpc("super_admin_set_admin_by_email", {
      p_email: email,
      p_role: role,
      p_active: active,
      p_display_name: displayName,
    });
  },

  async logs(limit = 100) {
    if (!isSupabaseMode) return [] as LogRecord[];

    return rpc("admin_list_logs", { p_limit: limit });
  },
};
