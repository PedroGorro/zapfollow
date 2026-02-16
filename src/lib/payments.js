// src/lib/payments.js
import { supabase } from "./supabaseClient";

/**
 * Decodifica o payload do JWT (sem validar assinatura)
 * Serve só para debug: ver iss, exp, sub etc.
 */
function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Abre o checkout do Mercado Pago (Edge Function)
 * - Usa supabase.functions.invoke
 * - Faz refresh antes de chamar
 * - Retorna { init_point } ou { alreadyActive, redirect }
 */
export async function startProCheckout() {
  // DEBUG: qual projeto o front está usando?
  try {
    const url = supabase?.supabaseUrl;
    console.log("[checkout] supabaseUrl(front):", url);
  } catch (e) {
    console.log("[checkout] supabaseUrl(front): (não disponível)", e);
  }

  // 1) garante que existe sessão
  const { data: sess0, error: sessErr0 } = await supabase.auth.getSession();
  if (sessErr0) throw sessErr0;
  if (!sess0?.session) throw new Error("Faça login para continuar.");

  // DEBUG: loga infos da sessão ATUAL
  console.log("[checkout] session(user id):", sess0.session.user?.id);
  console.log("[checkout] access_token length:", sess0.session.access_token?.length);
  console.log("[checkout] refresh_token exists:", !!sess0.session.refresh_token);

  const payload0 = decodeJwtPayload(sess0.session.access_token || "");
  console.log("[checkout] token.iss(before refresh):", payload0?.iss);
  console.log("[checkout] token.exp(before refresh):", payload0?.exp);

  // 2) força refresh (evita JWT expirado/antigo)
  const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();

  if (refreshErr) {
    console.error("[checkout] refreshSession error:", refreshErr);
    // dica forte quando o refresh token é inválido/velho
    throw new Error(
      "Sua sessão está inválida/antiga. Faça logout e login novamente (ou limpe o armazenamento do site)."
    );
  }
  if (!refreshed?.session) throw new Error("Faça login para continuar.");

  // DEBUG: loga infos da sessão NOVA
  console.log("[checkout] session refreshed(user id):", refreshed.session.user?.id);
  console.log("[checkout] access_token length(after refresh):", refreshed.session.access_token?.length);

  const payload1 = decodeJwtPayload(refreshed.session.access_token || "");
  console.log("[checkout] token.iss(after refresh):", payload1?.iss);
  console.log("[checkout] token.exp(after refresh):", payload1?.exp);

  // 3) chama a function via invoke
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { plan: "pro" },
  });

  if (error) {
    // erro do invoke costuma vir com status e message
    console.error("[checkout] functions.invoke error:", error);

    // mensagem mais útil
    const status = error?.status || error?.context?.status;
    const msg =
      error?.message ||
      (typeof error === "string" ? error : null) ||
      "Falha ao iniciar checkout.";

    // Se for JWT inválido, a correção mais comum é limpar sessão
    if (String(msg).toLowerCase().includes("jwt") || status === 401) {
      throw new Error(
        `Falha de autenticação (401). Normalmente é sessão antiga/token de outro projeto. ` +
          `Faça logout e login novamente. (Detalhe: ${msg})`
      );
    }

    throw new Error(`Erro ao abrir checkout: ${msg}`);
  }

  // Usuário já é Pro? redireciona pro app
  if (data?.alreadyActive && data?.redirect) {
    window.location.href = data.redirect;
    return;
  }

  if (!data?.init_point) {
    console.error("[checkout] resposta sem init_point:", data);
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

  // refresh opcional
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
