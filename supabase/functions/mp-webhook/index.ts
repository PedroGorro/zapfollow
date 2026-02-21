// @ts-nocheck
/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2?dts";

/**
 * Webhook do Mercado Pago:
 * - GET ?token=...  -> health-check manual
 * - POST (MP)       -> atualiza subscriptions e profiles.plan
 *
 * Compatível com:
 * - MP_ACCESS_TOKEN ou MERCADOPAGO_ACCESS_TOKEN
 * - SUPABASE_URL ou SB_URL
 * - SUPABASE_SERVICE_ROLE_KEY ou SB_SERVICE_ROLE_KEY
 */

const DEBUG = (Deno.env.get("DEBUG") ?? "").toLowerCase() === "true";

function env(...names: string[]) {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v && v.trim()) return v.trim();
  }
  return "";
}

// ✅ Fallbacks importantes (pra não quebrar quando você alterna nomes de secret)
const MP_TOKEN = env("MP_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN");
const SB_URL = env("SUPABASE_URL", "SB_URL");
const SRV_KEY = env("SUPABASE_SERVICE_ROLE_KEY", "SB_SERVICE_ROLE_KEY");
const WEBHOOK_TOKEN = env("MP_WEBHOOK_TOKEN");

function log(...args: unknown[]) {
  if (DEBUG) console.log("[mp-webhook]", ...args);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Health-check manual (opcional)
  if (req.method === "GET") {
    if (url.searchParams.get("token") === WEBHOOK_TOKEN) {
      return json({
        ok: true,
        env: DEBUG
          ? {
              hasMPToken: !!MP_TOKEN,
              mpIsTest: MP_TOKEN.startsWith("TEST-"),
              hasSBUrl: !!SB_URL,
              hasSrvKey: !!SRV_KEY,
              hasWebhookToken: !!WEBHOOK_TOKEN,
            }
          : undefined,
      });
    }
    return json({ error: "forbidden" }, 403);
  }

  if (req.method !== "POST") return json({ ok: true });

  // Proteção do webhook via token na query string
  if (url.searchParams.get("token") !== WEBHOOK_TOKEN) {
    return json({ error: "forbidden" }, 403);
  }

  try {
    // Valida ENV mínimas (mantém comportamento: retorna 200 no catch)
    if (!MP_TOKEN || !SB_URL || !SRV_KEY || !WEBHOOK_TOKEN) {
      throw new Error(
        `Missing env(s): MP_TOKEN=${!!MP_TOKEN}, SB_URL=${!!SB_URL}, SRV_KEY=${!!SRV_KEY}, WEBHOOK_TOKEN=${!!WEBHOOK_TOKEN}`
      );
    }

    const payload = await req.json().catch(() => ({}));
    log("payload keys:", payload ? Object.keys(payload) : null);

    // Tenta extrair o ID do preapproval
    const preapprovalId =
      payload?.data?.id ||
      payload?.data?.preapproval_id ||
      payload?.id ||
      payload?.resource?.id;

    if (!preapprovalId) {
      log("no preapproval id in payload");
      return json({ ok: true, note: "no preapproval id" });
    }

    log("preapprovalId:", preapprovalId);

    // Consulta o preapproval no MP (fonte da verdade)
    const r = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      log("MP preapproval fetch not ok:", r.status, txt);
      return json({ ok: true, note: "preapproval not found", status: r.status });
    }

    const preapproval = await r.json();

    const externalId = String(preapproval.id || "");
    const externalRef = String(preapproval.external_reference || "");
    const statusRaw = String(preapproval.status || "").toLowerCase(); // authorized | paused | cancelled ...

    let newStatus: "active" | "cancelled" | "pending" = "pending";
    if (statusRaw === "authorized") newStatus = "active";
    else if (statusRaw === "paused" || statusRaw === "cancelled") newStatus = "cancelled";

    log("mp statusRaw:", statusRaw, "=> newStatus:", newStatus);
    log("externalId:", externalId);
    log("externalRef:", externalRef);

    const admin = createClient(SB_URL, SRV_KEY);

    // Acha a subscription local
    let { data: sub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("external_id", externalId)
      .maybeSingle();

    // fallback: external_reference costuma ser o id da linha local
    if (!sub && externalRef) {
      const alt = await admin.from("subscriptions").select("*").eq("id", externalRef).maybeSingle();
      sub = alt.data || null;
    }

    if (!sub) {
      log("subscription not found for externalId/externalRef");
      return json({ ok: true, note: "subscription not found" });
    }

    // Atualiza subscription
    await admin
      .from("subscriptions")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", sub.id);

    // Atualiza plano do perfil (libera Pro no app)
    if (newStatus === "active") {
      await admin.from("profiles").update({ plan: "pro" }).eq("id", sub.user_id);
    } else if (newStatus === "cancelled") {
      await admin.from("profiles").update({ plan: "free" }).eq("id", sub.user_id);
    }

    return json({ ok: true, status: newStatus });
  } catch (e: any) {
    console.error("webhook error", e);
    // Retorna 200 para evitar retries infinitos do MP
    return json({ ok: true, error: String(e?.message || e) });
  }
});