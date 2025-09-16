// @ts-nocheck
/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?dts";

/**
 * create-checkout
 * - Cria um preapproval (assinatura recorrente) no Mercado Pago
 * - Retorna o init_point (URL do checkout)
 * - CORS: apenas APP_URL é permitido
 */

const MP_TOKEN  = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
const APP_URL   = Deno.env.get("APP_URL")!;               // ex.: https://app.zapfollow.com
const PRO_PRICE = Number(Deno.env.get("PRO_PRICE") || "39.90");

const SB_URL   = Deno.env.get("SB_URL")!;
const SRV_KEY  = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SB_ANON_KEY")!;

/** Garante que comparamos a ORIGIN do APP_URL (ignora paths) */
const APP_ORIGIN = (() => {
  try { return new URL(APP_URL).origin; } catch { return APP_URL; }
})();

/** CORS estrito: só aceita o APP_ORIGIN */
function cors(origin: string | null) {
  const allowed = !!origin && origin === APP_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null", // bloqueia outros domínios
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    // "Access-Control-Allow-Credentials": "true", // habilite se algum dia precisar enviar cookies
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: cors(origin) });
  }

  // Checagem extra: recuse imediatamente se a origin não é a do app
  if (!(origin && origin === APP_ORIGIN)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });
  }

  try {
    // === Autentica o usuário pelo token do Supabase vindo do front ===
    const userClient = createClient(SB_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: auth } = await userClient.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    const admin = createClient(SB_URL, SRV_KEY);

    // Se já tem assinatura ativa, não reabre checkout
    const { data: existing } = await admin
      .from("subscriptions").select("*")
      .eq("user_id", user.id).eq("status", "active").maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ alreadyActive: true, redirect: `${APP_URL}/dashboard` }),
        { headers: { "Content-Type": "application/json", ...cors(origin) } }
      );
    }

    // Cria registro local (pending) para usar como external_reference
    const { data: subRow, error: subErr } = await admin
      .from("subscriptions")
      .insert({ user_id: user.id, status: "pending", amount: PRO_PRICE, currency: "BRL" })
      .select().single();
    if (subErr || !subRow) throw subErr || new Error("Falha ao criar assinatura local");

    // Chama Mercado Pago: preapproval (assinatura recorrente)
    const body = {
      payer_email: user.email,
      back_url: `${APP_URL}/dashboard`, // volta para o app
      reason: "ZapFollow Pro",
      external_reference: subRow.id,     // reconciliado no webhook
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: PRO_PRICE,
        currency_id: "BRL",
      },
    };

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { Authorization: `Bearer ${MP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const mpJson = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP error:", mpJson);
      throw new Error(mpJson?.message || "Falha ao criar assinatura no Mercado Pago");
    }

    const preapprovalId = mpJson.id as string;
    const initPoint = (mpJson.init_point || mpJson.sandbox_init_point) as string;

    // Atualiza assinatura local
    await admin
      .from("subscriptions")
      .update({ external_id: preapprovalId, external_ref: subRow.id, init_point: initPoint })
      .eq("id", subRow.id);

    return new Response(JSON.stringify({ init_point: initPoint }), {
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });
  }
});
