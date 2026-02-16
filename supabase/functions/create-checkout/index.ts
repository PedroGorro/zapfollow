// supabase/functions/create-checkout/index.ts
// @ts-nocheck
/// <reference lib="deno.ns" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2?dts";

/**
 * create-checkout
 * - Cria um preapproval (assinatura recorrente) no Mercado Pago
 * - Retorna o init_point (URL do checkout)
 * - CORS: apenas APP_URL é permitido
 */

const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
const APP_URL = Deno.env.get("APP_URL")!; // ex.: https://www.zapfollow.app
const PRO_PRICE = Number(Deno.env.get("PRO_PRICE") || "39.90");
const WEBHOOK_TOKEN = Deno.env.get("MP_WEBHOOK_TOKEN")!;

/**
 * IMPORTANTE:
 * Use SEMPRE as envs nativas do Supabase dentro da Edge Function
 * pra evitar "Invalid JWT" por projeto diferente.
 */
const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") || Deno.env.get("SB_URL") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SB_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SB_SERVICE_ROLE_KEY") ||
  "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars", {
    hasUrl: !!SUPABASE_URL,
    hasAnon: !!SUPABASE_ANON_KEY,
    hasSrv: !!SUPABASE_SERVICE_ROLE_KEY,
  });
}

const APP_ORIGIN = (() => {
  try {
    return new URL(APP_URL).origin;
  } catch {
    return APP_URL;
  }
})();

function cors(origin: string | null) {
  const allowed = !!origin && origin === APP_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: cors(origin),
    });
  }

  // CORS estrito
  if (!(origin && origin === APP_ORIGIN)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });
  }

  try {
    const { plan } = await req.json().catch(() => ({}));

    if (plan !== "pro") {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    // Pega Authorization (pode vir como "authorization" em minúsculo)
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization") || "";

    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    // Autentica o usuário com o JWT do front (MESMO projeto)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: auth, error: authErr } = await userClient.auth.getUser();

    if (authErr || !auth?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", detail: authErr?.message || "Invalid JWT" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...cors(origin) },
        }
      );
    }

    const user = auth.user;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Se já tem assinatura ativa, não reabre checkout
    const { data: existing } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ alreadyActive: true, redirect: `${APP_URL}/dashboard` }),
        { headers: { "Content-Type": "application/json", ...cors(origin) } }
      );
    }

    // Cria registro local (pending) para usar como external_reference
    const { data: subRow, error: subErr } = await admin
      .from("subscriptions")
      .insert({
        user_id: user.id,
        status: "pending",
        amount: PRO_PRICE,
        currency: "BRL",
      })
      .select()
      .single();

    if (subErr || !subRow) throw subErr || new Error("Falha ao criar assinatura local");

    const webhookUrl = `${SUPABASE_URL}/functions/v1/mp-webhook?token=${WEBHOOK_TOKEN}`;
    const backUrl = `${APP_URL}/billing/mercadopago/return`;

    // Mercado Pago: preapproval (assinatura recorrente)
    const body = {
      payer_email: user.email,
      back_url: backUrl,
      reason: "ZapFollow Pro",
      external_reference: subRow.id,
      notification_url: webhookUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: PRO_PRICE,
        currency_id: "BRL",
      },
    };

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const mpJson = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP error:", mpJson);
      throw new Error(mpJson?.message || "Falha ao criar assinatura no Mercado Pago");
    }

    const preapprovalId = mpJson.id as string;
    const initPoint = (mpJson.init_point || mpJson.sandbox_init_point) as string;

    await admin
      .from("subscriptions")
      .update({
        external_id: preapprovalId,
        external_ref: subRow.id,
        init_point: initPoint,
      })
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
