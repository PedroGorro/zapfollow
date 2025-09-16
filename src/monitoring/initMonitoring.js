// src/monitoring/initMonitoring.js
import * as Sentry from "@sentry/react";
import LogRocket from "logrocket";

export function initMonitoring() {
  const isProd = import.meta.env.PROD;

  // --- SENTRY ---
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (isProd && dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,          // ajuste depois (0.1 em produção é comum)
      replaysSessionSampleRate: 0.1,  // 10% das sessões
      replaysOnErrorSampleRate: 1.0,  // 100% quando há erro
    });
  }

  // --- LOGROCKET ---
  const lrId = import.meta.env.VITE_LOGROCKET_APP_ID;
  if (isProd && lrId) {
    LogRocket.init(lrId);
    // Conecta detalhe de sessão ao Sentry (link no evento)
    try {
      LogRocket.getSessionURL((url) => {
        Sentry.setContext("LogRocket", { sessionURL: url });
      });
    } catch { /* noop */ }
  }
}

export function captureException(err, context = {}) {
  try {
    // Se Sentry estiver ativo, manda pra lá
    // (não falha se Sentry não estiver inicializado)
    // eslint-disable-next-line no-console
    console.error("Captured error:", err, context);
    // @sentry/react expõe globalmente quando init foi chamado
    // Enviamos de qualquer forma; em dev sem DSN não sobe nada.
    try { 
      // enrich
      if (context.tags) {
        for (const [k, v] of Object.entries(context.tags)) Sentry.setTag(k, v);
      }
      if (context.extra) Sentry.setContext("extra", context.extra);
      Sentry.captureException(err);
    } catch (e) { /* noop */ }
  } catch (e) {
    // safety net
    // eslint-disable-next-line no-console
    console.error("Failed to capture error", e);
  }
}
