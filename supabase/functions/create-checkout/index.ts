/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const APP_ORIGIN = Deno.env.get("APP_ORIGIN") ?? "https://www.zapfollow.app";
const APP_URL = Deno.env.get("APP_URL") ?? "https://www.zapfollow.app";

const MP_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";
const WEBHOOK_TOKEN = Deno.env.get("MP_WEBHOOK_TOKEN") ?? "";

const DEBUG = (Deno.env.get("DEBUG") ?? "").toLowerCase() === "true";

// preço do Pro (mantive o mesmo padrão do seu código)
const PRO_PRICE = 29.9;

function cors(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function dlog(...args: unknown[]) {
  if (DEBUG) console.log("[create-checkout]", ...args);
}

function safeSample(s: string, n = 32) {
  if (!s) return "";
  return s.slice(0, n) + (s.length > n ? "..." : "");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin || APP_ORIGIN) });
  }

  // Bloqueia origens indevidas (mantendo sua lógica)
  if (!origin || origin !== APP_ORIGIN) {
    dlog("BLOCKED ORIGIN:", origin, "expected:", APP_ORIGIN);
    return new Response(JSON.stringify({ error: "Origin not allowed", origin }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...cors(origin || APP_ORIGIN) },
    });
  }

  try {
    dlog("METHOD:", req.method);
    dlog("ORIGIN:", origin);

    // ====== DEBUG DE ENV (sem vazar segredos) ======
    dlog("ENV SUPABASE_URL exists:", !!SB_URL);
    dlog("ENV SUPABASE_ANON_KEY exists:", !!SB_ANON);
    dlog("ENV SUPABASE_SERVICE_ROLE_KEY exists:", !!SB_SERVICE);
    dlog("ENV MP_ACCESS_TOKEN exists:", !!MP_TOKEN);
    dlog("ENV MP_WEBHOOK_TOKEN exists:", !!WEBHOOK_TOKEN);
    dlog("ENV APP_ORIGIN:", APP_ORIGIN);
    dlog("ENV APP_URL:", APP_URL);

    // ====== LÊ AUTH HEADER (bem tolerante) ======
    const authHeader =
      req.headers.get("authorization") ||
      req.headers.get("Authorization") ||
      req.headers.get("x-supabase-auth") ||
      "";

    const hasBearer = authHeader.toLowerCase().startsWith("bearer ");
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const jwtParts = jwt ? jwt.split(".").length : 0;

    dlog("AUTH header exists:", !!authHeader);
    dlog("AUTH startsWith Bearer:", hasBearer);
    dlog("AUTH length:", authHeader.length);
    dlog("AUTH sample:", safeSample(authHeader, 40));
    dlog("JWT parts:", jwtParts);

    if (!authHeader || !hasBearer) {
      const body = {
        error: "Missing Authorization Bearer token",
        debug: DEBUG
          ? {
              gotAuthorization: !!authHeader,
              sample: safeSample(authHeader, 40),
            }
          : undefined,
      };
      return new Response(JSON.stringify(body), {
        status: 401,
        headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    // ====== CLIENT PARA VALIDAR USUÁRIO ======
    const userClient = createClient(SB_URL, SB_ANON, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: u, error: uErr } = await userClient.auth.getUser();

    dlog("getUser() ok:", !!u?.user);
    if (uErr) dlog("getUser() error:", uErr.message);

    if (uErr || !u?.user) {
      const body = {
        error: "Unauthorized",
        detail: uErr?.message || "Invalid JWT",
        debug: DEBUG
          ? {
              hasBearer,
              jwtParts,
              tokenIssHint: (() => {
                try {
                  const payload = JSON.parse(atob(jwt.split(".")[1] || ""));
                  return payload?.iss ?? null;
                } catch {
                  return null;
                }
              })(),
            }
          : undefined,
      };

      return new Response(JSON.stringify(body), {
        status: 401,
        headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    const user = u.user;

    // ====== BODY ======
    const payload = await req.json().catch(() => ({}));
    const plan = payload?.plan ?? "";

    if (plan !== "pro") {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    // ====== ADMIN CLIENT (service role) ======
    const admin = createClient(SB_URL, SB_SERVICE);

    // Já é Pro ativo?
    const { data: existing } = await admin
      .from("subscriptions")
      .select("id,status")
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
      .insert({ user_id: user.id, status: "pending", amount: PRO_PRICE, currency: "BRL" })
      .select()
      .single();

    if (subErr || !subRow) throw subErr || new Error("Falha ao criar assinatura local");

    const webhookUrl = `${SB_URL}/functions/v1/mp-webhook?token=${WEBHOOK_TOKEN}`;
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

    await admin
      .from("subscriptions")
      .update({ external_id: preapprovalId, external_ref: subRow.id, init_point: initPoint })
      .eq("id", subRow.id);

    return new Response(JSON.stringify({ init_point: initPoint }), {
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        detail: (e as Error)?.message || String(e),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors(origin) },
      }
    );
  }
});
