// src/lib/payments.js
import { supabase } from "./supabaseClient";

/**
 * Abre o checkout do Mercado Pago (Edge Function)
 * - Usa supabase.functions.invoke
 * - Garante refresh do token antes de chamar
 * - Envia Authorization explicitamente (evita gateway achar vazio/errado)
 */
export async function startProCheckout() {
  // 1) garante sessão
  const { data: sess0, error: sessErr0 } = await supabase.auth.getSession();
  if (sessErr0) throw sessErr0;
  if (!sess0?.session) throw new Error("Faça login para continuar.");

  console.log("[checkout] supabaseUrl(front):", supabase?.supabaseUrl || "(unknown)");
  console.log("[checkout] session(user id):", sess0.session.user?.id);
  console.log("[checkout] access_token length:", sess0.session.access_token?.length || 0);
  console.log("[checkout] refresh_token exists:", !!sess0.session.refresh_token);
  console.log("[checkout] token.iss(before refresh):", sess0.session.user?.aud ? "(aud set)" : "(aud empty)");
  console.log("[checkout] token.exp(before refresh):", sess0.session.expires_at);

  // 2) força refresh
  const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr || !refreshed?.session) {
    throw new Error("Sua sessão expirou. Faça logout e login novamente.");
  }

  console.log("[checkout] session refreshed(user id):", refreshed.session.user?.id);
  console.log("[checkout] access_token length(after refresh):", refreshed.session.access_token?.length || 0);
  console.log("[checkout] token.exp(after refresh):", refreshed.session.expires_at);

  // 3) chama a function e envia Authorization explicitamente
  const accessToken = refreshed.session.access_token;
  const authHeader = `Bearer ${accessToken}`;

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { plan: "pro" },
    headers: {
      Authorization: authHeader,
    },
  });

  if (error) {
    console.error("[checkout] functions.invoke error:", error);

    // tenta mostrar algo útil
    const msg =
      error?.message ||
      (typeof error === "string" ? error : null) ||
      "Falha ao iniciar checkout.";

    // Se for 401, dá dica melhor
    if (String(msg).includes("401")) {
      throw new Error("Falha de autenticação (401). Faça logout e login novamente.");
    }
    throw new Error(msg);
  }

  // Usuário já é Pro?
  if (data?.alreadyActive && data?.redirect) {
    window.location.href = data.redirect;
    return;
  }

  if (!data?.init_point) {
    console.error("[checkout] invalid response data:", data);
    throw new Error("Resposta inválida: init_point não retornado.");
  }

  window.location.href = data.init_point;
}

export async function waitForProPlan({ timeoutMs = 120000, intervalMs = 4000 } = {}) {
  const started = Date.now();
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
