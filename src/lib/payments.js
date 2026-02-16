// src/lib/payments.js
import { supabase } from "./supabaseClient";

/**
 * Abre o checkout do Mercado Pago (Edge Function)
 * - Usa supabase.functions.invoke (mais seguro que fetch manual)
 * - Garante refresh do token antes de chamar
 * - Edge Function retorna { init_point } ou { alreadyActive, redirect }
 */
export async function startProCheckout() {
  // 1) garante que existe sessão
  const { data: sess0, error: sessErr0 } = await supabase.auth.getSession();
  if (sessErr0) throw sessErr0;
  if (!sess0?.session) throw new Error("Faça login para continuar.");

  // 2) força refresh (evita JWT expirado/antigo)
  const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr) {
    // se refresh falhar, é melhor pedir login de novo
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }
  if (!refreshed?.session) throw new Error("Faça login para continuar.");

  // 3) chama a function via invoke (envia Authorization corretamente)
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { plan: "pro" },
  });

  if (error) {
    // quando a function responde 401, normalmente vem aqui
    const msg =
      error?.message ||
      (typeof error === "string" ? error : null) ||
      "Falha ao iniciar checkout.";
    throw new Error(msg);
  }

  // Usuário já é Pro? só redireciona pro app
  if (data?.alreadyActive && data?.redirect) {
    window.location.href = data.redirect;
    return;
  }

  if (!data?.init_point) {
    throw new Error("Resposta inválida: init_point não retornado.");
  }

  window.location.href = data.init_point;
}

/**
 * Depois do pagamento, o usuário volta ao app.
 * Chamando esta função, a UI fica “esperando” o webhook virar o plano para 'pro'.
 */
export async function waitForProPlan({ timeoutMs = 120000, intervalMs = 4000 } = {}) {
  const started = Date.now();

  // (opcional) refresh também aqui, porque o usuário pode voltar do MP e a sessão pode estar “meia-bamba”
  await supabase.auth.refreshSession().catch(() => null);

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
