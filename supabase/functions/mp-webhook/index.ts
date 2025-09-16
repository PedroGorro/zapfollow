// @ts-nocheck
/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?dts";

/**
 * Webhook do Mercado Pago:
 * - GET ?token=...  -> health-check (sem Authorization)
 * - POST (MP)       -> atualiza subscriptions e profiles.plan
 */

const MP_TOKEN      = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
const SB_URL        = Deno.env.get("SB_URL")!;
const SRV_KEY       = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const WEBHOOK_TOKEN = Deno.env.get("MP_WEBHOOK_TOKEN")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Health-check manual no navegador:
  if (req.method === "GET") {
    if (url.searchParams.get("token") === WEBHOOK_TOKEN) {
      return json({ ok: true });
    }
    return json({ error: "forbidden" }, 403);
  }

  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  // Proteção do webhook via token de query string
  if (url.searchParams.get("token") !== WEBHOOK_TOKEN) {
    return json({ error: "forbidden" }, 403);
  }

  try {
    // MP pode mandar múltiplos formatos. Tentamos extrair o ID do preapproval.
    const payload = await req.json().catch(() => ({}));
    const preapprovalId =
      payload?.data?.id ||
      payload?.data?.preapproval_id ||
      payload?.id ||
      payload?.resource?.id;

    if (!preapprovalId) {
      // Sem ID — nada a fazer; evita 4xx para não gerar retry infinito
      return json({ ok: true, note: "no preapproval id" });
    }

    // Consulta o preapproval no MP para obter status atual
    const r = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });
    if (!r.ok) {
      // Não falhar duro para não gerar retries excessivos
      return json({ ok: true, note: "preapproval not found" });
    }
    const preapproval = await r.json();
    const externalId  = preapproval.id as string;
    const externalRef = (preapproval.external_reference || "").toString();
    const statusRaw   = (preapproval.status || "").toLowerCase(); // authorized | paused | cancelled ...

    let newStatus: "active" | "cancelled" | "pending" = "pending";
    if (statusRaw === "authorized") newStatus = "active";
    else if (statusRaw === "paused" || statusRaw === "cancelled") newStatus = "cancelled";

    const admin = createClient(SB_URL, SRV_KEY);

    // Localiza nossa subscription pela external_id (ou pela própria id enviada como external_reference)
    let { data: sub } = await admin
      .from("subscriptions").select("*")
      .eq("external_id", externalId).maybeSingle();

    if (!sub && externalRef) {
      const alt = await admin.from("subscriptions").select("*").eq("id", externalRef).maybeSingle();
      sub = alt.data || null;
    }
    if (!sub) return json({ ok: true, note: "subscription not found" });

    // Atualiza assinatura
    await admin
      .from("subscriptions")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", sub.id);

    // Atualiza plano do perfil
    if (newStatus === "active") {
      await admin.from("profiles").update({ plan: "pro" }).eq("id", sub.user_id);
    } else if (newStatus === "cancelled") {
      await admin.from("profiles").update({ plan: "free" }).eq("id", sub.user_id);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("webhook error", e);
    // retorna 200 para não forçar reentregas infinitas; o erro fica logado
    return json({ ok: true, error: String(e?.message || e) });
  }
});
