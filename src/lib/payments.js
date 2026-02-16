// src/lib/payments.js
import { supabase } from "./supabaseClient";

/**
 * Abre o checkout do Mercado Pago (Edge Function)
 * - Envia Authorization (JWT do usuário) + apikey (anon key do projeto)
 * - Edge Function retorna { init_point } ou { alreadyActive, redirect }
 */
export async function startProCheckout() {
  const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;
  if (!session) throw new Error("Faça login para continuar.");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL não configurado.");
  if (!anonKey) throw new Error("VITE_SUPABASE_ANON_KEY não configurado.");

  const url = `${supabaseUrl}/functions/v1/create-checkout`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // JWT do usuário logado:
      Authorization: `Bearer ${session.access_token}`,
      // Necessário para chamar Edge Functions:
      apikey: anonKey,
    },
    body: JSON.stringify({ plan: "pro" }),
  });

  // Tenta ler JSON mesmo em erro
  let json = null;
  try {
    json = await resp.json();
  } catch {
    // pode vir vazio em alguns cenários
  }

  if (!resp.ok) {
    const msg =
      json?.error ||
      json?.message ||
      `Falha ao iniciar checkout (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  // Usuário já é Pro? só redireciona pro app
  if (json?.alreadyActive && json?.redirect) {
    window.location.href = json.redirect;
    return;
  }

  if (!json?.init_point) {
    throw new Error("Resposta inválida: init_point não retornado.");
  }

  // Abre o Mercado Pago
  window.location.href = json.init_point;
}

/**
 * Depois do pagamento, o usuário volta ao app.
 * Chamando esta função, a UI fica “esperando” o webhook virar o plano para 'pro'.
 */
export async function waitForProPlan({ timeoutMs = 120000, intervalMs = 4000 } = {}) {
  const started = Date.now();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) return { ok: false, reason: "invalid-jwt" };
  if (!user) return { ok: false, reason: "not-authenticated" };

  while (Date.now() - started < timeoutMs) {
    const { data, error } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data?.plan === "pro") return { ok: true };

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  return { ok: false, reason: "timeout" };
}
