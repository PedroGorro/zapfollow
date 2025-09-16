// src/lib/payments.js
import { supabase } from "./supabaseClient";

/** Abre o checkout do Mercado Pago (Edge Function) */
export async function startProCheckout() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Faça login para continuar.");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plan: "pro" }),
  });

  const json = await resp.json();
  if (!resp.ok) throw new Error(json?.error || "Falha ao iniciar checkout");

  // Usuário já é Pro? só redireciona pro app
  if (json.alreadyActive && json.redirect) {
    window.location.href = json.redirect;
    return;
  }

  // Abre o Mercado Pago
  window.location.href = json.init_point;
}

/** Depois do pagamento, o usuário volta ao app.
 *  Chamando esta função, a UI fica “esperando” o webhook virar o plano para 'pro'.
 */
export async function waitForProPlan({ timeoutMs = 120000, intervalMs = 4000 } = {}) {
  const started = Date.now();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "not-authenticated" };

  while (Date.now() - started < timeoutMs) {
    const { data, error } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    if (!error && data?.plan === "pro") return { ok: true };
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return { ok: false, reason: "timeout" };
}
