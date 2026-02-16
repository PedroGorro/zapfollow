// src/lib/payments.js
import { supabase } from "./supabaseClient";

const DEBUG = true; // se quiser, pode amarrar em import.meta.env.VITE_DEBUG

export async function startProCheckout() {
  // Garante sessão válida
  const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
  if (sessErr) throw new Error(sessErr.message);

  let session = sessionData?.session;
  if (!session?.access_token) throw new Error("Sem sessão ativa. Faça login novamente.");

  // Tenta refresh (boa prática)
  const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
  if (!refreshErr && refreshed?.session?.access_token) {
    session = refreshed.session;
  }

  const accessToken = session.access_token;

  if (DEBUG) {
    console.log("[checkout] supabaseUrl(front):", supabase?.supabaseUrl || "(unknown)");
    console.log("[checkout] session(user id):", session.user?.id);
    console.log("[checkout] access_token length:", accessToken?.length);
    console.log("[checkout] token.iss:", (session?.user?.aud ? "(aud set)" : "(no aud)"));
    console.log("[checkout] token.exp:", session.expires_at);
  }

  // ✅ 1) PRIMEIRO: invoke (melhor caminho, já manda apikey + auth)
  try {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan: "pro" },
      // headers extra se quiser: { "x-debug": "1" }
    });

    if (error) throw error;

    // Se sua function retornar init_point:
    const initPoint = data?.init_point || data?.initPoint || null;

    if (DEBUG) console.log("[checkout] invoke data:", data);

    if (initPoint) {
      window.location.href = initPoint;
      return;
    }

    // Se você faz redirect server-side, talvez nem chegue aqui.
    // Caso não tenha init_point:
    throw new Error("Checkout não retornou init_point. Verifique a function create-checkout.");
  } catch (e) {
    if (DEBUG) console.warn("[checkout] invoke falhou, tentando fetch fallback...", e?.message || e);
  }

  // ✅ 2) FALLBACK: fetch direto (manda apikey + authorization)
  const fnUrl = `${supabase.supabaseUrl}/functions/v1/create-checkout`;
  const anonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;

  if (!anonKey) {
    throw new Error("VITE_SUPABASE_ANON_KEY ausente no front (necessário para o fallback).");
  }

  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ plan: "pro" }),
  });

  const json = await res.json().catch(() => ({}));

  if (DEBUG) {
    console.log("[checkout] fetch status:", res.status);
    console.log("[checkout] fetch response:", json);
  }

  if (!res.ok) {
    const msg =
      json?.detail ||
      json?.message ||
      `Falha no checkout (${res.status}).`;
    throw new Error(msg);
  }

  const initPoint = json?.init_point || json?.initPoint;
  if (!initPoint) throw new Error("Checkout não retornou init_point (fetch).");

  window.location.href = initPoint;
}
